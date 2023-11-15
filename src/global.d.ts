/// <reference types="svelte" />
/// <reference types="@nextcloud/typings" />

declare const OC: Nextcloud.v27.OC;

declare const OCP: Nextcloud.v27.OCP;

declare interface Window {
	t: (app: string, label: string, subs?: Record<string, string>) => string;
}
