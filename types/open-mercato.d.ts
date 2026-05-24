/**
 * Module declarations for @open-mercato packages that ship pre-compiled JS
 * without bundled TypeScript declarations.
 *
 * @open-mercato/ai-assistant ships dist/index.js without a .d.ts file.
 * All exports declared as `any` to unblock typecheck while proper
 * declarations are tracked separately.
 */
declare module '@open-mercato/ai-assistant' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const defineAiTool: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AiAgentDefinition: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AiAssistant: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useAiAssistant: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AiAssistantProvider: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AiAssistantWidgets: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AiToolWidget: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any
  export default mod
}

declare module '@open-mercato/ai-assistant/*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any
  export default mod
}
