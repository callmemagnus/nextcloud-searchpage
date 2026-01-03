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
use OCP\IAppConfig;
use OCP\IGroupManager;
use OCP\IRequest;
use OCP\IUserSession;

class PageController extends Controller
{
    public function __construct(
        IRequest                         $request,
        private readonly IInitialState   $initialState,
        private readonly ProviderService $providerService,
        private readonly IGroupManager   $groupManager,
        private readonly IUserSession    $userSession,
        private readonly IAppConfig      $appConfig
    )
    {
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
        $isEnabled = $this->appConfig->getValueBool(Application::APP_ID, 'restrict_providers_enabled');

        // Check if current user is an admin
        $user = $this->userSession->getUser();
        $isAdmin = $user !== null && $this->groupManager->isAdmin($user->getUID());

        // Provide initial state to frontend - providers with their limits
        $this->initialState->provideInitialState('availableProviders', $availableProviders);
        $this->initialState->provideInitialState('isAdmin', $isAdmin);
        $this->initialState->provideInitialState('isEnabled', $isEnabled);

        return new TemplateResponse(Application::APP_ID, 'main');
    }
}
