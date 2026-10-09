// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

// Shared reactive state bridging the plain-DOM hijack logic in main.ts and the
// SearchResultsPanel.svelte component it mounts. main.ts mutates this object
// on every keystroke/scroll/resize; the panel reacts via runes without needing
// prop updates through Svelte 5's mount().
export const session = $state({
	term: '',
	anchorRect: null as DOMRect | null
});
