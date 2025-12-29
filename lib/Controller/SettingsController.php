<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Controller;

use OCA\TheSearchPage\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\IAppConfig;
use OCP\IL10N;
use OCP\IRequest;
use OCP\ISession;
use OCP\IURLGenerator;

class SettingsController extends Controller
{
    public function __construct(
        IRequest $request,
        private IAppConfig $appConfig,
        private ISession $session,
        private IURLGenerator $urlGenerator,
        private IL10N $l10n
    ) {
        parent::__construct(Application::APP_ID, $request);
    }

    /**
     * @AuthorizedAdminSetting(settings=OCA\TheSearchPage\Settings\Admin)
     */
    public function saveSettings(): RedirectResponse
    {
        try {
            // Get enabled checkbox value
            $enabledParam = $this->request->getParam('enabled', '0');
            $enabled = $enabledParam === '1';

            // Parse provider-group mapping from form
            $providers = $this->request->getParam('providers', []);
            $providerGroupMap = [];

            if ($enabled && is_array($providers)) {
                foreach ($providers as $providerId => $groupIds) {
                    if (is_array($groupIds)) {
                        $providerGroupMap[$providerId] = array_values($groupIds);
                    }
                }
            }

            // Parse provider limits from form
            $limits = $this->request->getParam('limits', []);
            $providerLimits = [];

            if (is_array($limits)) {
                foreach ($limits as $providerId => $limit) {
                    $limitInt = (int)$limit;
                    // Enforce min/max constraints
                    if ($limitInt < 5) {
                        $limitInt = 5;
                    } elseif ($limitInt > 100) {
                        $limitInt = 100;
                    }
                    $providerLimits[$providerId] = $limitInt;
                }
            }

            // Save settings
            $this->appConfig->setValueBool(Application::APP_ID, 'restrict_providers_enabled', $enabled);
            $this->appConfig->setValueArray(Application::APP_ID, 'provider_group_map', $providerGroupMap);
            $this->appConfig->setValueArray(Application::APP_ID, 'provider_limits', $providerLimits);

            // Store success message in session
            $this->session->set('thesearchpage_save_success', true);
            $this->session->set('thesearchpage_save_message', $this->l10n->t('Settings saved successfully'));
        } catch (\Exception $e) {
            // Store error message in session
            $this->session->set('thesearchpage_save_success', false);
            $this->session->set('thesearchpage_save_message', $this->l10n->t('Error saving settings'));
        }

        // Redirect back to settings page
        $url = $this->urlGenerator->linkToRoute('settings.AdminSettings.index', ['section' => Application::APP_ID]);
        return new RedirectResponse($url);
    }
}
