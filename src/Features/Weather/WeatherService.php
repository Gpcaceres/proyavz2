<?php
namespace App\Features\Weather;

final class WeatherService {
  public function __construct(private WeatherRepositoryMongo $repo) {}

  /**
   * Consulta OpenWeather por lat/lon y opcionalmente registra la búsqueda.
   */
  public function getCurrent(float $lat, float $lon, string $label = '', bool $log = false, ?string $userId = null): Weather {
    $apiKey = getenv('OPENWEATHER_API_KEY') ?: '';
    if ($apiKey === '') {
      return new Weather([
        'location' => $label,
        'country' => '',
        'lat' => $lat,
        'lon' => $lon,
        'temp' => null,
        'condition' => 'Servicio meteo no configurado',
        'humidity' => null,
        'windSpeed' => null,
        'pressure' => null,
        'precipitation' => 0,
      ]);
    }

    $url = sprintf(
      'https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=metric&lang=es',
      urlencode((string)$lat), urlencode((string)$lon), urlencode($apiKey)
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($raw === false || $code >= 400) {
      return new Weather([
        'location' => $label,
        'country' => '',
        'lat' => $lat,
        'lon' => $lon,
        'temp' => null,
        'condition' => 'No se pudo obtener clima actual',
        'humidity' => null,
        'windSpeed' => null,
        'pressure' => null,
        'precipitation' => 0,
      ]);
    }
    $ow = json_decode($raw, true) ?: [];
    $weather = Weather::fromOpenWeather($ow, $label, $lat, $lon);

    if ($log && $userId) {
      try {
        $this->repo->logWeather($userId, $weather);
      } catch (\Throwable $e) {
        error_log('No se pudo registrar weather_search: ' . $e->getMessage());
      }
    }

    return $weather;
  }

  /** @return array{items: array<int,array>, total:int} */
  public function history(string $userId, int $page, int $size): array {
    return $this->repo->history($userId, $page, $size);
  }
}
