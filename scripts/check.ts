import { lstat, readdir, readFile } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'
import { scanCode, type Environment, type Severity } from '../src/scanner.ts'

const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])
const skippedDirectories = new Set(['.git', '.pnpm-store', 'node_modules', 'dist', 'dist-cli', 'dist-server', 'coverage', '.next'])
const maxFiles = 2_000
const maxBytes = 1_000_000

type OutputFinding = {
  file: string
  line: number
  id: string
  severity: Severity
  title: string
  fix: string
  documentation: string
}

function usage(): never {
  process.stderr.write('Usage: node dist-cli/scripts/check.js [paths...] [--environment auto|frontend|backend|unknown] [--fail-on high|medium|any|none] [--format text|json]\n')
  process.exit(2)
}

function args(): { paths: string[]; environment: Environment | 'auto'; failOn: string; format: string } {
  const paths: string[] = []
  let environment: Environment | 'auto' = 'auto'
  let failOn = 'high'
  let format = 'text'
  const values = process.argv.slice(2)
  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (value === '--environment') environment = (values[++index] ?? '') as Environment
    else if (value === '--fail-on') failOn = values[++index] ?? ''
    else if (value === '--format') format = values[++index] ?? ''
    else if (value.startsWith('-')) usage()
    else paths.push(value)
  }
  if (!['auto', 'frontend', 'backend', 'unknown'].includes(environment) ||
    !['high', 'medium', 'any', 'none'].includes(failOn) || !['text', 'json'].includes(format)) usage()
  return { paths: paths.length ? paths : ['src', 'server'], environment, failOn, format }
}

async function collect(path: string, files: string[], explicit = false): Promise<void> {
  const info = await lstat(path)
  if (info.isSymbolicLink()) return
  if (info.isDirectory()) {
    if (skippedDirectories.has(path.split(sep).at(-1) ?? '')) return
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || skippedDirectories.has(entry.name)) continue
      await collect(join(path, entry.name), files)
    }
    return
  }
  if (!info.isFile() || !sourceExtensions.has(extname(path).toLowerCase())) return
  if (!explicit && (/(?:^|[.])test\.[cm]?[jt]sx?$/.test(path) || path.endsWith(`${sep}examples.ts`))) return
  if (info.size > maxBytes) throw new Error(`Source file exceeds 1 MB: ${path}`)
  files.push(path)
  if (files.length > maxFiles) throw new Error(`Scan stopped after ${maxFiles} files.`)
}

function environmentFor(file: string, selection: Environment | 'auto'): Environment {
  if (selection !== 'auto') return selection
  const path = `${sep}${relative(process.cwd(), file).replaceAll('/', sep)}`
  if (path.startsWith(`${sep}server${sep}`)) return 'backend'
  if (path.startsWith(`${sep}src${sep}`)) return 'frontend'
  return 'unknown'
}

function blocking(severity: Severity, threshold: string): boolean {
  return threshold === 'any' || threshold === 'medium' && severity !== 'low' || threshold === 'high' && severity === 'high'
}

async function main(): Promise<void> {
  const options = args()
  const files: string[] = []
  for (const input of options.paths) await collect(resolve(input), files, true)
  files.sort()
  const findings: OutputFinding[] = []
  const errors: { file: string; message: string }[] = []
  for (const file of files) {
    const name = relative(process.cwd(), file).replaceAll('\\', '/')
    const code = await readFile(file, 'utf8')
    const report = scanCode(code, environmentFor(file, options.environment), file)
    if (report.error) errors.push({ file: name, message: report.error })
    for (const finding of report.findings) {
      findings.push({ file: name, line: finding.line, id: finding.id, severity: finding.severity,
        title: finding.title, fix: finding.fix, documentation: finding.documentation })
    }
  }
  const failed = errors.length > 0 || findings.some(finding => blocking(finding.severity, options.failOn))
  if (options.format === 'json') {
    process.stdout.write(JSON.stringify({ schemaVersion: 1, mode: 'single-file-static-analysis', scannedFiles: files.length,
      failOn: options.failOn, failed, findings, errors }, null, 2) + '\n')
  } else {
    for (const finding of findings) process.stdout.write(`${finding.severity.toUpperCase()} ${finding.id} ${finding.file}:${finding.line} ${finding.title}\n`)
    for (const error of errors) process.stderr.write(`ERROR ${error.file}: ${error.message}\n`)
    process.stdout.write(`Scanned ${files.length} files. ${findings.length} findings. ${errors.length} errors.\n`)
  }
  if (failed) process.exitCode = 1
}

main().catch(error => { process.stderr.write(`Scan stopped: ${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2 })
