import { writeFile } from 'node:fs/promises'
import { runExternalSuite } from '../dist-cli/scripts/external-assurance.js'
import * as safe from '../examples/external-app/adapter.mjs'
import * as unsafe from '../examples/external-app/unsafe-adapter.mjs'

const safeReport = await runExternalSuite(safe)
const unsafeReport = await runExternalSuite(unsafe)
if (safeReport.summary.failed !== 0 || unsafeReport.summary.failed < 1) {
  throw new Error('The external adapter examples no longer show the expected decisions.')
}
const report = { schemaVersion: 1, mode: 'synthetic-external-demo', safe: safeReport, unsafe: unsafeReport }
await writeFile(new URL('../public/external-demo-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
process.stdout.write(`External app demo: ${safeReport.summary.passed} safe passes; ${unsafeReport.summary.failed} unsafe failures.\n`)
