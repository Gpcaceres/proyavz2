<?php

use App\Features\Weather\WeatherController;

$weatherController = new WeatherController();

$router->get('/api/weather/current', [$weatherController, 'current']);
$router->get('/api/weather/history', [$weatherController, 'history']);
