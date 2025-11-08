<?php
namespace App\Features\Weather;

use App\Core\Database\MongoConnection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class WeatherRepositoryMongo {
  private \MongoDB\Database $db;

  public function __construct() {
    $client = MongoConnection::client();
    $dbName = getenv('MONGO_DB') ?: 'travel_brain';
    $this->db = $client->selectDatabase($dbName);
  }

  public function logSearch(string $userId, array $data): void {
    $col = $this->db->selectCollection('weather_searches');
    $doc = [
      'userId' => new \MongoDB\BSON\ObjectId($userId),
      'label' => (string)($data['label'] ?? ''),
      'lat' => (float)($data['lat'] ?? 0),
      'lon' => (float)($data['lon'] ?? 0),
      'temp' => $data['temp'] ?? null,
      'condition' => (string)($data['condition'] ?? ''),
      'humidity' => $data['humidity'] ?? null,
      'windSpeed' => $data['windSpeed'] ?? null,
      'pressure' => $data['pressure'] ?? null,
      'precipitation' => $data['precipitation'] ?? 0,
      'createdAt' => new \MongoDB\BSON\UTCDateTime(),
    ];
    $col->insertOne($doc);
  }

  public function logWeather(string $userId, Weather $w): void {
    $this->logSearch($userId, [
      'label' => $w->location,
      'lat' => $w->lat,
      'lon' => $w->lon,
      'temp' => $w->temp,
      'condition' => $w->condition,
      'humidity' => $w->humidity,
      'windSpeed' => $w->windSpeed,
      'pressure' => $w->pressure,
      'precipitation' => $w->precipitation,
    ]);
  }

  /**
   * @return array{items: array<int, array>, total: int}
   */
  public function history(string $userId, int $page = 1, int $size = 10): array {
    $skip = ($page - 1) * $size;
    $col = $this->db->selectCollection('weather_searches');
  $cursor = $col->find(['userId' => new \MongoDB\BSON\ObjectId($userId)], [
      'skip' => $skip,
      'limit' => $size,
      'sort' => ['createdAt' => -1],
    ]);
    $items = [];
    foreach ($cursor as $doc) {
      $items[] = [
        '_id' => (string)$doc['_id'],
        'label' => (string)($doc['label'] ?? ''),
        'lat' => (float)($doc['lat'] ?? 0),
        'lon' => (float)($doc['lon'] ?? 0),
        'temp' => isset($doc['temp']) ? (int)$doc['temp'] : null,
        'condition' => (string)($doc['condition'] ?? ''),
        'humidity' => isset($doc['humidity']) ? (int)$doc['humidity'] : null,
        'windSpeed' => isset($doc['windSpeed']) ? (float)$doc['windSpeed'] : null,
        'pressure' => isset($doc['pressure']) ? (int)$doc['pressure'] : null,
        'precipitation' => isset($doc['precipitation']) ? (int)$doc['precipitation'] : 0,
        'createdAt' => isset($doc['createdAt']) && $doc['createdAt'] instanceof UTCDateTime ? $doc['createdAt']->toDateTime()->format(DATE_ATOM) : null,
      ];
    }
  $total = $col->countDocuments(['userId' => new \MongoDB\BSON\ObjectId($userId)]);
    return ['items' => $items, 'total' => $total];
  }
}
