// Improved script.js
// - Defensive checks for DOM nodes
// - Safe DOM construction (no innerHTML for user content)
// - URL validation (only http/https allowed)
// - rel="noopener noreferrer" for target="_blank"
// - Validates that fetched JSON is an array
// - Formats starredAt into a <time> element
// - Fetch timeout using AbortController
// - Shows a retry button on error

const repositoryList = document.querySelector('#repository-list');
const repositoryCount = document.querySelector('#repository-count');

if (!repositoryList || !repositoryCount) {
  console.error('Required DOM elements not found: #repository-list and/or #repository-count');
  // Abort further execution to avoid runtime errors
} else {
  // Keep an initial loading state (present in HTML). Replace when ready.

  function createTextElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function isValidHttpUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function formatStars(n) {
    const num = Number(n);
    if (Number.isFinite(num)) {
      return `${new Intl.NumberFormat().format(num)} ${num === 1 ? 'star' : 'stars'}`;
    }
    return '0 stars';
  }

  function renderRepositories(repositories) {
    // repositories should be an array (validated by caller)
    repositoryCount.textContent = `${repositories.length} ${repositories.length === 1 ? 'repository' : 'repositories'}`;

    // clear existing list
    // if repositoryList is a <ul>, we'll fill with <li>
    repositoryList.innerHTML = '';

    if (repositories.length === 0) {
      const p = createTextElement('p', 'status', 'No starred repositories yet.');
      repositoryList.appendChild(p);
      return;
    }

    const listFragment = document.createDocumentFragment();

    repositories.forEach((repository) => {
      const li = document.createElement('li');
      li.className = 'repository-item';

      // card link
      const link = document.createElement('a');
      link.className = 'repository';
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      // Validate URL before setting href
      if (repository && repository.url && isValidHttpUrl(repository.url)) {
        link.href = repository.url;
      } else {
        // fallback - use no navigation but keep keyboard focusable container for accessibility
        link.href = '#';
        link.setAttribute('aria-disabled', 'true');
      }

      // Repository name (heading)
      const title = createTextElement('h3', 'repository-name', repository && repository.repository ? repository.repository : 'Untitled repository');
      link.appendChild(title);

      // Description (optional)
      if (repository && repository.description) {
        const desc = createTextElement('p', 'repository-description', repository.description);
        link.appendChild(desc);
      }

      // Meta container
      const meta = document.createElement('div');
      meta.className = 'repository-meta';

      // Language (optional)
      if (repository && repository.language) {
        const lang = createTextElement('span', 'language', repository.language);
        meta.appendChild(lang);
      }

      // Stars
      const stars = createTextElement('span', 'stars', formatStars(repository && repository.stars));
      meta.appendChild(stars);

      // Starred date - use <time datetime="">
      if (repository && repository.starredAt) {
        const timeEl = document.createElement('time');
        // try to parse ISO date safely
        const d = new Date(repository.starredAt);
        if (!Number.isNaN(d.getTime())) {
          timeEl.dateTime = d.toISOString();
          // Human friendly date (local)
          timeEl.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
          timeEl.className = 'starred-at';
          meta.appendChild(timeEl);
        } else {
          // If unparsable, show raw text safely
          const fallback = createTextElement('span', 'starred-at', String(repository.starredAt));
          meta.appendChild(fallback);
        }
      }

      link.appendChild(meta);
      li.appendChild(link);
      listFragment.appendChild(li);
    });

    repositoryList.appendChild(listFragment);
  }

  async function loadRepositories({ timeout = 10000 } = {}) {
    // show loading state (the HTML already has a "Loading repositories..." p, but we ensure repositoryCount is blank while loading)
    repositoryCount.textContent = '';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('events.json', { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      let repositories;
      try {
        repositories = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid JSON received from events.json');
      }

      if (!Array.isArray(repositories)) {
        throw new Error('Unexpected data format: expected an array of repositories');
      }

      renderRepositories(repositories);
    } catch (error) {
      // Show friendly error + retry button
      repositoryList.innerHTML = '';

      const container = document.createElement('div');
      container.className = 'status-container';

      const msg = createTextElement('p', 'status error', 'Repositories could not be loaded.');
      container.appendChild(msg);

      const details = createTextElement('p', 'error-detail', error && error.message ? String(error.message) : 'Unknown error');
      details.setAttribute('aria-hidden', 'true'); // hide error details from AT unless you want to surface them
      container.appendChild(details);

      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'retry-button';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => {
        // replace UI with loading state
        repositoryList.innerHTML = '<p class="status">Loading repositories...</p>';
        loadRepositories();
      });
      container.appendChild(retry);

      repositoryList.appendChild(container);

      console.error(error);
      // keep repositoryCount empty or show a placeholder
      repositoryCount.textContent = '';
    } finally {
      clearTimeout(timer);
    }
  }

  // run
  loadRepositories();
}
