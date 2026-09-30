import type { Hooks, Plugin } from "@opencode-ai/plugin"

export const TgrepServerPlugin: Plugin = async ({ $, worktree, client }) => {
  const hooks: Hooks = {
    "tool.execute.after": async (input, output) => {
      // OpenCode sustituye truncated por su propio recorte; conservar también los límites de la consulta.
      if (input.tool === "tgrep" && output.metadata?.truncation_reason) {
        output.metadata.truncated = true
      }
    },
  }
  try {
    const status = await $`tgrep status ${worktree}`.quiet().nothrow()

    if (status.exitCode === 0 && status.text().includes("Server status")) {
      return hooks
    }

    await $`powershell.exe -NoProfile -Command ${`
      Start-Process -FilePath 'tgrep.exe' -ArgumentList @('serve', '.') -WorkingDirectory '${worktree.replace(/'/g, "''")}' -WindowStyle Hidden
    `}`

    await client.app.log({
      body: {
        service: "tgrep",
        level: "info",
        message: "Started tgrep server",
      },
    })
  } catch (error) {
    await client.app.log({
      body: {
        service: "tgrep",
        level: "warn",
        message: `Could not start tgrep server: ${String(error)}`,
      },
    })
  }

  return hooks
}
