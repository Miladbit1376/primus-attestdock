import { useEffect, useState } from 'react'
import { DiagnosticPanel } from './DiagnosticPanel.tsx'

type Check = { id: string; label: string; expected: string; observed: string; status: 'pass' | 'fail' }
type Report = {
  schemaVersion: number
  suite: string
  mode: string
  generatedAt: string
  summary: { passed: number; failed: number }
  checks: Check[]
  limits: string[]
}

export function AssurancePanel() {
  const [report, setReport] = useState<Report | null>(null)
  const [selectedId, setSelectedId] = useState('wrong-recipient')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/assurance-report.json', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Build the project to generate the assurance report.')
        const value = await response.json() as Report
        if (value.schemaVersion !== 1 || !Array.isArray(value.checks)) throw new Error('The assurance report has an unsupported format.')
        setReport(value)
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The assurance report is unavailable.')
      })
    return () => controller.abort()
  }, [])

  const selected = report?.checks.find(check => check.id === selectedId) ?? report?.checks[0]
  return <section id="assurance" className="assurance-section">
    <div className="section-heading"><div><span className="overline">03 / ASSURANCE</span><h2>Test the app decision</h2><p>Run repeatable cases against AttestDock's local X verification path.</p></div><span className="privacy-pill">Synthetic policy checks</span></div>
    {error && <div className="error-state" role="status"><div><strong>Report unavailable</strong><p>{error}</p></div></div>}
    {!report && !error && <p role="status">Loading the latest build report…</p>}
    {report && <div className="assurance-grid">
      <div className="assurance-list" aria-label="Assurance cases">
        <p className="assurance-summary"><strong>{report.summary.passed}/{report.checks.length}</strong> checks passed <span>{report.summary.failed ? `${report.summary.failed} failed` : 'No failed checks'}</span></p>
        {report.checks.map(check => <button key={check.id} type="button" onClick={() => setSelectedId(check.id)} aria-pressed={selected?.id === check.id}>
          <span className={check.status === 'pass' ? 'assurance-pass' : 'assurance-fail'}>{check.status.toUpperCase()}</span>
          <span>{check.label}</span>
        </button>)}
      </div>
      {selected && <div className="assurance-detail">
        <span className="overline">{selected.id}</span>
        <h3>{selected.label}</h3>
        <dl><div><dt>Expected decision</dt><dd>{selected.expected}</dd></div><div><dt>Observed decision</dt><dd>{selected.observed}</dd></div></dl>
        <p className={selected.status === 'pass' ? 'assurance-result assurance-pass' : 'assurance-result assurance-fail'}>{selected.status === 'pass' ? 'The server decision matched the expected result.' : 'The server decision needs review.'}</p>
        <p className="assurance-limit">These cases use controlled inputs and a stubbed SDK signature result. They test application policy. They do not prove live Primus compatibility.</p>
        <a href="https://github.com/Miladbit1376/primus-attestdock/blob/main/docs/assurance.md" target="_blank" rel="noreferrer">Read the test method</a>
      </div>}
    </div>}
    <DiagnosticPanel />
  </section>
}
