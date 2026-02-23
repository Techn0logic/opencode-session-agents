import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { readdir, readFile, access } from "fs/promises"
import { join, resolve } from "path"

interface AgentInfo {
  name: string
  path: string
  description: string
  model: string
}

interface AgentConfig {
  description?: string
  model?: string
  tools?: Record<string, boolean>
  agent?: Record<string, {
    mode?: string
    model?: string
    description?: string
    tools?: Record<string, boolean>
  }>
}

function parseModelString(modelStr: string): { providerID: string; modelID: string } | null {
  if (!modelStr) return null
  const parts = modelStr.split("/")
  if (parts.length !== 2) return null
  return { providerID: parts[0], modelID: parts[1] }
}

interface DelegateResult {
  sessionId: string
  agent: string
  directory: string
  status: string
  note: string
}

interface StatusResult {
  id: string
  title: string
  status: string
  messageCount: number
  lastMessage: unknown
}

async function fileExists(p: string): Promise<boolean> {
  return access(p).then(() => true).catch(() => false)
}

async function readAgentMd(agentPath: string): Promise<string | null> {
  const p = join(agentPath, "AGENT.md")
  if (!(await fileExists(p))) return null
  return readFile(p, "utf8")
}

async function readAgentConfig(agentPath: string): Promise<Record<string, unknown> | null> {
  const p = join(agentPath, "opencode.json")
  if (!(await fileExists(p))) return null
  return JSON.parse(await readFile(p, "utf8"))
}

function extractDescriptionFromAgentMd(content: string): string {
  const trimmed = content.trim()
  const firstParagraph = trimmed.split(/\n\n+/)[0]
  const cleaned = firstParagraph.replace(/^#+\s*/, "").replace(/\s+/g, " ").trim()
  return cleaned.length > 200 ? cleaned.slice(0, 200) + "..." : cleaned
}

export const SessionAgentsPlugin: Plugin = async ({ client }) => {
  return {
    tool: {
      /**
       * List available sub-agents in the project.
       * Scans for directories containing AGENT.md or opencode.json.
       */
      orchestrator_list_agents: tool({
        description: "List available sub-agents (directories containing AGENT.md or opencode.json) within parent directory",
        args: {},
        async execute(_args, context): Promise<string> {
          const discoveryRoot = resolve(context.directory, "..")
          const entries = await readdir(discoveryRoot, { withFileTypes: true })
          const agents: AgentInfo[] = []

          for (const e of entries) {
            if (!e.isDirectory()) continue
            const agentPath = join(discoveryRoot, e.name)
            const hasMd = await fileExists(join(agentPath, "AGENT.md"))
            const hasCfg = await fileExists(join(agentPath, "opencode.json"))
            if (!hasMd && !hasCfg) continue

            const cfg = hasCfg ? await readAgentConfig(agentPath) : null
            const agentConfigTyped = cfg as AgentConfig | null
            const agentSpecificConfig = agentConfigTyped?.agent?.[e.name]
            
            let description = (agentSpecificConfig?.description as string) ?? (agentConfigTyped?.description as string) ?? null
            if (!description && hasMd) {
              const agentMd = await readAgentMd(agentPath)
              if (agentMd) {
                description = extractDescriptionFromAgentMd(agentMd)
              }
            }
            
            agents.push({
              name: e.name,
              path: agentPath,
              description: description ?? "No description",
              model: (agentSpecificConfig?.model as string) ?? (agentConfigTyped?.model as string) ?? "inherits root default",
            })
          }

          return JSON.stringify(agents, null, 2)
        },
      }),

      /**
       * Delegate a task to a sub-agent.
       * Creates a child session in the sub-agent's directory, loads its opencode.json config,
       * and executes the task.
       */
      orchestrator_delegate: tool({
        description:
          "Delegate a task to a sub-agent. Creates a child session in the sub-agent's directory, " +
          "applies the sub-agent's opencode.json config (model, tools, permissions), " +
          "loads AGENT.md, then executes the task and returns the result.",
        args: {
          agent: tool.schema
            .string()
            .describe("Sub-agent directory name e.g. agent_1, backend, frontend"),
          task: tool.schema.string().describe("Full task prompt to execute"),
        },
          async execute(args, context): Promise<string> {
          try {
            const { agent, task } = args
            const discoveryRoot = resolve(context.directory, "..")
            const agentPath = join(discoveryRoot, agent)

            if (!(await fileExists(agentPath))) {
              return JSON.stringify({ error: `Agent directory not found at ${agentPath}` })
            }

            const agentMd = await readAgentMd(agentPath)
            const agentConfig = await readAgentConfig(agentPath)

            const agentConfigTyped = agentConfig as AgentConfig | null
            const modelStr = agentConfigTyped?.agent?.[agent]?.model ?? agentConfigTyped?.model
            const modelOverride = modelStr ? parseModelString(modelStr) : null
            const toolsOverride = agentConfigTyped?.agent?.[agent]?.tools ?? agentConfigTyped?.tools

            console.log(`[orchestrator_delegate] agent=${agent} agentPath=${agentPath}`)
            console.log(`[orchestrator_delegate] modelStr=${modelStr} modelOverride=${JSON.stringify(modelOverride)}`)
            console.log(`[orchestrator_delegate] toolsOverride=${JSON.stringify(toolsOverride)}`)

            const childSession = await client.session.create({
              query: { directory: agentPath },
              body: {
                title: `${agent} - ${task.slice(0, 60)}${task.length > 60 ? "..." : ""}`,
              },
            })

            const sessionData = childSession as { data?: { id?: string } }
            const sessionId = sessionData?.data?.id
            if (!sessionId) {
              return JSON.stringify({ error: "Failed to get child session ID" })
            }

            await client.session.prompt({
              query: { directory: agentPath },
              path: { id: sessionId },
              body: {
                agent: agent,
                model: modelOverride ?? undefined,
                tools: toolsOverride,
                system: agentMd ?? undefined,
                noReply: true,
                parts: [{ type: "text", text: "Initialize session with sub-agent configuration" }],
              },
            })

            const promptPromise = client.session.prompt({
              query: { directory: agentPath },
              path: { id: sessionId },
              body: {
                agent: agent,
                model: modelOverride ?? undefined,
                parts: [{ type: "text", text: task }],
              },
            })

            if (promptPromise?.then) {
              promptPromise
                .then((result: unknown) => {
                  const resultStr =
                    typeof result === "string" ? result : JSON.stringify(result)
                  console.log(`Sub-agent ${agent} completed:`, resultStr.slice(0, 200))
                })
                .catch((err: unknown) => {
                  const msg = err instanceof Error ? err.message : String(err)
                  console.error(`Sub-agent ${agent} failed:`, msg)
                })
            }

            const result: DelegateResult = {
              sessionId,
              agent,
              directory: agentPath,
              status: "delegated",
              note: `Task executing in ${agentPath} with model: ${modelStr ?? "default"}`,
            }
            return JSON.stringify(result, null, 2)
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            return JSON.stringify({ error: errorMessage })
          }
        },
      }),

      /**
       * Get the status of a delegated child session.
       */
      orchestrator_status: tool({
        description: "Get status and message count of a delegated child session",
        args: {
          sessionId: tool.schema.string(),
        },
        async execute(args): Promise<string> {
          const [infoRaw, messagesRaw] = await Promise.all([
            client.session.get({ path: { id: args.sessionId } }),
            client.session.messages({ path: { id: args.sessionId } }),
          ])

          const info = infoRaw as { data?: { id?: string; title?: string; status?: string } }
          const messages = messagesRaw as { data?: unknown[] }
          const messagesArray = messages?.data || []

          const result: StatusResult = {
            id: info?.data?.id ?? "",
            title: info?.data?.title ?? "",
            status: info?.data?.status ?? "unknown",
            messageCount: messagesArray.length,
            lastMessage: messagesArray[messagesArray.length - 1] ?? null,
          }
          return JSON.stringify(result, null, 2)
        },
      }),

      /**
       * Read the last N messages from a child session.
       */
      orchestrator_read_output: tool({
        description: "Read the last N messages from a child session",
        args: {
          sessionId: tool.schema.string(),
          lastN: tool.schema.number().int().min(1).max(50).default(10),
        },
        async execute(args): Promise<string> {
          const messagesRaw = await client.session.messages({
            path: { id: args.sessionId },
          })

          const messages = messagesRaw as { data?: unknown[] }
          const messagesArray = messages?.data || []

          return JSON.stringify(
            messagesArray.slice(-args.lastN).map((m: unknown) => {
              const msg = m as { role?: string; content?: unknown }
              return {
                role: msg.role,
                content:
                  typeof msg.content === "string" ? msg.content.slice(0, 800) : msg.content,
              }
            }),
            null,
            2
          )
        },
      }),
    },
  }
}

export default SessionAgentsPlugin
