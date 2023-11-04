#!/bin/sh

# Don't judge me for this script :-)

POT_FILE="translationfiles/templates/thesearchpage.pot"
read -r -d '' POT_FILE_PREFIX << EOM
"POT-Creation-Date: $(date "+%Y-%m-%dT%H-%M-%S")"
"Language: "
"MIME-Version: 1.0"
"Content-Type: text/plain; charset=UTF-8"
"Content-Transfer-Encoding: 8bit"

# info.xml
msgid "The Search Page"
msgstr ""

# info.xml
msgid "Provides a proper search page"
msgstr ""

# info.xml
msgid "Provides a search page to your Nextcloud instance."
msgstr ""

msgid "All providers"
msgstr ""

EOM

pot=$(mktemp)
php=$(mktemp)

files=$(find src -name \*.svelte -or -name \*.ts)

for file in $files; do
    IFS=$'\n'
    haz=( $(grep -o "_t('[^)]*')" "$file") )
    # echo ${haz[*]}
    for match in ${haz[*]}; do
        label=$(echo $match | sed -e "s/^_t('\(.*\)')/\1/")
        printf "# %s\n" "$file" >> "$pot"
        printf "msgid \"%s\"\n" "$label" >> "$pot"
        printf 'msgstr \"\"\n\n' >> "$pot"
        echo "\"$label\"," >> $php
    done

done

printf "\nstring object to update in PageController.php\n\n"
cat $php

printf "\nPOT file updated\n\n"
echo "$POT_FILE_PREFIX" > $POT_FILE
cat "$pot" >> $POT_FILE

rm -f "$pot" "$php"

printf "\nDon't forget to update existing translations.\n"