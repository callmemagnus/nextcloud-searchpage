// import { confirmPassword } from '@nextcloud/password-confirmation';
// import '@nextcloud/password-confirmation/style.css'; // Required for dialog styles

// export async function withPrivilege(callback: () => Promise<void>) {
// 	await confirmPassword();
// 	await callback();
// }

import { clog } from './log';
export async function withPrivilege(callback: () => Promise<void>) {
	if (OC.PasswordConfirmation.requiresPasswordConfirmation()) {
		return new Promise((resolve, reject) => {
			clog('before password confirmation');
			OC.PasswordConfirmation.requirePasswordConfirmation(
				async () => {
					clog('actually doing something');
					await callback();
					resolve({});
				},
				{
					title: 'Password is required'
				},
				() => {
					reject('User is not authenticated');
				}
			);
		});
	} else {
		callback();
	}
}
