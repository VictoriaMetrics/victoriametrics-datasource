#!/bin/bash

set -ex

ROOT_BIN="$(cd ../.. && pwd)/node_modules/.bin"

"$ROOT_BIN/lezer-generator" src/metricsql.grammar -o src/parser

cat src/parser.terms.js >> src/parser.js

bash ./generate-types.sh

"$ROOT_BIN/rollup" -c
