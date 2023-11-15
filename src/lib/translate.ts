import { APP_NAME } from '$/constants';

export function t(label: string, subst?: Record<string, string>): string {
	return window.t(APP_NAME, label, subst);
}
