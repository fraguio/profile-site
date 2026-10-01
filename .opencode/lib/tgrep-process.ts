import type { ChildProcessWithoutNullStreams } from "node:child_process"

export interface ProcessLimits {
  abort?: AbortSignal
  timeoutMs: number
  cleanupTimeoutMs?: number
  onInterrupt: (kind: "timeout" | "cancelled") => void
  onStdout: (chunk: Buffer) => void
  onStderr: (chunk: Buffer) => void
}

// Recoger exclusivamente el cliente, nunca el árbol de procesos ni el daemon compartido.
export function collectTgrepProcess(child: ChildProcessWithoutNullStreams, limits: ProcessLimits) {
  let stop: () => void
  const completed = new Promise<{ code: number | null, signal: NodeJS.Signals | null, launchError?: NodeJS.ErrnoException }>((resolve, reject) => {
    let settled = false
    let terminationRequested = false
    let terminationRejected = false
    let failure: Error | undefined
    let launchError: NodeJS.ErrnoException | undefined
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined
    const timer = setTimeout(() => {
      if (settled || child.exitCode !== null || child.signalCode !== null) return
      limits.onInterrupt("timeout")
      stop()
    }, limits.timeoutMs)
    const release = () => {
      clearTimeout(timer)
      clearTimeout(cleanupTimer)
      limits.abort?.removeEventListener("abort", onAbort)
      child.stdout.removeListener("data", limits.onStdout)
      child.stderr.removeListener("data", limits.onStderr)
      child.stdout.removeListener("error", onStreamError)
      child.stderr.removeListener("error", onStreamError)
      child.removeListener("exit", onExit)
      child.removeListener("close", onClose)
      child.removeListener("error", onError)
    }
    const awaitClose = () => {
      if (cleanupTimer || settled) return
      cleanupTimer = setTimeout(() => {
        if (settled) return
        settled = true
        release()
        child.stdout.destroy()
        child.stderr.destroy()
        child.unref()
        reject(new Error("El cliente tgrep no cerró durante el cleanup."))
      }, limits.cleanupTimeoutMs ?? 5_000)
    }
    stop = () => {
      clearTimeout(timer)
      if (!terminationRequested && child.exitCode === null && child.signalCode === null) {
        terminationRequested = true
        if (!child.kill()) terminationRejected = true
      }
      awaitClose()
    }
    const onAbort = () => {
      if (settled || child.exitCode !== null || child.signalCode !== null) return
      limits.onInterrupt("cancelled")
      stop()
    }
    const onExit = () => {
      clearTimeout(timer)
      limits.abort?.removeEventListener("abort", onAbort)
      awaitClose()
    }
    const onError = (error: NodeJS.ErrnoException) => {
      if (child.pid === undefined) launchError = error
      else failure = new Error(`Falló la terminación del cliente tgrep: ${error.message}`, { cause: error })
      awaitClose()
    }
    const onStreamError = (error: Error) => {
      failure = new Error(`Error de lectura del cliente tgrep: ${error.message}`, { cause: error })
      stop()
    }
    const onClose = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return
      settled = true
      release()
      // kill puede perder la carrera con una salida natural antes de recibir exit.
      if (failure) reject(failure)
      else if (terminationRejected && code === null) reject(new Error("No se pudo terminar el cliente tgrep durante el cleanup."))
      else resolve({ code, signal, launchError })
    }
    child.stdout.on("data", limits.onStdout).on("error", onStreamError)
    child.stderr.on("data", limits.onStderr).on("error", onStreamError)
    child.on("error", onError).once("exit", onExit).once("close", onClose)
    limits.abort?.addEventListener("abort", onAbort, { once: true })
    if (limits.abort?.aborted) onAbort()
  })
  return { completed, stop: () => stop() }
}
