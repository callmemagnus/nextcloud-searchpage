<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Controller;

use OCA\TheSearchPage\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IL10N;
use OCP\IRequest;

class PageController extends Controller
{
    /** @var IL10N */
    private $l;
    /** @var IInitialState */
    private $state;

    private $labels;

    public function __construct(IRequest $request, IL10N $l, IInitialState $state)
    {
        $this->l = $l;
        parent::__construct(Application::APP_ID, $request);
        $this->labels = [
            "All providers",
            "Search",
            "There was an error loading the providers.",
            "Loading...",
            "No results",
            "Load more...",
            "Clear",
            "Show only"

        ];
        $this->state = $state;
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index(): TemplateResponse
    {
        $this->state->provideInitialState('labels', $this->getLabels());
        return new TemplateResponse(Application::APP_ID, 'main');
    }

    private function getLabels()
    {
        return array_reduce(
            $this->labels,
            function ($carry, $label) {
                $carry[$label] = $this->l->t($label);
                return $carry;
            },
            array()
        );
    }
}
