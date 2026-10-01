import type { Hooks, Plugin } from "@opencode-ai/plugin"
import { ensureTgrepService } from "../lib/tgrep-service.ts"

export const TgrepServerPlugin: Plugin = async ({ worktree, client }) => {
  const hooks: Hooks = {
    "tool.execute.after": async (input, output) => {
      // OpenCode sustituye truncated por su propio recorte; conservar también los límites de la consulta.
      if (input.tool === "tgrep" && output.metadata?.truncation_reason) {
        output.metadata.truncated = true
      }
    },
  }
  await ensureTgrepService(worktree, undefined, undefined, (level, message) => {
    // El logging no debe ampliar los plazos de disponibilidad del servicio.
    void client.app.log({ body: { service: "tgrep", level, message } }).catch(() => {})
  })

  return hooks
}
