import { useEffect, useState } from 'react'

type WalletProvider = { request(input: { method: string; params?: unknown[] }): Promise<unknown> }
type Config = { enabled: boolean; appId: string; templateId: string }

declare global { interface Window { ethereum?: WalletProvider } }

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json() as T & { error?: string; reasonCode?: string }
  if (!response.ok) throw new Error(data.reasonCode ? `${data.error || 'Request failed.'} [${data.reasonCode}]` : data.error || `Request failed (${response.status}).`)
  return data
}

export function PrimusXProof() {
  const [config, setConfig] = useState<Config | null>(null)
  const [handle, setHandle] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Connect an EVM wallet and enter the X username you want to prove.')
  const [verified, setVerified] = useState(false)
  useEffect(() => {
    fetch('/api/v1/primus/config').then(async response => {
      if (!response.ok) throw new Error('Start the local AttestDock server to use X proofs.')
      setConfig(await response.json() as Config)
    }).catch(error => setStatus(error instanceof Error ? error.message : 'Primus configuration is unavailable.'))
  }, [])

  async function run(): Promise<void> {
    setBusy(true)
    setVerified(false)
    try {
      if (!config?.enabled) throw new Error('Configure the Primus App ID and App Secret on the local server first.')
      if (!consent) throw new Error('Confirm that you consent to the X account request.')
      if (!window.ethereum) throw new Error('Install an EVM wallet extension, then reload this page.')
      setStatus('Connecting wallet…')
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      const wallet = accounts?.[0]
      if (!wallet) throw new Error('No wallet account was selected.')
      const challenge = await post<{ challengeId: string; message: string }>('/api/v1/primus/challenge', { wallet })
      setStatus('Sign the local wallet challenge…')
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [challenge.message, wallet] })
      const auth = await post<{ wallet: string }>('/api/v1/primus/authenticate', { challengeId: challenge.challengeId, signature })
      const session = await post<{ sessionId: string; nonce: string }>('/api/v1/primus/sessions', { handle, consent: true })
      setStatus('Loading the Primus SDK…')
      const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk')
      const sdk = new PrimusZKTLS()
      setStatus('Initializing the Primus extension…')
      await sdk.init(config.appId)
      const attRequest = sdk.generateRequestParams(config.templateId, auth.wallet)
      attRequest.setAdditionParams(JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce, algorithmType: 'proxytls' }))
      const signed = await post<{ signedRequest: string }>('/api/v1/primus/sign', { sessionId: session.sessionId, serializedRequest: attRequest.toJsonString() })
      setStatus('Complete the X account proof in the Primus extension…')
      const attestation = await sdk.startAttestation(signed.signedRequest)
      if (!sdk.verifyAttestation(attestation)) throw new Error('Primus extension attestation signature is invalid.')
      setStatus('Checking the attestation on the server…')
      const result = await post<{ verified: boolean; handle: string }>('/api/v1/primus/verify', { sessionId: session.sessionId, attestation })
      if (!result.verified) throw new Error('Server verification did not pass.')
      setVerified(true)
      setStatus(`Verified X account @${result.handle} for the connected wallet. This local result is cleared when the server restarts.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The X proof failed. Try again.')
    } finally { setBusy(false) }
  }

  return <div className="platform-card platform-form">
    <h4>X account ownership</h4>
    <p>Prove the <code>screen_name</code> returned by your X account settings with Primus zkTLS. AttestDock checks the attestation on the local server before it shows success.</p>
    <label htmlFor="x-handle">X username</label>
    <input id="x-handle" value={handle} onChange={event => setHandle(event.target.value)} placeholder="username" autoComplete="off" maxLength={16} disabled={busy} />
    <label><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy} /> I consent to opening X in the Primus extension and disclosing my X username.</label>
    <button type="button" onClick={() => void run()} disabled={busy || !config?.enabled}>{busy ? 'Proof in progress…' : 'Prove X account'}</button>
    <p role="status" aria-live="polite" className={verified ? 'proof-success' : undefined}>{status}</p>
    {config && !config.enabled && <p>Local Primus configuration is missing. The scanner and simulated API remain available.</p>}
  </div>
}
