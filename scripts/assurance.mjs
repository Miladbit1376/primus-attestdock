import { writeFile } from 'node:fs/promises'
import { runXAssuranceSuite } from '../dist-server/server/assurance.js'

const report = await runXAssuranceSuite()
for (const check of report.checks) {
  const mark = check.status === 'pass' ? 'PASS' : 'FAIL'
  process.stdout.write(`${mark} ${check.id}: ${check.label} (${check.observed})\n`)
}
process.stdout.write(`X proof policy: ${report.summary.passed} passed, ${report.summary.failed} failed\n`)
if (process.argv.includes('--write-public') && report.summary.failed === 0) {
  await writeFile(new URL('../public/assurance-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
}
if (report.summary.failed > 0) process.exitCode = 1
