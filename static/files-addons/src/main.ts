// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { mount, unmount } from 'svelte';
import MiniSearchModal from './MiniSearchModal.svelte';

/**
 * Map the current page URL to a set of provider IDs to pre-select.
 * Returns null to mean "all providers".
 */
function getProviderIdsForCurrentUrl(): string[] | null {
	const path = window.location.pathname;
	if (path.includes('/apps/files')) {
		return ['files'];
	}
	// dashboard, home, everything else → all providers
	return null;
}

let modalContainer: HTMLDivElement | null = null;
let modalComponent: ReturnType<typeof mount> | null = null;

function openModal() {
	if (modalContainer) return; // already open

	modalContainer = document.createElement('div');
	document.body.appendChild(modalContainer);

	modalComponent = mount(MiniSearchModal, {
		target: modalContainer,
		props: {
			initialProviderIds: getProviderIdsForCurrentUrl(),
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

function attachSearchButtonListener(button: Element) {
	button.addEventListener(
		'click',
		(e) => {
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			openModal();
		},
		{ capture: true }
	);
}

function hijackSearchButton() {
	// <v33
	let button = document.querySelector('#unified-search button > span');
	if (!button) {
		// v34
		button = document.querySelector('.unified-search-input button');
	}
	if (button) {
		attachSearchButtonListener(button);
		return;
	}

	// Button not yet in DOM — wait for it
	const observer = new MutationObserver(() => {
		let btn = document.querySelector('#unified-search button > span');
		if (!btn) {
			btn = document.querySelector('.unified-search-input button');
		}
		if (btn) {
			observer.disconnect();
			attachSearchButtonListener(btn);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', hijackSearchButton);
