/* SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com> */
/* SPDX-License-Identifier: AGPL-3.0-or-later */

const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

const config = {
  root: true,
  plugins: [
    //Some plugins, like tailwindcss/nesting, need to run before Tailwind,
    tailwindcss(),
    //But others, like autoprefixer, need to run after,
    autoprefixer,
  ],
};

module.exports = config;
