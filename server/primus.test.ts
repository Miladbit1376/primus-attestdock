import { describe, expect, it } from 'vitest'
import { ethers } from 'ethers'
import { PrimusXFlow, X_TEMPLATE_ID } from './primus.ts'
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk'

const now = 1_800_000_000_000
function fixture(signatureValid: boolean | 'throw' = true) {
  const fake = { init: async () => true, sign: async (raw: string) => JSON.stringify({ attRequest: JSON.parse(raw), appSignature: 'test-signature' }), verifyAttestation: () => { if (signatureValid === 'throw') throw new Error('SDK test error'); return signatureValid } } as unknown as PrimusZKTLS
  const flow = new PrimusXFlow({ appId: 'test-app', appSecret: 'test-only' }, () => now, () => fake)
  const wallet = ethers.Wallet.createRandom()
  return { flow, wallet }
}
async function signedProof(signatureValid: boolean | 'throw' = true) {
  const { flow, wallet } = fixture(signatureValid)
  const challenge = flow.challenge(wallet.address)
  const auth = flow.authenticate(challenge.challengeId, await wallet.signMessage(challenge.message))
  expect(flow.wallet(auth.cookie)).toBe(wallet.address)
  const session = flow.create(wallet.address, '@example_user')
  const request = {
    appId: 'test-app', attTemplateID: X_TEMPLATE_ID, userAddress: wallet.address, timestamp: now,
    attMode: { algorithmType: 'proxytls', resultType: 'plain' }, requestid: '123e4567-e89b-42d3-a456-426614174000',
    backUrl: '', computeMode: 'normal', extendedParams: '', noProxy: true, allJsonResponseFlag: 'false',
    additionParams: JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce, algorithmType: 'proxytls' })
  }
  const signed = await flow.sign(wallet.address, session.sessionId, JSON.stringify(request))
  expect(JSON.parse(signed.signedRequest).attRequest).toEqual(request)
  const attestation = {
    recipient: wallet.address, request: { url: 'https://api.x.com/1.1/account/settings.json?test=1', header: '', method: 'GET', body: '' },
    reponseResolve: [{ keyName: 'screen_name', parseType: 'json', parsePath: '$.screen_name' }],
    data: JSON.stringify({ screen_name: 'example_user' }), attConditions: '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"}]', timestamp: String(now),
    additionParams: request.additionParams, attestors: [{ attestorAddr: wallet.address, url: 'https://example.test' }], signatures: ['0xabc']
  }
  return { flow, wallet, session, request, attestation }
}

describe('Primus X local proof gate', () => {
  it('binds wallet login, approved template, nonce, username and server signature check', async () => {
    const proof = await signedProof()
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).resolves.toMatchObject({ verified: true, handle: 'example_user' })
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toThrow('already used')
  })
  it('rejects a different template and an altered nonce before signing', async () => {
    const { flow, wallet } = fixture()
    const session = flow.create(wallet.address, 'example_user')
    const base = { appId: 'test-app', attTemplateID: X_TEMPLATE_ID, userAddress: wallet.address, timestamp: now, attMode: { algorithmType: 'proxytls', resultType: 'plain' }, requestid: '123e4567-e89b-42d3-a456-426614174000', backUrl: '', computeMode: 'normal', extendedParams: '', noProxy: true, allJsonResponseFlag: 'false', additionParams: JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce, algorithmType: 'proxytls' }) }
    await expect(flow.sign(wallet.address, session.sessionId, JSON.stringify({ ...base, attTemplateID: 'other' }))).rejects.toThrow('approved X template')
    await expect(flow.sign(wallet.address, session.sessionId, JSON.stringify({ ...base, additionParams: '{}' }))).rejects.toThrow('approved X template')
    await expect(flow.sign(wallet.address, session.sessionId, JSON.stringify({ ...base, additionParams: JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce }) }))).rejects.toThrow('approved X template')
    await expect(flow.sign(wallet.address, session.sessionId, JSON.stringify({ ...base, attMode: { algorithmType: 'mpctls', resultType: 'plain' } }))).rejects.toThrow('approved X template')
    await expect(flow.sign(wallet.address, session.sessionId, JSON.stringify({ ...base, attConditions: [[{ field: '$.screen_name', op: '=' }]] }))).rejects.toThrow('approved X template')
  })
  it.each([
    ['wrong username', (a: any) => { a.data = JSON.stringify({ screen_name: 'another_user' }) }],
    ['wrong source', (a: any) => { a.request.url = 'https://example.com/1.1/account/settings.json' }],
    ['wrong nonce', (a: any) => { a.additionParams = '{}' }],
    ['wrong wallet', (a: any) => { a.recipient = ethers.Wallet.createRandom().address }],
    ['wrong field', (a: any) => { a.reponseResolve[0].parsePath = '$.email' }],
    ['wrong condition', (a: any) => { a.attConditions = '[{"op":"REVEAL_STRING","field":"$.email"}]' }]
  ])('rejects %s', async (_label, mutate) => {
    const proof = await signedProof()
    mutate(proof.attestation)
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toThrow('failed server verification')
  })
  it('accepts only the confirmed signed X reveal with the other proof checks', async () => {
    const proof = await signedProof()
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).resolves.toMatchObject({ verified: true, handle: 'example_user' })
  })
  it.each([
    ['missing reveal_id', '[{"op":"REVEAL_STRING","field":"$.screen_name"}]', 'CONDITIONS_REVEAL_ID_MISSING'],
    ['wrong reveal_id', '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"other"}]', 'CONDITIONS_REVEAL_ID_MISMATCH'],
    ['type property', '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name","type":"FIELD_REVEAL"}]', 'CONDITIONS_UNKNOWN_PROPERTY'],
    ['unknown property', '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name","unknown":true}]', 'CONDITIONS_UNKNOWN_PROPERTY'],
    ['value property', '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name","value":"synthetic"}]', 'CONDITIONS_UNKNOWN_PROPERTY'],
    ['wrong field', '[{"op":"REVEAL_STRING","field":"$.email","reveal_id":"screen_name"}]', 'CONDITIONS_FIELD_MISMATCH'],
    ['wrong operator', '[{"op":"=","field":"$.screen_name","reveal_id":"screen_name"}]', 'CONDITIONS_OPERATOR_MISMATCH'],
    ['multiple conditions', '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"},{"op":"REVEAL_STRING","field":"$.email","reveal_id":"email"}]', 'CONDITIONS_MULTIPLE_ITEMS'],
    ['nested condition', '[[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"}]]', 'CONDITIONS_ENTRY_TYPE'],
    ['empty string', '', 'CONDITIONS_MULTIPLE_ITEMS'],
    ['empty array', '[]', 'CONDITIONS_MULTIPLE_ITEMS'],
    ['empty nested array', '[[]]', 'CONDITIONS_ENTRY_TYPE'],
    ['non-array condition object', '{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"}', 'CONDITIONS_TOP_LEVEL_TYPE'],
    ['double-encoded conditions', '"[]"', 'CONDITIONS_STRING_ENCODING'],
    ['scalar conditions', '1', 'CONDITIONS_TOP_LEVEL_TYPE'],
    ['non-object entry', '[null]', 'CONDITIONS_ENTRY_TYPE']
  ])('rejects %s with a fixed reason and consumes the session', async (_label, conditions, reasonCode) => {
    const proof = await signedProof()
    proof.attestation.attConditions = conditions
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 422, reasonCode })
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 409, reasonCode: 'REPLAY_DETECTED' })
  })
  it.each([
    ['wrong response key', (a: any) => { a.reponseResolve[0].keyName = 'other' }],
    ['wrong response path', (a: any) => { a.reponseResolve[0].parsePath = '$.email' }]
  ])('rejects %s even with the confirmed condition', async (_label, mutate) => {
    const proof = await signedProof()
    mutate(proof.attestation)
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 422, reasonCode: 'TEMPLATE_FIELD_MISMATCH' })
  })
  it('rejects an invalid attestor signature', async () => {
    const proof = await signedProof(false)
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toThrow('failed server verification')
  })
  it('accepts the installed SDK request format for the fixed template and signs it', async () => {
    const appSigner = ethers.Wallet.createRandom()
    const user = ethers.Wallet.createRandom()
    const appId = 'test-app'
    const flow = new PrimusXFlow({ appId, appSecret: appSigner.privateKey })
    const session = flow.create(user.address, 'example_user')
    const browserSdk = new PrimusZKTLS()
    await browserSdk.init(appId, appSigner.privateKey)
    const request = browserSdk.generateRequestParams(X_TEMPLATE_ID, user.address)
    request.setAdditionParams(JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce, algorithmType: 'proxytls' }))
    const signed = JSON.parse((await flow.sign(user.address, session.sessionId, request.toJsonString())).signedRequest) as { attRequest: unknown; appSignature: string }
    expect(signed.attRequest).toEqual(JSON.parse(request.toJsonString()))
    expect(JSON.parse(request.toJsonString())).not.toHaveProperty('attConditions')
    expect(ethers.utils.verifyMessage(ethers.utils.keccak256(new TextEncoder().encode(request.toJsonString())), signed.appSignature)).toBe(appSigner.address)
  })
  it('uses the installed Primus SDK 0.3.15 to sign a serialized request on the server', async () => {
    const appSigner = ethers.Wallet.createRandom()
    const sdk = new PrimusZKTLS()
    await sdk.init('test-app', appSigner.privateKey)
    const serialized = JSON.stringify({ appId: 'test-app', attTemplateID: X_TEMPLATE_ID, userAddress: appSigner.address })
    const signed = JSON.parse(await sdk.sign(serialized)) as { attRequest: unknown; appSignature: string }
    expect(signed.attRequest).toEqual(JSON.parse(serialized))
    expect(ethers.utils.verifyMessage(ethers.utils.keccak256(new TextEncoder().encode(serialized)), signed.appSignature)).toBe(appSigner.address)
  })
  it('runs the installed SDK verifier in Node and rejects an unrelated signer', async () => {
    const proof = await signedProof()
    const unrelated = ethers.Wallet.createRandom()
    const sdk = new PrimusZKTLS()
    await sdk.init('test-app', ethers.Wallet.createRandom().privateKey)
    const attestation = { ...proof.attestation, signatures: [await unrelated.signMessage('unrelated attestation')] }
    expect(sdk.verifyAttestation(attestation as unknown as Parameters<PrimusZKTLS['verifyAttestation']>[0])).toBe(false)
  })
  it.each([
    ['ATTESTATION_STRUCTURE', (a: any) => { a.signatures = [] }],
    ['CONDITIONS_FORMAT', (a: any) => { a.attConditions = '{' }],
    ['CONDITIONS_FIELD_MISMATCH', (a: any) => { a.attConditions = '[{"op":"REVEAL_STRING","field":"$.email","reveal_id":"screen_name"}]' }],
    ['WALLET_BINDING', (a: any) => { a.recipient = ethers.Wallet.createRandom().address }],
    ['ADDITION_PARAMS_FORMAT', (a: any) => { a.additionParams = '{' }],
    ['SESSION_BINDING_MISSING', (a: any, p: any) => { a.additionParams = JSON.stringify({ nonce: p.session.nonce }) }],
    ['SESSION_BINDING', (a: any) => { a.additionParams = JSON.stringify({ sessionId: 'other', nonce: 'other' }) }],
    ['NONCE_MISSING', (a: any, p: any) => { a.additionParams = JSON.stringify({ sessionId: p.session.sessionId }) }],
    ['NONCE_MISMATCH', (a: any, p: any) => { a.additionParams = JSON.stringify({ sessionId: p.session.sessionId, nonce: 'other' }) }],
    ['ADDITION_PARAMS_DUPLICATE_KEYS', (a: any, p: any) => { a.additionParams = `{"sessionId":"other","sessionId":"${p.session.sessionId}","nonce":"${p.session.nonce}"}` }],
    ['ADDITION_PARAMS_DUPLICATE_KEYS', (a: any, p: any) => { a.additionParams = `{"sessionId":"${p.session.sessionId}","nonce":"other","nonce":"${p.session.nonce}"}` }],
    ['ADDITION_PARAMS_DUPLICATE_KEYS', (a: any, p: any) => { a.additionParams = `{"sessionId":"${p.session.sessionId}","nonce":"${p.session.nonce}","algorithmType":"mpctls","algorithmType":"proxytls"}` }],
    ['ADDITION_PARAMS_UNEXPECTED_FIELDS', (a: any, p: any) => { a.additionParams = JSON.stringify({ sessionId: p.session.sessionId, nonce: p.session.nonce, algorithmType: 'proxytls', extra: true }) }],
    ['ADDITION_PARAMS_ALGORITHM_MISMATCH', (a: any, p: any) => { a.additionParams = JSON.stringify({ sessionId: p.session.sessionId, nonce: p.session.nonce, algorithmType: 'mpctls' }) }],
    ['ADDITION_PARAMS_ALGORITHM_MISMATCH', (a: any, p: any) => { a.additionParams = JSON.stringify({ sessionId: p.session.sessionId, nonce: p.session.nonce }) }],
    ['TIMESTAMP_FORMAT', (a: any) => { a.timestamp = 'invalid' }],
    ['TIMESTAMP_OUT_OF_WINDOW', (a: any) => { a.timestamp = String(now - 120_000) }],
    ['SOURCE_FORMAT', (a: any) => { a.request.url = 'invalid' }],
    ['SOURCE_MISMATCH', (a: any) => { a.request.url = 'https://example.com/1.1/account/settings.json' }],
    ['TEMPLATE_FIELD_MISMATCH', (a: any) => { a.reponseResolve[0].parsePath = '$.email' }],
    ['SCREEN_NAME_FORMAT', (a: any) => { a.data = '{' }],
    ['SCREEN_NAME_MISSING', (a: any) => { a.data = '{}' }],
    ['SCREEN_NAME_MISMATCH', (a: any) => { a.data = JSON.stringify({ screen_name: 'another_user' }) }]
  ])('returns safe reason %s for a rejected attestation', async (reasonCode, mutate) => {
    const proof = await signedProof()
    mutate(proof.attestation, proof)
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 422, reasonCode })
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 409, reasonCode: 'REPLAY_DETECTED' })
  })
  it.each([
    (sessionId: string, nonce: string) => JSON.stringify({ nonce, sessionId, algorithmType: 'proxytls' }),
    (sessionId: string, nonce: string) => ` { "sessionId": "${sessionId}", "nonce": "${nonce}", "algorithmType": "proxytls" } `
  ])('accepts equivalent signed additionParams encoding', async encode => {
    const proof = await signedProof()
    proof.attestation.additionParams = encode(proof.session.sessionId, proof.session.nonce)
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).resolves.toMatchObject({ verified: true, handle: 'example_user' })
  })
  it('separates SDK signature rejection from an SDK verification error', async () => {
    const invalid = await signedProof(false)
    await expect(invalid.flow.verify(invalid.wallet.address, invalid.session.sessionId, invalid.attestation)).rejects.toMatchObject({ status: 422, reasonCode: 'SDK_SIGNATURE_INVALID' })
    const thrown = await signedProof('throw')
    await expect(thrown.flow.verify(thrown.wallet.address, thrown.session.sessionId, thrown.attestation)).rejects.toMatchObject({ status: 422, reasonCode: 'SDK_VERIFY_ERROR' })
  })
  it.each([
    ['invalid signature', false, (a: any) => {}, 'SDK_SIGNATURE_INVALID'],
    ['stale timestamp', true, (a: any) => { a.timestamp = String(now - 120_000) }, 'TIMESTAMP_OUT_OF_WINDOW'],
    ['wrong source', true, (a: any) => { a.request.url = 'https://example.com/1.1/account/settings.json' }, 'SOURCE_MISMATCH'],
    ['wrong username', true, (a: any) => { a.data = JSON.stringify({ screen_name: 'another_user' }) }, 'SCREEN_NAME_MISMATCH']
  ])('rejects %s with a signed algorithm binding', async (_label, signatureValid, mutate, reasonCode) => {
    const proof = await signedProof(signatureValid)
    proof.attestation.additionParams = JSON.stringify({ sessionId: proof.session.sessionId, nonce: proof.session.nonce, algorithmType: 'proxytls' })
    mutate(proof.attestation)
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 422, reasonCode })
    await expect(proof.flow.verify(proof.wallet.address, proof.session.sessionId, proof.attestation)).rejects.toMatchObject({ status: 409, reasonCode: 'REPLAY_DETECTED' })
  })
  it('separates unsigned, wrong-wallet, and missing-session gates', async () => {
    const { flow, wallet } = fixture()
    const session = flow.create(wallet.address, '0xMiladx0')
    await expect(flow.verify(wallet.address, session.sessionId, {})).rejects.toMatchObject({ status: 409, reasonCode: 'REQUEST_NOT_SIGNED' })
    await expect(flow.verify(ethers.Wallet.createRandom().address, session.sessionId, {})).rejects.toMatchObject({ status: 404, reasonCode: 'SESSION_WALLET_MISMATCH' })
    await expect(flow.verify(wallet.address, 'missing', {})).rejects.toMatchObject({ status: 404, reasonCode: 'SESSION_NOT_FOUND' })
  })
  it('codes expired proof sessions and missing wallet authentication without exposing values', async () => {
    let current = now
    const fake = { init: async () => true } as unknown as PrimusZKTLS
    const flow = new PrimusXFlow({ appId: 'test-app', appSecret: 'test-only' }, () => current, () => fake)
    const wallet = ethers.Wallet.createRandom()
    const session = flow.create(wallet.address, '0xMiladx0')
    expect(() => flow.wallet(undefined)).toThrow('Connect and sign in')
    try { flow.wallet(undefined) } catch (error) { expect(error).toMatchObject({ status: 401, reasonCode: 'WALLET_AUTH_REQUIRED' }) }
    current += 5 * 60_000
    await expect(flow.verify(wallet.address, session.sessionId, {})).rejects.toMatchObject({ status: 404, reasonCode: 'SESSION_EXPIRED' })
  })
  it('rejects an invalid wallet signature and consumes the challenge', async () => {
    const { flow, wallet } = fixture()
    const challenge = flow.challenge(wallet.address)
    const wrong = await ethers.Wallet.createRandom().signMessage(challenge.message)
    expect(() => flow.authenticate(challenge.challengeId, wrong)).toThrow('does not match')
    expect(() => flow.authenticate(challenge.challengeId, wrong)).toThrow('invalid or expired')
  })
})
