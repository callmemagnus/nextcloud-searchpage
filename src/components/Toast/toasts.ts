import { get, writable } from 'svelte/store';

export type Toast = {
	id: symbol;
	text: string;
	duration: number;
	type: 'info' | 'success' | 'warning' | 'error';
};

export const toasts = writable<Toast[]>([]);

function addToast(toast: Omit<Toast, 'id'>) {
	const id = Symbol(toast.text);
	toasts.update((previousToasts) => [
		{
			...toast,
			id
		},
		...previousToasts
	]);
	setTimeout(() => {
		console.log(get(toasts));
		toasts.update((previousValues) => [...previousValues.filter((toast) => toast.id !== id)]);
	}, toast.duration);
}

const defaultDuration = 3000;

export const toast = {
	info(text: string, options: Pick<Toast, 'duration'> = { duration: defaultDuration }) {
		addToast({
			...options,
			type: 'info',
			text
		});
	},
	success(text: string, options: Pick<Toast, 'duration'> = { duration: defaultDuration }) {
		addToast({
			...options,
			type: 'success',
			text
		});
	},
	warn(text: string, options: Pick<Toast, 'duration'> = { duration: defaultDuration }) {
		addToast({
			...options,
			type: 'warning',
			text
		});
	},
	error(text: string, options: Pick<Toast, 'duration'> = { duration: 3000 }) {
		addToast({
			...options,
			type: 'error',
			text
		});
	}
};
