<?php

declare(strict_types=1);

// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Tests\Unit\Controller;

use OCA\TheSearchPage\Controller\PageController;
use OCA\TheSearchPage\Service\ProviderService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
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
    private MockObject|ProviderService $providerService;
    private MockObject|IGroupManager $groupManager;
    private MockObject|IUserSession $userSession;

    public function setUp(): void
    {
        $this->request = $this->createMock(IRequest::class);
        $this->initialState = $this->createMock(IInitialState::class);
        $this->providerService = $this->createMock(ProviderService::class);
        $this->groupManager = $this->createMock(IGroupManager::class);
        $this->userSession = $this->createMock(IUserSession::class);

        $this->controller = new PageController(
            $this->request,
            $this->initialState,
            $this->providerService,
            $this->groupManager,
            $this->userSession,
        );
    }

    public function testIndexReturnsTemplateResponse(): void
    {
        $user = $this->createMock(IUser::class);
        $user->method('getUID')->willReturn('testuser');

        $this->userSession->expects($this->once())
            ->method('getUser')
            ->willReturn($user);

        $this->groupManager->expects($this->once())
            ->method('isAdmin')
            ->with('testuser')
            ->willReturn(false);

        $this->providerService->expects($this->once())
            ->method('getProvidersForCurrentUser')
            ->willReturn([]);

        $this->initialState->expects($this->exactly(2))
            ->method('provideInitialState')
            ->willReturnCallback(function ($key, $value) {
                if ($key === 'availableProviders') {
                    $this->assertEquals([], $value);
                } elseif ($key === 'isAdmin') {
                    $this->assertEquals(false, $value);
                }
            });

        $result = $this->controller->index();

        $this->assertInstanceOf(TemplateResponse::class, $result);
        $this->assertEquals('main', $result->getTemplateName());
    }

    public function testIndexProvidesProvidersToInitialState(): void
    {
        $providers = [
            ['id' => 'files', 'name' => 'Files', 'limit' => 10],
            ['id' => 'contacts', 'name' => 'Contacts', 'limit' => 25],
        ];

        $user = $this->createMock(IUser::class);
        $user->method('getUID')->willReturn('testuser');

        $this->userSession->expects($this->once())
            ->method('getUser')
            ->willReturn($user);

        $this->groupManager->expects($this->once())
            ->method('isAdmin')
            ->with('testuser')
            ->willReturn(false);

        $this->providerService->expects($this->once())
            ->method('getProvidersForCurrentUser')
            ->willReturn($providers);

        $this->initialState->expects($this->exactly(2))
            ->method('provideInitialState')
            ->willReturnCallback(function ($key, $value) use ($providers) {
                if ($key === 'availableProviders') {
                    $this->assertEquals($providers, $value);
                } elseif ($key === 'isAdmin') {
                    $this->assertEquals(false, $value);
                }
            });

        $this->controller->index();
    }

    public function testIndexSetsIsAdminTrueForAdminUser(): void
    {
        $user = $this->createMock(IUser::class);
        $user->method('getUID')->willReturn('adminuser');

        $this->userSession->expects($this->once())
            ->method('getUser')
            ->willReturn($user);

        $this->groupManager->expects($this->once())
            ->method('isAdmin')
            ->with('adminuser')
            ->willReturn(true);

        $this->providerService->expects($this->once())
            ->method('getProvidersForCurrentUser')
            ->willReturn([]);

        $this->initialState->expects($this->exactly(2))
            ->method('provideInitialState')
            ->willReturnCallback(function ($key, $value) {
                if ($key === 'availableProviders') {
                    $this->assertEquals([], $value);
                } elseif ($key === 'isAdmin') {
                    $this->assertEquals(true, $value);
                }
            });

        $this->controller->index();
    }

    public function testIndexSetsIsAdminFalseWhenNoUser(): void
    {
        $this->userSession->expects($this->once())
            ->method('getUser')
            ->willReturn(null);

        $this->groupManager->expects($this->never())
            ->method('isAdmin');

        $this->providerService->expects($this->once())
            ->method('getProvidersForCurrentUser')
            ->willReturn([]);

        $this->initialState->expects($this->exactly(2))
            ->method('provideInitialState')
            ->willReturnCallback(function ($key, $value) {
                if ($key === 'availableProviders') {
                    $this->assertEquals([], $value);
                } elseif ($key === 'isAdmin') {
                    $this->assertEquals(false, $value);
                }
            });

        $this->controller->index();
    }
}
