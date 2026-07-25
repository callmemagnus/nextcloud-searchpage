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

function isNextcloud34(): boolean {
	const version = (window as unknown as { OC?: { config?: { version?: string } } }).OC?.config
		?.version;
	return !!version && version.startsWith('34.');
}

function attachSearchButtonListener(button: Element) {
	// The button's label markup only reliably has a dedicated, safely
	// replaceable label span on NC 34 (`.unified-search-input__label`).
	// Older versions structure the button differently, so leave their text
	// untouched rather than risk mangling it.
	if (isNextcloud34()) {
		setButtonLabel(button, translate(APP_NAME, 'Search…'));
	}

	button.addEventListener(
		'click',
		(e) => {
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
			openModal(effectiveProviderIds);
		},
		{ capture: true }
	);
}

function findSearchButton(): Element | null {
	// NC 30: .unified-search-menu  |  NC 31-33: #unified-search  |  NC 34: .unified-search-input
	// Select the <button> itself, not a child span: the button's content is
	// split across an icon span and a label span, and only the button is a
	// common ancestor of both (needed for click capture and label lookup).
	return (
		document.querySelector('.unified-search-menu button') ??
		document.querySelector('#unified-search button') ??
		document.querySelector('.unified-search-input button')
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
