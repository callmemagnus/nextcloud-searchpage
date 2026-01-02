<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Service;

use OCA\TheSearchPage\AppInfo\Application;
use OCP\IAppConfig;
use OCP\IGroupManager;
use OCP\IUser;
use OCP\IUserSession;

class ProviderService
{
    public function __construct(
        private readonly IAppConfig    $appConfig,
        private readonly IGroupManager $groupManager,
        private readonly IUserSession  $userSession,
    ) {
    }

    /**
     * Get providers available for the current user, with limits applied
     *
     * @return array Array of providers with id, name, and limit
     */
    public function getProvidersForCurrentUser(): array
    {
        $user = $this->userSession->getUser();
        if ($user === null) {
            return [];
        }

        return $this->getProvidersForUser($user);
    }

    /**
     * Get providers available for a specific user, with limits applied
     *
     * @param IUser $user The user to get providers for
     * @return array Array of providers with id, name, and limit
     */
    public function getProvidersForUser(IUser $user): array
    {
        // Get user's groups
        $userGroups = $this->groupManager->getUserGroups($user);
        $userGroupIds = array_map(fn ($group) => $group->getGID(), $userGroups);

        // Fetch provider restriction settings
        $enabled = $this->appConfig->getValueBool(Application::APP_ID, 'restrict_providers_enabled');
        $providerGroupMap = $this->appConfig->getValueArray(Application::APP_ID, 'provider_group_map');
        $providerLimits = $this->appConfig->getValueArray(Application::APP_ID, 'provider_limits');
        $availableProviders = $this->appConfig->getValueArray(Application::APP_ID, 'providers');

        // Filter providers based on user's group membership
        $availableProviders = $this->filterProvidersForUser($availableProviders, $enabled, $providerGroupMap, $userGroupIds);

        // Add limit to each provider (default to 10 if not configured)
        foreach ($availableProviders as &$provider) {
            $provider['limit'] = $providerLimits[$provider['id']] ?? 10;
        }
        unset($provider); // Break the reference

        return $availableProviders;
    }

    /**
     * Filter providers based on user's group membership
     *
     * @param array $providers List of all providers
     * @param bool $enabled Whether restrictions are enabled
     * @param array $providerGroupMap Mapping of provider IDs to allowed group IDs
     * @param array $userGroupIds List of group IDs the user belongs to
     * @return array Filtered list of providers
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
