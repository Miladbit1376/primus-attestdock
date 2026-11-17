import ts from 'typescript'

export type Environment = 'frontend' | 'backend' | 'unknown'
export type Severity = 'high' | 'medium' | 'low'
export type RuleId = 'ATTESTDOCK-001' | 'ATTESTDOCK-002' | 'ATTESTDOCK-003' | 'ATTESTDOCK-004' | 'ATTESTDOCK-005' | 'ATTESTDOCK-006'
export type Finding = { id: RuleId; title: string; severity: Severity; line: number; evidence: string; explanation: string; fix: string; documentation: string }
export type ScanReport = { fileName: string; environment: Environment; findings: Finding[]; error?: string }

const docs = {
  extension: 'https://github.com/primus-labs/zktls-extension-core-sdk#production-example',
  verification: 'https://github.com/primus-labs/zktls-extension-core-sdk#test-example',
  core: 'https://github.com/primus-labs/skills/blob/main/primus-zktls-core-sdk/references/usage-guide.md'
}
const names: Record<RuleId, string> = {
  'ATTESTDOCK-001': 'Exposed app secret', 'ATTESTDOCK-002': 'Missing attestation verification',
  'ATTESTDOCK-003': 'Missing business logic validation', 'ATTESTDOCK-004': 'Sensitive data logging',
  'ATTESTDOCK-005': 'Missing freshness validation', 'ATTESTDOCK-006': 'Unchecked verification result'
}

function nodeName(node: ts.Node): string {
  if (ts.isIdentifier(node)) return node.text
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  if (ts.isStringLiteral(node)) return node.text
  return ''
}
function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node)
  ts.forEachChild(node, child => walk(child, visit))
}
function contains(node: ts.Node, test: (node: ts.Node) => boolean): boolean {
  let found = false
  walk(node, child => { if (test(child)) found = true })
  return found
}
function isCall(node: ts.Node, name: string): node is ts.CallExpression {
  return ts.isCallExpression(node) && nodeName(node.expression) === name
}
function isPolicySink(node: ts.Node): node is ts.CallExpression {
  return ts.isCallExpression(node) && /^(grantAccess|approve|accept|authorize|fulfill|issue|unlock|award|release|markVerified)$/.test(nodeName(node.expression))
}
function isCheck(node: ts.Node, namesToFind: string[]): boolean {
  return (ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isBinaryExpression(node)) &&
    contains(node, child => ts.isPropertyAccessExpression(child) && namesToFind.includes(child.name.text))
}

export function scanCode(code: string, environment: Environment, fileName = 'snippet.tsx'): ScanReport {
  const result: ScanReport = { fileName, environment, findings: [] }
  if (!code.trim()) return { ...result, error: 'Enter JavaScript or TypeScript code before scanning.' }
  const extension = fileName.toLowerCase().split('.').pop()
  if (!['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(extension ?? '')) return { ...result, error: 'Use a .js, .jsx, .ts, .tsx, .mjs, or .cjs file.' }
  const scriptKind = extension === 'tsx' ? ts.ScriptKind.TSX : extension === 'jsx' ? ts.ScriptKind.JSX : extension === 'ts' ? ts.ScriptKind.TS : ts.ScriptKind.JS
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKind)
  const parseDiagnostics = (source as ts.SourceFile & { parseDiagnostics: readonly ts.DiagnosticWithLocation[] }).parseDiagnostics
  if (parseDiagnostics.length) {
    const issue = parseDiagnostics[0]
    const line = source.getLineAndCharacterOfPosition(issue.start ?? 0).line + 1
    return { ...result, error: `Could not parse line ${line}: ${ts.flattenDiagnosticMessageText(issue.messageText, ' ')}` }
  }
  const add = (id: RuleId, severity: Severity, node: ts.Node, explanation: string, fix: string, documentation: string) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
    const raw = code.split(/\r?\n/)[line - 1]?.trim() ?? ''
    // Reports can be exported. Redact the code line to avoid copying secrets into reports.
    const evidence = id === 'ATTESTDOCK-001' ? 'Literal appSecret assignment (value redacted)' : raw.slice(0, 180)
    if (!result.findings.some(item => item.id === id && item.line === line)) result.findings.push({ id, title: names[id], severity, line, evidence, explanation, fix, documentation })
  }
  const scopes: ts.Node[] = [source]
  walk(source, node => {
    if (ts.isFunctionLike(node) && 'body' in node && node.body) scopes.push(node)
    if (ts.isVariableDeclaration(node) && nodeName(node.name) === 'appSecret' && node.initializer && (ts.isStringLiteralLike(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))) {
      if (environment !== 'backend') add('ATTESTDOCK-001', environment === 'frontend' ? 'high' : 'medium', node, 'This file contains a literal appSecret. A client bundle can expose it.', 'Keep appSecret on the server. Sign requests on the server for extension integrations.', docs.extension)
    }
    if (ts.isPropertyAssignment(node) && nodeName(node.name) === 'appSecret' && node.initializer && ts.isStringLiteralLike(node.initializer) && environment !== 'backend') {
      add('ATTESTDOCK-001', environment === 'frontend' ? 'high' : 'medium', node, 'This object contains a literal appSecret.', 'Keep appSecret on the server.', docs.extension)
    }
    if (ts.isVariableDeclaration(node) && /^(VITE_|NEXT_PUBLIC_|REACT_APP_)/.test(nodeName(node.name)) && /SECRET|PRIVATE_KEY/i.test(nodeName(node.name))) {
      add('ATTESTDOCK-001', 'high', node, 'A public environment variable name indicates a secret may enter the client bundle.', 'Use a server-only environment variable for the app secret.', docs.extension)
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && /^(log|info|debug|warn|error)$/.test(node.expression.name.text) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'console') {
      if (node.arguments.some(arg => contains(arg, child => ts.isIdentifier(child) && /^(appSecret|accessToken|authToken|apiKey|attestation)$/i.test(child.text)))) {
        add('ATTESTDOCK-004', 'medium', node, 'A console call includes a credential or full attestation object.', 'Remove the log or log only non-sensitive status fields.', docs.extension)
      }
    }
  })
  for (const scope of scopes) {
    const own = (node: ts.Node): boolean => node === scope || !scopes.some(other => other !== scope && other !== source && other.pos >= scope.pos && other.end <= scope.end && node.pos >= other.pos && node.end <= other.end)
    const calls: ts.CallExpression[] = []
    const checks: ts.Node[] = []
    const sinks: ts.CallExpression[] = []
    walk(scope, node => {
      if (!own(node)) return
      if (ts.isCallExpression(node)) { calls.push(node); if (isPolicySink(node)) sinks.push(node) }
      if (isCheck(node, ['data', 'request', 'attConditions', 'recipient', 'additionParams', 'url'])) checks.push(node)
    })
    const starts = calls.filter(node => isCall(node, 'startAttestation'))
    const verifies = calls.filter(node => isCall(node, 'verifyAttestation'))
    const relevantSinks = sinks.filter(node => node.arguments.some(arg => contains(arg, child => ts.isIdentifier(child) && /^(attestation|proof|result)$/i.test(child.text))) || starts.length > 0 || verifies.length > 0)
    if (!relevantSinks.length) continue
    const target = relevantSinks[0]
    const hasAttestation = starts.length > 0 || contains(scope, node => ts.isIdentifier(node) && node.text === 'attestation')
    if (!hasAttestation) continue
    if (!verifies.length) {
      add('ATTESTDOCK-002', 'high', target, 'A decision uses an attestation, but this function has no visible verifyAttestation() call.', 'Verify the attestation before this decision. Review verification in other files too.', docs.verification)
      continue
    }
    const verify = verifies[0]
    const isVerificationCondition = (node: ts.Node) => contains(node, child => isCall(child, 'verifyAttestation') || ts.isIdentifier(child) && /^(ok|valid|verified|verifyResult|isValid)$/.test(child.text))
    const stops = (node: ts.Node) => contains(node, child => ts.isReturnStatement(child) || ts.isThrowStatement(child))
    const guarded = contains(scope, node => {
      if (!ts.isIfStatement(node) || !isVerificationCondition(node.expression)) return false
      const beforeSink = node.getStart(source) < target.getStart(source)
      const negative = ts.isPrefixUnaryExpression(node.expression) && node.expression.operator === ts.SyntaxKind.ExclamationToken
      const sinkInsideThen = target.getStart(source) >= node.thenStatement.getStart(source) && target.end <= node.thenStatement.end
      return beforeSink && (negative ? stops(node.thenStatement) : sinkInsideThen || !!node.elseStatement && stops(node.elseStatement))
    })
    if (!guarded || verify.getStart(source) > target.getStart(source)) {
      add('ATTESTDOCK-006', 'high', target, 'The visible decision can proceed without a checked verification result.', 'Stop the decision when verifyAttestation() returns false.', docs.verification)
    }
    if (!checks.some(node => node.getStart(source) < target.getStart(source))) {
      add('ATTESTDOCK-003', 'medium', target, 'No check of attestation data, source, or expected conditions is visible before this decision.', 'Compare the relevant attestation fields with your expected source and business policy.', docs.verification)
    }
    const freshness = contains(scope, node => ts.isBinaryExpression(node) && node.getStart(source) < target.getStart(source) && [ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken].includes(node.operatorToken.kind) && contains(node, child => ts.isPropertyAccessExpression(child) && child.name.text === 'timestamp'))
    if (!freshness) add('ATTESTDOCK-005', 'medium', target, 'No timestamp comparison is visible before this decision.', 'Set and enforce a freshness window that fits your application.', docs.verification)
  }
  result.findings.sort((a, b) => a.line - b.line || a.id.localeCompare(b.id))
  return result
}
