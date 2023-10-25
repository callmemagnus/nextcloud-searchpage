#!/bin/sh

missing_lib() {
	echo "Missing $1"
	exit 1
}

which entr > /dev/null || missing_lib entr

find src lib templates | entr npm run dev
