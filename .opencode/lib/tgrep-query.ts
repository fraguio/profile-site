import { spawn } from "node:child_process"

interface TgrepArgs {
  pattern: string
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

export async function queryTgrep(
  args: TgrepArgs,
  context: QueryContext,
  command: QueryCommand = { executable: "tgrep" },
): Promise<string> {
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(
        command.executable,
        [...(command.args ?? []), "-n", "--", args.pattern, context.worktree],
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
