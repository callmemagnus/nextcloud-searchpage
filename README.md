<!--
SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
SPDX-License-Identifier: CC0-1.0
-->

# The Search Page

A dedicated search interface for Nextcloud that provides a proper search page with admin configuration options. This app leverages Nextcloud's unified search API to query all available search providers and display results in a browsable, user-friendly format.

Place this app in one of the application folders of your nextcloud server (e.g. **nextcloud/apps/**).

- [Changelog](https://raw.githubusercontent.com/callmemagnus/nextcloud-searchpage/main/CHANGELOG.md)
- [Help translate this application](https://app.transifex.com/nextcloud/nextcloud/thesearchpage/)

## Features

- **Unified Search Interface**: Search across all Nextcloud search providers from a single page
- **Admin Configuration**: Control which search providers are available to users
- **Customizable Result Limits**: Set maximum number of results per provider
- **Modern UI**: Built with Svelte 5
- **Pagination Support**: Load more results for providers that support pagination

## Philosophy of this application

This application only uses official APIs provided by Nextcloud.

It works as described below (fresh arrival on page):

1. User arrives on the application page
2. Page fetches the available providers of the Nextcloud instance
3. User types a search query
4. Page fetches the result of each provider for the given search query

If the URL contains predefined values, the step 3 is not necessary.

The application must not depend on other applications (except the core Nextcloud). This brings the following caveats

- not possible (yet) to fetch more information on results as the existing search API is quite light
- not possible to make specific behaviors for a given provider

## Admin Configuration

Administrators can configure search provider behavior from **Settings → Administration → The Search Page**:

1. **Enable Provider Restrictions**: Toggle to activate provider management
2. **Provider Restrictions**: Control which search providers are available to users
3. **Provider Limits**: Set the maximum number of results displayed per provider

All settings are saved via the SettingsController API and persist across sessions.

## Building the app

The app can be built by using the provided Makefile by running:

    make

This requires the following things to be present:

- make
- which
- tar: for building the archive
- curl: used if phpunit and composer are not installed to fetch them from the web
- npm: for building and testing everything JS

### Backend (`lib/`)

The PHP backend provides:

- **PageController**: Serves the main search page
- **SettingsController**: API endpoints for admin settings (get/save provider configuration)
- **ProviderService**: Business logic for managing provider restrictions and limits
- **Admin Settings**: Admin panel integration for configuring search providers

### Frontend

The app includes two Svelte 5 applications:

**Search Page (`static/search-page/`)**: The main search interface

- Search box with real-time query handling
- Provider filtering and result display
- Pagination support for providers
- Session persistence for search state

**Settings Page (`static/settings-page/`)**: Admin configuration interface

- Provider restrictions table (enable/disable providers)
- Provider limits table (set result limits)
- Real-time save feedback

**Shared Package (`static/shared/`)**: Common utilities and constants used by both applications

## Development

### Build Commands
```bash
npm run build          # Production build (minified, no sourcemaps)
npm run lint           # Run ESLint on TypeScript and Svelte files
npm run dev            # Development build (with sourcemaps)
```

### PHP Code Quality
```bash
composer run lint                    # PHP syntax check
composer run cs:check               # PHP-CS-Fixer dry-run
composer run cs:fix                 # Auto-fix PHP code style
composer run psalm                  # Static analysis
composer run psalm:update-baseline  # Update Psalm baseline
```

## Running tests

### PHP Tests
You can use the provided Makefile to run all tests:

```bash
make test                                                    # Run all PHP tests
vendor/phpunit/phpunit/phpunit -c tests/phpunit.xml          # Unit tests only
vendor/phpunit/phpunit/phpunit -c phpunit.integration.xml    # Integration tests only
```
