import { z } from 'zod'
import { VERTICAL_KEYS } from './verticals'

export const setVerticalSchema = z.object({
  vertical_key: z.enum(VERTICAL_KEYS),
})

export const verticalResponseSchema = z.object({
  vertical_key: z.string().nullable(),
  vertical: z.object({
    key: z.string(),
    label: z.string(),
    description: z.string(),
    color: z.string(),
    icon: z.string(),
    modules: z.array(z.string()),
    navGroupKey: z.string(),
  }).nullable(),
  set_at: z.string().nullable(),
})

export type SetVerticalInput = z.infer<typeof setVerticalSchema>
export type VerticalResponse = z.infer<typeof verticalResponseSchema>
