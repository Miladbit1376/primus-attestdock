import { useEffect, useState } from 'react'

type Check = { id: string; label: string; expected: 'allow' | 'deny'; observed: 'allow' | 'deny' | 'error'; status: 'pass' | 'fail' }
type AppReport = { summary: { passed: number; failed: number }; checks: Check[] }
type DemoReport = { schemaVersion: number; mode: string; safe: AppReport; unsafe: AppReport }

export function ExternalAdapterPanel() {
  const [report, setReport] = useState<DemoReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/external-demo-report.json', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Build the project to generate the external app example.')
        const value = await response.json() as DemoReport
        if (value.schemaVersion !== 1 || value.mode !== 'synthetic-external-demo' ||
          !Array.isArray(value.safe?.checks) || !Array.isArray(value.unsafe?.checks)) throw new Error('The example report has an unsupported format.')
        setReport(value)
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The example report is unavailable.') })
    return () => controller.abort()
  }, [])

  return <section id="external" className="external-section">
    <div className="section-heading"><div><span className="overline">04 / APP TESTS</span><h2>Test your app's decision</h2><p>Connect a local adapter to your app's decision function. AttestDock checks how that function handles controlled proof inputs.</p></div><span className="privacy-pill">Local developer tool</span></div>
    {error && <div className="error-state" role="status"><div><strong>Example unavailable</strong><p>{error}</p></div></div>}
    {!report && !error && <p role="status">Loading the external app example…</p>}
    {report && <>
      <div className="external-score-grid">
        <div><span className="overline">CHECKED SAMPLE APP</span><strong>{report.safe.summary.passed}/10</strong><p>Valid input is allowed. Changed inputs are denied.</p></div>
        <div><span className="overline">UNSAFE SAMPLE APP</span><strong className="external-bad">{report.unsafe.summary.failed}/10</strong><p>{report.unsafe.summary.failed} cases expose decisions that need a fix.</p></div>
      </div>
      <div className="external-table-wrap"><table><thead><tr><th scope="col">Case</th><th scope="col">Expected</th><th scope="col">Checked sample</th><th scope="col">Unsafe sample</th></tr></thead><tbody>
        {report.safe.checks.map((check, index) => <tr key={check.id}><th scope="row">{check.label}</th><td>{check.expected}</td><td className="assurance-pass">{check.observed}</td><td className={report.unsafe.checks[index]?.status === 'fail' ? 'assurance-fail' : 'assurance-pass'}>{report.unsafe.checks[index]?.observed ?? 'missing'}</td></tr>)}
      </tbody></table></div>
    </>}
    <p className="external-limit">These are sample apps. The inputs and signature result are synthetic. Run a separate live Primus proof test for SDK compatibility.</p>
    <a className="external-guide" href="https://github.com/Miladbit1376/primus-attestdock/blob/main/docs/external-adapter.md" target="_blank" rel="noreferrer">Connect your app to these checks →</a>
  </section>
}
