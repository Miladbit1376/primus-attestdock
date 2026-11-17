import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAttestDockServer } from './app.ts'
import type { Server } from 'node:http'
import { ethers } from 'ethers'
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk'
import { PrimusXFlow, X_TEMPLATE_ID } from './primus.ts'

let server: Server | undefined
afterEach(async () => {
  if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
  server = undefined
  vi.unstubAllEnvs()
})
async function start(development: boolean, primusFlow?: PrimusXFlow): Promise<string> {
  server = createAttestDockServer({ development, distDirectory: 'dist', primusFlow })
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No test port')
  return 'http://127.0.0.1:' + address.port
}

async function signedHttpSession(): Promise<{ base: string; cookie: string; sessionId: string; nonce: string; wallet: string; now: number }> {
  const now = Date.now()
  const fake = { init: async () => true, sign: async (raw: string) => JSON.stringify({ attRequest: JSON.parse(raw), appSignature: 'test-signature' }), verifyAttestation: () => true } as unknown as PrimusZKTLS
  const flow = new PrimusXFlow({ appId: 'test-app', appSecret: 'test-only' }, () => now, () => fake)
  const wallet = ethers.Wallet.createRandom()
  const challenge = flow.challenge(wallet.address)
  const auth = flow.authenticate(challenge.challengeId, await wallet.signMessage(challenge.message))
  const session = flow.create(wallet.address, '0xMiladx0')
  const request = {
    appId: 'test-app', attTemplateID: X_TEMPLATE_ID, userAddress: wallet.address, timestamp: now,
    attMode: { algorithmType: 'proxytls', resultType: 'plain' }, requestid: crypto.randomUUID(),
    backUrl: '', computeMode: 'normal', extendedParams: '', noProxy: true, allJsonResponseFlag: 'false',
    additionParams: JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce, algorithmType: 'proxytls' })
  }
  await flow.sign(wallet.address, session.sessionId, JSON.stringify(request))
  return { base: await start(true, flow), cookie: auth.cookie.split(';')[0], sessionId: session.sessionId, nonce: session.nonce, wallet: wallet.address, now }
}

describe('local platform API', () => {
  it('lists only server-verified X proofs for the signed-in wallet', async () => {
    const { base, cookie, sessionId, nonce, wallet, now } = await signedHttpSession()
    const url = base + '/api/v1/primus/proofs'
    expect((await fetch(url)).status).toBe(401)
    const before = await fetch(url, { headers: { cookie } })
    expect(await before.json()).toEqual({ wallet, proofs: [] })
    const attestation = {
      recipient: wallet,
      request: { url: 'https://api.x.com/1.1/account/settings.json?test=1', header: '', method: 'GET', body: '' },
      reponseResolve: [{ keyName: 'screen_name', parseType: 'json', parsePath: '$.screen_name' }],
      data: JSON.stringify({ screen_name: '0xMiladx0' }),
      attConditions: '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"}]',
      timestamp: String(now), additionParams: JSON.stringify({ sessionId, nonce, algorithmType: 'proxytls' }),
      attestors: [{ attestorAddr: wallet, url: 'https://example.test' }], signatures: ['synthetic']
    }
    const verified = await fetch(base + '/api/v1/primus/verify', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base, cookie },
      body: JSON.stringify({ sessionId, attestation })
    })
    expect(verified.status).toBe(200)
    const after = await fetch(url, { headers: { cookie } })
    expect(await after.json()).toEqual({ wallet, proofs: [{ sessionId, handle: '0xMiladx0', verifiedAt: new Date(now).toISOString() }] })
  })
  it('shows only a fixed reason code for a local verification rejection', async () => {
    vi.stubEnv('ATTESTDOCK_DEV_MODE', '1')
    const { base, cookie, sessionId } = await signedHttpSession()
    const response = await fetch(base + '/api/v1/primus/verify', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base, cookie },
      body: JSON.stringify({ sessionId, attestation: {} })
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({
      error: 'The X proof failed server verification. Check the account, session, and extension result.',
      reasonCode: 'ATTESTATION_STRUCTURE'
    })
  })
  it('shows only the fixed condition category in local development', async () => {
    vi.stubEnv('ATTESTDOCK_DEV_MODE', '1')
    const { base, cookie, sessionId } = await signedHttpSession()
    const response = await fetch(base + '/api/v1/primus/verify', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base, cookie },
      body: JSON.stringify({ sessionId, attestation: {
        signatures: ['synthetic'], attestors: [{}],
        request: { method: 'GET', body: '', url: 'https://api.x.com/1.1/account/settings.json' },
        reponseResolve: [{ keyName: 'screen_name', parseType: 'json', parsePath: '$.screen_name' }],
        attConditions: '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name","type":"FIELD_REVEAL"}]'
      } })
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({
      error: 'The X proof failed server verification. Check the account, session, and extension result.',
      reasonCode: 'CONDITIONS_UNKNOWN_PROPERTY'
    })
  })
  it('keeps a condition category private in production', async () => {
    vi.stubEnv('ATTESTDOCK_DEV_MODE', '1')
    vi.stubEnv('NODE_ENV', 'production')
    const { base, cookie, sessionId } = await signedHttpSession()
    const response = await fetch(base + '/api/v1/primus/verify', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base, cookie },
      body: JSON.stringify({ sessionId, attestation: {
        signatures: ['synthetic'], attestors: [{}],
        request: { method: 'GET', body: '', url: 'https://api.x.com/1.1/account/settings.json' },
        reponseResolve: [{ keyName: 'screen_name', parseType: 'json', parsePath: '$.screen_name' }],
        attConditions: '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name","type":"FIELD_REVEAL"}]'
      } })
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: 'The X proof failed server verification. Check the account, session, and extension result.' })
  })
  it.each([
    ['development, wrong algorithm', 'test', false, 'ADDITION_PARAMS_ALGORITHM_MISMATCH'],
    ['development, extra field', 'test', true, 'ADDITION_PARAMS_UNEXPECTED_FIELDS'],
    ['production, wrong algorithm', 'production', false, undefined],
    ['production, extra field', 'production', true, undefined]
  ])('keeps additionParams diagnostics fixed and private in %s', async (_label, nodeEnv, extraField, reasonCode) => {
    vi.stubEnv('ATTESTDOCK_DEV_MODE', '1')
    vi.stubEnv('NODE_ENV', nodeEnv)
    const { base, cookie, sessionId, nonce, wallet, now } = await signedHttpSession()
    const response = await fetch(base + '/api/v1/primus/verify', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base, cookie },
      body: JSON.stringify({ sessionId, attestation: {
        signatures: ['synthetic'], attestors: [{}], recipient: wallet,
        request: { method: 'GET', body: '', url: 'https://api.x.com/1.1/account/settings.json' },
        reponseResolve: [{ keyName: 'screen_name', parseType: 'json', parsePath: '$.screen_name' }],
        attConditions: '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"}]',
        data: JSON.stringify({ screen_name: '0xMiladx0' }), timestamp: String(now),
        additionParams: JSON.stringify({ sessionId, nonce, algorithmType: extraField ? 'proxytls' : 'mpctls', ...(extraField ? { extra: true } : {}) })
      } })
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({
      error: 'The X proof failed server verification. Check the account, session, and extension result.',
      ...(reasonCode ? { reasonCode } : {})
    })
  })
  it.each([
    ['flag disabled', '0', 'test'],
    ['production environment', '1', 'production']
  ])('keeps the verification response generic in %s', async (_label, flag, nodeEnv) => {
    vi.stubEnv('ATTESTDOCK_DEV_MODE', flag)
    vi.stubEnv('NODE_ENV', nodeEnv)
    const { base, cookie, sessionId } = await signedHttpSession()
    const response = await fetch(base + '/api/v1/primus/verify', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base, cookie },
      body: JSON.stringify({ sessionId, attestation: {} })
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: 'The X proof failed server verification. Check the account, session, and extension result.' })
  })

  it('lists candidate providers and no configured templates', async () => {
    const base = await start(false)
    const providers = await (await fetch(base + '/api/v1/providers')).json()
    const templates = await (await fetch(base + '/api/v1/templates')).json()
    expect(providers.providers).toHaveLength(5)
    expect(providers.providers.every((item: { availability: string }) => item.availability === 'template_pending')).toBe(true)
    expect(templates.templates).toEqual([])
  })
  it('fails closed for live proof and verification routes', async () => {
    const base = await start(false)
    expect((await fetch(base + '/api/v1/proof-sessions', { method: 'POST' })).status).toBe(503)
    expect((await fetch(base + '/api/v1/attestations/verify', { method: 'POST' })).status).toBe(503)
    const primus = await fetch(base + '/api/v1/primus/verify', { method: 'POST', headers: { origin: base } })
    expect(primus.status).toBe(503)
    expect(await primus.json()).toEqual({ error: 'Live proof service is disabled.' })
  })
  it('creates only a clearly simulated local session and honors idempotency', async () => {
    const base = await start(true)
    const body = JSON.stringify({ providerId: 'google', claimId: 'account_email', recipient: 'demo-user', consent: true, mode: 'simulated' })
    const headers = { 'content-type': 'application/json', 'idempotency-key': 'test-key-1234567890' }
    const first = await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body })
    const created = await first.json()
    expect(first.status).toBe(201)
    expect(created.simulation).toBe(true)
    expect(created.session.status).toBe('created')
    expect(created.session.mode).toBe('simulated')
    expect(created.session.templateId).toBeNull()
    const again = await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body })
    expect(again.status).toBe(200)
    expect((await again.json()).session.id).toBe(created.session.id)
  })
  it('rejects client verification flags and idempotency key reuse with changed input', async () => {
    const base = await start(true)
    const headers = { 'content-type': 'application/json', 'idempotency-key': 'test-key-flag-123456' }
    const body = { providerId: 'google', claimId: 'account_email', recipient: 'demo-user', consent: true, mode: 'simulated' }
    const flagged = await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body: JSON.stringify({ ...body, verified: true }) })
    expect(flagged.status).toBe(400)
    expect((await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body: JSON.stringify(body) })).status).toBe(201)
    expect((await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body: JSON.stringify({ ...body, recipient: 'other-demo' }) })).status).toBe(409)
  })
  it('keeps Primus credentials off the public config route and fails closed without them', async () => {
    const base = await start(true)
    const config = await (await fetch(base + '/api/v1/primus/config')).json()
    expect(config).toMatchObject({ enabled: false, appId: '', templateId: '2e3160ae-8b1e-45e3-8c59-426366278b9d' })
    expect(JSON.stringify(config)).not.toContain('appSecret')
    const missingOrigin = await fetch(base + '/api/v1/primus/challenge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet: 'invalid' }) })
    expect(missingOrigin.status).toBe(403)
    const disabled = await fetch(base + '/api/v1/primus/challenge', { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify({ wallet: 'invalid' }) })
    expect(disabled.status).toBe(503)
  })
  it('rejects cross-origin writes and live mode even in development', async () => {
    const base = await start(true)
    const headers = { 'content-type': 'application/json', 'idempotency-key': 'test-key-9876543210', origin: 'https://example.com' }
    const body = JSON.stringify({ providerId: 'google', claimId: 'account_email', recipient: 'demo-user', consent: true, mode: 'live' })
    expect((await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body })).status).toBe(403)
    delete (headers as { origin?: string }).origin
    expect((await fetch(base + '/api/v1/proof-sessions', { method: 'POST', headers, body })).status).toBe(503)
  })
})
