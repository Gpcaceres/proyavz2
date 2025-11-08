<?php
namespace App\Features\Auth;

use App\Core\Http\Response;
use App\Core\Http\Request;
use App\Core\Auth\AuthMiddleware;
use App\Features\Users\UserService;
use App\Features\Users\UserRepositoryMongo;

final class AuthController {
  private UserService $userService;
  private \MongoDB\Collection $usersCollection;

  public function __construct() {
    $repository = new UserRepositoryMongo();
    $this->userService = new UserService($repository);
    $this->usersCollection = $this->initializeUsersCollection();
  }

  public function register(): void {
    try {
      $body = Request::body();
      $normalizedInput = $this->normalizeRegistrationData($body);
      
      $userId = $this->userService->create($normalizedInput);
      AuthMiddleware::setUserId($userId);
      
      Response::json(['ok' => true, 'id' => $userId], 201);
    } catch (\InvalidArgumentException $exception) {
      Response::error($exception->getMessage(), 400);
    } catch (\DomainException $exception) {
      Response::error($exception->getMessage(), 409);
    } catch (\Throwable $exception) {
      error_log('Error en registro: ' . $exception->getMessage());
      Response::error('Error al crear usuario', 500);
    }
  }

  public function login(): void {
    $body = Request::body();
    $username = $body['username'] ?? '';
    $password = $body['password'] ?? '';

    if (empty($username) || empty($password)) {
      Response::error('Faltan credenciales', 400);
      return;
    }

    $user = $this->findUserByUsernameOrEmail($username);

    if (!$this->isValidCredentials($user, $password)) {
      Response::error('Credenciales inválidas', 401);
      return;
    }

    AuthMiddleware::setUserId((string)$user['_id']);
    $this->updateLastLogin($user['_id']);

    Response::json(['ok' => true]);
  }

  public function me(): void {
    AuthMiddleware::startSession();
    
    if (!AuthMiddleware::isAuthenticated()) {
      Response::error('No autenticado', 401);
      return;
    }

    try {
      $user = $this->findUserById(AuthMiddleware::getUserId());

      if (!$user) {
        Response::error('Usuario no encontrado', 404);
        return;
      }

      $user['_id'] = (string)$user['_id'];
      Response::json(['ok' => true, 'user' => $user]);
    } catch (\Throwable $exception) {
      error_log('Error en me(): ' . $exception->getMessage());
      Response::error('Error al obtener usuario', 500);
    }
  }

  public function logout(): void {
    AuthMiddleware::destroySession();
    Response::json(['ok' => true]);
  }

  private function normalizeRegistrationData(array $body): array {
    return [
      'username' => $body['username'] ?? '',
      'email' => $body['email'] ?? '',
      'password' => $body['password'] ?? '',
      'password_confirm' => $body['password2'] ?? $body['password_confirm'] ?? null,
      'firstname' => $body['firstname'] ?? '',
      'lastname' => $body['lastname'] ?? '',
      'name' => $body['name'] ?? ''
    ];
  }

  private function initializeUsersCollection(): \MongoDB\Collection {
    $mongoClient = new \MongoDB\Client(getenv('MONGO_URI') ?: 'mongodb://localhost:27017');
    $mongoDb = $mongoClient->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
    return $mongoDb->selectCollection('users');
  }

  private function findUserByUsernameOrEmail(string $identifier): ?array {
    $doc = $this->usersCollection->findOne([
      '$or' => [
        ['username' => $identifier],
        ['email' => $identifier]
      ]
    ]);
    if (!$doc) { return null; }
    return $this->docToArray($doc);
  }

  private function findUserById(string $userId): ?array {
    $doc = $this->usersCollection->findOne(
      ['_id' => new \MongoDB\BSON\ObjectId($userId)],
      ['projection' => ['passwordHash' => 0]]
    );
    if (!$doc) { return null; }
    return $this->docToArray($doc);
  }

  /** @param mixed $doc */
  private function docToArray($doc): array {
    if ($doc instanceof \MongoDB\Model\BSONDocument) {
      return $doc->getArrayCopy();
    }
    if ($doc instanceof \MongoDB\Model\BSONArray) {
      return $doc->getArrayCopy();
    }
    if ($doc instanceof \ArrayObject) {
      return $doc->getArrayCopy();
    }
    if (is_array($doc)) {
      return $doc;
    }
    return (array)$doc;
  }

  private function isValidCredentials(?array $user, string $password): bool {
    if (!$user) {
      return false;
    }

    $hash = $user['passwordHash'] ?? null;
    if (!is_string($hash) || $hash === '') {
      return false;
    }
    return password_verify($password, $hash);
  }

  private function updateLastLogin(\MongoDB\BSON\ObjectId $userId): void {
    $this->usersCollection->updateOne(
      ['_id' => $userId],
      ['$set' => ['lastLogin' => new \MongoDB\BSON\UTCDateTime()]]
    );
  }
}
