<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { escapeForRegexp } from '../lib/text';

	type Props = {
		terms: string;
		original: string;
	};

	type Token = {
		bold: boolean;
		value: string;
	};

	let { terms, original }: Props = $props();

	let tokenized = $derived.by<Token[]>(() => {
		const separator = '|##|';
		let result = original;

		for (const term of terms.split(' ')) {
			const escapedTerm = escapeForRegexp(term);
			result = result.replaceAll(
				new RegExp(`(${escapedTerm})`, 'ig'),
				`${separator}%b%$1%b%${separator}`
			);
		}

		return result.split(separator).map((token) => ({
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
