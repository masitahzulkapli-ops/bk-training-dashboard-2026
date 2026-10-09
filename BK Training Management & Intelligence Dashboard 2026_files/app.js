// ============================================================
// BK Training Management & Intelligence Dashboard 2026
// app.js — main application logic
// ============================================================

const D = window.BKData;
let charts = {};
let currentSection = 'dashboard';
let tableState = { page: 1, perPage: 10, sort: null, dir: 'asc', filter: {} };

// ── Clock ────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleDateString('ms-MY', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ── Sidebar toggle ────────────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sb.classList.toggle('mobile-open');
  } else {
    sb.classList.toggle('collapsed');
  }
}
window.toggleSidebar = toggleSidebar;

// ── Navigation ────────────────────────────────────────────────
function showSection(name) {
  currentSection = name;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-section="${name}"]`);
  if (nav) nav.classList.add('active');
  const titles = {
    dashboard: 'Dashboard Utama',
    perancangan: 'Perancangan Latihan',
    kertaskerja: 'Kertas Kerja Latihan',
    kelulusan: 'Kelulusan',
    pelaksanaan: 'Pelaksanaan',
    peserta: 'Peserta & Kehadiran',
    kewangan: 'Peruntukan & Kewangan',
    laporan: 'Laporan',
    penilaian: 'Penilaian & CQI',
    dokumen: 'Pengurusan Dokumen',
    tindakan: 'Tindakan Susulan',
    import: 'Import Data',
    tetapan: 'Tetapan Sistem',
  };
  document.getElementById('page-title').textContent = titles[name] || name;
  // Destroy old charts before re-rendering
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};
  const renderers = {
    dashboard: renderDashboard,
    perancangan: renderPerancangan,
    kertaskerja: renderKertasKerja,
    kelulusan: renderKelulusan,
    pelaksanaan: renderPelaksanaan,
    peserta: renderPeserta,
    kewangan: renderKewangan,
    laporan: renderLaporan,
    penilaian: renderPenilaian,
    dokumen: renderDokumen,
    tindakan: renderTindakan,
    import: renderImport,
    tetapan: renderTetapan,
  };
  const fn = renderers[name] || (() => { document.getElementById('content-area').innerHTML = `<div class="empty-state"><div class="icon">🚧</div><p>Modul <strong>${name}</strong> sedang dibangunkan.</p></div>`; });
  fn();
  updateAlertBadge();
}
window.showSection = showSection;

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); showSection(el.dataset.section); });
});

// ── Alert badge ───────────────────────────────────────────────
function updateAlertBadge() {
  const open = D.tindakanSusulan.filter(t => t.status !== 'Selesai').length;
  document.getElementById('alertCount').textContent = open;
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
window.toast = toast;

// ── Modal ─────────────────────────────────────────────────────
function openModal(title, bodyHtml, footerHtml = '', size = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-footer').innerHTML = footerHtml;
  const box = document.getElementById('modal-box');
  box.className = 'modal-box' + (size ? ` modal-${size}` : '');
  box.classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-box').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}
window.openModal = openModal;
window.closeModal = closeModal;

// ══════════════════════════════════════════════════════════════
// DASHBOARD UTAMA
// ══════════════════════════════════════════════════════════════
function renderDashboard() {
  const kpi = D.getKPI();
  const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) : '—';
  const rmFmt = v => v ? 'RM ' + Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2 }) : 'RM 0.00';

  document.getElementById('content-area').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card green" onclick="showSection('perancangan')">
        <div class="kpi-label">Jumlah Latihan Dirancang</div>
        <div class="kpi-value">${kpi.total}</div>
        <div class="kpi-sub">Tahun 2026</div>
      </div>
      <div class="kpi-card blue" onclick="showSection('kelulusan')">
        <div class="kpi-label">Telah Diluluskan</div>
        <div class="kpi-value">${kpi.diluluskan}</div>
        <div class="kpi-sub">${pct(kpi.diluluskan, kpi.total)}% daripada jumlah</div>
      </div>
      <div class="kpi-card green" onclick="showSection('pelaksanaan')">
        <div class="kpi-label">Telah Dilaksanakan</div>
        <div class="kpi-value">${kpi.dilaksanakan}</div>
        <div class="kpi-sub">${pct(kpi.dilaksanakan, kpi.total)}% kadar pelaksanaan</div>
      </div>
      <div class="kpi-card" onclick="showSection('perancangan')">
        <div class="kpi-label">Dalam Perancangan</div>
        <div class="kpi-value">${kpi.dalamPerancangan}</div>
        <div class="kpi-sub">Termasuk Draft</div>
      </div>
      <div class="kpi-card yellow" onclick="showSection('kelulusan')">
        <div class="kpi-label">Menunggu Kelulusan</div>
        <div class="kpi-value">${kpi.menungguKelulusan}</div>
        <div class="kpi-sub">Tindakan diperlukan</div>
      </div>
      <div class="kpi-card red" onclick="showSection('perancangan')">
        <div class="kpi-label">Ditangguhkan / Dibatalkan</div>
        <div class="kpi-value">${kpi.tangguhBatal}</div>
        <div class="kpi-sub">Semak status</div>
      </div>
      <div class="kpi-card blue" onclick="showSection('peserta')">
        <div class="kpi-label">Jumlah Sasaran Peserta</div>
        <div class="kpi-value">${kpi.totalSasaran}</div>
        <div class="kpi-sub">Sepanjang 2026</div>
      </div>
      <div class="kpi-card green" onclick="showSection('peserta')">
        <div class="kpi-label">Kehadiran Disahkan</div>
        <div class="kpi-value">${kpi.totalHadir}</div>
        <div class="kpi-sub">Kadar: ${pct(kpi.totalHadir, kpi.totalSasaran)}%</div>
      </div>
      <div class="kpi-card orange" onclick="showSection('kewangan')">
        <div class="kpi-label">Jumlah Peruntukan Diluluskan</div>
        <div class="kpi-value" style="font-size:18px">${rmFmt(kpi.totalDiluluskan)}</div>
        <div class="kpi-sub">Anggaran: ${rmFmt(kpi.totalAnggar)}</div>
      </div>
      <div class="kpi-card red" onclick="showSection('kewangan')">
        <div class="kpi-label">Perbelanjaan Sebenar Disahkan</div>
        <div class="kpi-value" style="font-size:18px">${rmFmt(kpi.totalBelanja)}</div>
        <div class="kpi-sub">${pct(kpi.totalBelanja, kpi.totalDiluluskan)}% penggunaan</div>
      </div>
      <div class="kpi-card green" onclick="showSection('kewangan')">
        <div class="kpi-label">Baki Peruntukan Disahkan</div>
        <div class="kpi-value" style="font-size:18px">${rmFmt(kpi.baki)}</div>
        <div class="kpi-sub">Peruntukan − Perbelanjaan</div>
      </div>
      <div class="kpi-card red" onclick="showSection('laporan')">
        <div class="kpi-label">Laporan Belum Lengkap</div>
        <div class="kpi-value">${kpi.laporanBelumLengkap}</div>
        <div class="kpi-sub">Latihan selesai tanpa laporan</div>
      </div>
    </div>

    ${kpi.menungguKelulusan > 0 || D.tindakanSusulan.filter(t=>t.status!=='Selesai').length > 0 ? `
    <div class="alert alert-warning">
      ⚠ Terdapat <strong>${kpi.menungguKelulusan}</strong> latihan menunggu kelulusan dan
      <strong>${D.tindakanSusulan.filter(t=>t.status!=='Selesai').length}</strong> tindakan susulan belum selesai.
      <a href="#" onclick="showSection('tindakan');return false;" style="margin-left:8px;">Lihat Tindakan →</a>
    </div>` : ''}

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Status Pelaksanaan Latihan</div>
        <div class="chart-wrap"><canvas id="chartStatus"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Jadual Latihan Bulanan 2026</div>
        <div class="chart-wrap"><canvas id="chartBulanan"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Peruntukan vs Perbelanjaan Sebenar (RM)</div>
        <div class="chart-wrap"><canvas id="chartBudget"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Aktiviti Latihan mengikut Unit</div>
        <div class="chart-wrap"><canvas id="chartUnit"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Sasaran vs Kehadiran Peserta</div>
        <div class="chart-wrap"><canvas id="chartPeserta"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Kaedah Pelaksanaan Latihan</div>
        <div class="chart-wrap"><canvas id="chartKaedah"></canvas></div>
      </div>
    </div>

    <div class="section-header">
      <div><div class="section-title">Senarai Latihan 2026</div><div class="section-sub">Klik baris untuk butiran penuh</div></div>
      <button class="btn btn-primary btn-sm" onclick="showSection('perancangan')">+ Tambah Latihan</button>
    </div>
    <div class="table-wrap">
      ${renderLatihanTable(D.latihan, true)}
    </div>
  `;

  renderDashboardCharts();
}

function renderDashboardCharts() {
  const lat = D.latihan;
  const green = '#2e7d52', blue = '#1976d2', orange = '#e65100', red = '#c62828', yellow = '#f9a825', purple = '#6a1b9a', teal = '#00695c';

  // Status doughnut
  const statusCounts = {};
  lat.forEach(l => { statusCounts[l.statusLatihan] = (statusCounts[l.statusLatihan] || 0) + 1; });
  charts.status = new Chart(document.getElementById('chartStatus'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{ data: Object.values(statusCounts), backgroundColor: [green, blue, yellow, orange, teal, red, purple, '#b0bec5'], borderWidth: 2 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } } } }
  });

  // Monthly bar
  const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const monthly = Array(12).fill(0);
  lat.forEach(l => {
    const d = l.cad_mula || l.sebenar_mula;
    if (d) { const m = new Date(d).getMonth(); if (m >= 0 && m < 12) monthly[m]++; }
  });
  charts.bulanan = new Chart(document.getElementById('chartBulanan'), {
    type: 'bar',
    data: { labels: months, datasets: [{ label: 'Bilangan Latihan', data: monthly, backgroundColor: green + 'cc', borderColor: green, borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // Budget vs actual
  const top6 = lat.slice(0, 6);
  charts.budget = new Chart(document.getElementById('chartBudget'), {
    type: 'bar',
    data: {
      labels: top6.map(l => l.tajuk.substring(0, 25) + '…'),
      datasets: [
        { label: 'Anggaran (RM)', data: top6.map(l => l.anggaranPerbelanjaan || 0), backgroundColor: blue + '99' },
        { label: 'Sebenar (RM)', data: top6.map(l => l.perbelanjaanSebenar || 0), backgroundColor: green + 'cc' },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true } } }
  });

  // By unit
  const unitCount = {};
  lat.forEach(l => { unitCount[l.unit] = (unitCount[l.unit] || 0) + 1; });
  charts.unit = new Chart(document.getElementById('chartUnit'), {
    type: 'bar',
    data: {
      labels: Object.keys(unitCount).map(k => k.replace('Unit ', '').replace('Bahagian ', '')),
      datasets: [{ label: 'Bilangan', data: Object.values(unitCount), backgroundColor: [green, blue, orange, red, yellow, purple, teal], borderWidth: 0 }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // Participants
  const p6 = lat.filter(l => l.sasaranPeserta).slice(0, 8);
  charts.peserta = new Chart(document.getElementById('chartPeserta'), {
    type: 'bar',
    data: {
      labels: p6.map(l => 'LAT-' + l.bil),
      datasets: [
        { label: 'Sasaran', data: p6.map(l => l.sasaranPeserta || 0), backgroundColor: blue + '99' },
        { label: 'Hadir', data: p6.map(l => l.kehadiranSebenar || 0), backgroundColor: green + 'cc' },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } }, scales: { y: { beginAtZero: true } } }
  });

  // Kaedah pie
  const kaedahCount = {};
  lat.forEach(l => { kaedahCount[l.kaedah] = (kaedahCount[l.kaedah] || 0) + 1; });
  charts.kaedah = new Chart(document.getElementById('chartKaedah'), {
    type: 'pie',
    data: {
      labels: Object.keys(kaedahCount),
      datasets: [{ data: Object.values(kaedahCount), backgroundColor: [green, blue, orange, teal, yellow, purple], borderWidth: 2 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } } } }
  });
}

// ══════════════════════════════════════════════════════════════
// SHARED: Latihan Table
// ══════════════════════════════════════════════════════════════
function renderLatihanTable(data, compact = false) {
  if (!data.length) return '<div class="empty-state"><div class="icon">📋</div><p>Tiada rekod ditemui.</p></div>';
  return `
    <div class="table-scroll">
    <table>
      <thead><tr>
        <th>Bil</th><th>Tajuk Latihan</th><th>Unit</th>
        <th>Tarikh Cadangan</th><th>Kaedah</th>
        <th>Status</th><th>Peserta</th><th>Anggaran</th><th>Tindakan</th>
      </tr></thead>
      <tbody>
      ${data.map(l => `
        <tr onclick="viewLatihan('${l.id}')" style="cursor:pointer">
          <td>${l.bil}</td>
          <td class="wrap-text" style="max-width:220px"><strong>${l.tajuk}</strong>
            ${l.flagMissing && l.flagMissing.length ? `<div class="text-sm text-orange">⚠ ${l.flagMissing.length} medan belum lengkap</div>` : ''}
          </td>
          <td class="nowrap text-sm">${l.unit}</td>
          <td class="nowrap text-sm">${D.formatDate(l.cad_mula)} ${l.cad_tamat ? '– ' + D.formatDate(l.cad_tamat) : ''}</td>
          <td><span class="badge-status status-perancangan">${l.kaedah}</span></td>
          <td><span class="badge-status ${D.statusClass(l.statusLatihan)}">${l.statusLatihan}</span></td>
          <td class="text-right">${l.sasaranPeserta || '<span class="text-muted">—</span>'}</td>
          <td class="text-right rm-amount">${l.anggaranPerbelanjaan ? 'RM ' + Number(l.anggaranPerbelanjaan).toLocaleString('ms-MY') : '<span class="text-muted">—</span>'}</td>
          <td class="nowrap">
            <button class="btn btn-sm btn-blue" onclick="event.stopPropagation();editLatihan('${l.id}')">Edit</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// PERANCANGAN LATIHAN
// ══════════════════════════════════════════════════════════════
function renderPerancangan() {
  const lat = D.latihan;
  document.getElementById('content-area').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Perancangan Latihan 2026</div>
        <div class="section-sub">Daftar, edit dan pantau semua latihan tahunan</div>
      </div>
      <button class="btn btn-primary" onclick="formTambahLatihan()">+ Tambah Latihan Baharu</button>
    </div>
    <div class="filter-bar">
      <div class="filter-item">
        <label>Status</label>
        <select id="fStatus" onchange="applyFilterPerancangan()">
          <option value="">Semua Status</option>
          ${D.STATUS_LATIHAN.map(s=>`<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="filter-item">
        <label>Unit</label>
        <select id="fUnit" onchange="applyFilterPerancangan()">
          <option value="">Semua Unit</option>
          ${D.UNIT.map(u=>`<option>${u}</option>`).join('')}
        </select>
      </div>
      <div class="filter-item">
        <label>Kaedah</label>
        <select id="fKaedah" onchange="applyFilterPerancangan()">
          <option value="">Semua Kaedah</option>
          ${D.KAEDAH.map(k=>`<option>${k}</option>`).join('')}
        </select>
      </div>
      <div class="filter-item">
        <label>Cari Tajuk</label>
        <input id="fCari" type="text" placeholder="Taip untuk cari…" oninput="applyFilterPerancangan()">
      </div>
      <button class="btn btn-secondary btn-sm" onclick="resetFilterPerancangan()">Reset</button>
    </div>
    <div id="perancangan-table" class="table-wrap">
      ${renderLatihanTable(lat)}
    </div>
    <div style="margin-top:20px">
      <div class="section-title" style="margin-bottom:10px">Takwim Latihan 2026</div>
      ${renderCalendarStrip(lat)}
    </div>
  `;
}
window.applyFilterPerancangan = function() {
  const st = document.getElementById('fStatus').value;
  const unit = document.getElementById('fUnit').value;
  const kd = document.getElementById('fKaedah').value;
  const cari = document.getElementById('fCari').value.toLowerCase();
  const filtered = D.latihan.filter(l =>
    (!st || l.statusLatihan === st) &&
    (!unit || l.unit === unit) &&
    (!kd || l.kaedah === kd) &&
    (!cari || l.tajuk.toLowerCase().includes(cari) || l.koordinator.toLowerCase().includes(cari))
  );
  document.getElementById('perancangan-table').innerHTML = renderLatihanTable(filtered);
};
window.resetFilterPerancangan = function() {
  ['fStatus','fUnit','fKaedah'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fCari').value = '';
  document.getElementById('perancangan-table').innerHTML = renderLatihanTable(D.latihan);
};

function renderCalendarStrip(lat) {
  const months = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;">
    ${months.map((m, mi) => {
      const lats = lat.filter(l => {
        const d = l.cad_mula || l.sebenar_mula;
        return d && new Date(d).getMonth() === mi;
      });
      return `<div class="card" style="min-width:160px;flex:1">
        <div class="card-title" style="font-size:12px;color:var(--green-dark)">${m}</div>
        ${lats.length ? lats.map(l=>`<div style="font-size:11px;margin-top:4px;padding:3px 6px;background:var(--green-pale);border-radius:4px;cursor:pointer" onclick="viewLatihan('${l.id}')">${l.tajuk.substring(0,30)}…</div>`).join('') : '<div class="text-sm text-muted" style="margin-top:4px;">Tiada latihan</div>'}
      </div>`;
    }).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// VIEW / EDIT LATIHAN
// ══════════════════════════════════════════════════════════════
window.viewLatihan = function(id) {
  const l = D.latihan.find(x => x.id === id);
  if (!l) return;
  const flagHtml = l.flagMissing && l.flagMissing.length
    ? `<div class="alert alert-warning">⚠ Medan berikut memerlukan pengesahan: <strong>${l.flagMissing.join(', ')}</strong></div>` : '';
  openModal(`Butiran Latihan — ${l.tajuk}`, `
    ${flagHtml}
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab(this,'tab-maklumat')">Maklumat</button>
      <button class="tab-btn" onclick="switchTab(this,'tab-kewangan')">Kewangan</button>
      <button class="tab-btn" onclick="switchTab(this,'tab-dokumen')">Dokumen</button>
      <button class="tab-btn" onclick="switchTab(this,'tab-audit')">Audit Trail</button>
    </div>
    <div id="tab-maklumat" class="tab-panel active">
      <div class="form-grid">
        ${infoRow('ID Latihan', l.id)}
        ${infoRow('Tajuk', l.tajuk)}
        ${infoRow('Unit', l.unit)}
        ${infoRow('Koordinator', l.koordinator)}
        ${infoRow('Kaedah', l.kaedah)}
        ${infoRow('Tempat', l.tempat || l.tempatOnline || '—')}
        ${infoRow('Tarikh Cadangan', D.formatDate(l.cad_mula) + ' – ' + D.formatDate(l.cad_tamat))}
        ${l.jadualDisemak ? infoRow('Jadual Disemak', D.formatDate(l.jadualBaru_mula) + ' – ' + D.formatDate(l.jadualBaru_tamat) + (l.sebabPerubahanJadual ? ' <em>(' + l.sebabPerubahanJadual + ')</em>' : '')) : ''}
        ${infoRow('Tarikh Sebenar', D.formatDate(l.sebenar_mula) + ' – ' + D.formatDate(l.sebenar_tamat))}
        ${infoRow('Bilangan Hari', l.bilHari)}
        ${infoRow('Sasaran Peserta', l.sasaranPeserta)}
        ${infoRow('Kehadiran Sebenar', l.kehadiranSebenar !== null ? l.kehadiranSebenar : '<span class="text-muted">Belum disahkan</span>')}
        ${infoRow('Status Latihan', `<span class="badge-status ${D.statusClass(l.statusLatihan)}">${l.statusLatihan}</span>`)}
        ${infoRow('Status Kelulusan', `<span class="badge-status ${D.statusClass(l.statusKelulusan)}">${l.statusKelulusan}</span>`)}
        ${infoRow('Status Laporan', `<span class="badge-status ${D.statusClass(l.statusLaporan)}">${l.statusLaporan}</span>`)}
        ${infoRow('Objektif', l.objektif)}
        ${infoRow('Kumpulan Sasaran', l.kumpulanSasaran)}
        ${infoRow('Penceramah', l.penceramah)}
        ${infoRow('Catatan', l.catatan || '—')}
      </div>
    </div>
    <div id="tab-kewangan" class="tab-panel">
      <div class="card">
        <div class="fin-row"><span class="fin-label">Anggaran Perbelanjaan</span><span class="fin-value">${D.formatRM(l.anggaranPerbelanjaan)}</span></div>
        <div class="fin-row"><span class="fin-label">Siling Peruntukan</span><span class="fin-value">${D.formatRM(l.silingPeruntukan)}</span></div>
        <div class="fin-row"><span class="fin-label">Peruntukan Diluluskan</span><span class="fin-value ${l.peruntutkanDiluluskan ? 'positive' : 'unconfirmed'}">${D.formatRM(l.peruntutkanDiluluskan)}</span></div>
        <div class="fin-row"><span class="fin-label">Sumber Peruntukan</span><span class="fin-value">${l.sumberPeruntukan}</span></div>
        <div class="fin-row"><span class="fin-label">No. Subwaran</span><span class="fin-value">${l.subwaranNo || '<span class="text-muted">Belum diterima</span>'}</span></div>
        <div class="fin-row"><span class="fin-label">Komitmen Kewangan</span><span class="fin-value">${D.formatRM(l.komitmenKewangan)}</span></div>
        <div class="fin-row"><span class="fin-label">Perbelanjaan Sebenar</span><span class="fin-value ${l.perbelanjaanSebenar !== null ? '' : 'unconfirmed'}">${D.formatRM(l.perbelanjaanSebenar)}</span></div>
        <div class="fin-row"><span class="fin-label">Baki</span><span class="fin-value ${l.baki >= 0 ? 'positive' : 'negative'}">${D.formatRM(l.baki)}</span></div>
        <div class="fin-row"><span class="fin-label">Status Invois</span><span class="fin-value">${l.statusInvois}</span></div>
        <div class="fin-row"><span class="fin-label">Tarikh Bayar</span><span class="fin-value">${D.formatDate(l.tarikhBayar)}</span></div>
        ${l.catatanKewangan ? `<div class="alert alert-info" style="margin-top:8px">${l.catatanKewangan}</div>` : ''}
      </div>
    </div>
    <div id="tab-dokumen" class="tab-panel">
      ${renderDocStatusTable(l)}
    </div>
    <div id="tab-audit" class="tab-panel">
      <div class="timeline">
        ${(l.auditTrail || []).map(a=>`
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">${a.tarikh} — ${a.pengguna}</div>
              <div>${a.tindakan}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  `, `<button class="btn btn-primary" onclick="closeModal();editLatihan('${l.id}')">Edit Rekod</button>
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>`, 'lg');
};

function renderDocStatusTable(l) {
  const docs = [
    { nama: 'Kertas Kerja', status: l.kertasKerja?.status || 'Belum Disediakan' },
    { nama: 'Surat Kelulusan', status: l.kelulusan?.no ? 'Diluluskan' : 'Belum Ada' },
    { nama: 'Senarai Peserta', status: l.kehadiranSebenar ? 'Ada' : 'Belum Disediakan' },
    { nama: 'Rekod Kehadiran', status: l.kehadiranDisahkan ? 'Disahkan' : 'Belum Disahkan' },
    { nama: 'Laporan Latihan', status: l.statusLaporan },
    { nama: 'Bukti Perbelanjaan', status: l.perbelanjaanSebenar !== null ? 'Ada' : 'Belum Ada' },
  ];
  return `<table style="width:100%"><thead><tr><th>Dokumen</th><th>Status</th></tr></thead><tbody>
    ${docs.map(d=>`<tr><td>${d.nama}</td><td><span class="badge-status ${D.statusClass(d.status)}">${d.status}</span></td></tr>`).join('')}
  </tbody></table>`;
}

function infoRow(label, value) {
  return `<div class="form-group"><label>${label}</label><div style="padding:6px 0;font-size:13px">${value ?? '<span class="text-muted">—</span>'}</div></div>`;
}

window.switchTab = function(btn, tabId) {
  const parent = btn.closest('.modal-body') || btn.closest('#content-area');
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = parent.querySelector('#' + tabId) || document.getElementById(tabId);
  if (panel) panel.classList.add('active');
};

// ── Form: Tambah / Edit Latihan ───────────────────────────────
window.formTambahLatihan = function() { openFormLatihan(null); };
window.editLatihan = function(id) { openFormLatihan(D.latihan.find(l => l.id === id)); };

function openFormLatihan(l) {
  const isNew = !l;
  const val = (f, def = '') => l ? (l[f] !== null && l[f] !== undefined ? l[f] : def) : def;
  const optStatus = D.STATUS_LATIHAN.map(s => `<option value="${s}" ${val('statusLatihan') === s ? 'selected' : ''}>${s}</option>`).join('');
  const optKaedah = D.KAEDAH.map(k => `<option value="${k}" ${val('kaedah') === k ? 'selected' : ''}>${k}</option>`).join('');
  const optUnit = D.UNIT.map(u => `<option value="${u}" ${val('unit') === u ? 'selected' : ''}>${u}</option>`).join('');
  const optSumber = D.SUMBER_PERUNTUKAN.map(s => `<option value="${s}" ${val('sumberPeruntukan') === s ? 'selected' : ''}>${s}</option>`).join('');

  openModal(isNew ? 'Tambah Latihan Baharu' : `Edit — ${l.tajuk}`, `
    <form id="formLatihan">
      <div class="form-grid">
        <div class="form-section-title">A. Maklumat Asas</div>
        <div class="form-group full"><label>Tajuk Latihan <span class="required">*</span></label>
          <input name="tajuk" value="${val('tajuk')}" required placeholder="Tajuk penuh latihan"></div>
        <div class="form-group"><label>Unit / Bahagian <span class="required">*</span></label>
          <select name="unit" required>${optUnit}</select></div>
        <div class="form-group"><label>Koordinator</label>
          <input name="koordinator" value="${val('koordinator')}"></div>
        <div class="form-group"><label>Kaedah Pelaksanaan</label>
          <select name="kaedah">${optKaedah}</select></div>
        <div class="form-group"><label>Tempat</label>
          <input name="tempat" value="${val('tempat')}"></div>
        <div class="form-group"><label>Platform Dalam Talian (jika berkaitan)</label>
          <input name="tempatOnline" value="${val('tempatOnline')}"></div>

        <div class="form-section-title">B. Jadual</div>
        <div class="form-group"><label>Tarikh Mula Cadangan <span class="required">*</span></label>
          <input type="date" name="cad_mula" value="${val('cad_mula')}" required></div>
        <div class="form-group"><label>Tarikh Tamat Cadangan</label>
          <input type="date" name="cad_tamat" value="${val('cad_tamat')}"></div>
        <div class="form-group"><label>Bilangan Hari</label>
          <input type="number" name="bilHari" value="${val('bilHari')}" min="1"></div>
        <div class="form-group"><label>Jadual Disemak?</label>
          <select name="jadualDisemak">
            <option value="false" ${!val('jadualDisemak') ? 'selected':''}>Tidak</option>
            <option value="true" ${val('jadualDisemak') ? 'selected':''}>Ya</option>
          </select></div>
        <div class="form-group"><label>Jadual Baharu — Tarikh Mula</label>
          <input type="date" name="jadualBaru_mula" value="${val('jadualBaru_mula')}"></div>
        <div class="form-group"><label>Jadual Baharu — Tarikh Tamat</label>
          <input type="date" name="jadualBaru_tamat" value="${val('jadualBaru_tamat')}"></div>
        <div class="form-group full"><label>Sebab Perubahan Jadual</label>
          <textarea name="sebabPerubahanJadual">${val('sebabPerubahanJadual')}</textarea></div>
        <div class="form-group"><label>Tarikh Sebenar Mula</label>
          <input type="date" name="sebenar_mula" value="${val('sebenar_mula')}"></div>
        <div class="form-group"><label>Tarikh Sebenar Tamat</label>
          <input type="date" name="sebenar_tamat" value="${val('sebenar_tamat')}"></div>

        <div class="form-section-title">C. Peserta</div>
        <div class="form-group"><label>Sasaran Peserta</label>
          <input type="number" name="sasaranPeserta" value="${val('sasaranPeserta')}" min="0"></div>
        <div class="form-group"><label>Kehadiran Sebenar</label>
          <input type="number" name="kehadiranSebenar" value="${val('kehadiranSebenar', '')}" min="0" placeholder="Kosongkan jika belum ada"></div>
        <div class="form-group"><label>Kumpulan Sasaran</label>
          <input name="kumpulanSasaran" value="${val('kumpulanSasaran')}"></div>

        <div class="form-section-title">D. Status</div>
        <div class="form-group"><label>Status Latihan</label>
          <select name="statusLatihan">${optStatus}</select></div>
        <div class="form-group"><label>Status Kelulusan</label>
          <select name="statusKelulusan">${D.STATUS_LATIHAN.map(s=>`<option ${val('statusKelulusan')===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label>Status Laporan</label>
          <select name="statusLaporan">${D.STATUS_LAPORAN.map(s=>`<option ${val('statusLaporan')===s?'selected':''}>${s}</option>`).join('')}</select></div>

        <div class="form-section-title">E. Kewangan</div>
        <div class="form-group"><label>Anggaran Perbelanjaan (RM)</label>
          <input type="number" name="anggaranPerbelanjaan" value="${val('anggaranPerbelanjaan', '')}" min="0" step="0.01" placeholder="Kosongkan jika belum ada"></div>
        <div class="form-group"><label>Siling Peruntukan (RM)</label>
          <input type="number" name="silingPeruntukan" value="${val('silingPeruntukan', '')}" min="0" step="0.01"></div>
        <div class="form-group"><label>Peruntukan Diluluskan (RM)</label>
          <input type="number" name="peruntutkanDiluluskan" value="${val('peruntutkanDiluluskan', '')}" min="0" step="0.01" placeholder="Kosongkan jika belum diluluskan"></div>
        <div class="form-group"><label>Perbelanjaan Sebenar (RM)</label>
          <input type="number" name="perbelanjaanSebenar" value="${val('perbelanjaanSebenar', '')}" min="0" step="0.01" placeholder="Kosongkan jika belum ada"></div>
        <div class="form-group"><label>Sumber Peruntukan</label>
          <select name="sumberPeruntukan">${optSumber}</select></div>
        <div class="form-group"><label>No. Subwaran</label>
          <input name="subwaranNo" value="${val('subwaranNo')}"></div>

        <div class="form-section-title">F. Lain-lain</div>
        <div class="form-group full"><label>Objektif Latihan</label>
          <textarea name="objektif">${val('objektif')}</textarea></div>
        <div class="form-group"><label>Penceramah / Fasilitator</label>
          <input name="penceramah" value="${val('penceramah')}"></div>
        <div class="form-group"><label>Penganjur</label>
          <input name="penganjur" value="${val('penganjur')}"></div>
        <div class="form-group"><label>Kategori Latihan</label>
          <input name="kategorLatihan" value="${val('kategorLatihan')}"></div>
        <div class="form-group full"><label>Catatan</label>
          <textarea name="catatan">${val('catatan')}</textarea></div>
      </div>
    </form>
  `, `
    <button class="btn btn-primary" onclick="saveFormLatihan('${isNew ? 'NEW' : l.id}')">💾 Simpan</button>
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
  `, 'xl');
}

window.saveFormLatihan = function(id) {
  const form = document.getElementById('formLatihan');
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  const numOrNull = (v) => v === '' ? null : Number(v);

  const patch = {
    tajuk: fd.get('tajuk'),
    unit: fd.get('unit'),
    koordinator: fd.get('koordinator'),
    kaedah: fd.get('kaedah'),
    tempat: fd.get('tempat') || null,
    tempatOnline: fd.get('tempatOnline') || null,
    cad_mula: fd.get('cad_mula') || null,
    cad_tamat: fd.get('cad_tamat') || null,
    bilHari: numOrNull(fd.get('bilHari')),
    jadualDisemak: fd.get('jadualDisemak') === 'true',
    jadualBaru_mula: fd.get('jadualBaru_mula') || null,
    jadualBaru_tamat: fd.get('jadualBaru_tamat') || null,
    sebabPerubahanJadual: fd.get('sebabPerubahanJadual') || null,
    sebenar_mula: fd.get('sebenar_mula') || null,
    sebenar_tamat: fd.get('sebenar_tamat') || null,
    sasaranPeserta: numOrNull(fd.get('sasaranPeserta')),
    kehadiranSebenar: numOrNull(fd.get('kehadiranSebenar')),
    statusLatihan: fd.get('statusLatihan'),
    statusKelulusan: fd.get('statusKelulusan'),
    statusLaporan: fd.get('statusLaporan'),
    anggaranPerbelanjaan: numOrNull(fd.get('anggaranPerbelanjaan')),
    silingPeruntukan: numOrNull(fd.get('silingPeruntukan')),
    peruntutkanDiluluskan: numOrNull(fd.get('peruntutkanDiluluskan')),
    perbelanjaanSebenar: numOrNull(fd.get('perbelanjaanSebenar')),
    sumberPeruntukan: fd.get('sumberPeruntukan'),
    subwaranNo: fd.get('subwaranNo') || null,
    objektif: fd.get('objektif'),
    penceramah: fd.get('penceramah'),
    penganjur: fd.get('penganjur'),
    kategorLatihan: fd.get('kategorLatihan'),
    catatan: fd.get('catatan') || null,
  };

  // Compute baki
  if (patch.peruntutkanDiluluskan !== null && patch.perbelanjaanSebenar !== null) {
    patch.baki = patch.peruntutkanDiluluskan - patch.perbelanjaanSebenar;
  } else {
    patch.baki = null;
  }

  if (id === 'NEW') {
    const newId = 'LAT-2026-' + String(D.latihan.length + 1).padStart(3, '0');
    const newBil = D.latihan.length + 1;
    const newRec = Object.assign({ id: newId, bil: newBil, kehadiranDisahkan: false, subwaranDisahkan: false, komitmenKewangan: 0, poNo: null, statusInvois: 'Belum Berkaitan', tarikhBayar: null, catatanKewangan: null, kertasKerja: { status: 'Belum Disediakan' }, kelulusan: {}, flagMissing: [], auditTrail: [] }, patch);
    newRec.auditTrail.push({ tarikh: new Date().toISOString().split('T')[0], pengguna: D.tetapan.penggunaSemasa, tindakan: 'Rekod baharu dicipta', perubahan: {} });
    D.latihan.push(newRec);
    toast('Rekod latihan baharu berjaya disimpan.', 'success');
  } else {
    const idx = D.latihan.findIndex(l => l.id === id);
    if (idx !== -1) {
      const old = D.latihan[idx];
      const changes = {};
      Object.keys(patch).forEach(k => { if (old[k] !== patch[k]) changes[k] = [old[k], patch[k]]; });
      Object.assign(D.latihan[idx], patch);
      D.latihan[idx].auditTrail = D.latihan[idx].auditTrail || [];
      D.latihan[idx].auditTrail.push({ tarikh: new Date().toISOString().split('T')[0], pengguna: D.tetapan.penggunaSemasa, tindakan: 'Rekod dikemas kini', perubahan: changes });
      toast('Rekod berjaya dikemas kini.', 'success');
    }
  }
  closeModal();
  showSection(currentSection);
};

// ══════════════════════════════════════════════════════════════
// KERTAS KERJA
// ══════════════════════════════════════════════════════════════
function renderKertasKerja() {
  document.getElementById('content-area').innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Penjana Kertas Kerja Latihan</div>
      <div class="section-sub">Jana kertas kerja berstruktur berdasarkan rekod latihan</div></div>
    </div>
    <div class="alert alert-info">ℹ Pilih latihan di bawah untuk menjana draf kertas kerja. Semua bahagian boleh diedit sebelum mencetak.</div>
    <div class="filter-bar">
      <div class="filter-item"><label>Pilih Latihan</label>
        <select id="kkSelectLatihan" onchange="loadKertasKerja(this.value)" style="min-width:300px">
          <option value="">— Pilih latihan —</option>
          ${D.latihan.map(l=>`<option value="${l.id}">[${l.bil}] ${l.tajuk}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="kkPreview"></div>
  `;
}
window.loadKertasKerja = function(id) {
  if (!id) { document.getElementById('kkPreview').innerHTML = ''; return; }
  const l = D.latihan.find(x => x.id === id);
  document.getElementById('kkPreview').innerHTML = `
    <div class="card" style="max-width:800px;margin:0 auto">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-weight:700;font-size:15px">KERTAS KERJA</div>
        <div style="font-weight:700;font-size:14px;margin-top:4px">${l.tajuk.toUpperCase()}</div>
        <div style="font-size:12px;color:var(--gray-500);margin-top:4px">${l.unit} | Tahun 2026</div>
      </div>
      ${kkSection('1. TUJUAN', `Kertas kerja ini bertujuan memohon kelulusan untuk pelaksanaan <strong>${l.tajuk}</strong> yang dirancang pada ${D.formatDate(l.cad_mula)} hingga ${D.formatDate(l.cad_tamat)}.`)}
      ${kkSection('2. LATAR BELAKANG', l.objektif || '<em class="text-muted">[Sila isi latar belakang]</em>')}
      ${kkSection('3. OBJEKTIF LATIHAN', l.objektif ? `<ul><li>${l.objektif}</li></ul>` : '<em class="text-muted">[Sila isi objektif]</em>')}
      ${kkSection('4. KUMPULAN SASARAN DAN BILANGAN PESERTA', `<p><strong>Kumpulan Sasaran:</strong> ${l.kumpulanSasaran || '—'}</p><p><strong>Bilangan Peserta:</strong> ${l.sasaranPeserta || '—'} orang</p>`)}
      ${kkSection('5. BUTIRAN PELAKSANAAN', `
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:4px 8px;width:180px;background:var(--gray-100)"><strong>Tarikh</strong></td><td style="padding:4px 8px">${D.formatDate(l.cad_mula)} – ${D.formatDate(l.cad_tamat)}</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Tempoh</strong></td><td style="padding:4px 8px">${l.bilHari || '—'} hari</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Tempat</strong></td><td style="padding:4px 8px">${l.tempat || l.tempatOnline || '—'}</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Kaedah</strong></td><td style="padding:4px 8px">${l.kaedah}</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Penganjur</strong></td><td style="padding:4px 8px">${l.penganjur || l.unit}</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Penceramah</strong></td><td style="padding:4px 8px">${l.penceramah || '—'}</td></tr>
        </table>`)}
      ${kkSection('6. IMPLIKASI KEWANGAN', `
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:4px 8px;width:220px;background:var(--gray-100)"><strong>Anggaran Perbelanjaan</strong></td><td style="padding:4px 8px">${D.formatRM(l.anggaranPerbelanjaan)}</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Siling Peruntukan</strong></td><td style="padding:4px 8px">${D.formatRM(l.silingPeruntukan)}</td></tr>
          <tr><td style="padding:4px 8px;background:var(--gray-100)"><strong>Sumber Peruntukan</strong></td><td style="padding:4px 8px">${l.sumberPeruntukan}</td></tr>
        </table>`)}
      ${kkSection('7. PENUTUP', `Adalah dipohon pihak pengurusan memberikan pertimbangan dan kelulusan untuk pelaksanaan program ini.`)}
      <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;font-size:12px">
        <div style="border-top:1px solid #ccc;padding-top:8px"><strong>Disediakan Oleh</strong><br><br><br>${l.koordinator || '_______________'}<br><em>${l.unit}</em></div>
        <div style="border-top:1px solid #ccc;padding-top:8px"><strong>Disemak Oleh</strong><br><br><br>_______________<br><em>Ketua Unit</em></div>
        <div style="border-top:1px solid #ccc;padding-top:8px"><strong>Diluluskan Oleh</strong><br><br><br>_______________<br><em>Pengarah Bahagian Kurikulum</em></div>
      </div>
      <div class="alert alert-warning" style="margin-top:16px">⚠ Ini adalah draf yang dijana secara automatik. Semak dan lengkapkan semua bahagian sebelum mengemukakan untuk kelulusan. Tandatangan, nombor rujukan dan keputusan rasmi TIDAK boleh dibuat secara automatik.</div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-primary no-print" onclick="window.print()">🖨 Cetak</button>
        <button class="btn btn-secondary no-print" onclick="exportKKText('${l.id}')">📋 Salin Teks</button>
      </div>
    </div>`;
};
function kkSection(title, content) {
  return `<div style="margin-bottom:14px"><div style="font-weight:600;font-size:13px;color:var(--green-dark);border-bottom:1px solid var(--green-border);padding-bottom:4px;margin-bottom:8px">${title}</div><div style="font-size:13px;line-height:1.7">${content}</div></div>`;
}
window.exportKKText = function(id) {
  const el = document.querySelector('#kkPreview .card');
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => toast('Teks disalin ke papan klip.', 'success'));
};

// ══════════════════════════════════════════════════════════════
// KELULUSAN
// ══════════════════════════════════════════════════════════════
function renderKelulusan() {
  const pending = D.latihan.filter(l => l.statusKelulusan === 'Menunggu Kelulusan');
  const approved = D.latihan.filter(l => l.statusKelulusan === 'Diluluskan');
  document.getElementById('content-area').innerHTML = `
    <div class="tabs" id="kelulusanTabs">
      <button class="tab-btn active" onclick="switchTabSection(this,'kTab1')">Menunggu Kelulusan (${pending.length})</button>
      <button class="tab-btn" onclick="switchTabSection(this,'kTab2')">Telah Diluluskan (${approved.length})</button>
      <button class="tab-btn" onclick="switchTabSection(this,'kTab3')">Semua Latihan (${D.latihan.length})</button>
    </div>
    <div id="kTab1" class="tab-panel active">
      ${pending.length ? renderLatihanTable(pending) : '<div class="empty-state"><div class="icon">✅</div><p>Tiada latihan menunggu kelulusan.</p></div>'}
    </div>
    <div id="kTab2" class="tab-panel">${renderLatihanTable(approved)}</div>
    <div id="kTab3" class="tab-panel">${renderLatihanTable(D.latihan)}</div>
  `;
}
window.switchTabSection = function(btn, tabId) {
  const tabs = btn.closest('.tabs');
  if (!tabs) return;
  const container = tabs.parentElement;
  container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');
};

// ══════════════════════════════════════════════════════════════
// PELAKSANAAN
// ══════════════════════════════════════════════════════════════
function renderPelaksanaan() {
  const done = D.latihan.filter(l => l.statusLatihan === 'Telah Dilaksanakan');
  const inprog = D.latihan.filter(l => l.statusLatihan === 'Dalam Pelaksanaan');
  const upcoming = D.latihan.filter(l => ['Diluluskan','Dalam Perancangan'].includes(l.statusLatihan));
  document.getElementById('content-area').innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Pelaksanaan Latihan</div><div class="section-sub">Pantau senarai semak dan kemaskini status pelaksanaan</div></div>
    </div>
    <div class="tabs" id="pelakTabs">
      <button class="tab-btn active" onclick="switchTabSection(this,'pTab1')">Akan Datang (${upcoming.length})</button>
      <button class="tab-btn" onclick="switchTabSection(this,'pTab2')">Dalam Pelaksanaan (${inprog.length})</button>
      <button class="tab-btn" onclick="switchTabSection(this,'pTab3')">Telah Dilaksanakan (${done.length})</button>
    </div>
    <div id="pTab1" class="tab-panel active">
      ${upcoming.length ? renderLatihanTable(upcoming) : '<div class="empty-state"><div class="icon">📅</div><p>Tiada latihan akan datang.</p></div>'}
    </div>
    <div id="pTab2" class="tab-panel">
      ${inprog.length ? renderLatihanTable(inprog) : '<div class="empty-state"><div class="icon">▶</div><p>Tiada latihan dalam pelaksanaan.</p></div>'}
    </div>
    <div id="pTab3" class="tab-panel">
      ${done.length ? renderLatihanTable(done) : '<div class="empty-state"><div class="icon">✅</div><p>Tiada latihan selesai dilaksanakan.</p></div>'}
    </div>
    <div style="margin-top:20px">
      <div class="section-title" style="margin-bottom:10px">Senarai Semak Pelaksanaan</div>
      ${renderChecklistSelector()}
    </div>
  `;
}
function renderChecklistSelector() {
  return `<div class="filter-bar"><div class="filter-item"><label>Pilih Latihan</label>
    <select onchange="loadChecklist(this.value)" style="min-width:280px">
      <option value="">— Pilih latihan —</option>
      ${D.latihan.map(l=>`<option value="${l.id}">[${l.bil}] ${l.tajuk}</option>`).join('')}
    </select></div></div><div id="checklistArea"></div>`;
}
window.loadChecklist = function(id) {
  if (!id) { document.getElementById('checklistArea').innerHTML = ''; return; }
  const l = D.latihan.find(x => x.id === id);
  const checkGroup = (title, items) => `
    <div style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:8px;color:var(--green-dark)">${title}</div>
      ${items.map((item,i) => `<div class="checklist-item">
        <input type="checkbox" id="ck_${i}_${id}" onchange="this.nextElementSibling.classList.toggle('done',this.checked)">
        <label class="checklist-label" for="ck_${i}_${id}">${item}</label>
      </div>`).join('')}
    </div>`;
  document.getElementById('checklistArea').innerHTML = `
    <div class="card" style="max-width:700px">
      <div class="card-title">Senarai Semak: ${l.tajuk}</div>
      ${checkGroup('Sebelum Latihan', ['Keperluan latihan dan objektif disahkan','Kertas kerja disediakan','Kelulusan diperoleh','Peruntukan disahkan','Penceramah / penyedia dilantik','Tempat atau platform dalam talian disahkan','Jemputan dan pendaftaran peserta selesai','Jadual program ditetapkan','Bahan latihan disediakan','Urusan perolehan dan logistik selesai','Pelan risiko dan kontingensi disediakan'])}
      ${checkGroup('Semasa Latihan', ['Kehadiran direkodkan','Program dilaksanakan mengikut jadual','Kehadiran penceramah dan fasilitator disahkan','Bahan latihan diagihkan','Maklum balas peserta dikumpulkan','Perubahan atau insiden didokumentasikan','Gambar dan bukti pelaksanaan diambil'])}
      ${checkGroup('Selepas Latihan', ['Kehadiran disahkan','Penilaian peserta dianalisis','Status perbelanjaan dan pembayaran dikemas kini','Bayaran penceramah diproses','Laporan latihan disediakan','Sijil dikeluarkan','Dokumen sokongan diarkib','Tindakan CQI dikenal pasti','Tindakan tertangguh ditugaskan'])}
    </div>`;
};

// ══════════════════════════════════════════════════════════════
// PESERTA & KEHADIRAN
// ══════════════════════════════════════════════════════════════
function renderPeserta() {
  const kpi = D.getKPI();
  const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '—';
  document.getElementById('content-area').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card blue"><div class="kpi-label">Jumlah Sasaran Peserta</div><div class="kpi-value">${kpi.totalSasaran}</div></div>
      <div class="kpi-card green"><div class="kpi-label">Kehadiran Disahkan</div><div class="kpi-value">${kpi.totalHadir}</div></div>
      <div class="kpi-card"><div class="kpi-label">Kadar Kehadiran Keseluruhan</div><div class="kpi-value">${pct(kpi.totalHadir, kpi.totalSasaran)}</div></div>
    </div>
    <div class="section-header">
      <div><div class="section-title">Kehadiran Mengikut Latihan</div></div>
    </div>
    <div class="table-wrap">
      <div class="table-scroll"><table>
        <thead><tr><th>Bil</th><th>Tajuk Latihan</th><th>Sasaran</th><th>Hadir</th><th>Kadar Kehadiran</th><th>Status Pengesahan</th></tr></thead>
        <tbody>
        ${D.latihan.map(l => {
          const rate = l.sasaranPeserta && l.kehadiranSebenar !== null ? (l.kehadiranSebenar / l.sasaranPeserta * 100).toFixed(1) : null;
          const rateColor = rate ? (rate >= 80 ? 'var(--green-mid)' : rate >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)') : '';
          return `<tr onclick="viewLatihan('${l.id}')" style="cursor:pointer">
            <td>${l.bil}</td>
            <td class="wrap-text" style="max-width:240px">${l.tajuk}</td>
            <td class="text-right">${l.sasaranPeserta || '<span class="text-muted">—</span>'}</td>
            <td class="text-right">${l.kehadiranSebenar !== null ? l.kehadiranSebenar : '<span class="text-muted">Belum ada</span>'}</td>
            <td>${rate ? `<span style="font-weight:600;color:${rateColor}">${rate}%</span>` : '<span class="text-muted">—</span>'}</td>
            <td><span class="badge-status ${l.kehadiranDisahkan ? 'status-dilaksanakan' : 'status-belum'}">${l.kehadiranDisahkan ? 'Disahkan' : 'Belum Disahkan'}</span></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// PERUNTUKAN & KEWANGAN
// ══════════════════════════════════════════════════════════════
function renderKewangan() {
  const kpi = D.getKPI();
  const rmFmt = v => v !== null && v !== undefined ? 'RM ' + Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2 }) : '<span class="text-muted">—</span>';
  const warnings = D.latihan.filter(l =>
    (l.anggaranPerbelanjaan && l.silingPeruntukan && l.anggaranPerbelanjaan > l.silingPeruntukan) ||
    (l.peruntutkanDiluluskan && l.perbelanjaanSebenar && l.perbelanjaanSebenar > l.peruntutkanDiluluskan)
  );
  document.getElementById('content-area').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card orange"><div class="kpi-label">Jumlah Anggaran</div><div class="kpi-value" style="font-size:18px">${rmFmt(kpi.totalAnggar)}</div></div>
      <div class="kpi-card blue"><div class="kpi-label">Peruntukan Diluluskan</div><div class="kpi-value" style="font-size:18px">${rmFmt(kpi.totalDiluluskan)}</div></div>
      <div class="kpi-card red"><div class="kpi-label">Perbelanjaan Sebenar</div><div class="kpi-value" style="font-size:18px">${rmFmt(kpi.totalBelanja)}</div></div>
      <div class="kpi-card green"><div class="kpi-label">Baki Peruntukan</div><div class="kpi-value" style="font-size:18px">${rmFmt(kpi.baki)}</div></div>
    </div>
    ${warnings.length ? `<div class="alert alert-error">⚠ <strong>${warnings.length} latihan</strong> mempunyai isu kewangan (perbelanjaan melebihi peruntukan). Semak segera.</div>` : ''}
    <div class="section-header"><div class="section-title">Butiran Kewangan Semua Latihan</div></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Bil</th><th>Tajuk</th><th>Anggaran</th><th>Peruntukan</th><th>Subwaran</th><th>Belanja Sebenar</th><th>Baki</th><th>Status</th></tr></thead>
      <tbody>
      ${D.latihan.map(l => {
        const overBudget = l.perbelanjaanSebenar && l.peruntutkanDiluluskan && l.perbelanjaanSebenar > l.peruntutkanDiluluskan;
        return `<tr onclick="viewLatihan('${l.id}')" style="cursor:pointer${overBudget ? ';background:#fff5f5' : ''}">
          <td>${l.bil}</td>
          <td class="wrap-text" style="max-width:200px">${l.tajuk}</td>
          <td class="text-right rm-amount">${rmFmt(l.anggaranPerbelanjaan)}</td>
          <td class="text-right rm-amount">${l.peruntutkanDiluluskan ? '<span style="color:var(--green-mid);font-weight:600">' + rmFmt(l.peruntutkanDiluluskan) + '</span>' : '<span class="text-muted">—</span>'}</td>
          <td>${l.subwaranNo ? `<span class="text-sm">${l.subwaranNo}</span>` : '<span class="text-muted">Belum ada</span>'}</td>
          <td class="text-right rm-amount">${l.perbelanjaanSebenar !== null ? rmFmt(l.perbelanjaanSebenar) : '<span class="text-muted">Belum ada</span>'}</td>
          <td class="text-right rm-amount ${l.baki !== null ? (l.baki >= 0 ? '' : 'text-red') : ''}">${l.baki !== null ? rmFmt(l.baki) : '<span class="text-muted">—</span>'}</td>
          <td><span class="badge-status ${l.baki !== null && l.baki < 0 ? 'status-error' : 'status-diluluskan'}">${l.statusKewangan}</span></td>
        </tr>`;
      }).join('')}
      </tbody>
      <tfoot><tr style="background:var(--gray-100);font-weight:600">
        <td colspan="2">JUMLAH</td>
        <td class="text-right">${rmFmt(kpi.totalAnggar)}</td>
        <td class="text-right">${rmFmt(kpi.totalDiluluskan)}</td>
        <td></td>
        <td class="text-right">${rmFmt(kpi.totalBelanja)}</td>
        <td class="text-right">${rmFmt(kpi.baki)}</td>
        <td></td>
      </tr></tfoot>
    </table></div></div>`;
}

// ══════════════════════════════════════════════════════════════
// LAPORAN
// ══════════════════════════════════════════════════════════════
function renderLaporan() {
  document.getElementById('content-area').innerHTML = `
    <div class="section-header"><div><div class="section-title">Jana Laporan</div><div class="section-sub">Laporan rasmi berdasarkan data sistem</div></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:20px">
      ${[
        ['Pelan Latihan Tahunan 2026','📋','Senarai lengkap semua latihan 2026','laporanPlan'],
        ['Laporan Pelaksanaan Bulanan','📅','Status pelaksanaan mengikut bulan','laporanBulanan'],
        ['Laporan Status Latihan','📊','Ringkasan status semua latihan','laporanStatus'],
        ['Analisis Kehadiran Peserta','👥','Sasaran vs kehadiran sebenar','laporanPeserta'],
        ['Laporan Perbelanjaan & Peruntukan','💰','Penggunaan bajet mengikut latihan','laporanKewangan'],
        ['Laporan Tindakan Tertunggak','🔔','Tindakan susulan belum selesai','laporanTindakan'],
        ['Laporan Latihan Pasca-Pelaksanaan','📝','Latihan selesai dengan status laporan','laporanPasca'],
      ].map(([title,icon,desc,fn]) => `
        <div class="card" style="cursor:pointer" onclick="generateLaporan('${fn}')">
          <div style="font-size:28px;margin-bottom:8px">${icon}</div>
          <div class="card-title">${title}</div>
          <div class="text-sm" style="color:var(--gray-500);margin-top:4px">${desc}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px">Jana Laporan →</button>
        </div>`).join('')}
    </div>
    <div id="laporanOutput"></div>
  `;
}
window.generateLaporan = function(type) {
  const out = document.getElementById('laporanOutput');
  const now = new Date().toLocaleDateString('ms-MY');
  let html = '';
  if (type === 'laporanPlan') {
    html = `<div class="card"><div style="font-weight:700;font-size:14px;margin-bottom:4px">PELAN LATIHAN TAHUNAN 2026 — BAHAGIAN KURIKULUM, JPPKK</div>
      <div class="text-sm text-muted">Dijana: ${now} | Data: ${D.latihan.length} rekod</div>
      ${renderLatihanTable(D.latihan)}
      <button class="btn btn-primary btn-sm no-print" style="margin-top:10px" onclick="window.print()">🖨 Cetak</button></div>`;
  } else if (type === 'laporanKewangan') {
    const kpi = D.getKPI();
    html = `<div class="card"><div style="font-weight:700;font-size:14px;margin-bottom:4px">LAPORAN PERUNTUKAN DAN PERBELANJAAN LATIHAN 2026</div>
      <div class="text-sm text-muted">Dijana: ${now}</div>
      <div class="fin-row" style="margin-top:12px"><span>Jumlah Anggaran Perbelanjaan</span><span class="fin-value">${D.formatRM(kpi.totalAnggar)}</span></div>
      <div class="fin-row"><span>Jumlah Peruntukan Diluluskan</span><span class="fin-value positive">${D.formatRM(kpi.totalDiluluskan)}</span></div>
      <div class="fin-row"><span>Jumlah Perbelanjaan Sebenar (Disahkan)</span><span class="fin-value">${D.formatRM(kpi.totalBelanja)}</span></div>
      <div class="fin-row"><span>Baki Peruntukan</span><span class="fin-value ${kpi.baki >= 0 ? 'positive' : 'negative'}">${D.formatRM(kpi.baki)}</span></div>
      <div class="alert alert-info" style="margin-top:8px">⚠ Angka di atas hanya meliputi rekod yang telah disahkan. Medan kosong tidak dikira sebagai sifar.</div>
    </div>`;
  } else if (type === 'laporanStatus') {
    const statusSummary = {};
    D.latihan.forEach(l => { statusSummary[l.statusLatihan] = (statusSummary[l.statusLatihan] || 0) + 1; });
    html = `<div class="card"><div style="font-weight:700;font-size:14px;margin-bottom:12px">LAPORAN STATUS LATIHAN 2026</div>
      <div class="table-scroll"><table><thead><tr><th>Status</th><th>Bilangan</th><th>Peratusan</th></tr></thead><tbody>
      ${Object.entries(statusSummary).map(([s,n]) => `<tr><td><span class="badge-status ${D.statusClass(s)}">${s}</span></td><td class="text-right">${n}</td><td class="text-right">${(n/D.latihan.length*100).toFixed(1)}%</td></tr>`).join('')}
      </tbody></table></div></div>`;
  } else if (type === 'laporanTindakan') {
    const open = D.tindakanSusulan.filter(t => t.status !== 'Selesai');
    html = `<div class="card"><div style="font-weight:700;font-size:14px;margin-bottom:12px">LAPORAN TINDAKAN TERTUNGGAK</div>
      ${open.length ? renderTindakanTable(open) : '<div class="empty-state"><div class="icon">✅</div><p>Tiada tindakan tertunggak.</p></div>'}
    </div>`;
  } else {
    html = `<div class="alert alert-info">Laporan jenis ini sedang dibangunkan. Gunakan eksport Excel untuk data penuh.</div>`;
  }
  out.innerHTML = html;
};

// ══════════════════════════════════════════════════════════════
// PENILAIAN & CQI
// ══════════════════════════════════════════════════════════════
function renderPenilaian() {
  document.getElementById('content-area').innerHTML = `
    <div class="tabs" id="penilaianTabs">
      <button class="tab-btn active" onclick="switchTabSection(this,'penTab1')">Penilaian Peserta</button>
      <button class="tab-btn" onclick="switchTabSection(this,'penTab2')">Daftar Tindakan CQI</button>
    </div>
    <div id="penTab1" class="tab-panel active">
      <div class="section-header">
        <div><div class="section-title">Penilaian Peserta</div></div>
        <button class="btn btn-primary btn-sm" onclick="formTambahPenilaian()">+ Tambah Penilaian</button>
      </div>
      ${D.penilaian.length ? `
        <div class="table-wrap"><div class="table-scroll"><table>
          <thead><tr><th>Latihan</th><th>Tarikh</th><th>Responden</th><th>Kepuasan</th><th>Relevan</th><th>Penceramah</th><th>Objektif</th><th>Peningkatan Ilmu</th></tr></thead>
          <tbody>
          ${D.penilaian.map(p => {
            const l = D.latihan.find(x => x.id === p.latihanId);
            const stars = (v) => v ? '★'.repeat(Math.round(v)) + `<span class="text-sm"> (${v})</span>` : '—';
            return `<tr><td class="wrap-text" style="max-width:180px">${l ? l.tajuk : p.latihanId}</td>
              <td>${D.formatDate(p.tarikhPenilaian)}</td>
              <td class="text-right">${p.bilResponden}</td>
              <td>${stars(p.kepuasanPeserta)}</td>
              <td>${stars(p.relevansKandungan)}</td>
              <td>${stars(p.keberkesananPenceramah)}</td>
              <td>${stars(p.pencapaianObjektif)}</td>
              <td>${stars(p.peningkatanIlmu)}</td>
            </tr>`;
          }).join('')}
          </tbody>
        </table></div></div>` : '<div class="empty-state"><div class="icon">⭐</div><p>Tiada rekod penilaian. Tambah rekod penilaian selepas setiap latihan.</p></div>'}
    </div>
    <div id="penTab2" class="tab-panel">
      <div class="section-header">
        <div><div class="section-title">Daftar Tindakan CQI</div></div>
        <button class="btn btn-primary btn-sm" onclick="formTambahCQI()">+ Tambah Tindakan CQI</button>
      </div>
      ${renderCQITable()}
    </div>
  `;
}
function renderCQITable() {
  if (!D.cqiActions.length) return '<div class="empty-state"><div class="icon">🔄</div><p>Tiada tindakan CQI direkodkan.</p></div>';
  return `<div class="table-wrap"><div class="table-scroll"><table>
    <thead><tr><th>ID</th><th>Dapatan</th><th>Tindakan</th><th>Pegawai</th><th>Sasaran</th><th>Status</th></tr></thead>
    <tbody>
    ${D.cqiActions.map(c => `<tr>
      <td class="nowrap text-sm">${c.id}</td>
      <td class="wrap-text" style="max-width:200px">${c.dapatan}</td>
      <td class="wrap-text" style="max-width:180px">${c.tindakan}</td>
      <td>${c.pegawaiBertanggungjawab}</td>
      <td class="nowrap">${D.formatDate(c.tarikhSasaran)}</td>
      <td><span class="badge-status ${c.statusTindakan === 'Selesai' ? 'status-dilaksanakan' : c.statusTindakan === 'Dalam Proses' ? 'status-pelaksanaan' : 'status-menunggu'}">${c.statusTindakan}</span></td>
    </tr>`).join('')}
    </tbody>
  </table></div></div>`;
}
window.formTambahPenilaian = function() {
  openModal('Tambah Penilaian Peserta', `
    <form id="formPenilaian">
      <div class="form-grid">
        <div class="form-group full"><label>Latihan <span class="required">*</span></label>
          <select name="latihanId" required><option value="">— Pilih latihan —</option>
            ${D.latihan.map(l=>`<option value="${l.id}">[${l.bil}] ${l.tajuk}</option>`).join('')}
          </select></div>
        <div class="form-group"><label>Tarikh Penilaian</label><input type="date" name="tarikhPenilaian"></div>
        <div class="form-group"><label>Bilangan Responden</label><input type="number" name="bilResponden" min="0"></div>
        <div class="form-group"><label>Kepuasan Peserta (1-5)</label><input type="number" name="kepuasanPeserta" min="1" max="5" step="0.1"></div>
        <div class="form-group"><label>Relevan Kandungan (1-5)</label><input type="number" name="relevansKandungan" min="1" max="5" step="0.1"></div>
        <div class="form-group"><label>Keberkesanan Penceramah (1-5)</label><input type="number" name="keberkesananPenceramah" min="1" max="5" step="0.1"></div>
        <div class="form-group"><label>Pencapaian Objektif (1-5)</label><input type="number" name="pencapaianObjektif" min="1" max="5" step="0.1"></div>
        <div class="form-group"><label>Peningkatan Ilmu (1-5)</label><input type="number" name="peningkatanIlmu" min="1" max="5" step="0.1"></div>
        <div class="form-group full"><label>Ulasan / Cadangan</label><textarea name="ulasan"></textarea></div>
      </div>
    </form>`, `<button class="btn btn-primary" onclick="savePenilaian()">Simpan</button><button class="btn btn-secondary" onclick="closeModal()">Batal</button>`);
};
window.savePenilaian = function() {
  const form = document.getElementById('formPenilaian');
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  const numOrNull = v => v === '' ? null : Number(v);
  D.penilaian.push({
    id: 'EVAL-' + String(D.penilaian.length + 1).padStart(3,'0'),
    latihanId: fd.get('latihanId'),
    tarikhPenilaian: fd.get('tarikhPenilaian'),
    bilResponden: numOrNull(fd.get('bilResponden')),
    kepuasanPeserta: numOrNull(fd.get('kepuasanPeserta')),
    relevansKandungan: numOrNull(fd.get('relevansKandungan')),
    keberkesananPenceramah: numOrNull(fd.get('keberkesananPenceramah')),
    pencapaianObjektif: numOrNull(fd.get('pencapaianObjektif')),
    peningkatanIlmu: numOrNull(fd.get('peningkatanIlmu')),
    ulasan: fd.get('ulasan'),
    cqiDikenal: false,
  });
  toast('Rekod penilaian disimpan.','success'); closeModal(); renderPenilaian();
};
window.formTambahCQI = function() {
  openModal('Tambah Tindakan CQI', `
    <form id="formCQI">
      <div class="form-grid">
        <div class="form-group full"><label>Dapatan / Isu <span class="required">*</span></label><textarea name="dapatan" required></textarea></div>
        <div class="form-group full"><label>Punca Masalah</label><textarea name="punca"></textarea></div>
        <div class="form-group full"><label>Tindakan Pembetulan <span class="required">*</span></label><textarea name="tindakan" required></textarea></div>
        <div class="form-group"><label>Pegawai Bertanggungjawab</label><input name="pegawaiBertanggungjawab"></div>
        <div class="form-group"><label>Tarikh Sasaran</label><input type="date" name="tarikhSasaran"></div>
        <div class="form-group"><label>Status</label>
          <select name="statusTindakan"><option>Belum Dimulakan</option><option>Dalam Proses</option><option>Selesai</option></select></div>
      </div>
    </form>`, `<button class="btn btn-primary" onclick="saveCQI()">Simpan</button><button class="btn btn-secondary" onclick="closeModal()">Batal</button>`);
};
window.saveCQI = function() {
  const form = document.getElementById('formCQI');
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  D.cqiActions.push({
    id: 'CQI-2026-' + String(D.cqiActions.length + 1).padStart(3,'0'),
    latihanId: null,
    dapatan: fd.get('dapatan'),
    punca: fd.get('punca'),
    tindakan: fd.get('tindakan'),
    pegawaiBertanggungjawab: fd.get('pegawaiBertanggungjawab'),
    tarikhSasaran: fd.get('tarikhSasaran'),
    statusTindakan: fd.get('statusTindakan'),
    buktiPenyelesaian: null,
    semakKeberkesanan: null,
  });
  toast('Tindakan CQI disimpan.','success'); closeModal(); renderPenilaian();
};

// ══════════════════════════════════════════════════════════════
// DOKUMEN
// ══════════════════════════════════════════════════════════════
function renderDokumen() {
  const cats = ['Kertas Kerja','Kelulusan & Minit Mesyuarat','Surat Jemputan','Senarai Peserta','Rekod Kehadiran','Bahan Latihan','Laporan Latihan','Invois & Resit','Penilaian Peserta','Sijil','Rekod CQI'];
  document.getElementById('content-area').innerHTML = `
    <div class="section-header"><div><div class="section-title">Repositori Dokumen</div><div class="section-sub">Semua dokumen sokongan latihan</div></div>
      <button class="btn btn-primary btn-sm" onclick="openModal('Muat Naik Dokumen',uploadForm(),'<button class=\\'btn btn-primary\\' onclick=\\'saveDoc()\\'>Simpan</button><button class=\\'btn btn-secondary\\' onclick=\\'closeModal()\\'>Batal</button>')">+ Muat Naik</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:20px">
      ${cats.map(c => {
        const count = D.dokumen.filter(d => d.kategori === c).length;
        return `<div class="card" style="cursor:pointer" onclick="filterDokumen('${c}')">
          <div style="font-size:24px;margin-bottom:6px">📁</div>
          <div style="font-size:13px;font-weight:500">${c}</div>
          <div class="text-sm text-muted">${count} dokumen</div>
        </div>`;
      }).join('')}
    </div>
    <div id="dokumenList">
      ${D.dokumen.length ? renderDokList(D.dokumen) : '<div class="empty-state"><div class="icon">🗂</div><p>Tiada dokumen dimuat naik lagi. Gunakan butang "+ Muat Naik" untuk menambah.</p></div>'}
    </div>
  `;
}
function renderDokList(docs) {
  return docs.map(d => `<div class="doc-item">
    <div class="doc-icon">📄</div>
    <div><div class="doc-name">${d.nama}</div><div class="doc-meta">${d.kategori} | ${D.formatDate(d.tarikhMuat)} | ${d.pemilik}</div></div>
    <div class="doc-actions"><span class="badge-status ${D.statusClass(d.status)}">${d.status}</span></div>
  </div>`).join('');
}
function uploadForm() {
  return `<div class="form-grid">
    <div class="form-group"><label>Latihan Berkaitan</label>
      <select name="docLatihanId"><option value="">— Pilih —</option>${D.latihan.map(l=>`<option value="${l.id}">${l.tajuk.substring(0,40)}</option>`).join('')}</select></div>
    <div class="form-group"><label>Kategori Dokumen</label>
      <select name="docKategori"><option>Kertas Kerja</option><option>Kelulusan & Minit Mesyuarat</option><option>Surat Jemputan</option><option>Senarai Peserta</option><option>Rekod Kehadiran</option><option>Bahan Latihan</option><option>Laporan Latihan</option><option>Invois & Resit</option><option>Penilaian Peserta</option><option>Sijil</option><option>Rekod CQI</option></select></div>
    <div class="form-group full"><label>Nama Dokumen</label><input name="docNama" required></div>
    <div class="form-group"><label>Status Dokumen</label>
      <select name="docStatus">${D.STATUS_LAPORAN.map(s=>`<option>${s}</option>`).join('')}</select></div>
    <div class="form-group"><label>Catatan</label><input name="docCatatan"></div>
    <div class="form-group full"><div class="import-dropzone"><div class="icon">📎</div><p>Muat naik fail (simulasi — dalam prototype ini fail tidak disimpan di pelayan)</p></div></div>
  </div>`;
}
window.saveDoc = function() {
  const get = (n) => document.querySelector(`[name="${n}"]`)?.value || '';
  D.dokumen.push({ id:'DOC-'+Date.now(), latihanId: get('docLatihanId'), kategori: get('docKategori'), nama: get('docNama') || 'Dokumen tanpa nama', status: get('docStatus'), pemilik: D.tetapan.penggunaSemasa, tarikhMuat: new Date().toISOString().split('T')[0], catatan: get('docCatatan') });
  toast('Rekod dokumen disimpan (simulasi).','success'); closeModal(); renderDokumen();
};
window.filterDokumen = function(kat) {
  const filtered = D.dokumen.filter(d => d.kategori === kat);
  document.getElementById('dokumenList').innerHTML = filtered.length ? renderDokList(filtered) : `<div class="empty-state"><div class="icon">📁</div><p>Tiada dokumen dalam kategori <strong>${kat}</strong>.</p></div>`;
};

// ══════════════════════════════════════════════════════════════
// TINDAKAN SUSULAN
// ══════════════════════════════════════════════════════════════
function renderTindakan() {
  const open = D.tindakanSusulan.filter(t => t.status !== 'Selesai');
  const done = D.tindakanSusulan.filter(t => t.status === 'Selesai');
  document.getElementById('content-area').innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Pusat Tindakan Susulan</div><div class="section-sub">${open.length} tindakan belum selesai</div></div>
      <button class="btn btn-primary btn-sm" onclick="formTambahTindakan()">+ Tambah Tindakan</button>
    </div>
    ${open.length ? '' : '<div class="alert alert-success">✓ Semua tindakan susulan telah diselesaikan.</div>'}
    <div class="tabs" id="tindakanTabs">
      <button class="tab-btn active" onclick="switchTabSection(this,'tTab1')">Terbuka / Dalam Proses (${open.length})</button>
      <button class="tab-btn" onclick="switchTabSection(this,'tTab2')">Selesai (${done.length})</button>
    </div>
    <div id="tTab1" class="tab-panel active">
      ${open.length ? renderTindakanTable(open) : '<div class="empty-state"><div class="icon">✅</div><p>Tiada tindakan terbuka.</p></div>'}
    </div>
    <div id="tTab2" class="tab-panel">
      ${done.length ? renderTindakanTable(done) : '<div class="empty-state"><p>Tiada tindakan selesai.</p></div>'}
    </div>
  `;
}
function renderTindakanTable(data) {
  return `<div class="table-wrap"><div class="table-scroll"><table>
    <thead><tr><th>ID</th><th>Jenis</th><th>Tindakan / Tajuk</th><th>Pegawai</th><th>Tarikh Due</th><th>Prioriti</th><th>Status</th><th></th></tr></thead>
    <tbody>
    ${data.map(t => `<tr>
      <td class="text-sm">${t.id}</td>
      <td class="text-sm">${t.jenis}</td>
      <td class="wrap-text" style="max-width:220px">${t.tajuk}${t.catatan ? `<div class="text-sm text-muted">${t.catatan}</div>` : ''}</td>
      <td>${t.pegawai || '—'}</td>
      <td class="nowrap">${D.formatDate(t.tarikhDue)}</td>
      <td><span class="badge-status ${t.prioriti === 'Tinggi' ? 'status-error' : t.prioriti === 'Sederhana' ? 'status-menunggu' : 'status-diluluskan'}">${t.prioriti}</span></td>
      <td><span class="badge-status ${t.status === 'Selesai' ? 'status-dilaksanakan' : t.status === 'Dalam Proses' ? 'status-pelaksanaan' : 'status-menunggu'}">${t.status}</span></td>
      <td><button class="btn btn-sm btn-secondary" onclick="editTindakan('${t.id}')">Kemaskini</button></td>
    </tr>`).join('')}
    </tbody>
  </table></div></div>`;
}
window.formTambahTindakan = function() {
  openModal('Tambah Tindakan Susulan', `
    <form id="formTindakan">
      <div class="form-grid">
        <div class="form-group full"><label>Tajuk Tindakan <span class="required">*</span></label><input name="tajuk" required></div>
        <div class="form-group"><label>Jenis</label>
          <select name="jenis"><option>Menunggu Kelulusan</option><option>Menunggu Subwaran</option><option>Laporan Belum Disediakan</option><option>Pembayaran Tertunggak</option><option>Maklumat Tidak Lengkap</option><option>Lain-lain</option></select></div>
        <div class="form-group"><label>Latihan Berkaitan</label>
          <select name="latihanId"><option value="">—</option>${D.latihan.map(l=>`<option value="${l.id}">${l.tajuk.substring(0,40)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Pegawai Bertanggungjawab</label><input name="pegawai"></div>
        <div class="form-group"><label>Tarikh Due</label><input type="date" name="tarikhDue"></div>
        <div class="form-group"><label>Prioriti</label>
          <select name="prioriti"><option>Tinggi</option><option>Sederhana</option><option>Rendah</option></select></div>
        <div class="form-group full"><label>Catatan</label><textarea name="catatan"></textarea></div>
      </div>
    </form>`, `<button class="btn btn-primary" onclick="saveTindakan()">Simpan</button><button class="btn btn-secondary" onclick="closeModal()">Batal</button>`);
};
window.saveTindakan = function() {
  const form = document.getElementById('formTindakan');
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  D.tindakanSusulan.push({
    id: 'ACT-2026-' + String(D.tindakanSusulan.length + 1).padStart(3,'0'),
    jenis: fd.get('jenis'), tajuk: fd.get('tajuk'), latihanId: fd.get('latihanId') || null,
    pegawai: fd.get('pegawai'), tarikhDue: fd.get('tarikhDue'),
    prioriti: fd.get('prioriti'), status: 'Terbuka', catatan: fd.get('catatan') || null,
  });
  toast('Tindakan susulan disimpan.','success'); closeModal(); updateAlertBadge(); renderTindakan();
};
window.editTindakan = function(id) {
  const t = D.tindakanSusulan.find(x => x.id === id);
  if (!t) return;
  openModal('Kemaskini Tindakan', `
    <div class="form-grid">
      <div class="form-group full"><label>Tajuk</label><div style="padding:6px 0">${t.tajuk}</div></div>
      <div class="form-group"><label>Status Baharu</label>
        <select id="editTindakanStatus"><option ${t.status==='Terbuka'?'selected':''}>Terbuka</option><option ${t.status==='Dalam Proses'?'selected':''}>Dalam Proses</option><option ${t.status==='Selesai'?'selected':''}>Selesai</option></select></div>
      <div class="form-group"><label>Catatan Kemaskini</label><input id="editTindakanCatatan" value="${t.catatan||''}"></div>
    </div>`, `
    <button class="btn btn-primary" onclick="
      const t = D.tindakanSusulan.find(x=>x.id==='${id}');
      t.status = document.getElementById('editTindakanStatus').value;
      t.catatan = document.getElementById('editTindakanCatatan').value;
      toast('Tindakan dikemas kini.','success'); closeModal(); updateAlertBadge(); renderTindakan();
    ">Simpan</button>
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>`);
};

// ══════════════════════════════════════════════════════════════
// IMPORT DATA
// ══════════════════════════════════════════════════════════════
function renderImport() {
  document.getElementById('content-area').innerHTML = `
    <div class="section-header"><div><div class="section-title">Import Data</div><div class="section-sub">Muat masuk data dari fail Excel atau CSV</div></div></div>
    <div class="alert alert-warning">⚠ Import data akan menambah rekod baharu. Rekod sedia ada tidak akan dipadam secara automatik. Semak pratonton sebelum mengesahkan.</div>
    <div class="card" style="max-width:600px;margin:0 auto">
      <div class="import-dropzone" id="importZone" onclick="document.getElementById('fileInput').click()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="handleDrop(event)">
        <div class="icon">📂</div>
        <div style="font-size:15px;font-weight:600;margin-top:8px">Seret fail ke sini atau klik untuk pilih</div>
        <p>Menyokong: .xlsx, .xls, .csv</p>
        <p class="text-sm" style="margin-top:4px">Fail: data latihan BK.xlsx atau mana-mana fail latihan BK</p>
      </div>
      <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleFileInput(this)">
      <div id="importProgress" style="margin-top:12px"></div>
      <div id="importPreview" style="margin-top:12px"></div>
    </div>
    <div class="card" style="max-width:600px;margin:16px auto">
      <div class="card-title">Panduan Pemetaan Lajur Excel</div>
      <div class="text-sm" style="margin-top:8px">
        Sistem akan cuba mengenal pasti lajur secara automatik. Lajur yang dijangka dalam fail Excel:
      </div>
      <table style="width:100%;margin-top:8px;font-size:12px">
        <thead><tr style="background:var(--gray-100)"><th>Medan Sistem</th><th>Nama Lajur Dijangka</th></tr></thead>
        <tbody>
          ${[['Tajuk Latihan','Tajuk / Tajuk Latihan'],['Unit','Bahagian / Unit'],['Kaedah','Kaedah Pelaksanaan'],['Tarikh Mula Cadangan','Cadangan Tarikh Mula'],['Tarikh Tamat Cadangan','Cadangan Tarikh Tamat'],['Sasaran Peserta','Sasaran Peserta / Bilangan Peserta'],['Anggaran Perbelanjaan','Anggaran Peruntukan / Anggaran Perbelanjaan'],['Peruntukan Diluluskan','Jumlah Subwaran / Kelulusan Pelaksanaan'],['Kehadiran Sebenar','Kehadiran Peserta Sebenar'],['Perbelanjaan Sebenar','Perbelanjaan Sebenar'],['Tempat','Tempat Latihan']].map(([f,h])=>`<tr><td>${f}</td><td class="text-muted">${h}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}
window.handleDrop = function(e) {
  e.preventDefault();
  document.getElementById('importZone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processImportFile(file);
};
window.handleFileInput = function(input) {
  if (input.files[0]) processImportFile(input.files[0]);
};
function processImportFile(file) {
  const prog = document.getElementById('importProgress');
  const prev = document.getElementById('importPreview');
  prog.innerHTML = '<div class="alert alert-info">⏳ Memproses fail…</div>';
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
      if (!rows.length) { prog.innerHTML = '<div class="alert alert-error">✕ Fail kosong atau tiada data.</div>'; return; }
      prog.innerHTML = `<div class="alert alert-success">✓ Fail dibaca. Ditemui <strong>${rows.length}</strong> baris data.</div>`;
      const mapped = rows.map((r, i) => mapExcelRow(r, i));
      prev.innerHTML = `
        <div class="card-title" style="margin-bottom:8px">Pratonton Data (5 baris pertama)</div>
        <div class="table-wrap"><div class="table-scroll"><table>
          <thead><tr><th>Bil</th><th>Tajuk</th><th>Kaedah</th><th>Tarikh Cadangan</th><th>Anggaran (RM)</th></tr></thead>
          <tbody>${mapped.slice(0,5).map(r=>`<tr><td>${r.bil}</td><td>${r.tajuk||'—'}</td><td>${r.kaedah}</td><td>${r.cad_mula||'—'}</td><td>${r.anggaranPerbelanjaan||'—'}</td></tr>`).join('')}</tbody>
        </table></div></div>
        <div class="alert alert-warning" style="margin-top:8px">⚠ Semak data di atas. Klik "Sahkan Import" untuk menambah rekod ke sistem. Data asal tidak akan dipadam.</div>
        <button class="btn btn-primary" onclick="confirmImport(${JSON.stringify(mapped).split('"').join("'")})">✓ Sahkan Import (${mapped.length} rekod)</button>
        <button class="btn btn-secondary" style="margin-left:8px" onclick="document.getElementById('importPreview').innerHTML=''">Batal</button>`;
      window._importData = mapped;
    } catch(err) {
      prog.innerHTML = `<div class="alert alert-error">✕ Ralat memproses fail: ${err.message}</div>`;
    }
  };
  reader.readAsArrayBuffer(file);
}
function mapExcelRow(r, i) {
  const get = (...keys) => { for (const k of keys) { const v = r[k]; if (v !== null && v !== undefined && v !== '') return v; } return null; };
  const toDate = v => { if (!v) return null; if (v instanceof Date) return v.toISOString().split('T')[0]; const d = new Date(v); return isNaN(d) ? null : d.toISOString().split('T')[0]; };
  const toNum = v => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return isNaN(n) ? null : n; };
  return {
    id: 'LAT-2026-IMP-' + String(i + 1).padStart(3,'0'),
    bil: i + 1 + D.latihan.length,
    tajuk: get('Tajuk','Tajuk Latihan','tajuk') || 'Tidak dinyatakan',
    unit: get('Bahagian','Unit','Bahagian / Unit','unit') || 'Bahagian Kurikulum',
    koordinator: get('Koordinator','Penganjur','koordinator') || '',
    kaedah: get('Kaedah Pelaksanaan','Kaedah','kaedah') || 'Bersemuka',
    tempat: get('Tempat Latihan','Tempat','tempat'),
    tempatOnline: null,
    cad_mula: toDate(get('Cadangan Tarikh Mula','Tarikh Mula Cadangan','Tarikh Mula','cad_mula')),
    cad_tamat: toDate(get('Cadangan Tarikh Tamat','Tarikh Tamat Cadangan','Tarikh Tamat','cad_tamat')),
    bilHari: toNum(get('Bilangan Hari','Bil Hari','bilHari')),
    jadualDisemak: false, jadualBaru_mula: null, jadualBaru_tamat: null, sebabPerubahanJadual: null,
    sebenar_mula: toDate(get('Tarikh Sebenar Mula','Tarikh Mula Sebenar')),
    sebenar_tamat: toDate(get('Tarikh Sebenar Tamat','Tarikh Tamat Sebenar')),
    sasaranPeserta: toNum(get('Sasaran Peserta','Bilangan Peserta','Peserta Sasaran')),
    kehadiranSebenar: toNum(get('Kehadiran Peserta Sebenar','Kehadiran Sebenar','Kehadiran')),
    kehadiranDisahkan: false,
    statusLatihan: get('Status','Status Latihan') || 'Dalam Perancangan',
    statusKelulusan: 'Dalam Perancangan', statusKewangan: 'Belum Ada Peruntukan',
    statusLaporan: 'Belum Disediakan', statusPelaksanaan: 'Dalam Perancangan',
    anggaranPerbelanjaan: toNum(get('Anggaran Peruntukan','Anggaran Perbelanjaan','Anggaran')),
    silingPeruntukan: toNum(get('Siling Peruntukan','Siling')),
    peruntutkanDiluluskan: toNum(get('Jumlah Subwaran','Kelulusan Pelaksanaan','Peruntukan Diluluskan')),
    sumberPeruntukan: get('Sumber Peruntukan','Sumber') || 'Peruntukan Mengurus JPPKK',
    komitmenKewangan: 0, perbelanjaanSebenar: toNum(get('Perbelanjaan Sebenar','Perbelanjaan')),
    baki: null, subwaranNo: get('No Subwaran','Subwaran'), subwaranDisahkan: false,
    poNo: null, statusInvois: 'Belum Berkaitan', tarikhBayar: null,
    catatanKewangan: get('Catatan Kewangan'),
    objektif: null, kumpulanSasaran: null, kategorLatihan: null,
    penganjur: get('Penganjur') || '', penceramah: null,
    kertasKerja: { status: 'Belum Disediakan' }, kelulusan: {},
    catatan: get('Catatan','Nota'), dataLengkap: false, flagMissing: [], auditTrail: [
      { tarikh: new Date().toISOString().split('T')[0], pengguna: 'Import', tindakan: 'Diimport dari Excel', perubahan: {} }
    ],
  };
}
window.confirmImport = function(data) {
  const arr = window._importData || data;
  if (!arr) return;
  let added = 0, skipped = 0;
  arr.forEach(r => {
    const dup = D.latihan.find(l => l.tajuk.toLowerCase() === r.tajuk.toLowerCase() && l.cad_mula === r.cad_mula);
    if (dup) { skipped++; } else { D.latihan.push(r); added++; }
  });
  toast(`Import selesai: ${added} rekod ditambah, ${skipped} duplikat dilewati.`, 'success');
  document.getElementById('importPreview').innerHTML = `<div class="alert alert-success">✓ Import berjaya: <strong>${added}</strong> rekod baharu, <strong>${skipped}</strong> duplikat dilewati.</div>`;
};

// ══════════════════════════════════════════════════════════════
// TETAPAN
// ══════════════════════════════════════════════════════════════
function renderTetapan() {
  const t = D.tetapan;
  document.getElementById('content-area').innerHTML = `
    <div class="section-header"><div><div class="section-title">Tetapan Sistem</div></div></div>
    <div class="card" style="max-width:600px">
      <div class="form-grid">
        <div class="form-group full"><label>Nama Organisasi</label>
          <input id="setOrg" value="${t.namaOrganisasi}"></div>
        <div class="form-group"><label>Tahun Aktif</label>
          <input id="setTahun" type="number" value="${t.tahunAktif}"></div>
        <div class="form-group"><label>Pengguna Semasa</label>
          <input id="setPengguna" value="${t.penggunaSemasa}"></div>
        <div class="form-group"><label>Peranan</label>
          <select id="setRole">
            ${['Administrator','Koordinator Latihan','Semakan','Kelulusan','Penonton'].map(r=>`<option ${t.roleSemasa===r?'selected':''}>${r}</option>`).join('')}
          </select></div>
        <div class="form-group"><label>Ambang Amaran Bajet (%)</label>
          <input id="setBudgetWarn" type="number" min="1" max="100" value="${t.warnBudgetThreshold}"></div>
        <div class="form-group"><label>Ambang Amaran Kehadiran (%)</label>
          <input id="setAttendWarn" type="number" min="1" max="100" value="${t.warnAttendanceThreshold}"></div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-primary" onclick="saveTetapan()">💾 Simpan Tetapan</button>
        <button class="btn btn-secondary" onclick="exportData()">📥 Eksport Data (JSON)</button>
        <button class="btn btn-danger btn-sm" onclick="if(confirm('Padam SEMUA data latihan dan mulakan semula? Tindakan ini tidak boleh dibuat asal.'))resetData()">🗑 Reset Data</button>
      </div>
    </div>
    <div class="card" style="max-width:600px;margin-top:16px">
      <div class="card-title">Maklumat Sistem</div>
      <div class="fin-row"><span>Versi</span><span class="fin-value">1.0.0 (Fasa 1-2)</span></div>
      <div class="fin-row"><span>Jumlah Rekod Latihan</span><span class="fin-value">${D.latihan.length}</span></div>
      <div class="fin-row"><span>Jumlah Penilaian</span><span class="fin-value">${D.penilaian.length}</span></div>
      <div class="fin-row"><span>Jumlah Tindakan CQI</span><span class="fin-value">${D.cqiActions.length}</span></div>
      <div class="fin-row"><span>Jumlah Dokumen</span><span class="fin-value">${D.dokumen.length}</span></div>
      <div class="alert alert-warning" style="margin-top:8px">⚠ Prototype: data disimpan dalam memori penyemak imbas sahaja. Data akan hilang apabila halaman ditutup. Gunakan Eksport Data untuk menyimpan rekod secara manual.</div>
    </div>
  `;
}
window.saveTetapan = function() {
  D.tetapan.namaOrganisasi = document.getElementById('setOrg').value;
  D.tetapan.tahunAktif = parseInt(document.getElementById('setTahun').value);
  D.tetapan.penggunaSemasa = document.getElementById('setPengguna').value;
  D.tetapan.roleSemasa = document.getElementById('setRole').value;
  D.tetapan.warnBudgetThreshold = parseInt(document.getElementById('setBudgetWarn').value);
  D.tetapan.warnAttendanceThreshold = parseInt(document.getElementById('setAttendWarn').value);
  document.getElementById('currentUser').textContent = D.tetapan.penggunaSemasa;
  document.getElementById('currentRole').textContent = D.tetapan.roleSemasa;
  toast('Tetapan disimpan.', 'success');
};
window.exportData = function() {
  const json = JSON.stringify({ latihan: D.latihan, penilaian: D.penilaian, cqiActions: D.cqiActions, tindakanSusulan: D.tindakanSusulan }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `BK_Dashboard_Eksport_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('Data dieksport ke fail JSON.', 'success');
};
window.resetData = function() {
  D.latihan = []; D.penilaian = []; D.cqiActions = []; D.tindakanSusulan = []; D.dokumen = [];
  toast('Data direset.', 'warning'); showSection('dashboard');
};

// ── INIT ──────────────────────────────────────────────────────
showSection('dashboard');
