const landingStyles = `
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    margin: 0;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .landing-container {
    background: white;
    padding: 48px;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    max-width: 400px;
    width: 100%;
    text-align: center;
  }
  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    color: #1a1a2e;
  }
  .subtitle {
    color: #666;
    margin: 0 0 32px;
  }
  .form-group {
    margin-bottom: 20px;
    text-align: left;
  }
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }
  input[type="text"] {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s;
  }
  input[type="text"]:focus {
    outline: none;
    border-color: #1976d2;
  }
  button {
    width: 100%;
    padding: 14px 24px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  button:hover {
    background: #1565c0;
  }
  .error-text {
    color: #e53935;
    font-size: 14px;
    margin-top: 8px;
  }
</style>
`;

export function landingHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disposable Form</title>
  ${landingStyles}
</head>
<body>
  <div class="landing-container">
    <h1>Disposable Form</h1>
    <p class="subtitle">Enter a session ID to access your form</p>
    <form id="sessionForm">
      <div class="form-group">
        <label for="sessionId">Session ID</label>
        <input type="text" id="sessionId" name="sessionId" placeholder="Enter session ID" required>
      </div>
      <button type="submit">Open Form</button>
    </form>
    <div id="error" class="error-text"></div>
  </div>
  <script>
    document.getElementById('sessionForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var sessionId = document.getElementById('sessionId').value.trim();
      if (sessionId) {
        window.location.href = '/' + sessionId;
      }
    });
  </script>
</body>
</html>`;
}