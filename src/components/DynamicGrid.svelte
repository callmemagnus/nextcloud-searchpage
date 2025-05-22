<script lang="ts" generics="T extends {providerId: string}">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { onMount, type Snippet } from 'svelte';
	import { generateArray } from '../lib/array-utils';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface $$Slots {
		default: { item: T };
		itemSnippet: { item: T };
	}

	type Props = {
		items: T[];
		itemSnippet: Snippet<[T]>;
		minCellWidth: number;
		minCellHeight: number;
	};

	let { items, minCellHeight, minCellWidth, itemSnippet }: Props = $props();

	const paddingBottom = 50;

	let me = $state<HTMLDivElement | undefined>();
	let availableWidth = $state<number>(800);
	let count = $derived(items.length);
	let columns = $derived(me ? Math.min(Math.round(availableWidth / minCellWidth), count) : 1);
	let rows = $derived(Math.ceil(count / columns));
	let cellHeight = $derived(
		rows === 1
			? `${window.innerHeight - (me?.getBoundingClientRect().top || 0) - paddingBottom}px`
			: 'auto'
	);
	let gridTemplateRows = $derived(
		rows === 1
			? `${window.innerHeight - (me?.getBoundingClientRect().top || 0) - paddingBottom}px`
			: generateArray(rows, `${minCellHeight}px`).join(' ')
	);
	function updateContainer(rows: number, columns: number) {
		if (me) {
			me.style.display = rows === 1 && columns === 1 ? 'block' : 'grid';
			me.style.overflowY = 'scroll';
			me.style.gridTemplateRows = gridTemplateRows;
			me.style.gridTemplateColumns = generateArray(columns, '1fr').join(' ');
		}
	}

	function updateCells() {
		if (me) {
			const cells = Array.from(me.getElementsByClassName('mwb-dynamic-grid-cell'));
			for (const cell of cells) {
				const hElement = cell as HTMLElement;
				hElement.style.minHeight = cellHeight;
			}
		}
	}

	$effect(() => {
		updateContainer(rows, columns);
		updateCells();
	});

	function resize() {
		if (me) {
			availableWidth = me.clientWidth;
		}
	}

	onMount(() => {
		const timer = setTimeout(() => resize());
		if (me) {
			me.style.paddingBottom = `${paddingBottom}px`;
			me.style.gridTemplateColumns = '1fr';
		}
		window.addEventListener('resize', resize);

		return () => {
			clearTimeout(timer);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<div bind:this={me} class="mwb-dynamic-grid" data-columns={columns} data-rows={rows}>
	{#if count}
		{#each items as i (i.providerId)}
			<div class="mwb-dynamic-grid-cell">
				{@render itemSnippet(i)}
			</div>
		{/each}
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-dynamic-grid {
		@apply h-full w-full grid justify-stretch items-stretch gap-4;
		min-height: 0;
		min-width: 0;
	}

	.mwb-dynamic-grid-cell {
		overflow: hidden;
		min-width: 0;
	}
</style>
