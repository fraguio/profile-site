import { spawn } from "node:child_process"
import { collectTgrepProcess } from "./tgrep-process.ts"
import { setTimeout as delay } from "node:timers/promises"

export interface TgrepCommand {
  executable: string
  args?: readonly string[]
  timeoutMs?: number
  cleanupTimeoutMs?: number
  statusTimeoutMs?: number
  availabilityTimeoutMs?: number
}

export type TgrepServiceLogger = (level: "info" | "warn", message: string) => void

function boundedDiagnostic(text: string): string {
  return new TextDecoder().decode(Buffer.from(text).subarray(0, 1_024), { stream: true })
}

async function checkStatus(
  worktree: string,
  command: TgrepCommand,
  abort?: AbortSignal,
): Promise<{ available: boolean, diagnostic?: string, clientFailure?: boolean }> {
  let stdout = Buffer.alloc(0)
  let stderr = Buffer.alloc(0)
  let interruption: string | undefined
  try {
    const child = spawn(command.executable, [...(command.args ?? []), "status", worktree], {
      cwd: worktree, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
    })
    child.stdin.end()
    const execution = collectTgrepProcess(child, {
      abort, timeoutMs: command.statusTimeoutMs ?? 2_000, cleanupTimeoutMs: command.cleanupTimeoutMs,
      onInterrupt: (kind) => { interruption = kind },
      onStdout: (chunk) => { stdout = Buffer.concat([stdout, chunk.subarray(0, Math.max(0, 8_192 - stdout.length))]) },
      onStderr: (chunk) => { stderr = Buffer.concat([stderr, chunk.subarray(0, Math.max(0, 2_048 - stderr.length))]) },
    })
    const result = await execution.completed
    if (result.launchError) return { available: false, diagnostic: String(result.launchError) }
    if (interruption) return { available: false, diagnostic: `Comprobación de estado tgrep: ${interruption}.` }
    return { available: result.code === 0 && stdout.toString().includes("Server status"), diagnostic: `El estado de tgrep no confirma un servidor disponible (código ${result.code}). ${stderr.toString().trim()}` }
  } catch (error) {
    return { available: false, diagnostic: String(error), clientFailure: true }
  }
}

export async function ensureTgrepService(
  worktree: string,
  command: TgrepCommand = { executable: "tgrep" },
  abort?: AbortSignal,
  log: TgrepServiceLogger = (level, message) => console[level](`[tgrep] ${message}`),
): Promise<{ available: boolean, diagnostic?: string }> {
  const fail = (cause: string) => {
    const diagnostic = boundedDiagnostic(`No se pudo asegurar el servicio tgrep: ${cause}`)
    log("warn", diagnostic)
    return { available: false, diagnostic }
  }
  if (abort?.aborted) return { available: false, diagnostic: "Comprobación del servicio tgrep cancelada." }
  let status = await checkStatus(worktree, command, abort)
  if (status.clientFailure) return fail(status.diagnostic ?? "fallo del cliente de estado")
  if (status.available) {
    log("info", "Servicio tgrep disponible; se reutiliza el servidor existente.")
    return { available: true }
  }
  if (abort?.aborted) return status
  const initialDiagnostic = status.diagnostic
  // El plazo de disponibilidad no espera a que termine el indexado del corpus.
  const deadline = Date.now() + (command.availabilityTimeoutMs ?? 5_000)
  log("info", "Intento de lanzamiento del servicio tgrep.")
  let launchDiagnostic: string | undefined
  let daemon
  try {
    daemon = spawn(command.executable, [...(command.args ?? []), "serve", worktree], {
      cwd: worktree, shell: false, windowsHide: true, detached: true, stdio: "ignore",
    })
  } catch (error) {
    return fail(`No se pudo lanzar el servicio: ${String(error)}`)
  }
  const onError = (error: Error) => { launchDiagnostic = String(error) }
  const onExit = (code: number | null) => { launchDiagnostic = `El lanzamiento de tgrep terminó con código ${code}.` }
  daemon.on("error", onError).once("exit", onExit)
  daemon.unref()
  try {
    while (Date.now() < deadline && !abort?.aborted) {
      status = await checkStatus(worktree, {
        ...command, statusTimeoutMs: Math.min(command.statusTimeoutMs ?? 2_000, Math.max(1, deadline - Date.now())),
      }, abort)
      if (status.clientFailure) return fail(status.diagnostic ?? "fallo del cliente de estado")
      if (status.available) {
        log("info", "Servicio tgrep disponible después del intento de lanzamiento.")
        return { available: true }
      }
      if (Date.now() < deadline && !abort?.aborted) {
        await delay(Math.min(100, deadline - Date.now()), undefined, { signal: abort }).catch(() => {})
      }
    }
    if (abort?.aborted) return fail("cancelado")
    const cause = launchDiagnostic ?? status.diagnostic ?? "sin respuesta"
    const initial = status.diagnostic !== initialDiagnostic ? ` Estado inicial: ${initialDiagnostic}` : ""
    return fail(`plazo de disponibilidad agotado; ${cause}${initial}`)
  } finally {
    daemon.removeListener("exit", onExit)
    // El listener de error no retiene el event loop y evita errores pendientes del lanzamiento.
  }
}
