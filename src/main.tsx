import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUpRight, Check, ChevronDown, CircleAlert, Download, FileCode2, LockKeyhole, RotateCcw, ScanSearch, ShieldCheck, Sparkles, Upload } from 'lucide-react'
import { examples } from './examples'
import { AssurancePanel } from './assurance/AssurancePanel'
import { PlatformPreview } from './platform/PlatformPreview'
import type { Environment, ScanReport, Severity } from './scanner'
import './style.css'

function App() {
  const [code, setCode] = useState('')
  const [fileName, setFileName] = useState('snippet.tsx')
  const [environment, setEnvironment] = useState<Environment>('unknown')
  const [report, setReport] = useState<ScanReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [exampleOpen, setExampleOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLElement>(null)
  const runScan = () => {
    setBusy(true)
    let worker: Worker
    try {
      worker = new Worker(new URL('./scanner.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      setReport({ fileName, environment, findings: [], error: 'This browser could not start the scanner worker.' })
      setBusy(false)
      return
    }
    const finish = (nextReport: ScanReport) => {
      setReport(nextReport)
      setBusy(false)
      worker.terminate()
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
    worker.onmessage = (event: MessageEvent<ScanReport>) => finish(event.data)
    worker.onerror = () => finish({ fileName, environment, findings: [], error: 'The scanner could not load. Reload the page and try again.' })
    worker.onmessageerror = () => finish({ fileName, environment, findings: [], error: 'The scanner returned an unreadable result.' })
    worker.postMessage({ code, environment, fileName })
  }
  const loadFile = async (file?: File) => {
    if (!file) return
    if (!/\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(file.name)) { setReport({ fileName: file.name, environment, findings: [], error: 'Choose a JavaScript or TypeScript source file.' }); return }
    if (file.size > 1_000_000) { setReport({ fileName: file.name, environment, findings: [], error: 'Choose a file smaller than 1 MB.' }); return }
    setCode(await file.text()); setFileName(file.name); setReport(null)
  }
  const exportReport = () => {
    if (!report || report.error) return
    const blob = new Blob([JSON.stringify({ ...report, scannedAt: new Date().toISOString(), note: 'Single-file static scan. Review findings before acting.' }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'attestdock-report.json'; link.click(); URL.revokeObjectURL(url)
  }
  const count = (severity: Severity) => report?.findings.filter(item => item.severity === severity).length ?? 0
  return <div className="app">
    <header className="topbar"><a className="brand" href="#top" aria-label="AttestDock home"><span className="brand-icon"><ShieldCheck size={19}/></span><span>ATTEST<b>DOCK</b></span></a><nav><a href="#workspace">Scanner</a><a href="#assurance">Assurance</a><a href="#user-app">X proof</a><a href="#developer">Developers</a><a href="https://github.com/primus-labs" target="_blank" rel="noreferrer">Primus GitHub <ArrowUpRight size={14}/></a></nav><span className="top-status"><span className="status-dot"/> LOCAL ZKTLS TOOL</span></header>
    <main id="top"><section className="hero"><div className="eyebrow"><Sparkles size={13}/> OPEN SOURCE · INDEPENDENT PRIMUS TOOL</div><h1>Check the proof.<br/><em>Test the decision.</em></h1><p>Scan Primus integration code in your browser. Run repeatable checks against the local X proof server path.</p><a className="hero-link" href="#assurance">Explore assurance checks <ArrowDown size={16}/></a><div className="hero-grid" aria-hidden="true"/></section>
      <section id="workspace" className="workspace"><div className="section-heading"><div><span className="overline">01 / WORKSPACE</span><h2>Scan your code</h2><p>Paste a file or upload source. Analysis runs in this browser.</p></div><span className="privacy-pill"><LockKeyhole size={14}/> Your code stays on this device</span></div>
      <div className="work-grid"><div className="editor-card"><div className="card-bar"><div className="card-title"><FileCode2 size={16}/><span>{fileName}</span></div><div className="card-actions"><button onClick={() => fileInput.current?.click()}><Upload size={14}/> Upload file</button><input ref={fileInput} type="file" accept=".js,.jsx,.ts,.tsx,.mjs,.cjs" hidden onChange={event => { void loadFile(event.target.files?.[0]); event.target.value = '' }}/><div className="example-wrap"><button onClick={() => setExampleOpen(!exampleOpen)} aria-expanded={exampleOpen}>Load example <ChevronDown size={14}/></button>{exampleOpen && <div className="example-menu">{examples.map(item => <button key={item.name} onClick={() => { setCode(item.code); setFileName(item.name.toLowerCase().replaceAll(' ', '-') + '.ts'); setEnvironment(item.environment); setReport(null); setExampleOpen(false) }}><span>{item.name}</span><small>{item.kind}</small></button>)}</div>}</div></div></div><div className="editor-body"><div className="line-numbers" aria-hidden="true">{Array.from({ length: Math.max(14, code.split('\n').length) }, (_, i) => <span key={i}>{i + 1}</span>)}</div><textarea aria-label="Source code" spellCheck={false} value={code} onChange={event => { setCode(event.target.value); setReport(null) }} placeholder={'// Paste your integration code here\n// JavaScript, JSX, TypeScript, and TSX supported'} /></div><div className="editor-footer"><span>{code.length.toLocaleString()} characters <span className="separator">·</span> {code.split('\n').length} lines</span><button className="clear-btn" onClick={() => { setCode(''); setFileName('snippet.tsx'); setReport(null) }}><RotateCcw size={13}/> Clear</button></div></div>
      <aside className="side-card"><div className="side-icon"><ScanSearch size={21}/></div><h3>Configure scan</h3><p>Set the runtime for accurate credential checks.</p><label htmlFor="environment">CODE ENVIRONMENT</label><select id="environment" value={environment} onChange={event => setEnvironment(event.target.value as Environment)}><option value="unknown">Unknown / mixed</option><option value="frontend">Frontend / extension</option><option value="backend">Backend / server</option></select><div className="scan-detail"><Check size={14}/> AST-based static analysis</div><div className="scan-detail"><Check size={14}/> No code execution</div><div className="scan-detail"><Check size={14}/> No network upload</div><button className="scan-button" disabled={busy} onClick={runScan}><ScanSearch size={17}/>{busy ? 'Scanning…' : 'Scan code'}<ArrowUpRight size={16}/></button><p className="side-note">A single-file scan cannot confirm that your full application is secure.</p></aside></div></section>
      <section ref={resultRef} id="results" className="results"><div className="section-heading"><div><span className="overline">02 / RESULTS</span><h2>Scan report</h2><p>Review each finding in the context of your application.</p></div>{report && !report.error && <button className="export-btn" onClick={exportReport}><Download size={15}/> Export JSON</button>}</div>
      {!report ? <div className="empty-state"><span><ScanSearch size={29}/></span><h3>Ready when you are</h3><p>Add code and run a scan. Findings will appear here with line numbers and suggested fixes.</p></div> : report.error ? <div className="error-state"><CircleAlert size={20}/><div><strong>Scan could not complete</strong><p>{report.error}</p></div></div> : <><div className="stats"><div><span>TOTAL FINDINGS</span><strong>{report.findings.length}</strong></div><div><span>HIGH SEVERITY</span><strong className="high-text">{count('high')}</strong></div><div><span>MEDIUM SEVERITY</span><strong className="medium-text">{count('medium')}</strong></div><div><span>LOW SEVERITY</span><strong>{count('low')}</strong></div></div>{report.findings.length === 0 ? <div className="success-state"><ShieldCheck size={27}/><div><h3>No supported patterns found</h3><p>This scan found no issues in this file. Review other files and test the full flow before release.</p></div></div> : <div className="findings">{report.findings.map((finding, index) => <article className="finding" key={`${finding.id}-${finding.line}-${index}`}><div className="finding-top"><span className={`severity ${finding.severity}`}>{finding.severity.toUpperCase()}</span><span className="rule-id">{finding.id}</span><span className="line-tag">LINE {finding.line}</span></div><h3>{finding.title}</h3><p>{finding.explanation}</p><code>{finding.evidence}</code><div className="finding-fix"><strong>Suggested fix</strong><p>{finding.fix}</p></div><a href={finding.documentation} target="_blank" rel="noreferrer">Official reference <ArrowUpRight size={13}/></a></article>)}</div>}</>}</section>
      <AssurancePanel/><section id="how" className="how"><div><span className="overline">04 / HOW IT WORKS</span><h2>Know what the scan sees.</h2><p>AttestDock parses source into a TypeScript syntax tree and looks for specific integration patterns. It does not run your code or contact Primus services.</p></div><div className="how-list"><div><span>01</span><p><strong>Paste or upload</strong><br/>Choose one JavaScript or TypeScript file.</p></div><div><span>02</span><p><strong>Scan locally</strong><br/>The browser checks six rule categories.</p></div><div><span>03</span><p><strong>Review and fix</strong><br/>Inspect evidence, then confirm behavior across the app.</p></div></div></section><PlatformPreview/></main>
    <footer><span>ATTESTDOCK <span className="separator">/</span> Independent community tool</span><span>Browser scanner stays local · X proof uses Primus · No production verification API</span><a href="https://docs.primuslabs.xyz/" target="_blank" rel="noreferrer">Primus docs <ArrowUpRight size={13}/></a></footer>
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
