import { writable } from 'svelte/store';
import { loadState } from '@nextcloud/initial-state';
import { APP_NAME } from '../constants';

type Labels = Record<string, string>;

export const labels = writable<Labels>(loadState(APP_NAME, 'labels', {}));
