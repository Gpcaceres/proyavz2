<?php
namespace App\Features\Users;

use App\Core\Http\Response;
use App\Core\Http\Request;

final class UserController {
  private UserService $service;

  public function __construct() {
    $repository = new UserRepositoryMongo();
    $this->service = new UserService($repository);
  }

  public function index(): void {
    $users = $this->service->list();
    Response::json($users);
  }

  public function show(string $id): void {
    $user = $this->service->get($id);
    
    if (!$user) {
      Response::error('Usuario no encontrado', 404);
      return;
    }

    Response::json($user);
  }

  public function store(): void {
    try {
      $body = Request::body();
      $sessionId = $_COOKIE['sid'] ?? null;
      
      $userId = $this->service->create($body, $sessionId);
      Response::json(['id' => $userId], 201);
    } catch (\Throwable $exception) {
      Response::error($exception->getMessage(), 400);
    }
  }

  public function update(string $id, bool $asAdmin = false): void {
    try {
      $body = Request::body();
      $success = $this->service->update($id, $body, $asAdmin);
      
      Response::json(['updated' => $success]);
    } catch (\Throwable $exception) {
      Response::error($exception->getMessage(), 400);
    }
  }

  public function destroy(string $id): void {
    $deleted = $this->service->delete($id);
    Response::json(['deleted' => $deleted]);
  }
}
