import { tool, type ToolContext, type ToolResult } from "@opencode-ai/plugin"
import { queryTgrep } from "../lib/tgrep-query.ts"

export default tool({
  description:
    "Primary tool for repository-wide code search. Use tgrep to find text, regex patterns, symbols, usages, definitions, and configuration references across the current repository. For a repository-wide search, prefer this tool over Grep and do not repeat the same search with Grep unless tgrep fails or a narrower follow-up search is needed. Searches are case-sensitive and return line numbers. No matches is a valid result; CLI warnings are preserved in the response.",

  args: {
    pattern: tool.schema
      .string()
      .describe("Case-sensitive regular-expression pattern to search for"),
  },

  async execute(args, context: ToolContext): Promise<ToolResult> {
    return queryTgrep(args, context)
  },
})
