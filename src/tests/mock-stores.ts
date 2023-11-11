import { writable } from 'svelte/store';
import { vi } from 'vitest';
import type { Provider } from '$states/providers';

const mockProviderIdsWritable = writable<string[]>([]);
export const mockProviderIds = {
	subscribe: mockProviderIdsWritable.subscribe,
	set: vi.fn(),
	mock: (value: string[]) => mockProviderIdsWritable.set(value)
};

const mockTermsWritable = writable('');
export const mockTerms = {
	subscribe: mockTermsWritable.subscribe,
	set: vi.fn(),
	mock: (value: string) => mockTermsWritable.set(value)
};

export const defaultProviders = [
	{ id: 'a', name: 'AAA' },
	{ id: 'b', name: 'BBB' }
];
const mockProvidersWritable = writable<Provider[]>([]);
export const mockProviders = {
	subscribe: mockProvidersWritable.subscribe,
	set: vi.fn(),
	load: () => {
		mockProvidersWritable.set(defaultProviders);
	},
	mock: (value: Provider[]) => mockProvidersWritable.set(value)
};
