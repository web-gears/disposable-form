const errorStyles = `
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
  .error-container {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 400px;
  }
  .error-code {
    font-size: 48px;
    font-weight: bold;
    margin: 0 0 8px;
    color: #e53935;
  }
  .error-message {
    font-size: 18px;
    color: #333;
    margin: 0 0 16px;
  }
  .error-description {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
  a { color: #1976d2; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
`;

export function errorHtml(code: string, message: string, description: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - ${code}</title>
  ${errorStyles}
</head>
<body>
  <div class="error-container">
    <div class="error-code">${code.replace('_', ' ')}</div>
    <div class="error-message">${message}</div>
    <div class="error-description">${description}</div>
  </div>
</body>
</html>`;
}