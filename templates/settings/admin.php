<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** @var array $_ */
/** @var \OCP\IL10N $l */

use OCA\TheSearchPage\AppInfo\Application;
use OCP\IURLGenerator;
use OCP\Server;

$urlGenerator = Server::get(IURLGenerator::class);
$saveUrl = $urlGenerator->linkToRoute(Application::APP_ID . '.Settings.save');


$providers = $_['providers'];
$groups = $_['groups'];
$groupCount = $_['groupCount'];
$settings = $_['settings'];
$saveMessage = $_['saveMessage'] ?? null;
$saveSuccess = $_['saveSuccess'] ?? null;

// Helper function to check if a provider is enabled for a group
function isProviderEnabledForGroup($providerId, $groupId, $providerGroupMap, $enabled)
{
    // If restrictions are not enabled, all providers are enabled for all groups
    if (!$enabled) {
        return true;
    }

    // If no settings exist (initial state), default to enabled
    if (empty($providerGroupMap)) {
        return true;
    }

    // If provider has group settings, check if this group is in the list
    if (isset($providerGroupMap[$providerId])) {
        return in_array($groupId, $providerGroupMap[$providerId]);
    }

    // Provider is not in the map but restrictions are enabled and other settings exist
    // This means all groups were unchecked for this provider
    return false;
}

// Helper function to check if a provider is available to any group
function isProviderAvailableToAnyGroup($providerId, $enabled, $providerGroupMap)
{
    // If restrictions are not enabled, all providers are available
    if (!$enabled) {
        return true;
    }

    // If no settings exist (initial state), default to available
    if (empty($providerGroupMap)) {
        return true;
    }

    // If provider has restrictions configured, check if at least one group is assigned
    if (isset($providerGroupMap[$providerId])) {
        return count($providerGroupMap[$providerId]) > 0;
    }

    // Provider is not in the map but restrictions are enabled and other settings exist
    // This means all groups were unchecked for this provider
    return false;
}

// Build groups list (admin first, then other groups, then "Default configuration")
$orderedGroups = [];

// Add admin group first
foreach ($groups as $group) {
    if ($group['id'] === 'admin') {
        $orderedGroups[] = $group;
        break;
    }
}

// Add other groups
foreach ($groups as $group) {
    if ($group['id'] !== 'admin') {
        $orderedGroups[] = $group;
    }
}

// Add "Default configuration" as last item
$orderedGroups[] = ['id' => '__all__', 'displayName' => $l->t('Default configuration')];

?>

<div id="thesearchpage-settings" class="section">
    <h2><?php p($l->t('The Search Page')); ?></h2>
    <p class="settings-hint">
        <?php p($l->t('Configure search provider visibility per group.')); ?>
    </p>

    <?php if ($saveMessage !== null): ?>
        <div class="<?php p($saveSuccess ? 'success' : 'error'); ?>" style="margin-bottom: 15px;">
            <?php p($saveMessage); ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="<?php p($urlGenerator->linkToRoute('thesearchpage.settings.saveSettings')); ?>"
          class="thesearchpage-settings-section">
        <input type="hidden" name="requesttoken" value="<?php p($_['requesttoken']); ?>">

        <div id="thesearchpage-settings-content">
            <div style="margin-bottom: 24px;">
            <p>
                <input type="checkbox"
                       id="restrict-providers-enabled"
                       name="enabled"
                       value="1"
                       class="checkbox"
                       <?php if ($settings['enabled']): ?>checked<?php endif; ?>>
                <label for="restrict-providers-enabled">
                    <strong><?php p($l->t('Enable provider restrictions')); ?></strong>
                </label>
            </p>
            </div>
            <div>
                <p class="settings-hint">
                    <?php p($l->t('When enabled, you can control which search providers are visible to specific user groups. By default, all providers are enabled for all groups.')); ?>
                </p>
            </div>
            <div id="provider-group-table-container"
                 style="<?php if (!$settings['enabled']): ?>display: none;<?php endif ?> margin-top: 20px;">
                <table id="provider-group-table">
                    <thead>
                    <tr>
                        <th><?php p($l->t('Group')); ?></th>
                        <?php foreach ($providers as $provider): ?>
                            <th><?php p($provider['name']); ?></th>
                        <?php endforeach; ?>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($orderedGroups as $group): ?>
                        <tr class="group-row">
                            <td><?php p($group['displayName']); ?></td>
                            <?php foreach ($providers as $provider): ?>
                                <?php
                                $checkboxId = 'provider_' . $provider['id'] . '_group_' . $group['id'];
                                $labelText = $l->t('Enable %1$s for %2$s', [$provider['name'], $group['displayName']]);
                                ?>
                                <td>
                                    <input type="checkbox"
                                           id="<?php p($checkboxId); ?>"
                                           class="provider-checkbox"
                                           name="providers[<?php p($provider['id']); ?>][]"
                                           value="<?php p($group['id']); ?>"
                                           title="<?php p($labelText); ?>"
                                           <?php if (isProviderEnabledForGroup($provider['id'], $group['id'], $settings['providerGroupMap'], $settings['enabled'])): ?>checked<?php endif; ?>>
                                    <label for="<?php p($checkboxId); ?>" class="screenreader-only">
                                        <?php p($labelText); ?>
                                    </label>
                                </td>
                            <?php endforeach; ?>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 30px;">
                <h3><?php p($l->t('Search results per provider')); ?></h3>
                <p class="settings-hint">
                    <?php p($l->t('Configure the number of search results to display for each provider (5-100).')); ?>
                </p>
                <p class="settings-hint settings-note">
                    <strong><?php p($l->t('Note:')); ?></strong> <?php p($l->t('Higher values may result in slower response times, especially for providers with large datasets.')); ?>
                </p>
                <div style="margin-top: 15px;">
                    <table id="provider-limit-table">
                        <thead>
                        <tr>
                            <th><?php p($l->t('Provider')); ?></th>
                            <th><?php p($l->t('Results per search')); ?></th>
                        </tr>
                        </thead>
                        <tbody>
                        <?php foreach ($providers as $provider): ?>
                            <?php
                            $limit = $settings['providerLimits'][$provider['id']] ?? 10;
                            $inputId = 'limit_' . $provider['id'];
                            $isAvailable = isProviderAvailableToAnyGroup($provider['id'], $settings['enabled'], $settings['providerGroupMap']);
                            ?>
                            <tr>
                                <td><?php p($provider['name']); ?></td>
                                <td>
                                    <?php if ($isAvailable): ?>
                                        <input type="number"
                                               id="<?php p($inputId); ?>"
                                               name="limits[<?php p($provider['id']); ?>]"
                                               value="<?php p($limit); ?>"
                                               min="5"
                                               max="100"
                                               step="5"
                                               class="limit-input">
                                        <label for="<?php p($inputId); ?>" class="screenreader-only">
                                            <?php p($l->t('Number of results for %s', [$provider['name']])); ?>
                                        </label>
                                    <?php else: ?>
                                        <input type="number"
                                               id="<?php p($inputId); ?>"
                                               name="limits[<?php p($provider['id']); ?>]"
                                               value="<?php p($limit); ?>"
                                               min="5"
                                               max="100"
                                               step="5"
                                               class="limit-input"
                                               disabled>
                                        <span class="provider-unavailable-hint">
                                            <?php p($l->t('Not available to any group')); ?>
                                        </span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="margin-top: 15px;">
                <button type="submit" class="button primary">
                    <?php p($l->t('Save')); ?>
                </button>
            </div>
        </div>
    </form>
</div>

<style>
    #thesearchpage-settings {
        margin-bottom: 20px;
    }

    .thesearchpage-settings-section {
        margin-top: 15px;
    }

    .screenreader-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    #provider-group-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    #provider-group-table th,
    #provider-group-table td {
        border: 1px solid var(--color-border);
        padding: 8px;
        text-align: left;
    }

    #provider-group-table th {
        background-color: var(--color-background-dark);
        font-weight: bold;
    }

    #provider-group-table td {
        text-align: center;
    }

    #provider-group-table td:first-child {
        text-align: left;
        font-weight: 500;
    }

    #provider-group-table input[type="checkbox"] {
        cursor: pointer;
    }

    #provider-group-table input[type="checkbox"]:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .group-row {
        background-color: var(--color-main-background);
    }

    .group-row:hover {
        background-color: var(--color-background-hover);
    }

    .success {
        color: var(--color-success);
        padding: 10px;
        background-color: var(--color-success-background, rgba(70, 176, 88, 0.1));
        border-radius: 3px;
    }

    .error {
        color: var(--color-error);
        padding: 10px;
        background-color: var(--color-error-background, rgba(233, 50, 45, 0.1));
        border-radius: 3px;
    }

    #provider-limit-table {
        width: 100%;
        max-width: 600px;
        border-collapse: collapse;
        margin-top: 10px;
    }

    #provider-limit-table th,
    #provider-limit-table td {
        border: 1px solid var(--color-border);
        padding: 8px;
        text-align: left;
    }

    #provider-limit-table th {
        background-color: var(--color-background-dark);
        font-weight: bold;
    }

    #provider-limit-table td:last-child {
        text-align: center;
    }

    .limit-input {
        width: 80px;
        text-align: center;
    }

    .provider-unavailable-hint {
        display: block;
        font-size: 0.9em;
        color: var(--color-text-maxcontrast);
        margin-top: 4px;
        font-style: italic;
    }

    #provider-limit-table input[type="number"]:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .settings-note {
        margin-top: 8px;
        padding: 8px 12px;
        background-color: var(--color-background-dark);
        border-left: 3px solid var(--color-primary-element);
        border-radius: 3px;
    }
</style>

<script nonce="<?php p(OC::$server->getContentSecurityPolicyNonceManager()->getNonce()); ?>">
    (function () {
        const checkbox = document.getElementById('restrict-providers-enabled');
        const form = checkbox.closest('form');

        // Auto-submit form when checkbox changes to reload page with updated table
        checkbox.addEventListener('change', function () {
            // Small delay to ensure checkbox state is committed
            setTimeout(function () {
                form.submit();
            }, 50);
        });
    })();
</script>
