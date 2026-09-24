/* Premium SaaS Dashboard Logic */

// ── Auth Guard ──
const currentUser = JSON.parse(sessionStorage.getItem('placeme_user') || 'null');
if (!currentUser) { window.location.href = 'login.html'; }

// ── Application Storage ──
function getApplications() { return JSON.parse(sessionStorage.getItem('placeme_applications') || '[]'); }
function saveApplications(apps) { sessionStorage.setItem('placeme_applications', JSON.stringify(apps)); }

function applyToDrive(driveIdx) {
  const drive = DRIVES[driveIdx];
  const apps = getApplications();
  if (apps.find(a => a.company === drive.company)) {
    alert('Already applied to ' + drive.company); return;
  }
  apps.push({
    company: drive.company,
    logo: drive.logo,
    color: drive.color,
    role: drive.role,
    package: drive.package,
    steps: [
      { label: 'Applied', date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' }), status: 'done' },
      { label: 'OA Scheduled', date: drive.date, status: 'active' },
      { label: 'Interview', date: 'TBD', status: 'pending' },
      { label: 'HR Round', date: 'TBD', status: 'pending' }
    ]
  });
  saveApplications(apps);
  refreshAll();
}

// ── Data ──
const DRIVES = [
  { id:1, company:'Google India', type:'product', logo:'G', color:'linear-gradient(135deg,#4285f4,#34a853)',
    role:'Software Engineer (SDE-1)', package:'45', date:'Oct 6, 2026', deadline:'Sep 28, 2026',
    cgpa:8.0, branches:['CSE','IT','ECE'], venue:'Main Auditorium', backlogs:0, tags:['DSA','System Design','LLD'] },
  { id:2, company:'Microsoft IDC', type:'product', logo:'M', color:'linear-gradient(135deg,#0078d4,#00b4d8)',
    role:'SDE L59 + Cloud Architect', package:'42', date:'Oct 14, 2026', deadline:'Oct 4, 2026',
    cgpa:7.5, branches:['CSE','IT','ECE','EEE'], venue:'T&P Seminar Hall 1', backlogs:0, tags:['Azure','Behavioral'] },
  { id:3, company:'Goldman Sachs', type:'finance', logo:'GS', color:'linear-gradient(135deg,#0047ab,#2563eb)',
    role:'Engineering Analyst', package:'32', date:'Oct 21, 2026', deadline:'Oct 12, 2026',
    cgpa:7.0, branches:['CSE','IT','ECE','EEE','ME','CE'], venue:'Virtual + On-Campus', backlogs:0, tags:['Quant','Python'] },
  { id:4, company:'Amazon India', type:'product', logo:'A', color:'linear-gradient(135deg,#ff9900,#ffb84d)',
    role:'SDE-I', package:'38', date:'Oct 28, 2026', deadline:'Oct 18, 2026',
    cgpa:7.0, branches:['CSE','IT','ECE','EEE','ME'], venue:'Campus Block B', backlogs:0, tags:['LPs','System Design'] },
  { id:5, company:'Flipkart', type:'product', logo:'F', color:'linear-gradient(135deg,#2874f0,#60a5fa)',
    role:'Software Engineer', package:'28', date:'Nov 4, 2026', deadline:'Oct 24, 2026',
    cgpa:7.5, branches:['CSE','IT','ECE'], venue:'T&P Lab Block A', backlogs:0, tags:['DSA','SQL'] },
  { id:6, company:'Deloitte', type:'consulting', logo:'D', color:'linear-gradient(135deg,#86bc25,#4d8b00)',
    role:'Business Analyst', package:'12', date:'Nov 6, 2026', deadline:'Oct 27, 2026',
    cgpa:6.5, branches:['CSE','IT','ECE','EEE','ME','CE'], venue:'Seminar Hall 2', backlogs:1, tags:['Case Study','Excel'] },
];

const ELIGIBILITY_DATA = {
  'Google': { min_cgpa:8.0, branches:['CSE','IT','ECE'], backlogs:0, package:'45', tier:'Dream' },
  'Microsoft': { min_cgpa:7.5, branches:['CSE','IT','ECE','EEE'], backlogs:0, package:'42', tier:'Dream' },
  'Amazon': { min_cgpa:7.0, branches:['CSE','IT','ECE','EEE','ME'], backlogs:0, package:'38', tier:'Super' },
  'Goldman Sachs': { min_cgpa:7.0, branches:['CSE','IT','ECE','EEE','ME','CE'], backlogs:0, package:'32', tier:'Dream' },
  'Flipkart': { min_cgpa:7.5, branches:['CSE','IT','ECE'], backlogs:0, package:'28', tier:'Super' },
  'Deloitte': { min_cgpa:6.5, branches:['CSE','IT','ECE','EEE','ME','CE'], backlogs:1, package:'12', tier:'Core' },
};

function getEligibleCompanies() {
  const cgpa = currentUser.cgpa || 0, branch = currentUser.branch || '';
  return Object.keys(ELIGIBILITY_DATA).filter(k => cgpa >= ELIGIBILITY_DATA[k].min_cgpa && ELIGIBILITY_DATA[k].branches.includes(branch));
}
function getEligibleDrives() {
  const cgpa = currentUser.cgpa || 0, branch = currentUser.branch || '';
  return DRIVES.filter(d => cgpa >= d.cgpa && d.branches.includes(branch));
}

// ── Initialization ──
document.addEventListener('DOMContentLoaded', () => {
  setupUser();
  refreshAll();
  
  const pg = sessionStorage.getItem('placeme_page');
  if(pg) { sessionStorage.removeItem('placeme_page'); openPage(pg); }
});

function refreshAll() {
  renderStats();
  renderHomeDrives();
  renderHomeApps();
  renderDrives(DRIVES);
  renderEligibilityPage();
  renderTracker();
  renderResumePage();
  renderInterviewPage();
}

function setupUser() {
  const name = currentUser.name || 'Student';
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-branch').textContent = `${currentUser.branch || '—'} • ${currentUser.cgpa || '—'} CGPA`;
  document.getElementById('sidebar-avatar').textContent = name.charAt(0);
  
  const h = new Date().getHours();
  document.getElementById('welcome-title').textContent = `${h<12?'Good morning':h<17?'Good afternoon':'Good evening'}, ${name.split(' ')[0]}!`;
}

function logout() {
  sessionStorage.removeItem('placeme_user');
  sessionStorage.removeItem('placeme_applications');
  window.location.href = 'login.html';
}

function openPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const p = document.getElementById('page-' + name);
  if(p) {
    p.classList.add('active');
    const navs = document.querySelectorAll('.nav-item');
    for(let n of navs) {
      if(n.getAttribute('onclick') === `openPage('${name}')`) n.classList.add('active');
    }
  }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if(sb) sb.classList.toggle('open');
}

function toggleNotif() {
  const el = document.getElementById('notif-dropdown');
  if(el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ── Search Logic ──
function globalSearch(query) {
  const q = query.toLowerCase().trim();
  const dropdown = document.getElementById('search-results');
  
  if (!dropdown) return;
  
  if (!q) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }
  
  const matches = DRIVES.filter(d => 
    d.company.toLowerCase().includes(q) || 
    d.role.toLowerCase().includes(q) || 
    d.type.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="dropdown-item"><div class="dropdown-text"><p style="color:var(--text-muted)">No matching drives found for "${query}"</p></div></div>`;
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = matches.slice(0, 5).map(d => `
    <div class="dropdown-item" onclick="openPage('drives'); document.getElementById('global-search').value=''; document.getElementById('search-results').style.display='none';">
      <div class="dropdown-icon" style="background:${d.color};color:#fff;font-size:12px;font-weight:700;">${d.logo}</div>
      <div class="dropdown-text">
        <h4 style="font-size:14px;color:var(--text-main);margin-bottom:2px;">${d.company}</h4>
        <p style="font-size:12px;color:var(--text-muted);">${d.role} • ₹${d.package} LPA</p>
      </div>
    </div>
  `).join('');
  
  dropdown.style.display = 'block';
}

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) {
    const dropdown = document.getElementById('search-results');
    if (dropdown) dropdown.style.display = 'none';
  }
});

// ── Rendering Functions ──
function renderStats() {
  const apps = getApplications();
  const eligCount = getEligibleCompanies().length;
  const shortCount = apps.filter(a => a.steps.some(s => s.status === 'done' && s.label.includes('Shortlist'))).length;
  
  document.getElementById('stat-drives').textContent = DRIVES.length;
  document.getElementById('stat-drives-sub').textContent = `${getEligibleDrives().length} match your profile`;
  
  document.getElementById('stat-apps').textContent = apps.length;
  document.getElementById('stat-apps-sub').textContent = apps.length > 0 ? 'Active tracking' : 'None yet';
  document.getElementById('stat-apps-trend').className = apps.length > 0 ? 'trend up' : 'trend neutral';
  
  document.getElementById('stat-elig').textContent = eligCount;
  
  document.getElementById('stat-short').textContent = shortCount;
  document.getElementById('stat-short-sub').textContent = shortCount > 0 ? 'Advancing!' : 'Apply more';
  document.getElementById('stat-short-trend').className = shortCount > 0 ? 'trend up' : 'trend neutral';
  
  document.getElementById('nav-drives-count').textContent = DRIVES.length;
  
  // Notifications
  const eligDrives = getEligibleDrives();
  document.getElementById('notif-badge').textContent = eligDrives.length;
  document.getElementById('notif-count').textContent = eligDrives.length;
  
  const notifList = document.getElementById('notif-list');
  if(notifList) {
    notifList.innerHTML = eligDrives.slice(0,3).map(d => `
      <div class="dropdown-item" onclick="openPage('drives')">
        <div class="dropdown-icon" style="background:${d.color};color:#fff;"><i class="ri-building-line"></i></div>
        <div class="dropdown-text">
          <h4>${d.company}</h4>
          <p>Deadline: ${d.deadline}</p>
        </div>
      </div>
    `).join('');
  }
}

function renderHomeDrives() {
  const container = document.getElementById('home-drives-list');
  if (!container) return;
  const elig = getEligibleDrives().slice(0,3);
  if(elig.length === 0) {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:14px;"><i class="ri-information-line"></i> No matching drives. Increase your CGPA!</div>`; return;
  }
  container.innerHTML = elig.map(d => `
    <div class="list-item">
      <div class="item-logo" style="background:${d.color}">${d.logo}</div>
      <div class="item-content">
        <div class="item-title">${d.company}</div>
        <div class="item-sub">${d.role}</div>
      </div>
      <div class="item-right">
        <div class="item-title">₹${d.package}</div>
        <div class="item-sub">${d.date}</div>
      </div>
    </div>
  `).join('');
}

function renderHomeApps() {
  const container = document.getElementById('home-apps-list');
  if (!container) return;
  const apps = getApplications();
  if(apps.length === 0) {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:14px;">You haven't applied to any drives yet.</div>`; return;
  }
  container.innerHTML = apps.slice(0,3).map(a => `
    <div class="list-item">
      <div class="item-logo" style="background:${a.color}">${a.logo}</div>
      <div class="item-content">
        <div class="item-title">${a.company}</div>
        <div class="item-sub">Applied ${a.steps[0].date}</div>
      </div>
      <div class="item-right">
        <span class="badge badge-success"><i class="ri-check-line" style="margin-right:4px;"></i> Active</span>
      </div>
    </div>
  `).join('');
}

function renderDrives(list) {
  const container = document.getElementById('drives-grid-container');
  if (!container) return;
  
  const apps = getApplications();
  const cgpa = currentUser.cgpa || 0, branch = currentUser.branch || '';

  container.innerHTML = list.map((d, idx) => {
    const isEligible = cgpa >= d.cgpa && d.branches.includes(branch);
    const hasApplied = apps.find(a => a.company === d.company);
    
    let btnHtml = '';
    if(hasApplied) btnHtml = `<button class="primary-btn btn-block" style="background:var(--success);" disabled><i class="ri-check-double-line"></i> Applied</button>`;
    else if(isEligible) btnHtml = `<button class="primary-btn btn-block" onclick="applyToDrive(${DRIVES.indexOf(d)})"><i class="ri-send-plane-fill"></i> Apply Now</button>`;
    else btnHtml = `<button class="primary-btn btn-block" style="background:var(--border);color:var(--text-muted);cursor:not-allowed;" disabled><i class="ri-close-circle-line"></i> Not Eligible</button>`;

    return `
    <div class="drive-card">
      <div class="drive-header">
        <div class="item-logo" style="background:${d.color}">${d.logo}</div>
        <div>
          <div class="drive-company">${d.company}</div>
          <div class="drive-type"><i class="ri-price-tag-3-line"></i> ${d.type} recruiter</div>
        </div>
      </div>
      <div class="drive-meta">
        <div class="meta-box"><span class="meta-lbl">Package</span><span class="meta-val">₹${d.package} LPA</span></div>
        <div class="meta-box"><span class="meta-lbl">Drive Date</span><span class="meta-val"><i class="ri-calendar-line"></i> ${d.date}</span></div>
        <div class="meta-box"><span class="meta-lbl">Min CGPA</span><span class="meta-val" style="color:${cgpa>=d.cgpa?'var(--success)':'var(--danger)'}">${d.cgpa}+ ${cgpa>=d.cgpa?'<i class="ri-check-line"></i>':'<i class="ri-close-line"></i>'}</span></div>
        <div class="meta-box"><span class="meta-lbl">Deadline</span><span class="meta-val" style="color:var(--danger)"><i class="ri-time-line"></i> ${d.deadline}</span></div>
      </div>
      <div class="drive-tags">
        ${d.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
      </div>
      ${btnHtml}
    </div>
    `;
  }).join('');
}

function filterDrives(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = type === 'all' ? DRIVES : DRIVES.filter(d => d.type === type);
  renderDrives(filtered);
}

function renderEligibilityPage() {
  const container = document.getElementById('all-elig-grid');
  if(!container) return;
  const cgpa = currentUser.cgpa || 0, branch = currentUser.branch || '';
  
  // Auto-fill form
  const bSelect = document.getElementById('elig-branch'), cInput = document.getElementById('elig-cgpa');
  if(bSelect && !bSelect.value) bSelect.value = branch;
  if(cInput && !cInput.value) cInput.value = cgpa;
  
  document.getElementById('elig-profile-info').textContent = `(${branch} • ${cgpa} CGPA)`;

  container.innerHTML = Object.entries(ELIGIBILITY_DATA).map(([company, data]) => {
    const cgpaOk = cgpa >= data.min_cgpa, branchOk = data.branches.includes(branch);
    const ok = cgpaOk && branchOk;
    return `
    <div class="drive-card" style="padding:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:10px;background:${ok?'var(--success-bg)':'var(--danger-bg)'};color:${ok?'var(--success)':'var(--danger)'};display:flex;align-items:center;justify-content:center;font-size:20px;">
          <i class="${ok?'ri-check-line':'ri-close-line'}"></i>
        </div>
        <div style="flex:1;">
          <div class="drive-company" style="font-size:16px;margin-bottom:2px;">${company}</div>
          <div class="drive-type">${ok?'Eligible':'Not Eligible'} • ₹${data.package} LPA</div>
        </div>
        <span class="badge ${ok?'badge-success':'badge-danger'}">${data.tier}</span>
      </div>
    </div>
    `;
  }).join('');
}

function checkEligibility() {
  const comp = document.getElementById('elig-company').value, br = document.getElementById('elig-branch').value;
  const cgp = parseFloat(document.getElementById('elig-cgpa').value), bl = parseInt(document.getElementById('elig-backlogs').value)||0;
  const res = document.getElementById('elig-result');
  
  if(!comp || !br || isNaN(cgp)) {
    res.style.display = 'block'; res.className = 'elig-result-box error';
    res.innerHTML = '<i class="ri-error-warning-line"></i> Fill all fields'; return;
  }
  
  const d = ELIGIBILITY_DATA[comp];
  const ok = cgp >= d.min_cgpa && d.branches.includes(br) && bl <= d.backlogs;
  
  res.style.display = 'block';
  res.className = `elig-result-box ${ok?'success':'error'}`;
  res.innerHTML = `
    <h3 style="font-size:16px;margin-bottom:12px;color:inherit;"><i class="${ok?'ri-checkbox-circle-fill':'ri-close-circle-fill'}"></i> ${ok?'You are Eligible!':'Not Eligible'} for ${comp}</h3>
    <div style="font-size:14px;display:flex;flex-direction:column;gap:6px;">
      <div><i class="${cgp>=d.min_cgpa?'ri-check-line':'ri-close-line'}"></i> CGPA: Required ${d.min_cgpa}+ (Yours: ${cgp})</div>
      <div><i class="${d.branches.includes(br)?'ri-check-line':'ri-close-line'}"></i> Branch: ${br} ${d.branches.includes(br)?'Allowed':'Not Allowed'}</div>
    </div>
  `;
}

function renderTracker() {
  const container = document.getElementById('tracker-board');
  if(!container) return;
  const apps = getApplications();
  if(apps.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;background:#fff;border-radius:16px;border:1px dashed var(--border);">
      <i class="ri-inbox-archive-line" style="font-size:40px;color:var(--text-muted);"></i>
      <h3 style="margin:16px 0 8px;">No Applications Yet</h3>
      <p style="color:var(--text-muted);font-size:14px;">Start applying from the Campus Drives page.</p>
    </div>`; return;
  }
  
  container.innerHTML = apps.map(app => `
    <div class="drive-card">
      <div class="drive-header" style="margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:16px;">
        <div class="item-logo" style="background:${app.color}">${app.logo}</div>
        <div>
          <div class="drive-company">${app.company}</div>
          <div class="drive-type">${app.role} • ₹${app.package}</div>
        </div>
      </div>
      <div class="tracker-timeline">
        ${app.steps.map(s => `
          <div class="timeline-item ${s.status}">
            <div class="timeline-icon"><i class="${s.status==='done'?'ri-check-line':s.status==='active'?'ri-time-line':'ri-more-fill'}"></i></div>
            <div class="timeline-content">
              <div class="timeline-title">${s.label}</div>
              <div class="timeline-date">${s.date}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderResumePage() {
  const c = document.getElementById('resume-page-content');
  if(!c) return;
  c.innerHTML = `
    <div class="drive-card" style="grid-column:1/-1; background:var(--primary-gradient); color:#fff; display:flex; flex-direction:row; justify-content:space-between; align-items:center;">
      <div>
        <h3 style="color:#fff;font-size:20px;margin-bottom:8px;"><i class="ri-magic-line"></i> AI Resume Optimizer</h3>
        <p style="opacity:0.9;font-size:14px;max-width:500px;">Paste your resume bullets in the AI Copilot chat to get them instantly optimized for ATS systems and formatted using the Google XYZ method.</p>
      </div>
      <button class="primary-btn" style="background:#fff;color:var(--primary);" onclick="window.location.href='chat.html'">Open AI Chat</button>
    </div>
    <div class="drive-card">
      <div class="drive-header"><div class="item-logo" style="background:var(--success)"><i class="ri-focus-2-line"></i></div><div><div class="drive-company">The XYZ Formula</div></div></div>
      <p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:12px;">Accomplished [X] as measured by [Y], by doing [Z]</p>
      <div style="background:var(--success-bg);padding:12px;border-radius:8px;font-size:13px;color:#065f46;"><i class="ri-check-line"></i> Reduced API latency by 38% via Redis caching, serving 50K users</div>
    </div>
    <div class="drive-card">
      <div class="drive-header"><div class="item-logo" style="background:var(--secondary)"><i class="ri-layout-masonry-line"></i></div><div><div class="drive-company">ATS Formatting Rules</div></div></div>
      <ul style="font-size:14px;color:var(--text-muted);line-height:1.8;padding-left:16px;">
        <li>Strictly 1 page for undergrads</li>
        <li>Single column layout only</li>
        <li>No graphics or rating bars</li>
        <li>Order: Education, Skills, Projects, Experience</li>
      </ul>
    </div>
  `;
}

function renderInterviewPage() {
  const c = document.getElementById('interview-page-content');
  if(!c) return;
  c.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px,1fr));gap:24px;">
      ${DRIVES.slice(0,4).map(d => `
        <div class="drive-card" style="cursor:pointer;" onclick="sessionStorage.setItem('placeme_prefill','Interview prep for ${d.company}');window.location.href='chat.html'">
          <div class="drive-header">
            <div class="item-logo" style="background:${d.color}">${d.logo}</div>
            <div>
              <div class="drive-company">${d.company} Prep</div>
              <div class="drive-type">Click to practice with AI</div>
            </div>
          </div>
          <div style="margin-top:auto;"><button class="primary-btn btn-block btn-outline" style="background:transparent;border:1px solid var(--primary);color:var(--primary);"><i class="ri-play-circle-line"></i> Start Mock Interview</button></div>
        </div>
      `).join('')}
    </div>
  `;
}
