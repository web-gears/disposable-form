import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Support } from './Support';

interface FormField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
}

interface FormConfig {
  fields: FormField[];
  timeoutSeconds: number;
}

declare global {
  interface Window {
    __FORM_CONFIG__: FormConfig;
    __SESSION_ID__: string;
  }
}

function FieldInput({ field, value, onChange, error }: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  error?: boolean;
}) {
  const commonProps = {
    id: field.id,
    name: field.id,
    required: field.required,
    placeholder: field.placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      onChange(val);
    },
  };

  switch (field.type) {
    case 'text':
      return (
        <input type="text" {...commonProps} value={value as string ?? ''} maxLength={field.maxLength} className={error ? 'error' : ''} />
      );
    case 'textarea':
      return (
        <textarea {...commonProps} value={value as string ?? ''} maxLength={field.maxLength} className={error ? 'error' : ''} />
      );
    case 'number':
      return (
        <input type="number" {...commonProps} value={value as number ?? ''} min={field.min} max={field.max} className={error ? 'error' : ''} />
      );
    case 'email':
      return (
        <input type="email" {...commonProps} value={value as string ?? ''} className={error ? 'error' : ''} />
      );
    case 'password':
      return (
        <input type="password" {...commonProps} value={value as string ?? ''} className={error ? 'error' : ''} />
      );
    case 'select':
      return (
        <select {...commonProps} value={value as string ?? ''} className={error ? 'error' : ''}>
          <option value="">Select...</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'multiselect':
      return (
        <select {...commonProps} multiple value={Array.isArray(value) ? value.join(',') : ''} className={error ? 'error' : ''}>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'checkbox':
      return (
        <label className="checkbox-label">
          <input type="checkbox" checked={value as boolean ?? false} onChange={(e) => onChange(e.target.checked)} />
          <span>{field.name}</span>
        </label>
      );
    case 'radio':
      return (
        <div className="radio-group">
          {field.options?.map(opt => (
            <label key={opt}>
              <input type="radio" name={field.id} value={opt} checked={value === opt} onChange={(e) => onChange(e.target.value)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    case 'date':
      return (
        <input type="date" {...commonProps} value={value as string ?? ''} className={error ? 'error' : ''} />
      );
    case 'datetime':
      return (
        <input type="datetime-local" {...commonProps} value={value as string ?? ''} className={error ? 'error' : ''} />
      );
    case 'range':
      return (
        <input type="range" {...commonProps} value={value as number ?? field.min ?? 0} min={field.min} max={field.max} onChange={(e) => onChange(Number(e.target.value))} />
      );
    case 'switch':
      return (
        <label className="switch-label">
          <input type="checkbox" checked={value as boolean ?? false} onChange={(e) => onChange(e.target.checked)} />
          <span className="switch-track" />
          <span>{field.name}</span>
        </label>
      );
    default:
      return <input type="text" {...commonProps} value={value as string ?? ''} />;
  }
}

export function FormApp() {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeout, setTimeout_] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (window.__FORM_CONFIG__) {
      setConfig(window.__FORM_CONFIG__);
      setTimeout_(window.__FORM_CONFIG__.timeoutSeconds);
    }
  }, []);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setInterval(() => {
        setTimeout_((t) => Math.max(0, t - 1));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeout === 0 && config) {
      setExpired(true);
    }
  }, [timeout, config]);

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const validate = (): boolean => {
    if (!config) return false;
    const newErrors: Record<string, boolean> = {};
    let valid = true;

    for (const field of config.fields) {
      const value = values[field.id];
      if (field.required) {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = true;
          valid = false;
        }
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/${window.__SESSION_ID__}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    }
    setSubmitting(false);
  };

  if (!config) return <div className="loading">Loading form...</div>;

  if (expired || timeout === 0) {
    return (
      <div className="error-container">
        <div className="error-code">expired</div>
        <div className="error-message">This form has expired</div>
        <div className="error-description">The form is no longer accessible.</div>
        <a href="/" className="landing-link">Go to Landing</a>
        <Support />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h2>Form Submitted</h2>
        <p>Your response has been recorded.</p>
        <p className="timeout-note">This form will expire in {timeout} seconds</p>
        <a href="/" className="landing-link">Go to Landing</a>
        <Support />
      </div>
    );
  }

  return (
    <div className="form-container">
      <header>
        <h1>Disposable Form</h1>
      </header>
      <div className="timeout">{timeout}</div>
      <form onSubmit={handleSubmit}>
        {config.fields.map((field) => (
          <div key={field.id} className={`field-group ${errors[field.id] ? 'has-error' : ''}`}>
            {field.type !== 'checkbox' && field.type !== 'switch' && (
              <label htmlFor={field.id}>{field.name}{field.required && <span className="required">*</span>}</label>
            )}
            <FieldInput
              field={field}
              value={values[field.id]}
              onChange={(val) => handleChange(field.id, val)}
              error={errors[field.id]}
            />
            {errors[field.id] && <span className="error-msg">This field is required</span>}
          </div>
        ))}
        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <Support />
      </form>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<FormApp />);