<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Controller;

use OC\Search\SearchComposer;
use OCA\TheSearchPage\AppInfo\Application;
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
        IRequest $request,
        private IInitialState $initialState,
        private IAppConfig $appConfig,
        private IGroupManager $groupManager,
        private IUserSession $userSession,
        private SearchComposer $searchComposer,
    ) {
        parent::__construct(Application::APP_ID, $request);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index(): TemplateResponse
    {
        // Fetch all available providers
        $allProviders = $this->fetchProviders();

        // Get current user's groups
        $user = $this->userSession->getUser();
        $userGroupIds = [];
        if ($user !== null) {
            $userGroups = $this->groupManager->getUserGroups($user);
            $userGroupIds = array_map(fn($group) => $group->getGID(), $userGroups);
        }

        // Fetch provider restriction settings
        $enabled = $this->appConfig->getValueBool(Application::APP_ID, 'restrict_providers_enabled', false);
        $providerGroupMap = $this->appConfig->getValueArray(Application::APP_ID, 'provider_group_map', []);
        $providerLimits = $this->appConfig->getValueArray(Application::APP_ID, 'provider_limits', []);

        // Filter providers based on user's group membership
        $availableProviders = $this->filterProvidersForUser($allProviders, $enabled, $providerGroupMap, $userGroupIds);

        // Add limit to each provider (default to 10 if not configured)
        foreach ($availableProviders as &$provider) {
            $provider['limit'] = $providerLimits[$provider['id']] ?? 10;
        }
        unset($provider); // Break the reference

        // Provide initial state to frontend - providers with their limits
        $this->initialState->provideInitialState('availableProviders', $availableProviders);

        return new TemplateResponse(Application::APP_ID, 'main');
    }

    /**
     * Fetch available providers using Nextcloud's SearchComposer
     */
    private function fetchProviders(): array
    {
        try {
            // Get providers from SearchComposer (same as UnifiedSearchController)
            $providers = $this->searchComposer->getProviders('', []);

            $providerList = [];
            foreach ($providers as $provider) {
                $providerId = $provider['id'] ?? '';

                // Filter out broken providers
                if ($providerId === 'users' || empty($providerId)) {
                    continue;
                }

                $providerList[] = [
                    'id' => $providerId,
                    'name' => $provider['name'] ?? $providerId
                ];
            }

            return $providerList;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Filter providers based on user's group membership
     */
    private function filterProvidersForUser(array $providers, bool $enabled, array $providerGroupMap, array $userGroupIds): array
    {
        // If restrictions are not enabled, return all providers
        if (!$enabled) {
            return $providers;
        }

        // If no settings exist (initial state), return all providers
        if (empty($providerGroupMap)) {
            return $providers;
        }

        $filteredProviders = [];
        foreach ($providers as $provider) {
            $providerId = $provider['id'];

            // If provider is not in the map, it means all groups were unchecked for it
            // So it should not be available to anyone
            if (!isset($providerGroupMap[$providerId])) {
                continue; // Skip this provider
            }

            $allowedGroups = $providerGroupMap[$providerId];

            // If the allowed groups array is empty, skip this provider
            if (empty($allowedGroups)) {
                continue;
            }

            // Check if '__all__' (Default configuration) is in allowed groups
            if (in_array('__all__', $allowedGroups)) {
                $filteredProviders[] = $provider;
                continue;
            }

            // Check if user is in any of the allowed groups (OR operator)
            foreach ($userGroupIds as $groupId) {
                if (in_array($groupId, $allowedGroups)) {
                    $filteredProviders[] = $provider;
                    break; // User has access, no need to check other groups
                }
            }
        }

        return $filteredProviders;
    }
}
