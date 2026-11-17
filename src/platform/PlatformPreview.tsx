import { useEffect, useState } from 'react'
import { disclosurePreview } from './privacy.ts'
import { providerRegistry } from './providers.ts'
import { templateRegistry } from './templates.ts'
import type { ProviderId } from './types.ts'
import { PrimusXProof } from './PrimusXProof.tsx'

const providers = providerRegistry.list()
const userSections = ['Overview', 'Providers', 'Create Proof', 'My Proofs', 'Activity', 'Settings'] as const
const developerSections = ['Overview', 'Projects', 'API Keys', 'Providers', 'Templates', 'Documentation', 'API Playground', 'Webhooks', 'Usage'] as const
type UserSection = typeof userSections[number]
type DeveloperSection = typeof developerSections[number]

function ProviderCards() {
  return <div className="platform-card-grid">{providers.map(provider =>
    <article className="platform-card" key={provider.id}>
      <div className="platform-card-top"><span className="provider-icon">{provider.icon}</span><span className="pending-badge">{provider.id === 'x' ? 'LOCAL X FLOW' : 'TEMPLATE PENDING'}</span></div>
      <h4>{provider.name}</h4><p>{provider.description}</p>
      <ul>{provider.claims.map(claim => <li key={claim.id}>{claim.name}</li>)}</ul>
      <small>{provider.id === 'x' ? 'X account ownership uses one selected local Primus template. Other X claims remain pending.' : 'Candidate claims. No approved template is configured.'}</small>
    </article>
  )}</div>
}

type LocalProof = { sessionId: string; handle: string; verifiedAt: string }

function LocalProofs() {
  const [proofs, setProofs] = useState<LocalProof[]>([])
  const [message, setMessage] = useState('Loading local proofs…')
  useEffect(() => {
    let active = true
    fetch('/api/v1/primus/proofs', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Sign in with your wallet and complete an X proof first.' : 'Start the configured local AttestDock server to view proofs.')
        return response.json() as Promise<{ proofs: LocalProof[] }>
      })
      .then(result => { if (active) { setProofs(result.proofs); setMessage(result.proofs.length ? '' : 'No verified X proof exists in this local server session.') } })
      .catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Local proof status is unavailable.') })
    return () => { active = false }
  }, [])
  return <div className="platform-card">
    <h4>Local verified proofs</h4>
    <p>Only server-verified X proofs appear here. This list is cleared when the local server restarts.</p>
    {message && <p role="status">{message}</p>}
    {proofs.length > 0 && <ul>{proofs.map(proof => <li key={proof.sessionId}>@{proof.handle} · Verified <time dateTime={proof.verifiedAt}>{new Date(proof.verifiedAt).toLocaleString()}</time></li>)}</ul>}
  </div>
}

function UserView({ section }: { section: UserSection }) {
  const [providerId, setProviderId] = useState<ProviderId>('x')
  const [claimId, setClaimId] = useState('account_ownership')
  const provider = providers.find(item => item.id === providerId)!
  const claim = provider.claims.find(item => item.id === claimId) ?? provider.claims[0]
  const preview = disclosurePreview(templateRegistry.resolveActive(providerId, claim.id))

  if (section === 'Providers') return <ProviderCards />
  if (section === 'Create Proof' && providerId === 'x' && claim.id === 'account_ownership') return <><PrimusXProof /><div className="platform-card platform-form"><label htmlFor="other-provider">Other providers</label><select id="other-provider" value={providerId} onChange={event => { const id = event.target.value as ProviderId; setProviderId(id); setClaimId(providers.find(item => item.id === id)!.claims[0].id) }}>{providers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></>
  if (section === 'Create Proof') return <div className="platform-card platform-form">
    <h4>Prepare a proof</h4>
    <p>Choose a candidate claim. A real proof needs an approved template and a clear disclosure preview.</p>
    <label htmlFor="proof-provider">Provider</label>
    <select id="proof-provider" value={providerId} onChange={event => { const id = event.target.value as ProviderId; setProviderId(id); setClaimId(providers.find(item => item.id === id)!.claims[0].id) }}>
      {providers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
    <label htmlFor="proof-claim">Claim</label>
    <select id="proof-claim" value={claim.id} onChange={event => setClaimId(event.target.value)}>
      {provider.claims.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
    <div className="disclosure-box"><strong>Privacy preview</strong><p>{preview.message}</p><p>No provider data is requested or stored.</p></div>
    <button type="button" disabled>Create proof — template pending</button>
  </div>
  if (section === 'My Proofs') return <LocalProofs />
  if (section === 'Activity') return <div className="platform-card"><h4>No account activity</h4><p>Activity will appear after authentication and approved proof flows are available.</p></div>
  if (section === 'Settings') return <div className="platform-card"><h4>Preferences are not available</h4><p>Account settings and data deletion controls need an authenticated, persistent service.</p></div>
  return <div className="platform-card-grid">
    <div className="platform-card"><span className="platform-metric">0</span><h4>Ready providers</h4><p>X account ownership has a selected template. Other claims remain pending.</p></div>
    <div className="platform-card"><span className="platform-metric">0</span><h4>Verified proofs</h4><p>AttestDock does not claim a proof is verified without trusted server checks.</p></div>
    <div className="platform-card"><h4>Your next step</h4><p>Review the provider catalog. Configure the local Primus service and connect a wallet to try X account ownership.</p></div>
  </div>
}

const developerCopy: Record<DeveloperSection, { title: string; text: string }> = {
  Overview: { title: 'Integration status', text: 'The shared API and typed SDK are in development. X account ownership is available only on the configured local server.' },
  Projects: { title: 'Projects need authentication', text: 'Project creation and ownership controls are not configured. No project records are stored.' },
  'API Keys': { title: 'No API keys issued', text: 'Secret key issuance requires authenticated project ownership, hashing, rotation, and a persistent store.' },
  Providers: { title: 'Candidate provider catalog', text: 'One X account ownership template is selected for local integration. Other claims remain pending.' },
  Templates: { title: 'Selected X template', text: 'Template IDs must come from verified Primus configuration. The X account ownership Template ID is configured in the local integration.' },
  Documentation: { title: 'Developer documentation', text: 'The source repository contains architecture, security, integration, and API documents. Examples use development data only.' },
  'API Playground': { title: 'Read-only API playground', text: 'The local platform server can return provider metadata. The configured local server can issue an X account proof.' },
  Webhooks: { title: 'Webhooks disabled', text: 'Signing keys, delivery retries, and persistent logs need authenticated project configuration.' },
  Usage: { title: 'No usage data', text: 'Usage analytics and request logs are unavailable until projects and storage exist.' }
}

function DeveloperView({ section }: { section: DeveloperSection }) {
  const [result, setResult] = useState('')
  if (section === 'Providers') return <ProviderCards />
  return <div className="platform-card platform-form">
    <h4>{developerCopy[section].title}</h4><p>{developerCopy[section].text}</p>
    {section === 'API Playground' && <>
      <div className="api-endpoint">GET /api/v1/providers</div>
      <button type="button" onClick={async () => {
        setResult('Loading provider metadata…')
        try {
          const response = await fetch('/api/v1/providers', { headers: { Accept: 'application/json' } })
          if (!response.ok) throw new Error('Local API is unavailable.')
          const body: unknown = await response.json()
          setResult(JSON.stringify(body, null, 2))
        } catch { setResult('Start the local AttestDock platform server to use this read-only endpoint.') }
      }}>Try read-only request</button>
      {result && <pre className="api-result">{result}</pre>}
    </>}
    {section === 'Templates' && <p className="pending-note">The X Account Ownership Template ID was supplied by the project owner.</p>}
  </div>
}

export function PlatformPreview() {
  const [userSection, setUserSection] = useState<UserSection>('Overview')
  const [developerSection, setDeveloperSection] = useState<DeveloperSection>('Overview')
  return <div className="platform-shell">
    <section id="user-app" className="platform-section">
      <div className="section-heading"><div><span className="overline">04 / USER APP</span><h2>Proofs with clear limits.</h2><p>Explore candidate claims. X account ownership is available when the local Primus service is configured.</p></div><span className="pending-badge">DEVELOPMENT PREVIEW</span></div>
      <nav className="platform-nav" aria-label="User app sections">{userSections.map(section => <button key={section} type="button" aria-current={userSection === section ? 'page' : undefined} onClick={() => setUserSection(section)}>{section}</button>)}</nav>
      <UserView section={userSection} />
    </section>
    <section id="developer" className="platform-section">
      <div className="section-heading"><div><span className="overline">05 / DEVELOPER PORTAL</span><h2>Build on one shared core.</h2><p>Review API and SDK work in progress. Production project tools are disabled.</p></div><span className="pending-badge">DEVELOPMENT PREVIEW</span></div>
      <nav className="platform-nav" aria-label="Developer portal sections">{developerSections.map(section => <button key={section} type="button" aria-current={developerSection === section ? 'page' : undefined} onClick={() => setDeveloperSection(section)}>{section}</button>)}</nav>
      <DeveloperView section={developerSection} />
    </section>
  </div>
}
