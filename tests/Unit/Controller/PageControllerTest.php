<?php

declare(strict_types=1);

// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Tests\Unit\Controller;

use OCA\TheSearchPage\Controller\PageController;
use OCA\TheSearchPage\Service\ProviderService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IRequest;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class PageControllerTest extends TestCase
{
    private PageController $controller;
    private MockObject|IRequest $request;
    private MockObject|IInitialState $initialState;
    private MockObject|ProviderService $providerService;

    public function setUp(): void
    {
        $this->request = $this->createMock(IRequest::class);
        $this->initialState = $this->createMock(IInitialState::class);
        $this->providerService = $this->createMock(ProviderService::class);

        $this->controller = new PageController(
            $this->request,
            $this->initialState,
            $this->providerService,
        );
    }

    public function testIndexReturnsTemplateResponse(): void
    {
        $this->providerService->expects($this->once())
            ->method('getProvidersForCurrentUser')
            ->willReturn([]);

        $this->initialState->expects($this->once())
            ->method('provideInitialState')
            ->with('availableProviders', []);

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

        $this->providerService->expects($this->once())
            ->method('getProvidersForCurrentUser')
            ->willReturn($providers);

        $this->initialState->expects($this->once())
            ->method('provideInitialState')
            ->with('availableProviders', $providers);

        $this->controller->index();
    }
}
