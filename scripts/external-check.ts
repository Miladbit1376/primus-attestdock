import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runExternalSuite, type ExternalModule } from './external-assurance.ts'

function usage(): never {
  process.stderr.write('Usage: node dist-cli/scripts/external-check.js --adapter path/to/adapter.mjs [--format text|json] [--timeout-ms 100..30000]\n')
  process.exit(2)
}

function options(): { adapter: string; format: 'text' | 'json'; timeoutMs: number } {
  let adapter = ''
  let format: 'text' | 'json' = 'text'
  let timeoutMs = 5_000
  const values = process.argv.slice(2)
  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (value === '--adapter') adapter = values[++index] ?? ''
    else if (value === '--format') {
      const selected = values[++index]
      if (selected !== 'text' && selected !== 'json') usage()
      format = selected
    } else if (value === '--timeout-ms') timeoutMs = Number(values[++index])
    else usage()
  }
  if (!adapter || !/\.(mjs|js)$/.test(adapter) || !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) usage()
  return { adapter, format, timeoutMs }
}

async function main(): Promise<void> {
  const { adapter, format, timeoutMs } = options()
  const module = await import(pathToFileURL(resolve(adapter)).href) as ExternalModule
  const report = await runExternalSuite(module, timeoutMs)
  if (format === 'json') process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  else {
    for (const check of report.checks) process.stdout.write(`${check.status.toUpperCase()} ${check.id}: expected ${check.expected}, observed ${check.observed}\n`)
    process.stdout.write(`${report.target}: ${report.summary.passed} passed, ${report.summary.failed} failed\n`)
    process.stdout.write('Synthetic policy results only. No genuine Primus signature was checked.\n')
  }
  if (report.summary.failed) process.exitCode = 1
}

main().catch(error => {
  const message = error instanceof Error && /^(The adapter|target\.|timeoutMs)/.test(error.message) ? error.message : 'The adapter could not load or run. Check the trusted local module and its imports.'
  process.stderr.write(`${message}\n`)
  process.exitCode = 2
})
