# Deployment gate

Updated: 2026-11-17. Do not deploy the platform API. The X proof path is a local integration with in-memory wallet and proof sessions. Normal production startup remains disabled.

Before deployment:

1. Record Milad as the stated project copyright holder. Review the rights of each third-party sample and asset. Check the public AttestDock name and repository name before release.
2. Confirm the selected X template is enabled for the same Primus project as the configured App ID. A real local extension proof passed on 2026-11-17. Repeat the test before deployment and check the signed fields.
3. Add production user identity, account ownership rules, and project authorization. Wallet sign-in alone does not establish a full user account.
4. Add a durable session and replay store with atomic consumption across server instances. Decide how verified account status is stored and revoked.
5. Store the App Secret in a server-only secret manager. Verify it is absent from frontend bundles and logs.
6. Add HTTPS cookie rules, production origin controls, rate limits, retention, deletion, monitoring, and backup procedures.
7. Recheck dependency and asset notices after the SDK dependency change.
8. Run a real end-to-end test, browser QA, network privacy checks, and an independent security review.
9. Obtain explicit approval before any push, publication, or deployment.

The existing static scanner can run without platform APIs. Its source code remains in the browser worker.
