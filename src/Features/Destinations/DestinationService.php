<?php
namespace App\Features\Destinations;

use App\Core\Contracts\DestinationRepositoryInterface;

final class DestinationService {
  private DestinationRepositoryInterface $repo;
  private DestinationValidator $validator;

  public function __construct(DestinationRepositoryInterface $repo) {
    $this->repo = $repo;
    $this->validator = new DestinationValidator();
  }

  public function list(
    int $page = \App\Core\Constants\ValidationRules::DEFAULT_PAGE,
    int $size = \App\Core\Constants\ValidationRules::DEFAULT_PAGE_SIZE,
    ?string $userId = null,
    ?string $search = null
  ): array {
    return $this->repo->findAll($page, $size, $userId, $search);
  }

  public function get(string $id): ?array {
    return $this->repo->findById($id);
  }

  public function create(array $input, ?string $userId = null): string {
    $this->validator->validateForCreate($input);
    
    $data = [
      'name' => trim($input['name']),
      'country' => trim($input['country']),
      'description' => trim($input['description'] ?? ''),
      'lat' => isset($input['lat']) && $input['lat'] !== '' ? (float)$input['lat'] : null,
      'lng' => isset($input['lng']) && $input['lng'] !== '' ? (float)$input['lng'] : null,
      'img' => !empty($input['img']) ? trim($input['img']) : null,
      'userId' => $userId
    ];

    return $this->repo->create((new Destination($data))->toArray());
  }

  public function update(string $id, array $input): bool {
    $this->validator->validateForUpdate($input);
    
    $data = $this->extractUpdateData($input);
    return $this->repo->update($id, $data);
  }

  private function extractUpdateData(array $input): array {
    $data = [];
    
    if (isset($input['name'])) {
      $data['name'] = trim($input['name']);
    }
    
    if (isset($input['country'])) {
      $data['country'] = trim($input['country']);
    }
    
    if (isset($input['description'])) {
      $data['description'] = trim($input['description']);
    }
    
    if (isset($input['lat'])) {
      $data['lat'] = $input['lat'] !== '' ? (float)$input['lat'] : null;
    }
    
    if (isset($input['lng'])) {
      $data['lng'] = $input['lng'] !== '' ? (float)$input['lng'] : null;
    }
    
    if (isset($input['img'])) {
      $data['img'] = !empty($input['img']) ? trim($input['img']) : null;
    }

    return $data;
  }

  public function delete(string $id): bool {
    return $this->repo->delete($id);
  }
}

