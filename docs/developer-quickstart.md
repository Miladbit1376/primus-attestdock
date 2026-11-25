# Developer quickstart

Updated: 2026-11-17. AttestDock has a loopback-only X account ownership flow. It is not deployed or production-ready.

Use Node.js 24.12 or newer for the local TypeScript server. Use pnpm with the committed lockfile.

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm test`, `pnpm check:integration`, `pnpm check:external:example`, `pnpm assurance`, and `pnpm build`. The assurance cases use controlled inputs and need no Primus credentials. See [assurance checks](assurance.md) and the [external adapter guide](external-adapter.md).
3. Create `.env.local` in the repository root. Set `ATTESTDOCK_DEV_MODE=1`, `PRIMUS_APP_ID=<your App ID>`, and `PRIMUS_APP_SECRET=<your App Secret>`. Use values from the Primus project that owns the selected X template. This file is ignored by Git. Do not use a `VITE_` prefix or commit the secret.
4. Run `pnpm server:local` and open the exact loopback URL it prints. The built UI and API use the same origin. Do not expose this server to a public interface.
5. Connect an EVM wallet and install the Primus extension. Open User App → Create Proof, enter the X username, consent, and follow the wallet and extension prompts.

Without both Primus environment values, the X proof button stays disabled. No tracked file contains credential values. A real local extension proof passed on 2026-11-17. This result does not make the service production-ready. See [integration details](primus-integration.md) for checks and limits.

The separate `POST /api/v1/proof-sessions` route creates simulated sessions only. They never become verified. The private `@attestdock/sdk` package still covers the earlier platform API. It does not implement the new wallet and Primus routes and is not published.
