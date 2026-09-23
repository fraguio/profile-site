import type { Plugin } from "@opencode-ai/plugin"

export const TgrepServerPlugin: Plugin = async ({ $, worktree, client }) => {
  try {
    const status = await $`tgrep status ${worktree}`.quiet().nothrow()

    if (status.exitCode === 0 && status.text().includes("Server status")) {
      return {}
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

  return {}
}
