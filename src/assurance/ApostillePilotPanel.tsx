import { useEffect, useState } from 'react'

type Check = { id: string; expected: string; observed: string; status: 'pass' | 'review'; note: string }
type Report = {
  schemaVersion: number
  mode: string
  project: string
  upstreamCommit: string
  evidenceRun: string
  policyAssumption: string
  checks: Check[]
  limits: string[]
}

export function ApostillePilotPanel() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/apostille-policy-report.json', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('The contract pilot report is unavailable.')
        const value = await response.json() as Report
        if (value.schemaVersion !== 1 || value.mode !== 'external-solidity-policy-pilot' ||
          value.project !== 'moltaphet/apostille' || !/^[0-9a-f]{40}$/.test(value.upstreamCommit) ||
          !/^https:\/\/github\.com\/Miladbit1376\/primus-attestdock\/actions\/runs\/\d+$/.test(value.evidenceRun) ||
          !Array.isArray(value.checks)) {
          throw new Error('The contract pilot report has an unsupported format.')
        }
        setReport(value)
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The contract pilot report is unavailable.') })
    return () => controller.abort()
  }, [])

  if (error) return <p role="status" className="external-limit">{error}</p>
  if (!report) return <p role="status" className="external-limit">Loading the public contract pilot…</p>

  const matched = report.checks.filter(check => check.status === 'pass').length
  const review = report.checks.length - matched
  return <div className="apostille-pilot">
    <div className="apostille-pilot-heading"><div><span className="overline">PUBLIC CONTRACT PILOT</span><h3>Apostille: test the seal decision</h3><p>AttestDock ran the upstream Solidity contract on a local EVM at a pinned commit. The verifier was mocked to isolate contract policy.</p></div><div className="apostille-pilot-count"><strong>{matched}/{report.checks.length}</strong><span>matched the assumed policy</span></div></div>
    <p className="apostille-pilot-review"><strong>{review} decisions need policy review.</strong> A changed request method and a nonempty body were accepted. The project's README describes a GET source. This result does not show a live Primus exploit.</p>
    <div className="external-table-wrap"><table><thead><tr><th scope="col">Case</th><th scope="col">Expected</th><th scope="col">Observed</th><th scope="col">Result</th></tr></thead><tbody>
      {report.checks.map(check => <tr key={check.id}><th scope="row">{check.id.replaceAll('-', ' ')}</th><td>{check.expected}</td><td>{check.observed}</td><td className={check.status === 'pass' ? 'assurance-pass' : 'assurance-fail'}>{check.status === 'pass' ? 'match' : 'review'}</td></tr>)}
    </tbody></table></div>
    <p className="external-limit">{report.policyAssumption} The test used a mock verifier and synthetic input. A real attestation and the Binance response were not tested.</p>
    <div className="apostille-pilot-links"><a href={`https://github.com/${report.project}/tree/${report.upstreamCommit}`} target="_blank" rel="noreferrer">Pinned contract source</a><a href={report.evidenceRun} target="_blank" rel="noreferrer">GitHub test run</a><a href="https://github.com/Miladbit1376/primus-attestdock/blob/main/docs/pilots/apostille.md" target="_blank" rel="noreferrer">Test method and limits</a></div>
  </div>
}
