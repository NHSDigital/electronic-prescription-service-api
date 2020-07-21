#!/bin/bash

set -o pipefail
npx ts-node ./broker/publish.ts | grep -v Created