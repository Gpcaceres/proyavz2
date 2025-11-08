<?php
namespace App\Features\Routes;

use App\Core\Database\MongoConnection;
use MongoDB\Collection;
use MongoDB\BSON\ObjectId;

final class FavoriteRouteRepositoryMongo {
	private Collection $collection;

	public function __construct(){
		$db = MongoConnection::client()->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
		$this->collection = $db->selectCollection('favorite_routes');
	}

	public function insert(array $data): string {
		$res = $this->collection->insertOne($data);
		return (string)$res->getInsertedId();
	}

	public function delete(string $id, string $userId): bool {
		$res = $this->collection->deleteOne(['_id' => new ObjectId($id), 'userId' => $userId]);
		return $res->getDeletedCount() > 0;
	}

	public function listByUser(string $userId, int $skip, int $limit): array {
		$cursor = $this->collection->find(
			['userId' => $userId],
			['sort' => ['createdAt' => -1], 'skip' => $skip, 'limit' => $limit]
		);
		return iterator_to_array($cursor);
	}

	public function countByUser(string $userId): int {
		return $this->collection->countDocuments(['userId' => $userId]);
	}
}

