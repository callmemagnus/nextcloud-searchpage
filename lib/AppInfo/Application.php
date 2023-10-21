<?php
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace OCA\TheSearchPage\AppInfo;

use OCP\AppFramework\App;

class Application extends App
{
	public const APP_ID = 'thesearchpage';

	public function __construct()
	{
		parent::__construct(self::APP_ID);
	}
}
