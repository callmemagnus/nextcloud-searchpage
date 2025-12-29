# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Search Page** is a Nextcloud application that provides a dedicated search interface. It leverages Nextcloud's unified search API to query all available search providers and displays results in a browsable, user-friendly format. The app is built with a PHP backend (minimal controller) and a Svelte 5 + TypeScript frontend with TailwindCSS.

## Architecture

### Backend (lib/)
The PHP backend is intentionally minimal - it only provides:
- `lib/AppInfo/Application.php`: App registration with constant `APP_ID = 'thesearchpage'`
- `lib/Controller/PageController.php`: Single controller with `index()` method that serves the main template
- `appinfo/routes.php`: Single route mapping `/` to `page#index`
- `templates/main.php`: Main template that loads the JavaScript bundle

The app namespace is `OCA\TheSearchPage\`.

### Frontend (src/)
The frontend is a Svelte 5 single-page application:

**Entry Point:**
- `src/main.ts`: Mounts the Svelte app to `#mwb-thesearchpage`
- `src/App.svelte`: Root component with search box and results display

**State Management (src/states/):**
- `availableProviders.ts`: Svelte store for available search providers (fetched from Nextcloud OCS API)
- `query.ts`: Store for search query and selected provider IDs
- `searchStore.ts`: Core search state with `byProvider` (keyed by provider ID) and `asList` (ordered array)
  - Manages search results, pagination, and loading states
  - Methods: `startSearch()`, `loadMore()`, `clearSearch()`

**Search Logic (src/lib/search.ts):**
- `fetchProviders()`: Fetches available search providers from `/ocs/v2.php/search/providers`
- `searchOnProvider()`: Queries a specific provider with term and cursor (pagination)
- `computeHasMore()`: Determines if more results can be loaded
- Uses `TimedCache` (30 second TTL) to avoid duplicate API calls
- Filters out `users` provider (broken, always returns empty array)

**Components (src/components/):**
- `Header/SearchBox.svelte`: Search input with query state binding
- `Header/ProviderSelector.svelte`: Multi-select for filtering providers
- `SearchResults.svelte`: Iterates over providers and displays results
- `ResultsForProvider.svelte`: Shows results for a single provider with "Load More" support
- `Result.svelte`: Individual search result item
- `DynamicGrid.svelte`: Responsive grid layout for results
- `BoldTerms.svelte`: Highlights search terms in result text

**Build System:**
- Vite builds `src/main.ts` into `js/main.iife.js`
- Uses `@tailwindcss/vite` (TailwindCSS v4) and `vite-plugin-css-injected-by-js`
- Build output: IIFE format in `js/` directory
- Svelte 5 with TypeScript support

## Development Commands

### Build & Development
```bash
make                    # Full build: composer install + npm ci + npm run build
npm run build          # Production build (minified, no sourcemaps)
npm run dev            # Development build (with sourcemaps)
npm run lint           # Run ESLint on TypeScript and Svelte files
npm run check          # Run svelte-check for TypeScript checking
npm run doctor         # Lint + build + run Playwright tests
```

### Testing
```bash
make test                                    # Run PHP unit and integration tests
vendor/phpunit/phpunit/phpunit -c tests/phpunit.xml          # PHP unit tests only
vendor/phpunit/phpunit/phpunit -c phpunit.integration.xml    # PHP integration tests only
./bin/run-playwright.sh                      # E2E tests (requires Docker)
npm run doctor                               # Full test suite (lint + build + E2E)
```

**Playwright E2E Tests:**
- Located in `tests/e2e/`
- Runs in Docker with `mcr.microsoft.com/playwright` image
- Tests multiple Nextcloud versions (28, 29, 30, 31, 32) in parallel
- Requires `TARGET_HOST` environment variable (auto-detected from host IP)
- Test files: `*.tests.ts`, Auth setup: `auth.setup.ts`

### PHP Code Quality
```bash
composer run lint                    # PHP syntax check
composer run cs:check               # PHP-CS-Fixer dry-run
composer run cs:fix                 # Auto-fix PHP code style
composer run psalm                  # Static analysis
composer run psalm:update-baseline  # Update Psalm baseline
```

### Packaging
```bash
make appstore          # Create signed release tarball in build/artifacts/
make clean             # Remove build artifacts
make distclean         # Clean + remove vendor/ and node_modules/
```

## Key Implementation Details

### Nextcloud Search API Integration
The app uses Nextcloud's OCS API (v2):
- **Provider List:** `GET /ocs/v2.php/search/providers`
- **Search Query:** `GET /ocs/v2.php/search/providers/{providerId}/search?term={query}&limit=10&cursor={cursor}`

Responses include:
- `entries[]`: Array of search results
- `cursor`: Next page offset (0 = no more results)
- `isPaginated`: Whether provider supports pagination

### State Flow
1. On mount: `availableProviders` fetches and filters provider list
2. User enters search query → `query` store updates
3. `searchStore.startSearch(terms)` called:
   - Clears previous results
   - Waits for providers to load
   - Queries all enabled providers in parallel
   - Saves search to session storage (for persistence)
4. User clicks "Load More" → `searchStore.loadMore(providerId)` appends next page

### Session Persistence
`src/lib/session.ts` saves/restores search state using `sessionStorage`:
- Key: `mwb-thesearchpage-search`
- Stores: last query term and selected provider IDs
- Restored on page load via URL parameters

### Styling
- Uses Nextcloud CSS variables (`--color-main-text`, `--color-main-background`, etc.)
- TailwindCSS v4 (new `@reference` syntax in `<style lang="postcss">`)
- Accessibility: `.mwb-screenreader` class, tabindex management via `hasTabbed` state

## Nextcloud Version Support
Supports Nextcloud 26-32 (see `appinfo/info.xml` dependencies).

## Philosophy
This application strictly uses official Nextcloud APIs - no direct database access or private APIs. It cannot enhance search results beyond what providers expose, ensuring maximum compatibility and forward compatibility.
