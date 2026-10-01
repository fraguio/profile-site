import { tool, type ToolContext, type ToolResult } from "@opencode-ai/plugin"
import { queryTgrep } from "../lib/tgrep-query.ts"

export default tool({
  description:
    "Primary tool for repository-wide code search. Use tgrep to find text, regex patterns, symbols, usages, definitions, and configuration references across the current repository. For a repository-wide search, prefer this tool over Grep and do not repeat the same search with Grep unless tgrep fails or a narrower follow-up search is needed. Searches are case-sensitive. Default content output returns line numbers; files output returns unique paths containing matches, not a filename search. No matches is a valid result; CLI warnings are preserved in the response.",

  args: {
    output_mode: tool.schema
      .enum(["content", "files"])
      .default("content")
      .describe('Default "content" returns matching lines and context. Use "files" to locate unique files whose content matches, without line numbers or content; paths are JSON-quoted, one per row, in CLI arrival order. Not a filename search.'),
    max_results: tool.schema
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(100)
      .describe("Maximum returned records, from 1 to 1000. Default: 100. Counts matching and context lines in content, unique normalized file paths in files. Output is also bounded to 48000 UTF-8 bytes; narrow the query when truncation is reported."),
    pattern: tool.schema
      .string()
      .describe("Regular-expression pattern by default; use literal to search for metacharacters as exact text and ignore_case for case-insensitive matching."),
    path: tool.schema
      .string()
      .optional()
      .describe('Existing file or directory within the worktree. Default: ".". Relative paths start at the worktree; absolute paths and links must resolve within it.'),
    literal: tool.schema
      .boolean()
      .optional()
      .describe("Search for exact text without interpreting regex metacharacters. Use for identifiers or literal snippets. Default: false (regex)."),
    ignore_case: tool.schema
      .boolean()
      .optional()
      .describe("Ignore differences between uppercase and lowercase letters. Default: false (case-sensitive search)."),
    glob: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe('CLI globs to include files ("*.ts") or exclude them ("!*.test.ts"). No filters by default. With an index, globs filter its corpus and do not recover ignored files; during a scan, positive globs can reinclude them through traversal overrides.'),
    file_types: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("CLI file type names, such as ts, js or py; can be combined with globs. No filters by default. An unknown name produces a CLI error."),
    hidden: tool.schema
      .boolean()
      .optional()
      .describe("Include non-ignored hidden files and directories, such as .opencode or .agents. Default: false. Does not disable ignore rules; explicitly named scopes retain CLI semantics."),
    freshness: tool.schema
      .enum(["indexed", "current"])
      .default("indexed")
      .describe('Use "current" to read edits directly from the filesystem, bypassing the index and service checks. Default: "indexed", allowing the CLI to select server, local index or scan; indexed_or_scan does not guarantee an up-to-date index. A current_scan is not an atomic filesystem snapshot.'),
    context_lines: tool.schema
      .number()
      .int()
      .min(0)
      .max(10)
      .default(0)
      .describe("Lines before and after each match in content, from 0 to 10. Default: 0. Request context to interpret nearby code; output distinguishes matches from context and counts each returned line once, not each submatch. Validated but does not add lines or change the file list in files."),
  },

  async execute(args, context: ToolContext): Promise<ToolResult> {
    return queryTgrep(args, context)
  },
})
