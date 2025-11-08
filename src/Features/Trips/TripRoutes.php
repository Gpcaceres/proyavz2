<?php

use App\Features\Trips\TripController;

$tripController = new TripController();

// GET /api/trips - Listar viajes del usuario
$router->get('/api/trips', [$tripController, 'index']);

// GET /api/trips/{id} - Obtener un viaje específico
$router->get('/api/trips/{id}', [$tripController, 'show']);

// POST /api/trips - Crear un nuevo viaje
$router->post('/api/trips', [$tripController, 'store']);

// PUT /api/trips/{id} - Actualizar un viaje
$router->put('/api/trips/{id}', [$tripController, 'update']);

// DELETE /api/trips/{id} - Eliminar un viaje
$router->delete('/api/trips/{id}', [$tripController, 'destroy']);
