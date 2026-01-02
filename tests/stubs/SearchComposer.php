<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OC\Search;

/**
 * Stub class for testing purposes
 * The actual SearchComposer is part of Nextcloud core and is not available in unit tests
 */
class SearchComposer
{
    /**
     * @param string $route
     * @param array<string, mixed> $routeParameters
     * @return array<int, array<string, mixed>>
     */
    public function getProviders(string $route, array $routeParameters): array
    {
        return [];
    }
}
