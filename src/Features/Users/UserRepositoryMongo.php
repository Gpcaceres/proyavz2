<?php
namespace App\Features\Users;

use App\Core\Contracts\UserRepositoryInterface;
use App\Core\Database\MongoConnection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class UserRepositoryMongo implements UserRepositoryInterface {
  private $col;
  public function __construct() {
    $db = MongoConnection::client()->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
    $this->col = $db->selectCollection('users');
  }

  public function findAll(int $page=1,int $size=20): array {
    $opts = ['skip'=>($page-1)*$size,'limit'=>$size,'sort'=>['createdAt'=>-1]];
    return array_map(fn($d)=>(array)$d, iterator_to_array($this->col->find([], $opts)));
  }

  public function findById(string $id): ?array {
    $doc = $this->col->findOne(['_id'=>new ObjectId($id)]);
    return $doc ? (array)$doc : null;
  }

  public function findByEmail(string $email): ?array {
    $doc = $this->col->findOne(['email'=>$email]);
    return $doc ? (array)$doc : null;
  }

  public function findByUsername(string $username): ?array {
    $doc = $this->col->findOne(['username'=>$username]);
    return $doc ? (array)$doc : null;
  }

  public function create(array $data): string {
    $payload = [
      'username'     => $data['username'] ?? '',
      'email'        => $data['email'],
      'passwordHash' => $data['passwordHash'],
      'name'         => $data['name'],
      'role'         => $data['role'] ?? 'REGISTERED',
      'status'       => $data['status'] ?? 'ACTIVE',
      'createdAt'    => new UTCDateTime(),
      'lastLogin'    => null
    ];
    $res = $this->col->insertOne($payload);
    return (string)$res->getInsertedId();
  }

  public function update(string $id, array $data): bool {
    unset($data['_id']);
    $res = $this->col->updateOne(['_id'=>new ObjectId($id)], ['$set'=>$data]);
    return $res->getModifiedCount() > 0;
  }

  public function delete(string $id): bool {
    $res = $this->col->deleteOne(['_id'=>new ObjectId($id)]);
    return $res->getDeletedCount() > 0;
  }
}
