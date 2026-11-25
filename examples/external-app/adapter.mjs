import { createAccessDecision } from './policy.mjs'

export const target = {
  name: 'Example account gate',
  recipient: '0x1111111111111111111111111111111111111111',
  sourceUrl: 'https://api.example.test/account',
  field: 'account_id',
  value: 'example_user',
  maxAgeMs: 60_000
}

export function createAdapter(context) {
  return { decide: createAccessDecision(context) }
}
