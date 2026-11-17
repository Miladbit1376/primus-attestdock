import { resolve } from 'node:path'
import { createAttestDockServer } from './app.ts'

if (process.env.ATTESTDOCK_DEV_MODE !== '1' || process.env.NODE_ENV === 'production') {
  throw new Error('AttestDock platform API is disabled. Set ATTESTDOCK_DEV_MODE=1 only for local development.')
}
const port = Number(process.env.ATTESTDOCK_PORT ?? '4174')
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid ATTESTDOCK_PORT.')
const server = createAttestDockServer({ development: true, distDirectory: resolve('dist') })
server.listen(port, '127.0.0.1', () => {
  process.stdout.write('AttestDock local development server: http://127.0.0.1:' + port + '/\n')
})
