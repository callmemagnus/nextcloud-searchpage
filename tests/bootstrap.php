<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

require_once __DIR__ . '/../../../tests/bootstrap.php';

\OC_App::loadApp(OCA\NoteBook\AppInfo\Application::APP_ID);
OC_Hook::clear();