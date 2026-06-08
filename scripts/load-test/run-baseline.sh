#!/bin/bash
set -euo pipefail

mkdir -p results

k6 run \
  --env BASE_URL="${BASE_URL:-http://localhost:3000}" \
  --env PRODUCT_SLUG="${PRODUCT_SLUG:-p141-test-laptop-1}" \
  --out "json=results/baseline-$(date +%Y%m%d-%H%M).json" \
  scripts/load-test/baseline.js
