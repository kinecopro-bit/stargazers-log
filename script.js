const repositoryList = document.querySelector('#repository-list');
const repositoryCount = document.querySelector('#repository-count');

function renderRepositories(repositories) {
  repositoryCount.textContent = `${repositories.length} ${repositories.length === 1 ? 'repository' : 'repositories'}`;

  if (repositories.length === 0) {
    repositoryList.innerHTML = '<p class="status">No starred repositories yet.</p>';
    return;
  }

  repositoryList.innerHTML = repositories.map((repository) => `
    <a class="repository" href="${repository.url}" target="_blank" rel="noreferrer">
      <h3 class="repository-name">${repository.repository}</h3>
      <p class="repository-description">${repository.description}</p>
      <div class="repository-meta">
        <span class="language">${repository.language}</span>
        <span>${repository.stars} stars</span>
        <span>Starred ${repository.starredAt}</span>
      </div>
    </a>
  `).join('');
}

async function loadRepositories() {
  try {
    const response = await fetch('events.json');
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const repositories = await response.json();
    renderRepositories(repositories);
  } catch (error) {
    repositoryList.innerHTML = '<p class="status error">Repositories could not be loaded.</p>';
    console.error(error);
  }
}

loadRepositories();