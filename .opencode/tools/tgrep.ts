import { tool } from "@opencode-ai/plugin"

declare const Bun: {
  $: (strings: TemplateStringsArray, ...values: unknown[]) => {
    text(): Promise<string>
  }
}

interface TgrepArgs {
  pattern: string
}

interface TgrepContext {
  worktree: string
}

export default tool({
  description:
    "Primary tool for repository-wide code search. Use tgrep to find text, regex patterns, symbols, usages, definitions, and configuration references across the current repository. For a repository-wide search, prefer this tool over Grep and do not repeat the same search with Grep unless tgrep fails or a narrower follow-up search is needed.",

  args: {
    pattern: tool.schema
      .string()
      .describe("Text or regular-expression pattern to search for"),
  },

  async execute(args: TgrepArgs, context: TgrepContext): Promise<string> {
    const result =
      await Bun.$`tgrep -n -- ${args.pattern} ${context.worktree}`.text()

    return result.trim()
  },
})
