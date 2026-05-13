import { z } from 'zod';
import type { FieldType } from '../types/index.js';

const fieldIdRegex = /^[a-zA-Z0-9_-]+$/;
const sessionIdRegex = /^[a-zA-Z0-9-]+$/;

const fieldTypeSchema = z.enum(['text', 'textarea', 'number', 'email', 'password', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'datetime', 'range', 'switch']);

const formFieldSchema = z.object({
  id: z.string().max(64).regex(fieldIdRegex, 'Invalid field ID format'),
  name: z.string().max(128),
  type: fieldTypeSchema,
  required: z.boolean().optional(),
  placeholder: z.string().max(256).optional(),
  options: z.array(z.string().max(128)).max(50).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  maxLength: z.number().max(10000).optional(),
}).refine((data) => {
  if (data.type === 'select' || data.type === 'multiselect' || data.type === 'radio') {
    return data.options && data.options.length > 0;
  }
  return true;
}, {
  message: 'options required for select/multiselect/radio fields',
  path: ['options'],
}).refine((data) => {
  if (data.maxLength !== undefined && (data.type === 'text' || data.type === 'textarea')) {
    return data.maxLength <= 10000;
  }
  return true;
}, {
  message: 'maxLength must be <= 10000',
  path: ['maxLength'],
});

export const createFormRequestSchema = z.object({
  sessionId: z.string().max(64).regex(sessionIdRegex, 'Invalid sessionId format'),
  fields: z.array(formFieldSchema).min(1).max(20),
  timeoutSeconds: z.number().min(10).max(3600).optional(),
  seed: z.string().min(1).max(256).optional(),
}).strict();

export const fieldValueSchema = z.record(z.unknown());

export type ValidatedCreateForm = z.infer<typeof createFormRequestSchema>;

export function validateCreateForm(data: unknown) {
  const result = createFormRequestSchema.safeParse(data);
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  return { success: true as const, data: result.data };
}

export function validateFieldValues(
  fieldValues: unknown,
  fields: { id: string; type: FieldType; required?: boolean }[]
): { success: true } | { success: false; error: string } {
  const values = fieldValueSchema.safeParse(fieldValues);
  if (!values.success) {
    return { success: false, error: 'Invalid values format' };
  }

  const valueMap = values.data;
  const fieldMap = new Map(fields.map(f => [f.id, f]));

  for (const field of fields) {
    const value = valueMap[field.id];
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        return { success: false, error: `Field ${field.id} is required` };
      }
      if (Array.isArray(value) && value.length === 0) {
        return { success: false, error: `Field ${field.id} is required` };
      }
    }
  }

  return { success: true };
}