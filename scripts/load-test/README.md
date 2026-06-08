# Load Test Guide

## Prerequisites
- k6 installed (see scripts/install-k6.sh)
- App running: npm run dev OR npm run start
- Seed data loaded. The default target product (`PRODUCT_SLUG=p141-test-laptop-1`) and the default
  `PRODUCT_IDS` come from the Phase 14.1 runtime dataset created by
  `tsx scripts/_phase141_seed.ts` (needs `DATABASE_URL`; seeds `p141-test-laptop-1` … `-30`).
  For any other dataset, override the targets instead of seeding P141 data:
  `--env PRODUCT_SLUG=<real-slug> --env PRODUCT_IDS=<id1>,<id2> --env PRODUCT_ID=<id>`.

## Run order (start with baseline, escalate only if it passes)
  npm run load:baseline   # 25 users / 10 min - run this first
  npm run load:api        # API contract + security checks
  npm run load:peak       # 100 users / 20 min - only if baseline passes
  npm run load:stress     # ramp to 500 users - destructive, staging only
  npm run load:spike      # 0->300 in 30s - staging only
  npm run load:soak       # 50 users / 4h - overnight run

## Pass/Fail thresholds
| Test     | p95 target | Error rate | Notes                        |
|----------|-----------|------------|------------------------------|
| Baseline | < 800ms   | < 1%       | Must pass before production  |
| Peak     | < 1500ms  | < 1%       | Must pass before launch      |
| Stress   | < 3000ms  | < 5%       | Find the breaking point      |
| Spike    | < 3000ms  | < 5%       | Recovery must be < 2 minutes |
| Soak     | < 1000ms  | < 1%       | p95 must stay flat over time |
| API      | < 500ms   | < 1%       | Includes retailPrice leak check |

## What to watch during soak test
- Memory usage: watch -n 5 'ps aux | grep node'
- DB connections: check your MySQL/Postgres connection pool count
- p95 trend: if response time creeps up over 4h -> memory/pool leak

## After each test
Results are saved to results/*.json
Open in k6 Cloud or use: k6 cloud results/baseline.json (requires k6 account)
Or use the open-source dashboard: https://grafana.com/grafana/dashboards/18030
