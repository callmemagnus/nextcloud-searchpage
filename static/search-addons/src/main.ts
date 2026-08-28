// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadState } from '@nextcloud/initial-state';
import { translate } from '@nextcloud/l10n';
import { mount, unmount } from 'svelte';
import { APP_NAME } from '@shared/libs';
import SearchResultsPanel from './SearchResultsPanel.svelte';
import { session } from './session.svelte';

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

// undefined = feature disabled or no providers available for this user/page — caller
// should let the native trigger behave normally. null = all providers.
function computeEffectiveProviderIds(): string[] | null | undefined {
	const { enabled, providerIds } = getConfigForCurrentUrl();
	if (!enabled) return undefined;

	if (availableProviderIds !== null) {
		const effective = providerIds
			? providerIds.filter((id) => availableProviderIds.includes(id))
			: availableProviderIds;
		if (effective.length === 0) return undefined;
		return effective;
	}

	return providerIds;
}

// --- Live search session -----------------------------------------------
//
// A session starts the moment the user activates the search trigger (click,
// or Tab-focus into NC35+'s native input). Rather than reusing/patching
// NC's own widget in place — which ties us to its exact internal DOM/CSS
// (label markup, stacking context) and has proven fragile across NC
// versions/themes — we hide the whole original widget and show our own
// overlay input instead. That keeps positioning, z-index and label text
// fully under our control regardless of NC's markup. The results panel
// mounts lazily once the user types a first character.

let activeTrigger: HTMLInputElement | null = null;
let activeProviderIds: string[] | null = null;
let hiddenWrapperEl: HTMLElement | null = null;

let panelContainer: HTMLDivElement | null = null;
let panelComponent: ReturnType<typeof mount> | null = null;

function reposition() {
	if (activeTrigger) session.anchorRect = activeTrigger.getBoundingClientRect();
}

function ensurePanelMounted() {
	if (panelComponent || !activeTrigger) return;
	session.anchorRect = activeTrigger.getBoundingClientRect();
	panelContainer = document.createElement('div');
	document.body.appendChild(panelContainer);
	panelComponent = mount(SearchResultsPanel, {
		target: panelContainer,
		props: {
			initialProviderIds: activeProviderIds,
			currentPath: getCurrentFilesDir(),
			providerLimits,
			isAdmin,
			onclose: closeSession
		}
	});
	window.addEventListener('scroll', reposition, { capture: true, passive: true });
	window.addEventListener('resize', reposition);
}

function unmountPanelOnly() {
	if (panelComponent) {
		unmount(panelComponent);
		panelComponent = null;
	}
	if (panelContainer) {
		panelContainer.remove();
		panelContainer = null;
	}
	window.removeEventListener('scroll', reposition, { capture: true });
	window.removeEventListener('resize', reposition);
}

function closeSession() {
	unmountPanelOnly();
	activeTrigger?.remove();
	if (hiddenWrapperEl) {
		hiddenWrapperEl.style.visibility = '';
		hiddenWrapperEl = null;
	}
	session.term = '';
	session.anchorRect = null;
	activeProviderIds = null;
	activeTrigger = null;
}

function handleTypingInput(el: HTMLInputElement) {
	session.term = el.value;
	if (el.value.length > 0) {
		ensurePanelMounted();
	} else {
		unmountPanelOnly();
	}
}

function handleTypingKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape') {
		closeSession();
		return;
	}
	if (e.key === 'Enter') e.preventDefault();
}

function createSyntheticInput(trigger: HTMLElement): HTMLInputElement {
	// Cover the whole NC search widget (icon + label + input + buttons) when
	// present, not just the trigger itself, so nothing of the original peeks
	// out from behind our overlay. On NC35+ mobile, `.unified-search-input`
	// collapses to `display: contents` (it just holds a header button rather
	// than the desktop input field), which makes its bounding rect degenerate
	// (all zeros) — fall back to the trigger's own rect in that case so the
	// overlay lands on the visible button instead of the viewport origin.
	const wrapperCandidate = trigger.closest('.unified-search-input') as HTMLElement | null;
	const wrapperRect = wrapperCandidate?.getBoundingClientRect();
	const hasBox = !!wrapperRect && (wrapperRect.width > 0 || wrapperRect.height > 0);
	const wrapper = hasBox ? wrapperCandidate! : trigger;
	const input = document.createElement('input');
	input.type = 'text';
	input.autocomplete = 'off';
	input.className = 'mwb-search-synthetic-input';
	input.placeholder = translate(APP_NAME, 'Search…');
	input.setAttribute('aria-label', translate(APP_NAME, 'Search…'));

	let top: number;
	let left: number;
	let width: number;
	let height: number;
	if (hasBox) {
		const rect = wrapperRect!;
		// Cap the height to a compact input size rather than inheriting the
		// full (often taller) wrapper height, centering it in the original
		// space.
		height = Math.min(rect.height, 30);
		top = rect.top + (rect.height - height) / 2 - 4;
		left = rect.left;
		width = Math.max(rect.width, 220);
	} else {
		// NC35+ mobile: the trigger is just a small icon button, too cramped
		// to anchor an input against. Float the input horizontally centered,
		// in place of the icon's own row (i.e. still in the header, not
		// pushed down below it).
		const rect = trigger.getBoundingClientRect();
		height = Math.min(rect.height, 30);
		top = rect.top + (rect.height - height) / 2;
		width = Math.min(window.innerWidth - 32, 400);
		left = window.innerWidth / 2 - width / 2;
	}

	Object.assign(input.style, {
		position: 'fixed',
		top: `${top}px`,
		left: `${left}px`,
		width: `${width}px`,
		height: `${height}px`,
		// NC's global CSS sets min-height: var(--default-clickable-area) (an
		// accessibility minimum touch-target size, ~34px) on all <input>
		// elements — that floors a smaller explicit height right back up
		// unless we override it too.
		minHeight: `${height}px`,
		//lineHeight: '1em',
		zIndex: '10002',
		boxSizing: 'border-box',
		font: 'inherit',
		color: 'var(--color-main-text)',
		background: 'var(--color-main-background)',
		border: '1px solid var(--color-border)',
		borderRadius: 'var(--border-radius, 4px)',
		padding: '0 8px'
	});
	document.body.appendChild(input);
	wrapper.style.visibility = 'hidden';
	hiddenWrapperEl = wrapper;

	input.addEventListener('input', () => handleTypingInput(input));
	input.addEventListener('keydown', handleTypingKeydown);
	input.addEventListener('blur', () => {
		if (activeTrigger === input && session.term.length === 0) closeSession();
	});

	return input;
}

function activate(trigger: HTMLElement, providerIds: string[] | null) {
	if (activeTrigger) return;
	const synthetic = createSyntheticInput(trigger);
	activeTrigger = synthetic;
	activeProviderIds = providerIds;
	synthetic.focus();
}

function attachNativeInputTrigger(trigger: HTMLInputElement) {
	const onMouseDown = (e: MouseEvent) => {
		if (activeTrigger) return;
		const providerIds = computeEffectiveProviderIds();
		if (providerIds === undefined) return;
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
		activate(trigger, providerIds);
	};

	const onFocus = (e: FocusEvent) => {
		if (activeTrigger) return;
		const providerIds = computeEffectiveProviderIds();
		if (providerIds === undefined) return;
		e.stopImmediatePropagation();
		e.stopPropagation();
		activate(trigger, providerIds);
	};

	trigger.addEventListener('mousedown', onMouseDown, { capture: true });
	trigger.addEventListener('focus', onFocus, { capture: true });
}

function attachButtonTrigger(button: HTMLElement) {
	const onClick = (e: Event) => {
		if (activeTrigger) return;
		const providerIds = computeEffectiveProviderIds();
		if (providerIds === undefined) return;
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
		activate(button, providerIds);
	};

	button.addEventListener('click', onClick, { capture: true });
}

// --- DOM discovery / bootstrap -------------------------------------------

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

function keepRestingIconLeftAligned() {
	// NC35+ animates the idle icon+label from the left edge toward the
	// horizontal center via a transform (see .unified-search-input__resting),
	// so it reads like a centered call-to-action until focused. We want it
	// left-aligned even before the user clicks, so cancel that slide.
	const style = document.createElement('style');
	style.textContent = '.unified-search-input__resting { transform: none !important; }';
	document.head.appendChild(style);
}

function attachSearchButtonListener(trigger: Element) {
	// Older NC versions structure the trigger differently and have no
	// dedicated label span, so leave their text untouched rather than risk
	// mangling it.
	const labelTarget = findLabelTarget(trigger);
	if (labelTarget) {
		setButtonLabel(labelTarget, translate(APP_NAME, 'Search…'));
		keepRestingIconLeftAligned();
	}

	if (trigger instanceof HTMLInputElement) {
		attachNativeInputTrigger(trigger);
	} else if (trigger instanceof HTMLElement) {
		attachButtonTrigger(trigger);
	}
	console.log('magnus', trigger);
	(trigger as HTMLElement).style.textAlign = 'left';
	(trigger as HTMLElement).style.justifyContent = 'left';
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
