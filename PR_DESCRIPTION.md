## Improve security, accessibility, and error handling for repository rendering

This PR changes how repositories are rendered to the DOM to avoid XSS, validates fetched data, improves accessibility, and adds better error handling with a retry button and a fetch timeout.

Changes:
- index.html
  - Use a semantic <ul> for the repository list and keep the aria-live region on the count only.
- script.js
  - Replace unsafe innerHTML with createElement/textContent.
  - Validate URLs and JSON shapes.
  - Use <time datetime> for starred dates.
  - Add AbortController timeout and retry behavior.

Testing notes:
- Test with valid and malformed events.json payloads, slow networks, and malicious content in text fields.
