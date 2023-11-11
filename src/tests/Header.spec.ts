import { defaultProviders } from '$/tests/mock-stores';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest';
import SearchBox from '../components/Header/SearchBox.svelte';

const { mockProviderIds, mockProviders, mockTerms } = await vi.hoisted(
	() => import('./mock-stores')
);

describe('Header', () => {
	beforeAll(() => {
		vi.mock('$states/providers', async () => ({
			providers: mockProviders
		}));
		vi.mock('$/states/query', async () => ({
			providerIds: mockProviderIds,
			terms: mockTerms
		}));
	});

	beforeEach(() => {
		vi.resetAllMocks();
	});

	test('default layout', () => {
		render(SearchBox);

		expect(screen.getByRole('textbox')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Search' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
		expect(screen.getByRole('button', { name: '⨯' })).toBeVisible();
		expect(screen.getByRole('button', { name: '⨯' })).toBeDisabled();
	});

	test('typing a value should enable ⨯', async () => {
		const user = userEvent.setup();
		mockProviders.load();
		mockProviderIds.mock(['a']);
		render(SearchBox);
		expect(screen.getByRole('button', { name: '⨯' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();

		await user.type(screen.getByRole('textbox'), 'test');
		await tick();

		expect(screen.getByRole('button', { name: '⨯' })).toBeEnabled();
		expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
	});

	it('should emit the search event', async () => {
		const user = userEvent.setup();
		mockProviders.load();
		mockProviderIds.mock(['a']);

		const spy = vi.fn();
		const result = render(SearchBox);
		result.component.$on('search', spy);
		await user.type(screen.getByRole('textbox'), 'test');
		await user.click(screen.getByRole('button', { name: 'Search' }));

		expect(spy).toHaveBeenCalledOnce();
		expect(mockTerms.set).toHaveBeenCalledOnce();
		expect(mockTerms.set).toHaveBeenCalledWith('test');
		expect(mockProviderIds.set).toHaveBeenCalledWith(['a']);
	});

	// it('should emit the search event on typing ENTER', async () => {
	// 	const user = userEvent.setup();
	// 	const spy = vi.fn();
	// 	const result = render(SearchBox);
	// 	result.component.$on('search', spy);
	// 	await user.type(screen.getByRole('textbox'), 'test');
	// 	await user.type(screen.getByRole('textbox'), '\n');
	// 	expect(spy.mock.calls.length).toEqual(1);
	// });

	it('should emit the clear event', async () => {
		const user = userEvent.setup();
		mockProviders.load();
		mockProviderIds.mock(['a']);
		const spy = vi.fn();
		const result = render(SearchBox);
		result.component.$on('clear', spy);
		await user.type(screen.getByRole('textbox'), 'test');
		await user.click(screen.getByRole('button', { name: '⨯' }));
		expect(spy).toHaveBeenCalledOnce();
	});

	it.skip('should immediately emit search if value are available', () => {
		mockProviders.load();
		mockProviderIds.mock(['a']);
		mockTerms.mock('test');

		const spy = vi.fn();
		const result = render(SearchBox);
		result.component.$on('search', spy);
		result.unmount();
		result.rerender({});
		expect(spy).toHaveBeenCalledOnce();
	});

	it('should populate the list of available providers', async () => {
		const user = userEvent.setup();
		mockProviders.load();
		mockProviderIds.mock(['a']);

		render(SearchBox);

		const button = screen.getByRole('button', { name: /Filters/ });
		expect(button).toBeEnabled();

		await user.click(button);

		expect(screen.getAllByRole('checkbox').length).toBe(defaultProviders.length + 1);
	});

	it('should update the parameters when selecting a provider', async () => {
		const user = userEvent.setup();
		mockProviders.load();
		mockProviderIds.mock(['a']);
		mockTerms.mock('abc');

		render(SearchBox);

		const button = screen.getByRole('button', { name: /Filters/ });
		expect(button).toBeEnabled();

		await user.click(button);

		await userEvent.click(
			screen.getByRole('checkbox', {
				name: defaultProviders[1].name
			})
		);
		await userEvent.click(screen.getByRole('button', { name: 'Search' }));

		expect(mockProviderIds.set).toHaveBeenCalledOnce();
		expect(mockProviderIds.set).toHaveBeenCalledWith(['All']);

		await userEvent.click(
			screen.getByRole('checkbox', {
				name: defaultProviders[1].name
			})
		);
		await userEvent.click(screen.getByRole('button', { name: 'Search' }));

		expect(mockProviderIds.set).toHaveBeenLastCalledWith(['a']);
	});
});
