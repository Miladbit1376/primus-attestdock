import { scanCode, type Environment, type ScanReport } from './scanner'

export type ScanRequest = { code: string; environment: Environment; fileName: string }

self.onmessage = (event: MessageEvent<ScanRequest>) => {
  const { code, environment, fileName } = event.data
  const report: ScanReport = scanCode(code, environment, fileName)
  self.postMessage(report)
}
