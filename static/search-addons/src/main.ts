// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadState } from '@nextcloud/initial-state';
import { translate } from '@nextcloud/l10n';
import { mount, unmount } from 'svelte';
import { APP_NAME } from '@shared/libs';
import MiniSearchModal from './MiniSearchModal.svelte';

type AppSearchConfigEntry = {
	enabled: boolean;
	providerIds: string[] | null; // null or empty = all providers
};

const appSearchConfig = loadState<Record<string, AppSearchConfigEntry>>(
	'thesearchpage',
	'appSearchConfig',
	{}
);

const providerLimits = loadState<Record<string, number>>('thesearchpage', 'providerLimits', {});
const isAdmin = loadState<boolean>('thesearchpage', 'isAdmin', false);
// null = restrictions disabled (all providers accessible); string[] = restricted list for this user
const availableProviderIds = loadState<string[] | null>(
	'thesearchpage',
	'availableProviderIds',
	null
);

function getAppIdFromPath(pathname: string): string | null {
	const match = pathname.match(/\/apps\/([^/]+)/);
	return match ? match[1] : null;
}

function getCurrentFilesDir(): string | null {
	const appId = getAppIdFromPath(window.location.pathname);
	if (appId !== 'files') return null;
	return new URLSearchParams(window.location.search).get('dir') ?? '/';
}

function getConfigForCurrentUrl(): { enabled: boolean; providerIds: string[] | null } {
	const pathname = window.location.pathname;

	const key = /\/settings(\/|$)/.test(pathname) ? '__settings__' : getAppIdFromPath(pathname);
	if (!key) return { enabled: false, providerIds: null };

	const entry = appSearchConfig[key];
	if (!entry) return { enabled: true, providerIds: null };

	return {
		enabled: entry.enabled,
		providerIds: entry.providerIds?.length ? entry.providerIds : null
	};
}

let modalContainer: HTMLDivElement | null = null;
let modalComponent: ReturnType<typeof mount> | null = null;

function openModal(providerIds: string[] | null) {
	if (modalContainer) return;

	modalContainer = document.createElement('div');
	document.body.appendChild(modalContainer);

	modalComponent = mount(MiniSearchModal, {
		target: modalContainer,
		props: {
			initialProviderIds: providerIds,
			currentPath: getCurrentFilesDir(),
			providerLimits,
			isAdmin,
			onclose: closeModal
		}
	});
}

function closeModal() {
	if (modalComponent) {
		unmount(modalComponent);
		modalComponent = null;
	}
	if (modalContainer) {
		modalContainer.remove();
		modalContainer = null;
	}
}

function setButtonLabel(el: Element, text: string) {
	// Walk the whole subtree (not just direct children) since the label text
	// may sit inside a nested span alongside the icon. Skip whitespace-only
	// text nodes (template formatting) so we land on the real label, not
	// stray whitespace next to the icon.
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) =>
			node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
	});
	const existing = walker.nextNode();
	if (existing) {
		existing.textContent = text;
		return;
	}
	// No existing non-empty text node anywhere (e.g. an icon-only button) —
	// add the label without touching any existing child elements such as
	// the icon.
	el.appendChild(document.createTextNode(text));
}

function findLabelTarget(trigger: Element): Element | null {
	// On NC 34 the label span sits inside the button itself. On NC 35+ the
	// trigger is an <input> (which can't hold child elements as a visible
	// label), and the label span is a sibling within the shared
	// `.unified-search-input` wrapper instead. Feature-detect rather than
	// branch on version so this keeps working on future NC releases that
	// reuse the same wrapper/label classes.
	return (
		trigger.closest('.unified-search-input')?.querySelector('.unified-search-input__label') ??
		null
	);
}

function attachSearchButtonListener(trigger: Element) {
	// Older NC versions structure the trigger differently and have no
	// dedicated label span, so leave their text untouched rather than risk
	// mangling it.
	const labelTarget = findLabelTarget(trigger);
	if (labelTarget) {
		setButtonLabel(labelTarget, translate(APP_NAME, 'Search…'));
	}

	const onTrigger = (e: Event) => {
		const { enabled, providerIds } = getConfigForCurrentUrl();
		if (!enabled) return;

		let effectiveProviderIds = providerIds;
		if (availableProviderIds !== null) {
			effectiveProviderIds = providerIds
				? providerIds.filter((id) => availableProviderIds.includes(id))
				: availableProviderIds;
			if (effectiveProviderIds.length === 0) return;
		}

		e.stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
		if (trigger instanceof HTMLElement) trigger.blur();
		openModal(effectiveProviderIds);
	};

	if (trigger instanceof HTMLInputElement) {
		// NC 35+: the trigger is now an editable combobox input rather than a
		// plain button. Intercept on mousedown (before the input can gain
		// focus/open NC's own dropdown) and on focus (covers keyboard
		// activation — Tab, or NC's own Ctrl+K shortcut, which both focus the
		// input without a preceding mousedown here).
		trigger.addEventListener('mousedown', onTrigger, { capture: true });
		trigger.addEventListener('focus', onTrigger, { capture: true });
	} else {
		trigger.addEventListener('click', onTrigger, { capture: true });
	}
}

function findSearchButton(): Element | null {
	// NC 30: .unified-search-menu  |  NC 31-33: #unified-search  |  NC 34: .unified-search-input (button)
	// NC 35+: same wrapper classes, but the trigger is an editable
	// <input role="combobox"> instead of a <button>.
	return (
		document.querySelector('.unified-search-menu button') ??
		document.querySelector('.unified-search-menu input[role="combobox"]') ??
		document.querySelector('#unified-search button') ??
		document.querySelector('#unified-search input[role="combobox"]') ??
		document.querySelector('.unified-search-input button') ??
		document.querySelector('.unified-search-input input[role="combobox"]')
	);
}

function hijackSearchButton() {
	const button = findSearchButton();
	if (button) {
		attachSearchButtonListener(button);
		return;
	}

	// Button not yet in DOM — wait for it
	const observer = new MutationObserver(() => {
		const btn = findSearchButton();
		if (btn) {
			observer.disconnect();
			attachSearchButtonListener(btn);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', hijackSearchButton);
