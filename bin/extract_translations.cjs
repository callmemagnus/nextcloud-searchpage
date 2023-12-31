#!/bin/env node

const { glob } = require("glob");
const fs = require("fs");

const fileHeader = `/**
 * Don't change this file manually it is generated by the ./bin/extract_translation.cjs script
 * to satisfy Nextcloud's bot as it does not know how to read .svelte files.
 */
 
// @ts-ignore
const { t } = window;
`


async function run() {

  const files = await glob("src/**/*.svelte");

  //const regexp = new RegExp('translate\\(APP_NAME, [^\']+\\)', 'mg');
  const regexp = new RegExp("translate\\(APP_NAME, '([^\']+)'\\)", "mg");

  const translations = new Set(["All providers"]);

  files.forEach(filepath => {
    console.log(`Grabing from ${filepath}`);
    const content = fs.readFileSync(filepath);

    const matches = content.toString().matchAll(regexp);

    if (!matches) {
      console.error("Did not find anything matching a translated field.");
    } else {
      let next = matches.next();
      while (!next.done) {
        const value = next.value;
        translations.add(value[1]);
        next = matches.next();
      }
    }
  });

  const result = [fileHeader];
  let counter = 0;

  const englishLabels = [...translations];
  englishLabels.sort();

  englishLabels.forEach(translation => {
    result.push(`const label${counter} = t('thesearchpage', '${translation}');`);
    counter++;
  });

  for (let i = 0; i < counter; i++) {
    result.push(`console.log(label${i});`)
  }

  fs.writeFileSync("src/fakeLabels.ts", result.join('\n') + '\n');
  console.log('Done')
}

run();