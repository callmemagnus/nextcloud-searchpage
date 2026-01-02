#!/usr/bin/env php
<?php

// SPDX-FileCopyrightText: Benjamin Brahmer <info@b-brahmer.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Nextcloud
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Benjamin Brahmer <info@b-brahmer.de>
 * @copyright Benjamin Brahmer 2020
 */

if ($argc < 2) {
    echo "This script expects two parameters:\n";
    echo "./file_from_env.php ENV_VAR PATH_TO_FILE\n";
    exit(1);
}

# Read environment variable
$content = getenv($argv[1]);

if (!$content) {
    echo "Variable was empty\n";
    exit(1);
}

file_put_contents($argv[2], $content);

echo "Done...\n";
