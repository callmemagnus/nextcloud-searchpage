<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { onMount, type Snippet } from 'svelte';
	import { generateArray } from '../lib/array-utils';

	// eslint-disable-next-line no-undef
	type T = $$Generic;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface $$Slots {
		default: { item: T };
		item: { item: T };
	}

	type Props = {
		items: T[];
		toto: Snippet<[T]>;
		minCellWidth: number;
		minCellHeight: number;
	};

	let { items, minCellHeight, minCellWidth, item }: Props = $props();

	const paddingBottom = 30;

	let columns = $state<number | undefined>();
	let rows = $state<number | undefined>();

	let me = $state<HTMLDivElement | undefined>();
	let count = $derived(items.length);

	function updateContainer(rows: number, columns: number) {
		if (me) {
			me.style.display = rows === 1 && columns === 1 ? 'block' : 'grid';
			me.style.overflowY = 'scroll';
			if (rows > 1) {
				me.style.gridTemplateRows = generateArray(rows, `${minCellHeight}px`).join(' ');
			} else {
				me.style.gridTemplateRows = `${me.getBoundingClientRect().height - paddingBottom}px`;
			}
			me.style.gridTemplateColumns = generateArray(columns, '1fr').join(' ');
		}
	}

	function updateCells(rows: number) {
		if (me) {
			const cells = Array.from(me.getElementsByClassName('mwb-dynamic-grid-cell'));
			for (const cell of cells) {
				const hElement = cell as HTMLElement;
				if (rows === 1) {
					const top = me.getBoundingClientRect().top;
					hElement.style.height = `${window.innerHeight - top - paddingBottom}px`;
				} else {
					hElement.style.height = 'auto';
				}
			}
		}
	}

	function resize() {
		if (!me) return;
		const availableWidth = me.clientWidth;
		columns = Math.min(Math.round(availableWidth / minCellWidth), count);
		rows = Math.ceil(count / columns);

		updateContainer(rows, columns);
		updateCells(rows);
	}

	$effect(() => {
		resize();
	});

	onMount(() => {
		if (me) {
			me.style.paddingBottom = `${paddingBottom}px`;
			me.style.gridTemplateColumns = '1fr';
			window.addEventListener('resize', resize);
		}
		return () => {
			window.removeEventListener('resize', resize);
		};
	});
</script>

<div bind:this={me} class="mwb-dynamic-grid" data-columns={columns} data-rows={rows}>
	{#each items as i}
		<div class="mwb-dynamic-grid-cell">
			{@render item(i)}
		</div>
	{/each}
</div>

<style>
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
