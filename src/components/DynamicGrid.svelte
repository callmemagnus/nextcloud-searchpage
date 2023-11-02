<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { afterUpdate, onMount } from 'svelte';
	import { generateArray } from '../lib/array-utils';

	// eslint-disable-next-line no-undef
	type T = $$Generic;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface $$Slots {
		default: { item: T };
	}

	export let items: T[];
	export let minCellWidth: number;
	export let minCellHeight: number;

	const paddingBottom = 10;

	let columns: number;
	let rows: number;

	let me: HTMLDivElement;
	$: count = items.length;

	function updateContainer(rows: number, columns: number) {
		me.style.display = rows === 1 && columns === 1 ? 'block' : 'grid';
		me.style.overflowY = 'scroll';
		if (rows > 1) {
			me.style.gridTemplateRows = generateArray(rows, `${minCellHeight}px`).join(' ');
		} else {
			me.style.gridTemplateRows = `${me.getBoundingClientRect().height - paddingBottom}px`;
		}
		me.style.gridTemplateColumns = generateArray(columns, '1fr').join(' ');
	}

	function updateCells(rows: number) {
		const cells = Array.from(me.getElementsByClassName('mwb-dynamic-grid-cell'));
		cells.forEach((cell) => {
			const hElement = cell as HTMLElement;
			if (rows === 1) {
				hElement.style.height = `${me.getBoundingClientRect().height - paddingBottom}px`;
			} else {
				hElement.style.height = 'auto';
			}
		});
	}

	function resize() {
		if (!me) return;
		const availableWidth = me.clientWidth;
		columns = Math.min(Math.round(availableWidth / minCellWidth), count);
		rows = Math.ceil(count / columns);

		updateContainer(rows, columns);
		updateCells(rows);
	}

	afterUpdate(() => {
		resize();
	});

	onMount(() => {
		resize();
		me.style.paddingBottom = `${paddingBottom}px`;
		me.style.gridTemplateColumns = '1fr';
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	});
</script>

<div class="mwb-dynamic-grid" bind:this={me} data-columns={columns} data-rows={rows}>
	{#each items as item}
		<div class="mwb-dynamic-grid-cell">
			<slot {item} />
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
