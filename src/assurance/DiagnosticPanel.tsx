import { useState } from 'react'
import { explainPrimusError, supportSummary } from '../diagnostics.ts'

export function DiagnosticPanel() {
  const [code, setCode] = useState('00104')
  const [subcode, setSubcode] = useState('')
  const [sdkVersion, setSdkVersion] = useState('')
  const [stage, setStage] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const info = explainPrimusError(code)
  const summary = supportSummary({ code, subcode, sdkVersion, stage })

  async function copy(): Promise<void> {
    try { await navigator.clipboard.writeText(summary); setCopyStatus('Copied. Review the text before sharing it.') }
    catch { setCopyStatus('Copy failed. Select the text below to copy it.') }
  }

  return <div className="diagnostic-panel">
    <div><span className="overline">ERROR REFERENCE</span><h3>Prepare a support report</h3><p>Enter an error code and basic context. Do not enter secrets, wallet addresses or raw proofs. This short reference does not diagnose an unknown cause.</p></div>
    <div className="diagnostic-fields">
      <label>Error code<input value={code} onChange={event => setCode(event.target.value)} maxLength={20} inputMode="numeric" /></label>
      <label>Subcode, if present<input value={subcode} onChange={event => setSubcode(event.target.value)} maxLength={80} /></label>
      <label>SDK version<input value={sdkVersion} onChange={event => setSdkVersion(event.target.value)} maxLength={80} placeholder="For example, 0.3.15" /></label>
      <label>Stage<input value={stage} onChange={event => setStage(event.target.value)} maxLength={80} placeholder="For example, startAttestation" /></label>
    </div>
    <div className="diagnostic-result"><strong>{info.meaning}</strong><p>{info.nextStep}</p><a href="https://docs.primuslabs.xyz/enterprise/error-code/" target="_blank" rel="noreferrer">Check the official error list</a></div>
    <label className="diagnostic-summary-label" htmlFor="diagnostic-summary">Support summary</label>
    <textarea id="diagnostic-summary" readOnly value={summary} rows={8} />
    <button type="button" onClick={() => void copy()}>Copy support summary</button>
    <p role="status">{copyStatus}</p>
  </div>
}
