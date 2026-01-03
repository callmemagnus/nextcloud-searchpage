import { generateOcsUrl } from "@nextcloud/router";
import axios from "@nextcloud/axios";

export type Provider = {
	id: string;
	name: string;
	limit?: number;
};

const disfunctionalProviders = [
	// Is broken, always returns []
	'users'
];


export async function fetchProviders() {
	try {
		const url = generateOcsUrl('search/providers');
		const result = await axios.get(url);

		if (result.data.ocs.meta.statuscode === 200) {
			const providers: Provider[] = result.data.ocs.data;
			return [...providers.filter(({ id }) => !disfunctionalProviders.includes(id))/*, {
				 id: 'toto', name: 'Toto'
			}*/];
		}
		return [];
	} catch (e) {
		console.error((e as Error).message || e);
		return [];
	}
}

