import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Support } from './Support';

function Landing() {
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sessionId.trim();
    if (!trimmed) {
      setError('Please enter a session ID');
      return;
    }
    window.location.href = '/' + trimmed;
  };

  return (
    <div className="landing-container">
      <h1>Disposable Form</h1>
      <p className="description">Create temporary forms that auto-delete after expiration. Perfect for one-time surveys, event registrations, or collecting sensitive data securely.</p>
      <p className="subtitle">Enter a session ID to access your form</p>
      <form id="sessionForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sessionId">Session ID</label>
          <input
            type="text"
            id="sessionId"
            name="sessionId"
            placeholder="Enter session ID"
            value={sessionId}
            autoFocus
            onChange={(e) => {
              setSessionId(e.target.value);
              setError('');
            }}
          />
        </div>
        <button type="submit">Open Form</button>
      </form>
      {error && <div className="error-text">{error}</div>}
      <Support />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Landing />);