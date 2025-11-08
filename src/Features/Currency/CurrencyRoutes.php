<?php

use App\Features\Currency\CurrencyController;

$currencyController = new CurrencyController();

$router->get('/api/currency/rates', [$currencyController, 'rates']);
$router->post('/api/currency/convert', [$currencyController, 'convert']);
$router->get('/api/currency/convert', [$currencyController, 'convert']);
