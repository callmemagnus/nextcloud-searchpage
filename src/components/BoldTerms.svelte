<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	type Props = {
		terms: string;
		original: string;
	};

	type Token = {
		bold: boolean;
		value: string;
	};

	let { terms, original }: Props = $props();

	let tokenized: Token[] = $state([]);

	$effect.pre(() => {
		let result = original;
		terms
			// remove non simple characters...
			.replaceAll(/[^a-zA-Z0-9]/g, '')
			.split(' ')
			.forEach((term) => {
				result = result.replaceAll(new RegExp(`(${term})`, 'ig'), '-%b%$1%b%-');
			});
		tokenized = result.split('-').map((token) => ({
			bold: token.startsWith('%b%') && token.endsWith('%b%'),
			value: token.replaceAll(new RegExp('%b%', 'g'), '')
		}));
	});
</script>

{#each tokenized as token, i (`${i}-${token.value}`)}
		{#if token.bold}
			<b>{token.value}</b>
		{:else}
			{token.value}
		{/if}
{/each}
