<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Controller;

use OCA\TheSearchPage\AppInfo\Application;
use OCA\TheSearchPage\Service\ProviderService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IRequest;

class PageController extends Controller
{
    public function __construct(
        IRequest                         $request,
        private readonly IInitialState   $initialState,
        private readonly ProviderService $providerService,
    ) {
        parent::__construct(Application::APP_ID, $request);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index(): TemplateResponse
    {
        // Get providers available for the current user (with limits applied)
        $availableProviders = $this->providerService->getProvidersForCurrentUser();

        // Provide initial state to frontend - providers with their limits
        $this->initialState->provideInitialState('availableProviders', $availableProviders);

        return new TemplateResponse(Application::APP_ID, 'main');
    }
}
