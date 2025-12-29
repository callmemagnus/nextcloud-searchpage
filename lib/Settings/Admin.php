<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Settings;

use OC\Search\SearchComposer;
use OCA\TheSearchPage\AppInfo\Application;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IAppConfig;
use OCP\IGroupManager;
use OCP\ISession;
use OCP\Settings\ISettings;

class Admin implements ISettings
{
    public function __construct(
        private IGroupManager  $groupManager,
        private IAppConfig     $appConfig,
        private ISession       $session,
        private SearchComposer $searchComposer
    )
    {
    }

    /**
     * @return TemplateResponse
     */
    public function getForm(): TemplateResponse
    {

        // Fetch groups
        $groups = $this->groupManager->search('');
        $groupList = [];

        foreach ($groups as $group) {
            $groupList[] = [
                'id' => $group->getGID(),
                'displayName' => $group->getDisplayName()
            ];
        }

        // Fetch providers
        $providers = $this->fetchProviders();

        // Fetch current settings
        $enabled = $this->appConfig->getValueBool(Application::APP_ID, 'restrict_providers_enabled', false);
        $providerGroupMap = $this->appConfig->getValueArray(Application::APP_ID, 'provider_group_map', []);
        $providerLimits = $this->appConfig->getValueArray(Application::APP_ID, 'provider_limits', []);

        // Read and clear flash messages from session
        $saveMessage = $this->session->get('thesearchpage_save_message');
        $saveSuccess = $this->session->get('thesearchpage_save_success');
        $this->session->remove('thesearchpage_save_message');
        $this->session->remove('thesearchpage_save_success');

        $parameters = [
            'groups' => $groupList,
            'groupCount' => count($groupList),
            'providers' => $providers,
            'settings' => [
                'enabled' => $enabled,
                'providerGroupMap' => $providerGroupMap ?: [],
                'providerLimits' => $providerLimits ?: []
            ],
            'saveMessage' => $saveMessage,
            'saveSuccess' => $saveSuccess,
            'requesttoken' => \OC::$server->getCSRFTokenManager()->getToken()->getEncryptedValue()
        ];

        return new TemplateResponse(Application::APP_ID, 'settings/admin', $parameters);
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
     * @return string the section ID (e.g. 'sharing')
     */
    public function getSection(): string
    {
        return Application::APP_ID;
    }

    /**
     * @return int whether the form should be rather on the top or bottom of
     * the admin section. The forms are arranged in ascending order of the
     * priority values. It is required to return a value between 0 and 100.
     */
    public function getPriority(): int
    {
        return 50;
    }
}
