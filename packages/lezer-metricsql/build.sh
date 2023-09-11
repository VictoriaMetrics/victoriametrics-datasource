#!/bin/bash

set -ex

npx lezer-generator src/metricsql.grammar -o src/parser

cat src/parser.terms.js >> src/parser.js

bash ./generate-types.sh

rollup -c
