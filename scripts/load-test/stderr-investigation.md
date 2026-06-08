# Runtime Stderr Investigation

> Relocated from `results/` (which is git-ignored as a test-output dir) so this
> documentation is tracked in version control.

## Error
`TypeError: controller[kState].transformAlgorithm is not a function`

## Node Version
`v24.13.0`

The installed Node version is above 18.17.0. This does not match the older Node/Next.js streaming incompatibility condition from the audit prompt. The project also declares `"node": ">=24 <25"` in `package.json`.

## Next.js Version
`next@16.2.6`

`npm list next` reports:

```text
e-katalog@0.1.0 D:\e-katalog
+-- better-auth@1.6.11
| `-- next@16.2.6 deduped
`-- next@16.2.6
```

This is above 14.1.0, so an old Next.js version is not the likely cause.

## Files Using Web Streams APIs
Search command:

```bash
rg -n "TransformStream|ReadableStream|WritableStream" src -g "*.ts" -g "*.tsx"
```

Result: no matches.

## Routes Using Edge Runtime
No `export const runtime = "edge"` routes were found.

Routes explicitly using Node.js runtime:

- `src/app/api/vouchers/claim/route.ts`
- `src/app/api/retail/request-whatsapp/route.ts`
- `src/app/api/products/[id]/track/route.ts`
- `src/app/api/products/saved/route.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/app/api/analytics/track/route.ts`
- `src/app/api/inquiries/whatsapp/route.ts`
- `src/app/api/products/batch/route.ts`

## Next Config Review
`next.config.ts` does not configure edge runtime or experimental stream behavior.

Notable settings:

- `serverExternalPackages` includes Prisma/MariaDB/sharp packages.
- `experimental.serverActions.bodySizeLimit` is set to `10mb`.
- Security headers and local-only image remote patterns are configured.

## Recommended Fix
The audit error is unlikely to be caused by app-authored Web Streams code, Edge runtime routes, or an old Node/Next.js combination.

Recommended next steps:

1. Reproduce with the same command and capture the full stack trace from stderr.
2. Confirm the process is actually using Node `v24.13.0` when the error occurs.
3. If the stack trace points into a dependency, upgrade or isolate that package.
4. If the stack trace points into Next.js internals, retest with a clean production build and the current Node 24 runtime because this project is already on Next `16.2.6`.
