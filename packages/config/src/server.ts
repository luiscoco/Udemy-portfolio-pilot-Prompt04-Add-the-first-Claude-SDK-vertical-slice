import { z } from 'zod';

export const serverConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATA_MODE: z.preprocess((v) => v === '' ? undefined : v, z.enum(['mock', 'live']).default('mock')),
  AGENT_MODE: z.preprocess((v) => v === '' ? undefined : v, z.enum(['mock', 'claude']).default('mock')),
  AGENT_MODEL_ID: z.preprocess((v) => v === '' ? undefined : v, z.string().trim().min(1).optional()),
  AGENT_WORKSPACE_DIR: z.preprocess((v) => v === '' ? undefined : v, z.string().trim().min(1).optional()),
  DATABASE_URL: z.preprocess((v) => v === '' ? undefined : v, z.string().optional()),
  REDIS_URL: z.preprocess((v) => v === '' ? undefined : v, z.string().optional()),
  ANTHROPIC_API_KEY: z.preprocess((v) => v === '' ? undefined : v, z.string().optional())
}).superRefine((value, ctx) => {
  if (value.DATA_MODE === 'live') {
    for (const key of ['DATABASE_URL', 'REDIS_URL'] as const) {
      if (!value[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required in live mode` });
    }
  }
  if (value.AGENT_MODE === 'claude') {
    for (const key of ['AGENT_MODEL_ID', 'AGENT_WORKSPACE_DIR'] as const) {
      if (!value[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required in Claude mode` });
    }
  }
});
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export function parseServerConfig(input: unknown): ServerConfig {
  return serverConfigSchema.parse(input);
}
