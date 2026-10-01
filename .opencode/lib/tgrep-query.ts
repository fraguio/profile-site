import { spawn } from "node:child_process"
import { realpath, stat } from "node:fs/promises"
import { isAbsolute, relative, resolve as resolvePath, sep } from "node:path"
import { ensureTgrepService, type TgrepCommand, type TgrepServiceLogger } from "./tgrep-service.ts"
import { collectTgrepProcess } from "./tgrep-process.ts"

interface TgrepArgs {
  pattern: string
  output_mode?: "content" | "files"
  path?: string
  literal?: boolean
  ignore_case?: boolean
  glob?: string[]
  file_types?: string[]
  hidden?: boolean
  freshness?: "indexed" | "current"
  context_lines?: number
  max_results?: number
}

interface QueryContext {
  worktree: string
  abort?: AbortSignal
  log?: TgrepServiceLogger
}

type QueryCommand = TgrepCommand

interface QueryResult {
  output: string
  metadata: {
    output_mode: "content" | "files"
    search_mode: "indexed_or_scan" | "current_scan"
    truncated: boolean
    record_count: number
    truncation_reason?: string
  }
}

interface SearchRecord {
  path: string
  line: number
  text: string
  kind: "match" | "context"
}

type QueryInterruption =
  | { kind: "cancelled" }
  | { kind: "timeout" }
  | { kind: "truncated", reason: string }

// Reserva separada para cabecera/avisos y stderr dentro de los 48 000 bytes del output.
const RECORD_BYTES = 38_000
const STDERR_BYTES = 8_192
const EVENT_BYTES = 256_000
// En files, pending comparte 256 000 bytes con el límite de eventos. El Set retiene
// como máximo 1000 rutas y 38 000 bytes de representación, sin guardar duplicados.
// Acotar tanto los bytes de rutas como el overhead del Set del protocolo.
const ACTIVE_FILES = 1000

function stderrText(buffer: Buffer): string {
  const decoded = new TextDecoder().decode(buffer, { stream: true })
  return new TextDecoder().decode(Buffer.from(decoded).subarray(0, STDERR_BYTES), { stream: true }).trim()
}

function renderRecord(record: SearchRecord): string {
  return `[${record.kind === "match" ? "coincidencia" : "contexto"}] ${record.path}:${record.line}:${record.text}${record.text.endsWith("\n") ? "" : "\n"}`
}

function renderFile(path: string): string {
  return JSON.stringify(path).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + "\n"
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function escapesWorktree(path: string): boolean {
  return path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path)
}

function normalizeResultPath(root: string, path: string): string {
  const destination = relative(root, resolvePath(root, path))
  if (!path || path.includes("\0") || !destination || escapesWorktree(destination)) {
    throw new Error("Ruta vacía o fuera del worktree.")
  }
  return destination.split(sep).join("/")
}

function launchFailure(error: unknown, executable: string): Error {
  const cause = error as NodeJS.ErrnoException
  return new Error(`No se pudo lanzar tgrep (${cause.code}): ${executable}\n${cause.message}`, { cause: error })
}

function validateString(name: string, value: unknown): void {
  if (typeof value !== "string") throw new Error(`${name}: tipo inválido; se requiere un string.`)
  if (value.includes("\0")) throw new Error(`${name}: no se permiten strings con NUL.`)
}

function validateArgs(args: TgrepArgs): void {
  validateString("pattern", args.pattern)
  if (args.output_mode !== undefined && args.output_mode !== "content" && args.output_mode !== "files") {
    throw new Error('output_mode: valor inválido; se requiere "content" o "files".')
  }
  if (args.max_results !== undefined && (!Number.isInteger(args.max_results) || args.max_results < 1 || args.max_results > 1000)) {
    throw new Error("max_results: tipo o rango inválido; se requiere un integer de 1–1000.")
  }
  if (args.freshness !== undefined && args.freshness !== "indexed" && args.freshness !== "current") {
    throw new Error('freshness: valor inválido; se requiere "indexed" o "current".')
  }
  if (args.context_lines !== undefined && (!Number.isInteger(args.context_lines) || args.context_lines < 0 || args.context_lines > 10)) {
    throw new Error("context_lines: tipo o rango inválido; se requiere un integer de 0–10.")
  }
  if (args.path !== undefined) validateString("path", args.path)
  for (const name of ["literal", "ignore_case", "hidden"] as const) {
    if (args[name] !== undefined && typeof args[name] !== "boolean") {
      throw new Error(`${name}: tipo inválido; se requiere un boolean.`)
    }
  }
  for (const name of ["glob", "file_types"] as const) {
    const values = args[name]
    if (values === undefined) continue
    if (!Array.isArray(values)) throw new Error(`${name}: tipo inválido; se requiere un array de strings.`)
    for (const value of values) validateString(name, value)
  }
}

async function resolveScope(worktree: string, path: string): Promise<{ root: string, scope: string }> {
  let root: string
  let scope: string
  try {
    root = await realpath(worktree)
    scope = await realpath(resolvePath(worktree, path))
    const info = await stat(scope)
    if (!info.isFile() && !info.isDirectory()) throw new Error("El destino no es un archivo ni un directorio.")
  } catch (error) {
    throw new Error(`Ámbito inexistente o inaccesible: ${path}`, { cause: error })
  }
  const destination = relative(root, scope)
  if (escapesWorktree(destination)) {
    throw new Error(`El ámbito está fuera del worktree: ${path}`)
  }
  return { root, scope }
}

export async function queryTgrep(
  args: TgrepArgs,
  context: QueryContext,
  command: QueryCommand = { executable: "tgrep" },
): Promise<QueryResult> {
  if (context.abort?.aborted) throw new Error("Consulta tgrep cancelada antes del lanzamiento.")
  validateArgs(args)
  const { root, scope } = await resolveScope(context.worktree, args.path ?? ".")
  if (context.abort?.aborted) throw new Error("Consulta tgrep cancelada antes del lanzamiento.")
  const service = args.freshness === "current" ? undefined : await ensureTgrepService(root, command, context.abort, context.log)
  if (context.abort?.aborted) throw new Error("Consulta tgrep cancelada antes del lanzamiento.")
  const currentScan = args.freshness === "current" || service?.available === false
  const outputMode = args.output_mode ?? "content"
  const options = outputMode === "files"
    ? ["--files-with-matches", "--null", "--color=never", "--no-heading"]
    : ["--json", "-n", "-H", "--context", String(args.context_lines ?? 0)]
  if (currentScan) options.push("--no-index")
  if (args.literal) options.push("--fixed-strings")
  if (args.ignore_case) options.push("--ignore-case")
  for (const glob of args.glob ?? []) options.push(`--glob=${glob}`)
  for (const type of args.file_types ?? []) options.push(`--type=${type}`)
  if (args.hidden) options.push("--hidden")
  const serviceWarning = service?.diagnostic ? `\nDiagnóstico del servicio tgrep: ${service.diagnostic}` : ""
  return new Promise((resolve, reject) => {
    const rejectProcess = (error: unknown) => {
      reject(serviceWarning ? new Error(`${error instanceof Error ? error.message : String(error)}${serviceWarning}`, { cause: error }) : error)
    }
    let child
    try {
      child = spawn(
        command.executable,
        [...(command.args ?? []), ...options, "--", args.pattern, scope],
        { cwd: context.worktree, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
      )
    } catch (error) {
      rejectProcess(launchFailure(error, command.executable))
      return
    }
    child.stdin.end()
    let pending = ""
    const records: SearchRecord[] = []
    const files = new Set<string>()
    let recordBytes = 0
    let protocolError: unknown
    let summarySeen = false
    let matchCount = 0
    const activeFiles = new Set<string>()
    let activePathBytes = 0
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: outputMode === "files" })
    let stderrBuffer = Buffer.alloc(0)
    let interruption: QueryInterruption | undefined
    const interrupt = (cause: QueryInterruption) => {
      if (interruption) return
      interruption = cause
      execution.stop()
    }
    const truncate = (reason: string) => {
      interrupt({ kind: "truncated", reason })
    }
    const admitRecord = (count: number, row: string): boolean => {
      if (count === (args.max_results ?? 100)) {
        truncate("max_results")
        return false
      }
      const bytes = Buffer.byteLength(row)
      if (recordBytes + bytes > RECORD_BYTES) {
        truncate("output_bytes")
        return false
      }
      recordBytes += bytes
      return true
    }
    const consume = (line: string) => {
      if (protocolError || interruption) return
      try {
        if (outputMode === "files") {
          const path = normalizeResultPath(root, line)
          if (files.has(path)) return
          if (!admitRecord(files.size, renderFile(path))) return
          files.add(path)
          return
        }
        const event: unknown = JSON.parse(line)
        if (!isObject(event) || !isObject(event.data)) throw new Error("Evento JSON inválido.")
        if (summarySeen) throw new Error("Se recibieron eventos después de summary.")
        if (event.type === "summary") {
          if (activeFiles.size) throw new Error("Falta end antes de summary.")
          summarySeen = true
          return
        }
        if (typeof event.type !== "string" || !["begin", "match", "context", "end"].includes(event.type)) {
          throw new Error("Clase de evento desconocida o inválida.")
        }
        const data = event.data
        if (!isObject(data.path) || typeof data.path.text !== "string" || !data.path.text || data.path.text.includes("\0")) {
          throw new Error("Ruta inválida en el evento.")
        }
        const path = normalizeResultPath(root, data.path.text)
        if (event.type === "begin") {
          if (activeFiles.has(path)) throw new Error("Evento begin duplicado.")
          const bytes = Buffer.byteLength(path)
          if (activeFiles.size === ACTIVE_FILES || activePathBytes + bytes > EVENT_BYTES) {
            truncate("protocol_state_bytes")
            return
          }
          activeFiles.add(path)
          activePathBytes += bytes
          return
        }
        if (!activeFiles.has(path)) throw new Error("Evento sin begin correspondiente.")
        if (event.type === "end") {
          activeFiles.delete(path)
          activePathBytes -= Buffer.byteLength(path)
          return
        }
        if (event.type === "match" || event.type === "context") {
          if (typeof data.line_number !== "number" || !Number.isSafeInteger(data.line_number) || data.line_number < 1 ||
              !isObject(data.lines) || typeof data.lines.text !== "string" || !data.lines.text) {
            throw new Error("Número de línea o texto inválido en el evento.")
          }
          const lines = data.lines.text.match(/[^\n]*\n|[^\n]+$/g) ?? []
          for (const [offset, text] of lines.entries()) {
            const record: SearchRecord = { path, line: data.line_number + offset, text, kind: event.type }
            if (!admitRecord(records.length, renderRecord(record))) return
            records.push(record)
          }
          if (event.type === "match") matchCount++
        }
      } catch (error) {
        protocolError = error
      }
    }
    const read = (text: string) => {
      let offset = 0
      while (offset < text.length && !interruption && !protocolError) {
        const boundary = text.indexOf(outputMode === "files" ? "\0" : "\n", offset)
        const end = boundary === -1 ? text.length : boundary
        const fragment = text.slice(offset, end)
        if (Buffer.byteLength(pending) + Buffer.byteLength(fragment) > EVENT_BYTES) {
          pending = ""
          truncate(outputMode === "files" ? "path_bytes" : "event_bytes")
          return
        }
        pending += fragment
        if (boundary === -1) return
        consume(pending)
        pending = ""
        offset = boundary + 1
      }
    }
    const onStdout = (chunk: Buffer) => {
      if (protocolError || interruption) return
      try {
        read(decoder.decode(chunk, { stream: true }))
      } catch (error) {
        protocolError = error
      }
    }
    const onStderr = (chunk: Buffer) => {
      const remaining = STDERR_BYTES - stderrBuffer.length
      stderrBuffer = Buffer.concat([stderrBuffer, chunk.subarray(0, remaining)])
      if (chunk.length > remaining || Buffer.byteLength(new TextDecoder().decode(stderrBuffer, { stream: true })) > STDERR_BYTES) {
        truncate("stderr_bytes")
      }
    }
    const onClose = ({ code, signal, launchError }: Awaited<typeof execution.completed>) => {
      if (launchError) {
        rejectProcess(launchFailure(launchError, command.executable))
        return
      }
      // No finalizar el decoder evita introducir un carácter de reemplazo si el presupuesto corta UTF-8.
      const stderr = stderrText(stderrBuffer)
      const warning = serviceWarning + (stderr.trim() ? `\nAdvertencias de tgrep:\n${stderr.trim()}` : "")
      if (interruption && interruption.kind !== "truncated") {
        reject(new Error(protocolError ? `Error de protocolo de tgrep: ${String(protocolError)}${warning}` : `${interruption.kind === "timeout" ? "Timeout de consulta tgrep" : "Consulta tgrep cancelada"}; cliente recogido sin detener el daemon compartido, que puede seguir procesando la consulta.${warning}`))
        return
      }
      if (code !== 0 && code !== 1 && !(interruption?.kind === "truncated" && signal === "SIGTERM")) {
        reject(new Error(`tgrep terminó con código ${code}.${warning}`))
        return
      }
      if (!protocolError && !interruption) {
        try {
          read(decoder.decode())
          if (pending) {
            if (outputMode === "files") throw new Error("Ruta residual sin NUL.")
            consume(pending)
          }
          if (!interruption) {
            if (outputMode === "content" && !summarySeen) throw new Error("Stream incompleto: falta summary.")
            if ((code === 0 && (outputMode === "files" ? files.size : matchCount) === 0) || (code === 1 && (outputMode === "files" ? files.size : records.length) > 0)) {
              throw new Error("El código de salida contradice los registros recibidos.")
            }
          }
        } catch (error) {
          protocolError ??= error
        }
      }
      if (protocolError) {
        reject(new Error(`Error de protocolo de tgrep: ${String(protocolError)}${warning}`))
        return
      }
      const truncationReason = interruption?.kind === "truncated" ? interruption.reason : undefined
      const recordCount = outputMode === "files" ? files.size : records.length
      const metadata: QueryResult["metadata"] = { output_mode: outputMode, search_mode: currentScan ? "current_scan" : "indexed_or_scan", truncated: !!truncationReason, record_count: recordCount }
      if (truncationReason) metadata.truncation_reason = truncationReason
      const lines = outputMode === "files" ? [...files].map(renderFile).join("") : records.map(renderRecord).join("")
      resolve({ output: `Modo de resultados: ${outputMode}\nModo de búsqueda: ${metadata.search_mode}\nTruncado: ${truncationReason ? `sí (${truncationReason}); estrecha la consulta. El cliente se interrumpe sin detener el daemon compartido; este puede seguir procesando la consulta` : "no"}. Registros devueltos: ${recordCount}.\n${code === 1 && !truncationReason ? "No se encontraron coincidencias." : lines}${warning}`, metadata })
    }
    // Los 30 s cuentan desde spawn; el cierre tiene un presupuesto separado de 5 s.
    const execution = collectTgrepProcess(child, {
      abort: context.abort, timeoutMs: command.timeoutMs ?? 30_000, cleanupTimeoutMs: command.cleanupTimeoutMs,
      onStdout, onStderr, onInterrupt: (kind) => { interruption ??= { kind } },
    })
    execution.completed.then(onClose, rejectProcess)
  })
}
