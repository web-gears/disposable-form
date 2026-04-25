export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'range'
  | 'switch';

export interface FormField {
  id: string;
  name: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface CreateFormRequest {
  sessionId: string;
  fields: FormField[];
  timeoutSeconds?: number;
}

export interface CreateFormResponse {
  sessionId: string;
  formUrl: string;
  expiresAt: string;
}

export interface SessionEntry {
  config: CreateFormRequest;
  values: Record<string, unknown> | null;
  createdAt: Date;
  expiresAt: Date;
  submittedAt: Date | null;
  timer: NodeJS.Timeout;
}

export interface SessionResponse {
  sessionId: string;
  submittedAt: string;
  expiresAt: string;
  values: Record<string, unknown>;
}

export enum ErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NOT_YET_SUBMITTED = 'NOT_YET_SUBMITTED',
  ALREADY_SUBMITTED = 'ALREADY_SUBMITTED',
  SESSION_EXISTS = 'SESSION_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SUBMIT_VALIDATION_ERROR = 'SUBMIT_VALIDATION_ERROR',
}