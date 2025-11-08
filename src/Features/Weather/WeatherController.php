<?php
namespace App\Features\Weather;

use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Auth\AuthMiddleware;

final class WeatherController {
  private WeatherService $service;

  public function __construct(){
    $this->service = new WeatherService(new WeatherRepositoryMongo());
  }

  // GET /api/weather/current?lat=&lon=&q=&log=1
  public function current(): void {
    try {
      $lat = (float)Request::get('lat', null);
      $lon = (float)Request::get('lon', null);
      $label = (string)Request::get('q', '');
      $logFlag = (string)Request::get('log', '0') === '1';
      if ($lat === 0.0 && (Request::get('lat', '') === '')) { Response::error('Parámetros faltantes: lat', 400); return; }
      if ($lon === 0.0 && (Request::get('lon', '') === '')) { Response::error('Parámetros faltantes: lon', 400); return; }
      $userId = AuthMiddleware::getUserId();
  $weather = $this->service->getCurrent($lat, $lon, $label, $logFlag, $userId);
  // Nota: el modelo Weather siempre retorna un objeto; si no hay datos reales, condition tendrá el mensaje de error
  Response::json($weather->toArray());
    } catch (\Throwable $e) {
      Response::error('Error al consultar clima', 500);
    }
  }

  // GET /api/weather/history?page=&size=
  public function history(): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) { Response::error('No autenticado', 401); return; }
      $page = max(1, (int)Request::get('page', 1));
      $size = max(1, min(50, (int)Request::get('size', 10)));
      $data = $this->service->history(AuthMiddleware::getUserId(), $page, $size);
      Response::json(['ok' => true, 'items' => $data['items'], 'page' => $page, 'size' => $size, 'total' => $data['total']]);
    } catch (\Throwable $e) {
      Response::error('Error al obtener historial', 500);
    }
  }
}
