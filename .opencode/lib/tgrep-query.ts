import { spawn } from "node:child_process"
import { realpath, stat } from "node:fs/promises"
import { isAbsolute, relative, resolve as resolvePath, sep } from "node:path"

interface TgrepArgs {
  pattern: string
  path?: string
  literal?: boolean
  ignore_case?: boolean
  glob?: string[]
  file_types?: string[]
  hidden?: boolean
}

interface QueryContext {
  worktree: string
}

interface QueryCommand {
  executable: string
  args?: readonly string[]
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

async function resolveScope(worktree: string, path: string): Promise<string> {
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
  if (destination === ".." || destination.startsWith(`..${sep}`) || isAbsolute(destination)) {
    throw new Error(`El ámbito está fuera del worktree: ${path}`)
  }
  return scope
}

export async function queryTgrep(
  args: TgrepArgs,
  context: QueryContext,
  command: QueryCommand = { executable: "tgrep" },
): Promise<string> {
  validateArgs(args)
  const scope = await resolveScope(context.worktree, args.path ?? ".")
  const options = ["-n", "-H"]
  if (args.literal) options.push("--fixed-strings")
  if (args.ignore_case) options.push("--ignore-case")
  for (const glob of args.glob ?? []) options.push(`--glob=${glob}`)
  for (const type of args.file_types ?? []) options.push(`--type=${type}`)
  if (args.hidden) options.push("--hidden")
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(
        command.executable,
        [...(command.args ?? []), ...options, "--", args.pattern, scope],
        { cwd: context.worktree, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
      )
    } catch (error) {
      reject(launchFailure(error, command.executable))
      return
    }
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => { stdout += chunk })
    child.stderr.on("data", (chunk: string) => { stderr += chunk })
    let launchError: NodeJS.ErrnoException | undefined
    child.on("error", (error) => { launchError = error })
    child.on("close", (code) => {
      if (launchError) {
        reject(launchFailure(launchError, command.executable))
        return
      }
      const warning = stderr.trim() ? `\nAdvertencias de tgrep:\n${stderr.trim()}` : ""
      if (code === 0) resolve(stdout + warning)
      else if (code === 1) resolve("No se encontraron coincidencias." + warning)
      else reject(new Error(`tgrep terminó con código ${code}.${stderr.trim() ? `\n${stderr.trim()}` : ""}`))
    })
  })
}
