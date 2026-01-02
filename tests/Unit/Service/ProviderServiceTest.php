<?php

declare(strict_types=1);

// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Tests\Unit\Service;

use OCA\TheSearchPage\Service\ProviderService;
use OCP\IAppConfig;
use OCP\IGroup;
use OCP\IGroupManager;
use OCP\IUser;
use OCP\IUserSession;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ProviderServiceTest extends TestCase
{
    private ProviderService $service;
    private MockObject|IAppConfig $appConfig;
    private MockObject|IGroupManager $groupManager;
    private MockObject|IUserSession $userSession;

    public function setUp(): void
    {
        $this->appConfig = $this->createMock(IAppConfig::class);
        $this->groupManager = $this->createMock(IGroupManager::class);
        $this->userSession = $this->createMock(IUserSession::class);

        $this->service = new ProviderService(
            $this->appConfig,
            $this->groupManager,
            $this->userSession,
        );
    }

    public function testGetProvidersForCurrentUserWithNoUser(): void
    {
        $this->userSession->expects($this->once())
            ->method('getUser')
            ->willReturn(null);

        $result = $this->service->getProvidersForCurrentUser();

        $this->assertEquals([], $result);
    }

    public function testGetProvidersForCurrentUserWithRestrictionsDisabled(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files'],
            ['id' => 'contacts', 'name' => 'Contacts'],
        ];

        $user = $this->setupUserMock(['admin']);
        $this->setupUserSessionMock($user);

        $this->appConfig->expects($this->once())
            ->method('getValueBool')
            ->willReturn(false); // Restrictions disabled

        $this->appConfig->expects($this->exactly(3))
            ->method('getValueArray')
            ->willReturnCallback(function ($appId, $key) use ($providers) {
                if ($key === 'providers') {
                    return $providers;
                }
                return [];
            });

        $result = $this->service->getProvidersForCurrentUser();

        $expectedProviders = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 10],
            ['id' => 'contacts', 'name' => 'Contacts', 'limit' => 10],
        ];

        $this->assertEquals($expectedProviders, $result);
    }

    public function testGetProvidersForCurrentUserWithRestrictionsEnabled(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files'],
            ['id' => 'contacts', 'name' => 'Contacts'],
        ];

        $user = $this->setupUserMock(['admin']);
        $this->setupUserSessionMock($user);

        $this->appConfig->expects($this->once())
            ->method('getValueBool')
            ->willReturn(true);

        $this->appConfig->expects($this->exactly(3))
            ->method('getValueArray')
            ->willReturnCallback(function ($appId, $key) use ($providers) {
                if ($key === 'providers') {
                    return $providers;
                }
                if ($key === 'provider_group_map') {
                    return [
                        'files' => ['admin'],
                        'contacts' => ['admin'],
                    ];
                }
                return [];
            });

        $result = $this->service->getProvidersForCurrentUser();

        $expectedProviders = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 10],
            ['id' => 'contacts', 'name' => 'Contacts', 'limit' => 10],
        ];

        $this->assertEquals($expectedProviders, $result);
    }

    public function testGetProvidersForUserWithUserInAllowedGroup(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files'],
            ['id' => 'contacts', 'name' => 'Contacts'],
            ['id' => 'calendar', 'name' => 'Calendar'],
        ];

        $user = $this->setupUserMock(['admin', 'users']);

        $this->appConfig->expects($this->once())
            ->method('getValueBool')
            ->willReturn(true); // Restrictions enabled

        $this->appConfig->expects($this->exactly(3))
            ->method('getValueArray')
            ->willReturnCallback(function ($appId, $key) use ($providers) {
                if ($key === 'providers') {
                    return $providers;
                }
                if ($key === 'provider_group_map') {
                    return [
                        'files' => ['admin', 'users'],
                        'contacts' => ['admin'],
                        'calendar' => ['developers'], // User not in this group
                    ];
                }
                return [];
            });

        $result = $this->service->getProvidersForUser($user);

        $expectedProviders = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 10],
            ['id' => 'contacts', 'name' => 'Contacts', 'limit' => 10],
        ];

        $this->assertEquals($expectedProviders, $result);
    }

    public function testGetProvidersForUserWithProviderAvailableToAll(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files'],
            ['id' => 'contacts', 'name' => 'Contacts'],
        ];

        $user = $this->setupUserMock(['users']);

        $this->appConfig->expects($this->once())
            ->method('getValueBool')
            ->willReturn(true);

        $this->appConfig->expects($this->exactly(3))
            ->method('getValueArray')
            ->willReturnCallback(function ($appId, $key) use ($providers) {
                if ($key === 'providers') {
                    return $providers;
                }
                if ($key === 'provider_group_map') {
                    return [
                        'files' => ['__all__'],
                        'contacts' => ['admin'],
                    ];
                }
                return [];
            });

        $result = $this->service->getProvidersForUser($user);

        $expectedProviders = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 10],
        ];

        $this->assertEquals($expectedProviders, $result);
    }

    public function testGetProvidersForUserWithProviderNotInMap(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files'],
            ['id' => 'contacts', 'name' => 'Contacts'],
        ];

        $user = $this->setupUserMock(['admin']);

        $this->appConfig->expects($this->once())
            ->method('getValueBool')
            ->willReturn(true);

        $this->appConfig->expects($this->exactly(3))
            ->method('getValueArray')
            ->willReturnCallback(function ($appId, $key) use ($providers) {
                if ($key === 'providers') {
                    return $providers;
                }
                if ($key === 'provider_group_map') {
                    return [
                        'files' => ['admin'],
                        // 'contacts' not in map (all checkboxes unchecked)
                    ];
                }
                return [];
            });

        $result = $this->service->getProvidersForUser($user);

        $expectedProviders = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 10],
        ];

        $this->assertEquals($expectedProviders, $result);
    }

    public function testGetProvidersForUserWithCustomLimits(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files'],
            ['id' => 'contacts', 'name' => 'Contacts'],
            ['id' => 'calendar', 'name' => 'Calendar'],
        ];

        $user = $this->setupUserMock(['admin']);

        $this->appConfig->expects($this->once())
            ->method('getValueBool')
            ->willReturn(true);

        $this->appConfig->expects($this->exactly(3))
            ->method('getValueArray')
            ->willReturnCallback(function ($appId, $key) use ($providers) {
                if ($key === 'providers') {
                    return $providers;
                }
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
                return [];
            });

        $result = $this->service->getProvidersForUser($user);

        $expectedProviders = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 50],
            ['id' => 'contacts', 'name' => 'Contacts', 'limit' => 25],
            ['id' => 'calendar', 'name' => 'Calendar', 'limit' => 10],
        ];

        $this->assertEquals($expectedProviders, $result);
    }

    private function setupUserMock(array $groupIds): MockObject|IUser
    {
        $user = $this->createMock(IUser::class);

        $groups = array_map(function ($groupId) {
            $group = $this->createMock(IGroup::class);
            $group->method('getGID')->willReturn($groupId);
            return $group;
        }, $groupIds);

        $this->groupManager->expects($this->once())
            ->method('getUserGroups')
            ->with($user)
            ->willReturn($groups);

        return $user;
    }

    private function setupUserSessionMock(MockObject|IUser $user): void
    {
        $this->userSession->expects($this->once())
            ->method('getUser')
            ->willReturn($user);
    }
}
