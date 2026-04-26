import React from 'react';
import { createRoot } from 'react-dom/client';
import { Support } from './Support';

interface ErrorPageProps {
  code: string;
  message: string;
  description: string;
}

function ErrorPage({ code, message, description }: ErrorPageProps) {
  return (
    <div className="error-container">
      <div className="error-code">{code.replace('_', ' ')}</div>
      <div className="error-message">{message}</div>
      <div className="error-description">{description}</div>
      <a href="/" className="landing-link">Go to Landing</a>
      <Support />
    </div>
  );
}

declare global {
  interface Window {
    __ERROR_CODE__: string;
    __ERROR_MESSAGE__: string;
    __ERROR_DESCRIPTION__: string;
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorPage
    code={window.__ERROR_CODE__ || 'Error'}
    message={window.__ERROR_MESSAGE__ || 'An error occurred'}
    description={window.__ERROR_DESCRIPTION__ || 'Please try again later.'}
  />
);