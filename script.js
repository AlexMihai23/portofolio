// ============================================
// Portfolio — loads from data/projects.json
// Assets served from assets/<folder>/
// ============================================

let PROJECTS = [];
let currentProjectId = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  loadProjects();

  // ESC to close lightbox
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
});

// ---- LOAD DATA ----
async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading projects...</div>';

  try {
    const resp = await fetch('data/projects.json');
    if (!resp.ok) throw new Error('Failed to load');
    const data = await resp.json();
    PROJECTS = data.projects || [];
  } catch (e) {
    console.warn('Could not load projects.json:', e);
    PROJECTS = [];
  }

  render();
}

// ---- RENDER ----
function render() {
  renderProjects();
  updateStats();
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  const empty = document.getElementById('empty-projects');
  grid.innerHTML = '';

  if (PROJECTS.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  PROJECTS.forEach((proj, i) => {
    const card = document.createElement('div');
    card.className = 'project-card fade-up';
    card.style.animationDelay = `${i * 0.1}s`;
    card.onclick = () => openProject(proj.id);

    // Find first image or gif for thumbnail
    const thumb = (proj.media || []).find(m => m.type === 'image' || m.type === 'gif');
    const thumbSrc = thumb ? `assets/${proj.folder}/${thumb.file}` : '';

    card.innerHTML = `
      <div class="card-thumb">
        ${thumbSrc
          ? `<img src="${thumbSrc}" alt="${esc(proj.name)}" loading="lazy">`
          : `<div class="placeholder">${esc(proj.name.substring(0, 3))}</div>`
        }
      </div>
      <div class="card-body">
        <h3>${esc(proj.name)}</h3>
        <p>${esc(proj.description || '')}</p>
        <div class="card-footer">
          <div class="card-tags">
            <span class="tag status">${esc(proj.status || 'WIP')}</span>
            ${(proj.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          ${proj.download
            ? `<a class="btn-download" href="${escAttr(proj.download)}" target="_blank" rel="noopener"
                 onclick="event.stopPropagation()">⬇ Download</a>`
            : `<span class="btn-download disabled">⬇ Soon</span>`
          }
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ---- PROJECT DETAIL ----
function openProject(id) {
  const proj = PROJECTS.find(p => p.id === id);
  if (!proj) return;
  currentProjectId = id;

  // Hide home sections, show detail
  document.getElementById('projects-section').style.display = 'none';
  document.getElementById('hero-section').style.display = 'none';
  document.getElementById('about').style.display = 'none';

  const detail = document.getElementById('project-detail');
  detail.classList.add('active');

  document.getElementById('detail-title').textContent = proj.name;
  document.getElementById('detail-desc').textContent = proj.description || '';
  document.getElementById('detail-meta').innerHTML = `
    <span>⚙️ ${esc(proj.engine || 'Unity')}</span>
    <span>◉ ${esc(proj.status || 'WIP')}</span>
    <span>📅 ${esc(proj.created || '')}</span>
  `;

  const dlBtn = document.getElementById('detail-download');
  if (proj.download) {
    dlBtn.href = proj.download;
    dlBtn.style.display = '';
  } else {
    dlBtn.style.display = 'none';
  }

  renderProjectMedia(proj);
  window.scrollTo(0, 0);
}

function renderProjectMedia(proj) {
  const container = document.getElementById('detail-media');
  const notesContainer = document.getElementById('detail-notes');
  container.innerHTML = '';
  notesContainer.innerHTML = '';

  const media = proj.media || [];
  const basePath = `assets/${proj.folder}`;

  const images = media.filter(m => m.type === 'image');
  const gifs = media.filter(m => m.type === 'gif');
  const videos = media.filter(m => m.type === 'video');
  const notes = proj.notes || [];

  // Screenshots
  if (images.length > 0) {
    container.innerHTML += `
      <div class="media-section">
        <h2>📸 Screenshots</h2>
        <div class="media-grid">
          ${images.map(m => {
            const src = `${basePath}/${m.file}`;
            return `<div class="media-item" onclick="openLightbox('${escAttr(src)}','image')">
              <img src="${src}" alt="${esc(m.caption || '')}" loading="lazy">
              ${m.caption ? `<div class="media-caption">${esc(m.caption)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // GIFs
  if (gifs.length > 0) {
    container.innerHTML += `
      <div class="media-section">
        <h2>✨ GIFs</h2>
        <div class="media-grid">
          ${gifs.map(m => {
            const src = `${basePath}/${m.file}`;
            return `<div class="media-item" onclick="openLightbox('${escAttr(src)}','image')">
              <img src="${src}" alt="${esc(m.caption || '')}" loading="lazy">
              ${m.caption ? `<div class="media-caption">${esc(m.caption)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Videos
  if (videos.length > 0) {
    container.innerHTML += `
      <div class="media-section">
        <h2>🎬 Videos</h2>
        <div class="media-grid">
          ${videos.map(m => {
            const src = `${basePath}/${m.file}`;
            return `<div class="media-item" onclick="openLightbox('${escAttr(src)}','video')">
              <video src="${src}" muted preload="metadata" style="width:100%;aspect-ratio:16/10;object-fit:cover"></video>
              ${m.caption ? `<div class="media-caption">${esc(m.caption)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Notes / Dev Log
  if (notes.length > 0) {
    notesContainer.innerHTML = `
      <div class="media-section">
        <h2>📝 Dev Notes</h2>
        ${notes.map(n => `
          <div class="note-entry">
            <div class="note-date">${esc(n.date || '')}</div>
            ${n.title ? `<div class="note-title">${esc(n.title)}</div>` : ''}
            <div class="note-content">${esc(n.content || '')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Empty state
  if (media.length === 0 && notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎮</div>
        <p>No media yet for this project.</p>
      </div>
    `;
  }
}

// ---- NAVIGATION ----
function showHome() {
  document.getElementById('projects-section').style.display = '';
  document.getElementById('hero-section').style.display = '';
  document.getElementById('about').style.display = '';
  document.getElementById('project-detail').classList.remove('active');
  currentProjectId = null;
}

// ---- LIGHTBOX ----
function openLightbox(src, type) {
  const lb = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');

  if (type === 'video') {
    content.innerHTML = `<video src="${src}" controls autoplay style="max-width:92vw;max-height:92vh;border-radius:12px;box-shadow:0 16px 60px rgba(0,0,0,0.3)"></video>`;
  } else {
    content.innerHTML = `<img src="${src}" alt="">`;
  }

  lb.classList.add('active');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const vid = lb.querySelector('video');
  if (vid) vid.pause();
  lb.classList.remove('active');
}

// ---- STATS ----
function updateStats() {
  document.getElementById('stat-projects').textContent = PROJECTS.length;

  let totalMedia = 0;
  PROJECTS.forEach(p => {
    totalMedia += (p.media || []).length;
  });
  document.getElementById('stat-media').textContent = totalMedia;
}

// ---- UTILITIES ----
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}