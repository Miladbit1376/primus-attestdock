import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ScanReport } from './scanner'

afterEach(() => vi.unstubAllGlobals())

describe('browser worker message path', () => {
  it('returns a scan report without a network call', async () => {
    const postMessage = vi.fn<(report: ScanReport) => void>()
    const workerScope = { onmessage: null as null | ((event: MessageEvent) => void), postMessage }
    const fetch = vi.fn()
    vi.stubGlobal('self', workerScope)
    vi.stubGlobal('fetch', fetch)
    await import('./scanner.worker')
    expect(workerScope.onmessage).toBeTypeOf('function')
    workerScope.onmessage!({ data: { code: "const appSecret = 'DEMO_ONLY';", environment: 'frontend', fileName: 'app.ts' } } as MessageEvent)
    expect(postMessage).toHaveBeenCalledOnce()
    expect(postMessage.mock.calls[0][0].findings[0].id).toBe('ATTESTDOCK-001')
    expect(fetch).not.toHaveBeenCalled()
  })
})
