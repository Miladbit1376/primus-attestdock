export type ErrorInfo = { meaning: string; nextStep: string; certainty: 'documented' | 'unknown' }

const known: Record<string, ErrorInfo> = {
  '00005': { meaning: 'Invalid SDK parameters.', nextStep: 'Check the SDK method and request fields against the selected SDK version.', certainty: 'documented' },
  '00006': { meaning: 'Primus extension not detected.', nextStep: 'Install or enable the extension, then retry from a supported browser.', certainty: 'documented' },
  '00012': { meaning: 'Invalid template ID.', nextStep: 'Check the template ID and its project configuration.', certainty: 'documented' },
  '00013': { meaning: 'No verifiable data detected.', nextStep: 'Check the data source login and the selected account.', certainty: 'documented' },
  '00104': { meaning: 'Verification requirements not met.', nextStep: 'This code alone does not identify which requirement failed. Record the condition, template ID, SDK version and any subcode. Ask Primus to confirm the template behavior.', certainty: 'documented' }
}

export function explainPrimusError(input: string): ErrorInfo {
  return known[input.trim()] ?? {
    meaning: 'This code is not in AttestDock\'s short reference list.',
    nextStep: 'Check the current Primus error-code documentation. If you contact Primus, include the error code and subcode, if present.',
    certainty: 'unknown'
  }
}

export function supportSummary(input: { code: string; subcode: string; sdkVersion: string; stage: string }): string {
  const clean = (value: string) => value.replace(/[\r\n\t]/g, ' ').trim().slice(0, 80) || 'not recorded'
  const info = explainPrimusError(input.code)
  return [
    'Primus verification issue',
    `Error code: ${clean(input.code)}`,
    `Subcode: ${clean(input.subcode)}`,
    `SDK version: ${clean(input.sdkVersion)}`,
    `Stage: ${clean(input.stage)}`,
    `Documented meaning: ${info.meaning}`,
    'Review this summary before sharing. Do not add secrets, wallet addresses or raw attestation data.'
  ].join('\n')
}
