/**
 * Module declarations for @open-mercato packages that ship pre-compiled JS
 * without bundled TypeScript declarations.
 *
 * @open-mercato/ai-assistant ships dist/index.js without a .d.ts file.
 * Declared as `any` to unblock typecheck; proper declarations tracked separately.
 */
declare module '@open-mercato/ai-assistant' {
  const mod: Record<string, unknown>
  export default mod
  export const AiAssistant: any
  export const useAiAssistant: any
  export const AiAssistantProvider: any
  export const AiAssistantWidgets: any
  export const AiToolWidget: any
}

declare module '@open-mercato/ai-assistant/*' {
  const mod: any
  export default mod
}
