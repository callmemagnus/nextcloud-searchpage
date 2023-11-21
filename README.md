<!--
SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
SPDX-License-Identifier: CC0-1.0
-->

# The Search Page

The idea behind this app is to provide a proper search page to Nextcloud. I know about the on provided by `fulltextsearch` but wasn't convinced.

Place this app in one of the application folders of your nextcloud server (e.g. **nextcloud/apps/**).

- [Changelog](https://raw.githubusercontent.com/callmemagnus/nextcloud-searchpage/main/CHANGELOG.md)
- [Help translate this application](https://app.transifex.com/nextcloud/nextcloud/thesearchpage/)

## Philosophy of this application

This application only uses official APIs provided by Nextcloud.

It works as described below (fresh arrival on page):

1. User arrives on the application page
2. Page fetches list of provider of the Nextcloud instance
3. User types a search query
4. Page fetches the result of each provider for the given search query

If the URL contains predefined values, the step 3 is not necessary.

The application must not depend on other applications (except the core Nextcloud). This brings the following caveats

- not possible (yet) to fetch more information on results as the existing search API is quite light
- not possible to make specific behaviors for a given provider

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

This app only provide a controller to serve the main page

### Front-end (`src/`)

## Publish to App Store

First get an account for the [App Store](http://apps.nextcloud.com/) then run:

    make && make appstore

The archive is located in build/artifacts/appstore and can then be uploaded to the App Store.

## Running tests

You can use the provided Makefile to run all tests by using:

    make test

This will run the PHP unit and integration tests and if a package.json is present will execute **npm run test**

Of course you can also install [PHPUnit](http://phpunit.de/getting-started.html) and use the configurations directly:

    phpunit -c phpunit.xml

or:

    phpunit -c phpunit.integration.xml

for integration tests
