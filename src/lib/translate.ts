import { APP_NAME } from '$/constants';
import { translate } from '@nextcloud/l10n';

export function t(label: string, subst?: Record<string, string>): string {
	return translate(APP_NAME, label, subst);
}
