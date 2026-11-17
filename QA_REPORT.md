# Primus SafeShip browser QA

Date: 2026-11-08. Browser: headless Microsoft Edge. The test used harmless sample code and no real credentials.

## Browser run

The requested command, `pnpm dev -- --host 127.0.0.1`, started Vite. Vite printed a `localhost` URL because pnpm passed the extra `--` to Vite. The browser test used the exact URL printed by its Vite process: `http://localhost:5174/`. The port is not fixed and can change on another run.

The browser test passed these checks:

- The app loaded with no page errors.
- The editor accepted JavaScript and TypeScript.
- PRIMUS-001 through PRIMUS-006 produced findings from sample code.
- A PRIMUS-002 finding pointed to line 2 of its sample.
- Load Example, source file upload, and Clear worked.
- An unsupported `.sol` file showed an error.
- Malformed code showed a parser error with a line number.
- JSON export downloaded valid report data. The detected secret literal was redacted.
- Browser workers started and returned findings. Ten worker instances were observed. No worker initialization or page error occurred.
- Desktop (1440×900), mobile (390×844), and tablet (768×1024) scans worked. No page-level horizontal overflow remained.

## Privacy observation

The test used `SAFESHIP_QA_CANARY_7E31F2` in pasted source. It observed 65 browser requests and no external requests. The canary was absent from request URLs, request bodies, local storage, and session storage. No analytics request was observed. This result covers the tested browser session and code paths. It does not prove behavior for every future change.

## Automated checks

- `pnpm test`: 22 tests passed in 2 files after setting `TEMP` and `TMP` to the project `.tmp` directory. The sandbox denied Vitest's rename operation in its default temporary directory.
- `pnpm build`: passed. TypeScript checking and the Vite production build both completed.

## Fixes from QA

- Added a local favicon to remove a browser 404 error.
- Allowed finding cards to shrink on narrow screens. This removed 103 px of mobile page overflow.

## Screenshots

- [Desktop](screenshots/desktop.png)
- [Mobile](screenshots/mobile.png)
- [Tablet](screenshots/tablet.png)

## Remaining limits

The TypeScript compiler makes the browser worker bundle about 3.5 MB. Scanning remains a single-file heuristic check. No deployment was made.

## Release review

The release review found no high-confidence credential or personal-data pattern in the release files. Four literal `appSecret` assignments are documented demo or test fixtures. The screenshots have no PNG text metadata. This is a pattern scan and manual review, not proof that all sensitive data is absent.

The `.gitignore` rules exclude dependencies, build output, temporary files, the local pnpm store, coverage, and environment files. `pnpm-lock.yaml` is present and is not ignored. A frozen-lockfile install completed without changes. The MIT license is present. The Primus documentation and repository links in the README and finding references were checked on 2026-11-08.

The final worker asset is 3,528,065 bytes raw, 982,318 bytes with gzip level 9, and 739,593 bytes with Brotli defaults. The scanner runs in a separate worker, so this asset is separate from the 235.72 kB initial JavaScript bundle. No parser replacement was made during the release review.

The release review reran `pnpm test` (22 passed) and `pnpm build` (passed) on 2026-11-08. The test run used the project `.tmp` directory for `TEMP` and `TMP` because this sandbox blocks Vitest's default temporary-directory rename.
