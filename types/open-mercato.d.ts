/**
 * Module declarations for @open-mercato packages without TypeScript declarations.
 */
declare module '@open-mercato/ai-assistant' {
  export const defineAiTool: any
  /** Exported as a type and value for modules that use it as `AiAgentDefinition[]` */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type AiAgentDefinition = any
  export const AiAssistant: any
  export const useAiAssistant: any
  export const AiAssistantProvider: any
  export const AiAssistantWidgets: any
  export const AiToolWidget: any
  const mod: any
  export default mod
}

declare module '@open-mercato/ai-assistant/*' {
  const mod: any
  export default mod
}
