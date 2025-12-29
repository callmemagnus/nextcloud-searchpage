<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\TheSearchPage\Settings;

use OCA\TheSearchPage\AppInfo\Application;
use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class AdminSection implements IIconSection
{
    public function __construct(
        private IL10N $l,
        private IURLGenerator $urlGenerator
    ) {
    }

    /**
     * Returns the ID of the section
     */
    public function getID(): string
    {
        return Application::APP_ID;
    }

    /**
     * Returns the name/title of the section
     */
    public function getName(): string
    {
        return $this->l->t('The Search Page');
    }

    /**
     * Returns the priority for ordering (lower = higher in the list)
     */
    public function getPriority(): int
    {
        return 75;
    }

    /**
     * Returns the icon for the section
     */
    public function getIcon(): string
    {
        return $this->urlGenerator->imagePath(Application::APP_ID, 'app-currentColor.svg');
    }
}
