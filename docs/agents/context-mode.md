# Context-mode routing

Read this guide before bulk file/log analysis, multi-page web extraction, or recovery of earlier decisions.

## Availability

When context-mode MCP tools are available, use them to process large inputs and return bounded findings. Discover the actual tool names and schemas exposed by the host; the operations below use their conventional names.

When unavailable, filter, count, parse and summarize with the available execution tools before returning output. Read exact source when needed for an edit. Use available search/fetch tools for research and report unavailable context-mode commands as unavailable.

## Route by operation

| Need | Operation |
| --- | --- |
| Recover a decision after resume/compaction | Search prior context with `ctx_search`, using `sort: "timeline"` and a relevant source when known. No result means investigate from current evidence. |
| Gather several command results | `ctx_batch_execute`, with descriptive labels and targeted search queries. |
| Analyze, count, filter or compare data | `ctx_execute` or `ctx_execute_file`; print the answer and supporting locations, keeping raw inputs outside context. |
| Extract web content | `ctx_fetch_and_index`, then `ctx_search`; use the required browser tool for interactive browser tasks. |
| Keep material for later lookup | `ctx_index`, with a descriptive source label. |

Use JavaScript/Node built-ins for programmatic analysis; handle missing values and errors. Use shell execution only when the code matches the host shell. Small Git/filesystem operations and exact source reads for editing can use ordinary tools. Route shell output over 20 lines through context-mode rather than dumping it into context.

When routing hooks block direct curl/wget, inline HTTP or raw web fetching, switch to the context-mode fetch/index or execute operation instead of retrying the blocked route. This does not override a user's requested browser or documentation workflow.

## Concurrency and output

Set explicit concurrency for multi-URL/API batches: use 4–8 for independent I/O, capped at 4 for GitHub API calls. Use 1 for CPU-heavy checks and operations sharing ports, databases, lockfiles or repository writes. Parallelize only independent operations.

Save generated reports and large artifacts as files; return their paths and a short result. Batch related follow-up queries and filter by descriptive source. Exact diagnostics needed to assess a failure belong in the answer; raw logs belong in the artifact.

## Diagnostics and memory

- For requested stats, doctor or upgrade commands, call the matching available context-mode tool and follow its returned instructions. Preserve the stats/doctor output when requested.
- Search session history before asking the user to repeat a recorded decision or constraint. If history is unavailable, state the missing information and continue work that does not depend on it.
- Purge clears stored context. Use it only when requested, with the required confirmation; resume/compaction alone is not a reason to purge.
