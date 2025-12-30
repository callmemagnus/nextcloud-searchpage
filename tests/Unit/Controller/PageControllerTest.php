<?php

declare(strict_types=1);

// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Tests\Unit\Controller;

use OC\Search\SearchComposer;
use OCA\TheSearchPage\AppInfo\Application;
use OCA\TheSearchPage\Controller\PageController;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IAppConfig;
use OCP\IGroup;
use OCP\IGroupManager;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserSession;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class PageControllerTest extends TestCase
{
	private PageController $controller;
	private MockObject|IRequest $request;
	private MockObject|IInitialState $initialState;
	private MockObject|IAppConfig $appConfig;
	private MockObject|IGroupManager $groupManager;
	private MockObject|IUserSession $userSession;
	private MockObject|SearchComposer $searchComposer;

	public function setUp(): void
	{
		$this->request = $this->createMock(IRequest::class);
		$this->initialState = $this->createMock(IInitialState::class);
		$this->appConfig = $this->createMock(IAppConfig::class);
		$this->groupManager = $this->createMock(IGroupManager::class);
		$this->userSession = $this->createMock(IUserSession::class);
		$this->searchComposer = $this->createMock(SearchComposer::class);

		$this->controller = new PageController(
			$this->request,
			$this->initialState,
			$this->appConfig,
			$this->groupManager,
			$this->userSession,
			$this->searchComposer,
		);
	}

	public function testIndexReturnsTemplateResponse(): void
	{
		$this->setupDefaultMocks();

		$result = $this->controller->index();

		$this->assertInstanceOf(TemplateResponse::class, $result);
		$this->assertEquals('main', $result->getTemplateName());
	}

	public function testIndexWithRestrictionsDisabled(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
			['id' => 'calendar', 'name' => 'Calendar'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin', 'users']);

		// Restrictions disabled
		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return false; // Restrictions disabled
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				return $default;
			});

		// All providers should be available
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
			['id' => 'contacts', 'name' => 'Contacts', 'limit' => 10],
			['id' => 'calendar', 'name' => 'Calendar', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithRestrictionsEnabledButNoSettings(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin']);

		// Restrictions enabled but no settings (initial state)
		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true; // Restrictions enabled
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return []; // No settings (initial state)
				}
				return $default;
			});

		// All providers should be available (initial state)
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
			['id' => 'contacts', 'name' => 'Contacts', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithProviderAvailableToAll(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['users']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['__all__'], // Available to all
						'contacts' => ['admin'], // Only for admin group
					];
				}
				return $default;
			});

		// Only 'files' should be available (has __all__)
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithUserInAllowedGroup(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
			['id' => 'calendar', 'name' => 'Calendar'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin', 'users']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['admin', 'users'], // User is in both groups
						'contacts' => ['admin'], // User is in admin group
						'calendar' => ['developers'], // User is NOT in this group
					];
				}
				return $default;
			});

		// User should have access to 'files' and 'contacts' but not 'calendar'
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
			['id' => 'contacts', 'name' => 'Contacts', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithUserNotInAnyAllowedGroup(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['users']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['admin'], // User is NOT in admin group
						'contacts' => ['developers'], // User is NOT in developers group
					];
				}
				return $default;
			});

		// User should not have access to any providers
		$expectedProviders = [];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithProviderNotInMap(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['admin'],
						// 'contacts' is NOT in the map (all checkboxes unchecked)
					];
				}
				return $default;
			});

		// Only 'files' should be available, 'contacts' was explicitly disabled
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithProviderHavingEmptyAllowedGroups(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['admin'],
						'contacts' => [], // Empty array (no groups selected)
					];
				}
				return $default;
			});

		// Only 'files' should be available, 'contacts' has empty allowed groups
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithCustomProviderLimits(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
			['id' => 'contacts', 'name' => 'Contacts'],
			['id' => 'calendar', 'name' => 'Calendar'],
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['admin'],
						'contacts' => ['admin'],
						'calendar' => ['admin'],
					];
				}
				if ($key === 'provider_limits') {
					return [
						'files' => 50,
						'contacts' => 25,
						// 'calendar' not configured, should use default
					];
				}
				return $default;
			});

		// Providers should have their configured limits
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 50],
			['id' => 'contacts', 'name' => 'Contacts', 'limit' => 25],
			['id' => 'calendar', 'name' => 'Calendar', 'limit' => 10], // default
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexFiltersOutUsersProvider(): void
	{
		$providers = [
			['id' => 'users', 'name' => 'Users'], // Should be filtered out
			['id' => 'files', 'name' => 'Files'],
			['id' => '', 'name' => 'Empty'], // Should be filtered out
		];

		$this->setupSearchComposerMock($providers);
		$this->setupUserMock(['admin']);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return false; // Restrictions disabled for simplicity
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				return $default;
			});

		// Only 'files' should be available (users and empty filtered out)
		$expectedProviders = [
			['id' => 'files', 'name' => 'Files', 'limit' => 10],
		];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	public function testIndexWithNoUser(): void
	{
		$providers = [
			['id' => 'files', 'name' => 'Files'],
		];

		$this->setupSearchComposerMock($providers);

		// No user logged in
		$this->userSession->expects($this->once())
			->method('getUser')
			->willReturn(null);

		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'restrict_providers_enabled') {
					return true;
				}
				return $default;
			});

		$this->appConfig->expects($this->exactly(2))
			->method('getValueArray')
			->willReturnCallback(function ($appId, $key, $default) {
				if ($key === 'provider_group_map') {
					return [
						'files' => ['admin'],
					];
				}
				return $default;
			});

		// No providers should be available (user has no groups)
		$expectedProviders = [];

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('availableProviders', $expectedProviders);

		$this->controller->index();
	}

	private function setupDefaultMocks(): void
	{
		$this->setupSearchComposerMock([]);
		$this->setupUserMock([]);

		$this->appConfig->method('getValueBool')->willReturn(false);
		$this->appConfig->method('getValueArray')->willReturn([]);
		$this->initialState->method('provideInitialState');
	}

	private function setupSearchComposerMock(array $providers): void
	{
		$searchProviders = array_map(function ($provider) {
			return [
				'id' => $provider['id'],
				'name' => $provider['name'] ?? $provider['id'],
			];
		}, $providers);

		$this->searchComposer->expects($this->once())
			->method('getProviders')
			->with('', [])
			->willReturn($searchProviders);
	}

	private function setupUserMock(array $groupIds): void
	{
		$user = $this->createMock(IUser::class);
		$this->userSession->expects($this->once())
			->method('getUser')
			->willReturn($user);

		$groups = array_map(function ($groupId) {
			$group = $this->createMock(IGroup::class);
			$group->method('getGID')->willReturn($groupId);
			return $group;
		}, $groupIds);

		$this->groupManager->expects($this->once())
			->method('getUserGroups')
			->with($user)
			->willReturn($groups);
	}
}
