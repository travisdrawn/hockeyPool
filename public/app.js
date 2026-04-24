let state = { players: {}, participants: [], lastUpdated: null };
let selectedParticipant = null;

function init() {
  // Compute API base from the page URL so it works at any subpath (/hockeypool) or root (/)
  const p = window.location.pathname;
  const base = p.includes('.') ? p.replace(/\/[^/]*$/, '') : p.replace(/\/$/, '');
  const evtSource = new EventSource(base + '/api/stream');
  evtSource.onmessage = e => {
    state = JSON.parse(e.data);
    render();
  };
  evtSource.onerror = () => {
    document.getElementById('lastUpdated').textContent = 'Reconnecting…';
  };
}

function render() {
  renderLeaderboard();
  renderLastUpdated();
  if (selectedParticipant) {
    const updated = state.participants.find(p => p.name === selectedParticipant);
    if (updated) renderRoster(updated);
  }
}

function renderLeaderboard() {
  const el = document.getElementById('leaderboard');
  if (!state.participants.length) {
    el.innerHTML = '<div class="loading">No data yet.</div>';
    return;
  }

  el.innerHTML = state.participants.map((p, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    return `
      <div class="lb-row rank-${rank <= 3 ? rank : 'other'}" onclick="openRoster(${p.id})">
        <div class="rank">${medal}</div>
        <div class="lb-name">${escHtml(p.name)}</div>
        <div class="lb-points">${p.total}</div>
      </div>
    `;
  }).join('');
}

function renderLastUpdated() {
  if (!state.lastUpdated) return;
  const d = new Date(state.lastUpdated);
  document.getElementById('lastUpdated').textContent =
    'Updated ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function openRoster(id) {
  const p = state.participants.find(p => p.id === id);
  if (!p) return;
  selectedParticipant = p.name;
  renderRoster(p);

  document.getElementById('overlay').classList.remove('hidden');
  const panel = document.getElementById('rosterPanel');
  panel.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('open'));
}

function renderRoster(p) {
  document.getElementById('rosterName').textContent = p.name;
  document.getElementById('rosterTotal').textContent = `${p.total} pts total`;

  const sorted = [...p.roster].sort((a, b) => {
    const pa = state.players[a]?.points ?? 0;
    const pb = state.players[b]?.points ?? 0;
    return pb - pa;
  });

  document.getElementById('rosterList').innerHTML = sorted.map(name => {
    const info = state.players[name];
    if (!info) return '';
    const pts = info.points ?? 0;
    const ptsClass = pts >= 8 ? 'pts-high' : pts >= 3 ? 'pts-mid' : 'pts-zero';

    let detail;
    if (info.isTandem) {
      const parts = [];
      if (info.wins)     parts.push(`${info.wins}W`);
      if (info.shutouts) parts.push(`${info.shutouts}SO`);
      if (info.goals)    parts.push(`${info.goals}G`);
      if (info.assists)  parts.push(`${info.assists}A`);
      detail = parts.length ? parts.join(' · ') : 'no stats yet';
    } else {
      const parts = [];
      if (info.goals)   parts.push(`${info.goals}G`);
      if (info.assists) parts.push(`${info.assists}A`);
      detail = parts.length ? parts.join(' · ') : 'no points yet';
    }

    return `
      <div class="roster-player">
        <div class="roster-player-left">
          <span class="roster-player-name${info.isTandem ? ' is-tandem' : ''}">${escHtml(name)}</span>
          <span class="roster-player-detail">${detail}</span>
        </div>
        <span class="roster-player-pts ${ptsClass}">${pts}</span>
      </div>
    `;
  }).join('');
}

function closeRoster() {
  selectedParticipant = null;
  const panel = document.getElementById('rosterPanel');
  panel.classList.remove('open');
  panel.addEventListener('transitionend', () => {
    panel.classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
  }, { once: true });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

init();
