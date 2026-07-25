<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Controller;

use OCA\TheSearchPage\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IAppConfig;
use OCP\IGroupManager;
use OCP\INavigationManager;
use OCP\IRequest;

class SettingsController extends Controller
{
    public function __construct(
        IRequest                          $request,
        private readonly IAppConfig       $appConfig,
        private readonly IGroupManager    $groupManager,
        private readonly INavigationManager $navigationManager
    )
    {
        parent::__construct(Application::APP_ID, $request);
    }

    /**
     * Get all user groups
     *
     * @return JSONResponse
     */
    public function getGroups(): JSONResponse
    {
        try {
            $groups = $this->groupManager->search('');
            $groupList = [];

            foreach ($groups as $group) {
                $groupList[] = [
                    'id' => $group->getGID(),
                    'displayName' => $group->getDisplayName()
                ];
            }

            return new JSONResponse($groupList);
        } catch (\Exception $e) {
            return new JSONResponse(['error' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get current settings
     *
     * @return JSONResponse
     */
    public function getSettings(): JSONResponse
    {
        try {
            $enabled = $this->appConfig->getValueBool(Application::APP_ID, 'restrict_providers_enabled');
            $hijackSearchEnabled = $this->appConfig->getValueBool(Application::APP_ID, 'hijack_search_enabled');
            $providerGroupMap = $this->appConfig->getValueArray(Application::APP_ID, 'provider_group_map');
            $providerLimits = $this->appConfig->getValueArray(Application::APP_ID, 'provider_limits');
            $providers = $this->appConfig->getValueArray(Application::APP_ID, 'providers');
            $appSearchConfig = $this->appConfig->getValueArray(Application::APP_ID, 'app_search_config');

            $navEntries = $this->navigationManager->getAll();
            $apps = array_values(array_map(
                fn($e) => ['id' => $e['id'], 'name' => $e['name']],
                array_filter($navEntries, fn($e) => ($e['type'] ?? 'link') === 'link')
            ));

            return new JSONResponse([
                'enabled' => $enabled,
                'hijackSearchEnabled' => $hijackSearchEnabled,
                'apps' => $apps,
                'appSearchConfig' => $appSearchConfig ?: (object)[],
                'providers' => $providers,
                'providerGroupMap' => $providerGroupMap ?: null,
                'providerLimits' => $providerLimits ?: null
            ]);
        } catch (\Exception $e) {
            return new JSONResponse(['error' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Save settings
     *
     * @return JSONResponse
     */
    public function saveSettings(): JSONResponse
    {
        try {
            // Get JSON body
            $data = $this->request->getParams();

            $enabled = isset($data['enabled']) && $data['enabled'] === true;
            $hijackSearchEnabled = isset($data['hijackSearchEnabled']) && $data['hijackSearchEnabled'] === true;
            $rawAppSearchConfig = $data['appSearchConfig'] ?? [];
            $providerGroupMap = $data['providerGroupMap'] ?? [];
            $providerLimits = $data['providerLimits'] ?? [];
            $providers = $data['providers'] ?? [];

            // Validate and sanitize app search config
            $appSearchConfig = [];
            foreach ($rawAppSearchConfig as $appId => $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $appSearchConfig[(string)$appId] = [
                    'enabled' => isset($entry['enabled']) && $entry['enabled'] === true,
                    'providerIds' => isset($entry['providerIds']) && is_array($entry['providerIds'])
                        ? array_values(array_filter(array_map('strval', $entry['providerIds']), 'strlen'))
                        : null,
                ];
            }

            // Validate and sanitize provider limits
            $sanitizedLimits = [];
            foreach ($providerLimits as $providerId => $limit) {
                $limitInt = (int)$limit;
                // Enforce min/max constraints
                if ($limitInt < 5) {
                    $limitInt = 5;
                } elseif ($limitInt > 100) {
                    $limitInt = 100;
                }
                $sanitizedLimits[$providerId] = $limitInt;
            }

            // Save settings
            $this->appConfig->setValueBool(Application::APP_ID, 'restrict_providers_enabled', $enabled);
            $this->appConfig->setValueBool(Application::APP_ID, 'hijack_search_enabled', $hijackSearchEnabled);
            $this->appConfig->setValueArray(Application::APP_ID, 'app_search_config', $appSearchConfig);
            $this->appConfig->setValueArray(Application::APP_ID, 'provider_group_map', $providerGroupMap);
            $this->appConfig->setValueArray(Application::APP_ID, 'provider_limits', $sanitizedLimits);
            $this->appConfig->setValueArray(Application::APP_ID, 'providers', $providers);

            return new JSONResponse([
                'success' => true,
                'message' => 'Settings saved successfully'
            ]);
        } catch (\Exception $e) {
            return new JSONResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }
}
