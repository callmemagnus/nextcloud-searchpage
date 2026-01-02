// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import App from './App.svelte';
import './app.css';
import {mount} from "svelte";

const app = mount(App, {
	target: document.getElementById('mwb-thesearchpage')!
});

export default app;
