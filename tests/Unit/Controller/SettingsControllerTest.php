<?php

declare(strict_types=1);

// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Tests\Unit\Controller;

use OCA\TheSearchPage\Controller\SettingsController;
use OCP\AppFramework\Http;
use OCP\IAppConfig;
use OCP\IGroupManager;
use OCP\INavigationManager;
use OCP\IRequest;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class SettingsControllerTest extends TestCase {
	private SettingsController $controller;
	private MockObject|IRequest $request;
	private MockObject|IAppConfig $appConfig;
	private MockObject|IGroupManager $groupManager;
	private MockObject|INavigationManager $navigationManager;

	public function setUp(): void {
		$this->request = $this->createMock(IRequest::class);
		$this->appConfig = $this->createMock(IAppConfig::class);
		$this->groupManager = $this->createMock(IGroupManager::class);
		$this->navigationManager = $this->createMock(INavigationManager::class);

		$this->controller = new SettingsController(
			$this->request,
			$this->appConfig,
			$this->groupManager,
			$this->navigationManager,
		);
	}

	/**
	 * Nextcloud only lets non-admins in when a method carries #[NoAdminRequired].
	 */
	public function testAllMethodsRequireAdmin(): void {
		$methods = (new \ReflectionClass(SettingsController::class))->getMethods(\ReflectionMethod::IS_PUBLIC);
		foreach ($methods as $method) {
			if ($method->getDeclaringClass()->getName() !== SettingsController::class) {
				continue;
			}
			foreach ($method->getAttributes() as $attribute) {
				$this->assertStringNotContainsString(
					'NoAdminRequired',
					$attribute->getName(),
					"{$method->getName()} must stay admin-only"
				);
			}
			$this->assertStringNotContainsString('@NoAdminRequired', (string)$method->getDocComment());
		}
	}

	/**
	 * @return array<string, mixed> values saved via setValueArray/setValueBool, keyed by config key
	 */
	private function save(array $params): array {
		$this->request->method('getParams')->willReturn($params);
		$saved = [];
		$capture = function (string $app, string $key, $value) use (&$saved) {
			$saved[$key] = $value;
			return true;
		};
		$this->appConfig->method('setValueArray')->willReturnCallback($capture);
		$this->appConfig->method('setValueBool')->willReturnCallback($capture);

		$response = $this->controller->saveSettings();
		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		return $saved;
	}

	public function testSaveClampsProviderLimits(): void {
		$saved = $this->save(['providerLimits' => [
			'files' => 1,
			'mail' => 500,
			'notes' => '20',
			'talk' => 'abc',
		]]);

		$this->assertSame(['files' => 5, 'mail' => 100, 'notes' => 20, 'talk' => 5], $saved['provider_limits']);
	}

	public function testSaveOnlyAcceptsStrictTrueBooleans(): void {
		$saved = $this->save(['enabled' => 'true', 'hijackSearchEnabled' => true]);

		$this->assertFalse($saved['restrict_providers_enabled']);
		$this->assertTrue($saved['hijack_search_enabled']);
	}

	public function testSaveSanitizesAppSearchConfig(): void {
		$saved = $this->save(['appSearchConfig' => [
			'files' => ['enabled' => true, 'providerIds' => ['files', '', 42]],
			'mail' => ['enabled' => 1],
			'broken' => 'not-an-array',
		]]);

		$this->assertSame([
			'files' => ['enabled' => true, 'providerIds' => ['files', '42']],
			'mail' => ['enabled' => false, 'providerIds' => null],
		], $saved['app_search_config']);
	}

	public function testSaveSanitizesProviderGroupMap(): void {
		$saved = $this->save(['providerGroupMap' => [
			'files' => ['admin', '__all__'],
			'mail' => ['admin', 42, null],
			'notes' => [],
			'talk' => 'admin',
		]]);

		$this->assertSame([
			'files' => ['admin', '__all__'],
			'mail' => ['admin'],
			'notes' => [],
		], $saved['provider_group_map']);
	}

	public function testSaveSanitizesProviders(): void {
		$saved = $this->save(['providers' => [
			['id' => 'files', 'name' => 'Files', 'extra' => 'dropped'],
			['id' => 'mail'],
			['name' => 'No id'],
			'not-an-array',
		]]);

		$this->assertSame([
			['id' => 'files', 'name' => 'Files'],
			['id' => 'mail', 'name' => 'mail'],
		], $saved['providers']);
	}

	public function testSaveIgnoresNonArrayProviderSettings(): void {
		$saved = $this->save(['providerGroupMap' => 'oops', 'providers' => 'oops']);

		$this->assertSame([], $saved['provider_group_map']);
		$this->assertSame([], $saved['providers']);
	}

	public function testSaveWithEmptyBodyResetsToDefaults(): void {
		$saved = $this->save([]);

		$this->assertFalse($saved['restrict_providers_enabled']);
		$this->assertFalse($saved['hijack_search_enabled']);
		$this->assertSame([], $saved['provider_group_map']);
		$this->assertSame([], $saved['provider_limits']);
		$this->assertSame([], $saved['providers']);
	}

	public function testSaveReturnsErrorWhenConfigWriteFails(): void {
		$this->request->method('getParams')->willReturn([]);
		$this->appConfig->method('setValueBool')->willThrowException(new \Exception('db down'));

		$response = $this->controller->saveSettings();

		$this->assertSame(Http::STATUS_INTERNAL_SERVER_ERROR, $response->getStatus());
		$this->assertFalse($response->getData()['success']);
	}

	public function testGetSettingsOnlyListsLinkNavigationEntries(): void {
		$this->appConfig->method('getValueArray')->willReturn([]);
		$this->navigationManager->method('getAll')->willReturn([
			'files' => ['id' => 'files', 'name' => 'Files', 'type' => 'link'],
			'settings' => ['id' => 'settings', 'name' => 'Settings', 'type' => 'settings'],
			'mail' => ['id' => 'mail', 'name' => 'Mail'],
		]);

		$data = $this->controller->getSettings()->getData();

		$this->assertSame([
			['id' => 'files', 'name' => 'Files'],
			['id' => 'mail', 'name' => 'Mail'],
		], $data['apps']);
		$this->assertNull($data['providerGroupMap']);
		$this->assertNull($data['providerLimits']);
	}
}
