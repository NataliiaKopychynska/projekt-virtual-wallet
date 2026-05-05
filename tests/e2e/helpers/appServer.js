import 'dotenv/config'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

export const APP_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

let viteProcess = null
let viteOutput = ''
let viteExitCode = null
let viteExited = false

const canReachApp = async () => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1000)

  try {
    const response = await fetch(APP_BASE_URL, { signal: controller.signal })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

const waitForApp = async () => {
  const startedAt = Date.now()
  const timeoutMs = Number(process.env.E2E_APP_START_TIMEOUT_MS || 30000)

  while (Date.now() - startedAt < timeoutMs) {
    if (viteExitCode !== null) {
      throw new Error(
        `Frontend process exited with code ${viteExitCode} before ${APP_BASE_URL} became available.\n${viteOutput}`,
      )
    }

    if (await canReachApp()) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Frontend did not become available at ${APP_BASE_URL}.\n${viteOutput}`)
}

export const ensureAppRunning = async () => {
  if (await canReachApp()) return

  viteOutput = ''
  viteExitCode = null
  viteExited = false

  const viteBin = resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
  viteProcess = spawn(process.execPath, [viteBin, '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    detached: process.platform !== 'win32',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const collectOutput = (data) => {
    viteOutput = `${viteOutput}${data.toString()}`.slice(-4000)
  }

  viteProcess.stdout.on('data', collectOutput)
  viteProcess.stderr.on('data', collectOutput)
  viteProcess.once('exit', (code) => {
    viteExitCode = code
    viteExited = true
  })

  try {
    await waitForApp()
  } catch (error) {
    await stopManagedApp()
    throw error
  }
}

export const stopManagedApp = async () => {
  if (!viteProcess) return

  const processToStop = viteProcess
  const killTarget = process.platform === 'win32' ? processToStop.pid : -processToStop.pid
  viteProcess = null

  await new Promise((resolve) => {
    const cleanupTimeout = setTimeout(() => {
      if (!viteExited) {
        try {
          process.kill(killTarget, 'SIGKILL')
        } catch {
          // The process may already be gone.
        }
      }
      resolve()
    }, 2500)

    processToStop.once('exit', () => {
      clearTimeout(cleanupTimeout)
      resolve()
    })

    try {
      process.kill(killTarget, 'SIGTERM')
    } catch {
      resolve()
    }
    setTimeout(() => {
      processToStop.stdout?.destroy()
      processToStop.stderr?.destroy()
    }, 0)
  })
}
