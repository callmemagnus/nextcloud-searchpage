<?php

// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace OCA\TheSearchPage\AppInfo;

use OCA\TheSearchPage\Service\ProviderService;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Services\IInitialState;
use OCP\IAppConfig;
use OCP\IL10N;
use OCP\INavigationManager;
use OCP\IURLGenerator;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\ContainerInterface;
use Psr\Container\NotFoundExceptionInterface;
use Throwable;

class Application extends App implements IBootstrap
{
    public const APP_ID = 'thesearchpage';

    public function __construct(
        array $urlParams = [],
    ) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void
    {
        // TODO: Implement register() method.
    }

    /**
     * Add navigation by default when not enabled and if enabled add navigation only for users with providers
     * @param IBootContext $context
     * @throws ContainerExceptionInterface
     * @throws Throwable
     */
    public function boot(IBootContext $context): void
    {
        // TODO: Implement boot() method.
        $context->injectFn(function (ContainerInterface $container) {
            $appConfig = $container->get(IAppConfig::class);
            $enabled = $appConfig->getValueBool(Application::APP_ID, 'restrict_providers_enabled', false);
            $navigation = $container->get(INavigationManager::class);

            if ($enabled) {
                $providerService = $container->get(ProviderService::class);
                $providers = $providerService->getProvidersForCurrentUser();
                if (!count($providers)) {
                    return;
                }
            }
            $navigationEntry = $this->navigation();
            if (count($navigationEntry) > 0) {
                $navigation->add(function () use ($navigationEntry) {
                    return $navigationEntry;
                });
            }
        });
        $context->injectFn(function (ContainerInterface $container) {
            $appConfig = $container->get(IAppConfig::class);
            if (!$appConfig->getValueBool(self::APP_ID, 'hijack_search_enabled', false)) {
                return;
            }
            \OCP\Util::addScript(self::APP_ID, 'search-addons.iife');
            $initialState = $this->getContainer()->get(IInitialState::class);
            $appSearchConfig = $appConfig->getValueArray(self::APP_ID, 'app_search_config');
            $initialState->provideInitialState('appSearchConfig', $appSearchConfig);
            $providerLimits = $appConfig->getValueArray(self::APP_ID, 'provider_limits');
            $initialState->provideInitialState('providerLimits', $providerLimits);
            $userSession = $container->get(\OCP\IUserSession::class);
            $groupManager = $container->get(\OCP\IGroupManager::class);
            $user = $userSession->getUser();
            $isAdmin = $user !== null && $groupManager->isAdmin($user->getUID());
            $initialState->provideInitialState('isAdmin', $isAdmin);
            $restrictEnabled = $appConfig->getValueBool(self::APP_ID, 'restrict_providers_enabled', false);
            if ($restrictEnabled) {
                $providerService = $container->get(ProviderService::class);
                $availableProviders = $providerService->getProvidersForCurrentUser();
                $availableProviderIds = array_column($availableProviders, 'id');
            } else {
                $availableProviderIds = null;
            }
            $initialState->provideInitialState('availableProviderIds', $availableProviderIds);
        });

    }

    /**
     * @return array
     */
    public function navigation(): array
    {
        try {
            $urlGenerator = $this->getContainer()->get(IURLGenerator::class);
            $l10n = $this->getContainer()->get(IL10N::class);
            return [
                'id' => self::APP_ID,
                'order' => 100,
                'href' => $urlGenerator->linkToRoute(self::APP_ID . '.Page.index'),
                'icon' => $urlGenerator->imagePath(self::APP_ID, 'app.svg'),
                'name' => $l10n->t('The Search Page')
            ];
        } catch (NotFoundExceptionInterface | ContainerExceptionInterface $e) {

            return [];
        }
    }
}
