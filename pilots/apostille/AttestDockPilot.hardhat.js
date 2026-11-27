const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time, loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { writeFileSync } = require('node:fs')
const TIERS = require('../config/tiers')
const SOURCES = require('../config/sources').map(({ templateId, ...source }) => source)

const SOURCE_URL = 'https://www.binance.com/bapi/accounts/v1/private/vip/vip-portal/vip-fee/vip-fee-summary'
const FIELDS = [
  { keyName: 'userId', parseType: '', parsePath: '$.data.userId' },
  { keyName: 'vipLevel', parseType: '', parsePath: '$.data.vipLevel' },
  { keyName: 'spot30dVol', parseType: '', parsePath: '$.data.spot30dVol' },
  { keyName: 'futures30dVol', parseType: '', parsePath: '$.data.futures30dVol' }
]
const checks = []

async function deploy() {
  const [owner, alice, other] = await ethers.getSigners()
  const primus = await ethers.deployContract('MockPrimusZKTLS')
  const apostille = await ethers.deployContract('Apostille', [
    owner.address, await primus.getAddress(), 15 * 60, 30 * 24 * 60 * 60, TIERS, SOURCES
  ])
  return { apostille, primus, alice, other }
}

async function attestation(recipient, changes = {}) {
  const now = BigInt(await time.latest())
  return {
    recipient,
    request: { url: changes.url ?? SOURCE_URL, header: changes.header ?? '', method: changes.method ?? 'GET', body: changes.body ?? '' },
    reponseResolve: changes.fields ?? FIELDS,
    data: JSON.stringify({
      'SHA256($.data.userId)': 'a'.repeat(64), vipLevel: '2', spot30dVol: '100.00', futures30dVol: '12500000.00'
    }),
    attConditions: JSON.stringify([
      { op: 'SHA256', field: '$.data.userId', reveal_id: 'userId' },
      { op: 'REVEAL_STRING', field: '$.data.vipLevel', reveal_id: 'vipLevel' },
      { op: 'REVEAL_STRING', field: '$.data.spot30dVol', reveal_id: 'spot30dVol' },
      { op: 'REVEAL_STRING', field: '$.data.futures30dVol', reveal_id: 'futures30dVol' }
    ]),
    timestamp: changes.timestampMs ?? now * 1000n,
    additionParams: '',
    attestors: [{ attestorAddr: ethers.ZeroAddress, url: 'https://primuslabs.xyz' }],
    signatures: ['0x' + '11'.repeat(65)]
  }
}

async function observedSeal(contract, signer, proof) {
  try {
    await (await contract.connect(signer).seal(proof)).wait()
    return 'allow'
  } catch {
    return 'deny'
  }
}

function record(id, expected, observed, note) {
  checks.push({ id, expected, observed, status: expected === observed ? 'pass' : 'review', note })
}

describe('AttestDock read-only Apostille policy pilot', function () {
  after(function () {
    const report = {
      schemaVersion: 1,
      mode: 'external-solidity-policy-pilot',
      project: 'moltaphet/apostille',
      upstreamCommit: '03c98c48290fb8b82be43bd43de7af11ede6d5b3',
      evidenceRun: process.env.GITHUB_RUN_ID ? `https://github.com/Miladbit1376/primus-attestdock/actions/runs/${process.env.GITHUB_RUN_ID}` : '',
      policyAssumption: 'The documented Binance source uses GET with an empty request body.',
      method: 'Hardhat local EVM with the upstream Apostille contract and MockPrimusZKTLS',
      checks,
      limits: [
        'A mock verifier isolates contract policy. No genuine Primus signature was generated.',
        'An accepted changed request does not prove that Binance returns a usable response for that request.',
        'This is a read-only pilot. It does not change the upstream contract.'
      ]
    }
    const serialized = JSON.stringify(report, null, 2)
    writeFileSync(process.env.ATTESTDOCK_PILOT_REPORT || 'attestdock-apostille-report.json', serialized + '\n')
    process.stdout.write(`ATTESTDOCK_PILOT_REPORT=${JSON.stringify(report)}\n`)
  })

  it('accepts a matching GET proof', async function () {
    const { apostille, alice } = await loadFixture(deploy)
    const observed = await observedSeal(apostille, alice, await attestation(alice.address))
    record('matching-get', 'allow', observed, 'Baseline contract decision.')
    expect(observed).to.equal('allow')
  })

  it('rejects a proof for another wallet', async function () {
    const { apostille, alice, other } = await loadFixture(deploy)
    const observed = await observedSeal(apostille, other, await attestation(alice.address))
    record('wrong-recipient', 'deny', observed, 'The caller differs from the attestation recipient.')
    expect(observed).to.equal('deny')
  })

  it('rejects a different endpoint', async function () {
    const { apostille, alice } = await loadFixture(deploy)
    const observed = await observedSeal(apostille, alice, await attestation(alice.address, { url: 'https://example.test/other' }))
    record('wrong-source', 'deny', observed, 'The URL differs from the registered source.')
    expect(observed).to.equal('deny')
  })

  it('rejects a failed verifier result', async function () {
    const { apostille, primus, alice } = await loadFixture(deploy)
    await primus.setReject(true)
    const observed = await observedSeal(apostille, alice, await attestation(alice.address))
    record('invalid-signature-result', 'deny', observed, 'The mock verifier rejects the attestation.')
    expect(observed).to.equal('deny')
  })

  it('rejects a stale proof', async function () {
    const { apostille, alice } = await loadFixture(deploy)
    const proof = await attestation(alice.address)
    await time.increase(15 * 60 + 2)
    const observed = await observedSeal(apostille, alice, proof)
    record('stale-proof', 'deny', observed, 'The proof age exceeds the configured limit.')
    expect(observed).to.equal('deny')
  })

  it('rejects a second use of the same proof', async function () {
    const { apostille, alice } = await loadFixture(deploy)
    const proof = await attestation(alice.address)
    const first = await observedSeal(apostille, alice, proof)
    const second = await observedSeal(apostille, alice, proof)
    const observed = first === 'allow' ? second : 'baseline-failed'
    record('replayed-proof', 'deny', observed, 'The same attestation is submitted twice.')
    expect(first).to.equal('allow')
    expect(second).to.equal('deny')
  })

  it('records whether a POST request is accepted', async function () {
    const { apostille, alice } = await loadFixture(deploy)
    const observed = await observedSeal(apostille, alice, await attestation(alice.address, { method: 'POST' }))
    record('different-method', 'deny', observed, 'The README describes a GET source. The contract should pin the method if GET is a policy requirement.')
    expect(observed).to.equal('allow')
  })

  it('records whether a nonempty request body is accepted', async function () {
    const { apostille, alice } = await loadFixture(deploy)
    const observed = await observedSeal(apostille, alice, await attestation(alice.address, { body: '{"account":"other"}' }))
    record('different-body', 'deny', observed, 'The README describes a GET source. A changed body may alter a server response if supported by that endpoint.')
    expect(observed).to.equal('allow')
  })
})
