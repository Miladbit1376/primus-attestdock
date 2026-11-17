# IP remediation report

Historical snapshot of the 2026-11-08 branding and notice work. Its 144-package count predates the two new MIT type packages. The current notice inventory has 146 entries. Later platform work is documented in docs/implementation-plan.md and PLATFORM_QA_REPORT.md.

Date: 2026-11-08
Repository: C:\Users\pc\Documents\ChatGPT\primus-safeship-release
Local branch: ip-remediation
Status: local working changes only. No commit, push, deployment, or publication was made.

## Scope and files changed

- README.md: product name, independent-project description, SafeShip rule IDs, and notice link.
- index.html: browser title.
- package.json: package name changed from primus-safeship to safeship. Version, scripts, and dependencies did not change.
- src/main.tsx: UI brand, hero copy, placeholder, footer, and JSON download filename.
- src/scanner.ts: rule IDs changed from PRIMUS-001 through PRIMUS-006 to SAFESHIP-001 through SAFESHIP-006. Detection conditions and findings did not change.
- src/scanner.test.ts and src/scanner.worker.test.ts: test expectations changed to the new rule IDs.
- screenshots/desktop.png, screenshots/mobile.png, and screenshots/tablet.png: replaced earlier captures that showed the old product brand and PRIMUS-002. New captures show SafeShip and SAFESHIP-002.
- THIRD_PARTY_NOTICES.md: added verified license notices, attribution guidance, asset notes, and the 144-entry lockfile license inventory.
- IP_REMEDIATION_REPORT.md: this report.

LICENSE was not edited. QA_REPORT.md was not edited; it remains a record of the earlier browser QA. pnpm-lock.yaml and the custom favicon were not edited. The original project at C:\Users\pc\Documents\ChatGPT\ClaimProof\primus-safeship was not edited.

## Branding changes

The product title, visible wordmark, README heading, and package name now use SafeShip. The UI describes an independent security scanner for JavaScript and TypeScript applications integrating Primus zkTLS. Factual references to Primus SDKs, official documentation, and the target integration remain. The footer calls SafeShip an independent community tool. The README says the project is not affiliated with or officially endorsed by Primus Labs.

The scanner now emits SAFESHIP-001 through SAFESHIP-006 in findings and exported JSON. This changes the rule ID values, so any consumer of a pre-release JSON report must update. The six detection rules and their logic remain the same.

The local clone still points to the existing GitHub repository URL containing primus-safeship. No remote setting, repository name, or published GitHub description was changed. Human review must decide whether the public repository name should change after rights review.

## Screenshot review

The previous desktop, mobile, and tablet images showed “PRIMUS SAFESHIP” in the header and footer, a Primus-focused hero, and PRIMUS-002 in a finding. All three were replaced with full-page captures from the production build. They now show the SafeShip wordmark, a zkTLS-focused hero, and SAFESHIP-002. Factual “Primus GitHub” and “Primus docs” links remain.

A headless Edge session opened the exact local Vite preview URL printed by the server: http://127.0.0.1:4173/. It scanned a harmless TypeScript sample and returned SAFESHIP-002 in the interface at desktop 1440×900, mobile 390×844, and tablet 768×1024. The browser title and wordmark read SafeShip at each size. No page exception was observed. The page had no horizontal overflow in those three captures. This is a focused branding and screenshot check, not a repeat of the full browser QA in QA_REPORT.md.

The favicon is a custom shield/check SVG. The review found no official Primus logo file or bundled font.

## Third-party notices added

THIRD_PARTY_NOTICES.md includes the installed lucide-react 0.468.0 ISC license text and a Feather MIT notice with Cole Bemis attribution. It identifies six imported icons that Lucide lists as Feather-derived. It records the non-MIT dependency groups identified in the IP audit: Apache-2.0 packages including TypeScript, CC-BY-4.0 caniuse-lite data, MPL-2.0 Lightning CSS packages, BSD-3-Clause source-map-js, and other ISC packages. It also explains MIT notice retention and lists all 144 lockfile package/version entries with their declared licenses.

The notice file distinguishes a source release from future built or hosted artifacts. It does not claim that package metadata alone proves license compliance. A future distribution of dependency code needs an artifact-level notice review.

## Verification

- pnpm test: passed. Vitest reported 2 test files and 22 tests passed. TEMP and TMP pointed to the ignored project .tmp directory because the earlier QA found that the sandbox blocks Vitest's default temporary-directory rename.
- pnpm build: passed. TypeScript checking and Vite production build completed. Vite transformed 1,566 modules. The browser worker asset remains about 3.53 MB raw.
- Headless Edge preview: SAFESHIP-002 appeared after scanning the sample at all three viewport sizes. No page exception was reported.
- git diff --check: passed after the edits reviewed so far. Run it again before any commit.
- LICENSE and QA_REPORT.md: unchanged from the local release commit.

These checks verify the local branch only. No remote release was tested.

## Unresolved licensing questions

1. The unchanged LICENSE still says “Primus SafeShip contributors.” The actual copyright holder and authority to use that notice remain unconfirmed. This is a release blocker.
2. Human review must confirm that the SafeShip name, shield/check mark, factual Primus references, and current repository URL do not infringe third-party rights or imply official endorsement. No trademark permission is assumed.
3. Human review must confirm that no protected Primus documentation example or other third-party code was copied into the sample integrations.
4. The 35 platform-specific lockfile packages absent on this Windows host were checked through npm metadata. Their exact license files and notices remain unverified.
5. The notices for a future hosted build or downloadable dist archive need review against the actual files shipped. TypeScript code is bundled in the browser worker.
6. The human authorship and ownership of AI-assisted code, prose, favicon, and screenshots need confirmation.

## Remaining human decisions

Confirm the copyright holder before changing LICENSE. Approve the public product and repository names after trademark review. Confirm the required notice package for the exact release artifact. Decide whether to update the historical QA_REPORT.md after a new full browser QA run. Approve any later commit or publication separately.

Publication remains on hold.

## Update on 2026-11-17

Milad stated that he is building SafeShip and named himself as the copyright holder. The Git history reviewed at this point lists only `Miladbit1376` as a committer. The LICENSE notice now reads `Copyright (c) 2026 Milad`. This resolves the incorrect `Primus SafeShip contributors` notice for the current local branch. It does not prove ownership of every third-party asset or copied example.

The selected X proof passed one real local browser and server test. My Proofs showed the verified X username and time. This result does not make the API production-ready.

The earlier sections remain a historical snapshot. Before publication, review the SafeShip name and repository name, the source of sample code and assets, and the notices for the exact release artifact. Keep production API deployment disabled until the security gates in `docs/deployment.md` pass. No commit, push, or deployment was made in this update.

## Public name search on 2026-11-17

A focused public search found two unrelated software products using the exact name SafeShip: [trysafeship.com](https://www.trysafeship.com/) offers a code and secret scanner, and [safeship.dev](https://www.safeship.dev/) offers a developer SDK and regression checks. The first product overlaps SafeShip's scanner feature. This is a concrete risk of user confusion. Search results also show trademark records with changing status; this report does not treat those secondary records as a legal decision.

Use SafeShip as a local working name until Milad selects a distinct public name or obtains a suitable rights review. Do not publish the current brand as a finished product based only on this search. Keep factual references to Primus separate from the product name and logo.

## AttestDock name update on 2026-11-17

Milad asked us to select and replace the public product name. The selected name is **AttestDock**. A focused search for this exact name found no matching software product. This search is not a trademark clearance or a guarantee that the name is available in every market.

The current UI, package names, scanner rule IDs, local SDK, API headers, environment variable prefix, active documentation, and review briefs use AttestDock. The README records the pre-release ID and configuration changes. The old GitHub URL and local folder path still contain `primus-safeship`; they identify the existing repository and do not claim that the public repository has been renamed. The earlier sections of this report and the two QA reports remain historical records.

The local build, TypeScript checks, and all 131 tests passed after the rename. The browser title and wordmark showed AttestDock in a local UI check. The real X proof was completed before this name change; no new live proof was requested from the user for the rename.

The three repository screenshots were captured again from the local AttestDock app at 1440, 768, and 390 pixel viewport widths. They show the new wordmark and no prior product name. These screenshots show the default page state; they are not a new scanner or proof test.

Before a public release, review the name and assets, the exact release notices, and the production security gates in `docs/deployment.md`. No commit, push, repository rename, or deployment was made for this update.
## GitHub update on 2026-11-17

Milad explicitly approved the commit, push to `ip-remediation`, and repository rename. Commit `ad0637249e34426ae52ba88f0ad7a4aae2eb40fb` was pushed to that branch. The GitHub repository is now `Miladbit1376/primus-attestdock`, and the local `origin` uses the new URL. The default `main` branch still contains the earlier release. This branch remains a local-development implementation and is not a production deployment.
