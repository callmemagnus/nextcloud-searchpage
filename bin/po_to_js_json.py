#!/bin/env python
import os
import sys
from pathlib import Path
import re

"""
GOAL take downloaded translation .po from transifex
and create the js and JSON files.

This should only be temporary as long as the sync does not work.
"""

cwd = os.getcwd()
target_dir = 'l10n'

print('Working in', cwd)

if not os.path.isdir(os.path.join(cwd, target_dir)):
    print('{} does not exist, run this script from the root of your project'.format(target_dir))

def this_script_name():
    return Path(sys.argv[0]).parts[-1]

def usage():
    print('{} <lang_code> </path/to/file.po>'.format(this_script_name()))
    sys.exit()

if not len(sys.argv) == 3:
    usage()

lang_code = sys.argv[1]
po_file = sys.argv[2]

if not Path(po_file).is_file():
    print('{} does not exist'.format(po_file))

target_files = {}
target_files['js'] = Path(os.path.join(cwd, target_dir, '{}.js'.format(lang_code)))
target_files['json'] = Path(os.path.join(cwd, target_dir, '{}.json'.format(lang_code)))

if target_files['js'].exists() or target_files['json'].exists():
    print('{} related files exits'.format(lang_code))
    sys.exit(1)

f = open(po_file, 'r')

lines = f.readlines()

readnext = False
lastid = None
all_labels = {}

for l in lines:
    line = l.strip().replace('\n', '')
    if line == '':
        continue

    if readnext or lastid:
        if line == 'msgid ""':
            # multiline msgid, not handled by this script
            readnext = False
            continue
        
        key, text = line.split(' "')
        
        if key == 'msgid':
            lastid = '"{}'.format(text)
            readnext = False
        if key == 'msgstr':
            all_labels[lastid] = '"{}'.format(text)
            lastid = None

    if re.fullmatch('#: /app/specialAppInfoFakeDummyForL10nScript.php:\d+', line):
        readnext = True
        continue

    if re.fullmatch('#: /app/src/fakeLabels.ts:\d+', line):
        readnext = True
        continue
    
template = {}
template['js'] = """
OC.L10N.register(
    "thesearchpage",
    {
    %%translations%%
},
"nplurals=2; plural=(n != 1);");
"""

template['json'] = """
{ "translations": {
    %%translations%%
},"pluralForm" :"nplurals=2; plural=(n != 1);"
}
"""

translations = []

for k in all_labels:
    translations.append('{}: {}'.format(k, all_labels[k]))


for ext in template:
    f = open(target_files[ext].as_posix(), mode='w')
    f.write(template[ext].replace('%%translations%%', ",\n    ".join(translations)))
