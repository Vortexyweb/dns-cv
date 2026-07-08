// Global CV Data State
let cvData = {};
let serverConfig = {};

// Lucide Icons Initialization
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Tabs Navigation
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // Load Initial Data
  fetchCvData();
  fetchServerConfig();
  connectToLogsSSE();
  setupTerminal();
  setupEditorForm();
  
  // Clear Terminal Button
  document.getElementById('clear-terminal').addEventListener('click', () => {
    const terminalOutput = document.getElementById('terminal-output');
    // Save only prompt
    const promptLine = terminalOutput.querySelector('.prompt-line');
    terminalOutput.innerHTML = '';
    terminalOutput.appendChild(promptLine);
    const input = document.getElementById('terminal-input-field');
    if (input) input.focus();
  });
});

// Fetch CV Data from API
async function fetchCvData() {
  try {
    const response = await fetch('/api/cv');
    if (!response.ok) throw new Error('Falha ao carregar dados do CV');
    cvData = await response.json();
    
    updateVisualPreview();
    populateEditorForm();
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar os dados do currículo do servidor.');
  }
}

// Fetch Server Config (Ports, Permissions, OS)
async function fetchServerConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Falha ao carregar configuracoes do servidor');
    serverConfig = await response.json();
    
    const dot = document.getElementById('server-status-dot');
    const text = document.getElementById('server-status-text');
    
    if (serverConfig.isStandardPort) {
      dot.className = 'status-dot active pinging';
      text.innerText = `Online - UDP 53`;
    } else {
      dot.className = 'status-dot warning pinging';
      text.innerText = `Local - UDP ${serverConfig.dnsPort}`;
    }
  } catch (error) {
    console.error(error);
    const dot = document.getElementById('server-status-dot');
    const text = document.getElementById('server-status-text');
    dot.className = 'status-dot';
    text.innerText = 'Desconectado';
  }
}

// Connect to Server-Sent Events (SSE) for Real-Time DNS logs
function connectToLogsSSE() {
  const logsContainer = document.getElementById('dns-logs-list');
  const logCountBadge = document.getElementById('log-count');
  let requestCounter = 0;
  
  const eventSource = new EventSource('/api/logs');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Remove empty log placeholder if present
    const emptyState = logsContainer.querySelector('.empty-logs');
    if (emptyState) {
      logsContainer.innerHTML = '';
    }
    
    if (data.type === 'init') {
      // Load initial batch of logs
      if (data.logs && data.logs.length > 0) {
        requestCounter = data.logs.length;
        logCountBadge.innerText = `${requestCounter} conexões`;
        data.logs.forEach(log => appendLogToUi(log, false));
      }
    } else {
      // New log event
      requestCounter++;
      logCountBadge.innerText = `${requestCounter} conexões`;
      appendLogToUi(data, true);
    }
  };
  
  eventSource.onerror = (err) => {
    console.warn('Conexão SSE de logs perdida. Tentando reconectar...', err);
  };
}

function appendLogToUi(log, animate) {
  const logsContainer = document.getElementById('dns-logs-list');
  
  const row = document.createElement('div');
  row.className = 'log-row';
  
  row.innerHTML = `
    <div class="log-left">
      <span class="log-time">[${log.time}]</span>
      <span class="log-type">${log.type}</span>
      <span class="log-name" title="${log.name}">${log.name}</span>
    </div>
    <div class="log-right">
      <span class="log-ip">${log.ip}</span>
      <span class="log-badge">${log.answersCount} rrs</span>
    </div>
  `;
  
  if (animate) {
    row.style.animation = 'slideIn 0.3s ease, highlightGlow 1s ease';
  }
  
  logsContainer.insertBefore(row, logsContainer.firstChild);
}

// Update Visual UI based on CV Data
function updateVisualPreview() {
  if (!cvData.personal) return;
  
  document.getElementById('preview-name').innerText = cvData.personal.name || 'Sem nome';
  document.getElementById('preview-title').innerText = cvData.personal.title || 'Sem título';
  document.getElementById('preview-location').innerText = cvData.personal.location || 'Sem local';
  document.getElementById('preview-bio').innerText = cvData.personal.bio || 'Sem biografia';
  
  // Skills
  const skillsContainer = document.getElementById('preview-skills');
  skillsContainer.innerHTML = '';
  if (Array.isArray(cvData.skills)) {
    cvData.skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.innerText = skill;
      skillsContainer.appendChild(tag);
    });
  }
  
  // Experience
  const expContainer = document.getElementById('preview-experience');
  expContainer.innerHTML = '';
  if (Array.isArray(cvData.experience)) {
    cvData.experience.forEach(exp => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.innerHTML = `
        <div class="timeline-header">
          <h5>${exp.role}</h5>
          <span>${exp.period}</span>
        </div>
        <div class="timeline-company">${exp.company}</div>
        <div class="timeline-desc">${exp.description}</div>
      `;
      expContainer.appendChild(item);
    });
  }
  
  // Projects
  const projContainer = document.getElementById('preview-projects');
  projContainer.innerHTML = '';
  if (Array.isArray(cvData.projects)) {
    cvData.projects.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <h5>${proj.name}</h5>
        <p>${proj.description}</p>
        <a href="https://${proj.link}" target="_blank" class="project-link">
          <i data-lucide="external-link"></i> Ver no GitHub
        </a>
      `;
      projContainer.appendChild(card);
    });
  }
  
  // Contact info
  const contactContainer = document.getElementById('preview-contacts');
  contactContainer.innerHTML = '';
  if (cvData.contact) {
    const contactConfig = [
      { key: 'email', icon: 'mail', prefix: 'mailto:' },
      { key: 'github', icon: 'github', prefix: 'https://' },
      { key: 'linkedin', icon: 'linkedin', prefix: 'https://' },
      { key: 'website', icon: 'globe', prefix: 'https://' }
    ];
    
    contactConfig.forEach(conf => {
      const value = cvData.contact[conf.key];
      if (value) {
        const pill = document.createElement('div');
        pill.className = 'contact-pill';
        pill.innerHTML = `
          <i data-lucide="${conf.icon}"></i>
          <span style="word-break: break-all;">${value}</span>
        `;
        contactContainer.appendChild(pill);
      }
    });
  }
  
  initIcons();
}

// Populate Editor Form fields
function populateEditorForm() {
  if (!cvData.personal) return;
  
  document.getElementById('edit-name').value = cvData.personal.name || '';
  document.getElementById('edit-title').value = cvData.personal.title || '';
  document.getElementById('edit-location').value = cvData.personal.location || '';
  document.getElementById('edit-bio').value = cvData.personal.bio || '';
  
  if (cvData.contact) {
    document.getElementById('edit-email').value = cvData.contact.email || '';
    document.getElementById('edit-website').value = cvData.contact.website || '';
    document.getElementById('edit-github').value = cvData.contact.github || '';
    document.getElementById('edit-linkedin').value = cvData.contact.linkedin || '';
  }
  
  if (Array.isArray(cvData.skills)) {
    document.getElementById('edit-skills').value = cvData.skills.join('\n');
  }
}

// Setup Editor Form submit logic
function setupEditorForm() {
  const form = document.getElementById('cv-editor-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i data-lucide="loader" class="icon-spin"></i> Salvando...`;
    initIcons();
    
    // Construct new CV JSON structure
    const updatedCv = {
      personal: {
        name: document.getElementById('edit-name').value,
        title: document.getElementById('edit-title').value,
        location: document.getElementById('edit-location').value,
        bio: document.getElementById('edit-bio').value
      },
      contact: {
        email: document.getElementById('edit-email').value,
        website: document.getElementById('edit-website').value,
        github: document.getElementById('edit-github').value,
        linkedin: document.getElementById('edit-linkedin').value
      },
      skills: document.getElementById('edit-skills').value.split('\n').filter(line => line.trim() !== ''),
      // Preserve complex experience/projects array for now or let them edit later
      experience: cvData.experience || [],
      education: cvData.education || [],
      projects: cvData.projects || []
    };
    
    try {
      const response = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCv)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar alteracoes.');
      
      const resData = await response.json();
      cvData = resData.cv;
      updateVisualPreview();
      
      alert('Currículo atualizado com sucesso! O Servidor DNS já está respondendo com os novos dados.');
      
      // Auto-switch to preview tab
      const previewTabBtn = document.querySelector('.tab-btn[data-tab="preview"]');
      if (previewTabBtn) previewTabBtn.click();
      
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar as alterações no servidor.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i data-lucide="save"></i> Salvar Currículo`;
      initIcons();
    }
  });
}

// -------------------------------------------------------------
// MOCK TERMINAL SIMULATOR
// -------------------------------------------------------------
function setupTerminal() {
  const terminalInput = document.getElementById('terminal-input-field');
  const terminalOutput = document.getElementById('terminal-output');
  
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = terminalInput.value.trim();
      if (!command) return;
      
      // Create element for output
      appendCommandLine(command);
      
      // Clear input
      terminalInput.value = '';
      
      // Process Command
      processTerminalCommand(command);
    }
  });
  
  // Make terminal body focus input on click anywhere inside it
  terminalOutput.addEventListener('click', () => {
    terminalInput.focus();
  });
}

function appendCommandLine(command) {
  const terminalOutput = document.getElementById('terminal-output');
  const promptLine = terminalOutput.querySelector('.prompt-line');
  
  const line = document.createElement('div');
  line.className = 'terminal-line command-echo';
  line.innerHTML = `<span class="prompt-prefix">user@dns-cv:~$</span> <span>${escapeHtml(command)}</span>`;
  
  // Insert before prompt line
  terminalOutput.insertBefore(line, promptLine);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function ansiToHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\x1b\[36m/g, '<span style="color: var(--color-accent)">') // cyan
    .replace(/\x1b\[32m/g, '<span style="color: var(--color-success)">') // green
    .replace(/\x1b\[33m/g, '<span style="color: var(--color-warning)">') // yellow
    .replace(/\x1b\[1m/g, '<span style="font-weight: bold; color: var(--text-primary)">') // bold
    .replace(/\x1b\[90m/g, '<span style="color: var(--text-muted)">') // gray
    .replace(/\x1b\[0m/g, '</span>'); // reset
}

function printToTerminal(text, isHeader = false, isError = false) {
  const terminalOutput = document.getElementById('terminal-output');
  const promptLine = terminalOutput.querySelector('.prompt-line');
  
  const line = document.createElement('div');
  if (isError) {
    line.className = 'terminal-line error-line';
  } else if (isHeader) {
    line.className = 'terminal-line output-line-header';
  } else {
    line.className = 'terminal-line output-line';
  }
  line.innerHTML = ansiToHtml(text);
  
  terminalOutput.insertBefore(line, promptLine);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function processTerminalCommand(cmdText) {
  const args = cmdText.split(/\s+/).filter(Boolean);
  const command = args[0].toLowerCase();
  
  if (command === 'clear') {
    const terminalOutput = document.getElementById('terminal-output');
    const promptLine = terminalOutput.querySelector('.prompt-line');
    terminalOutput.innerHTML = '';
    terminalOutput.appendChild(promptLine);
    return;
  }
  
  if (command === 'help') {
    printToTerminal('Comandos Disponíveis:', true);
    printToTerminal('  help                              - Mostra este menu de ajuda');
    printToTerminal('  clear                             - Limpa o terminal');
    printToTerminal('  dig TXT [subdominio].cv.local     - Executa uma query DNS TXT');
    printToTerminal('  nslookup -type=txt [subdominio]   - Alternativa para query DNS');
    printToTerminal('  cat cv.json                       - Imprime o JSON bruto do curriculo');
    return;
  }
  
  if (command === 'cat' && args[1] === 'cv.json') {
    printToTerminal(JSON.stringify(cvData, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;'));
    return;
  }
  
  // Match DIG or NSLOOKUP
  const isDig = command === 'dig';
  const isNslookup = command === 'nslookup';
  
  if (isDig || isNslookup) {
    let subdomain = '';
    let recordType = 'TXT';
    
    if (isDig) {
      // dig TXT bio.cv.local  OR  dig bio.cv.local TXT  OR dig bio.cv.local
      // Let's search for TXT type and find the target subdomain
      const txtIndex = args.findIndex(a => a.toUpperCase() === 'TXT');
      
      let queryTarget = '';
      if (txtIndex !== -1) {
        // remove "TXT" label to find domain
        const filteredArgs = args.slice(1).filter((_, idx) => idx !== (txtIndex - 1));
        queryTarget = filteredArgs[0] || '';
      } else {
        queryTarget = args[1] || '';
      }
      
      if (!queryTarget || queryTarget.startsWith('-') || queryTarget.startsWith('@')) {
        printToTerminal('Erro: Uso correto: dig TXT [subdominio].cv.local', false, true);
        return;
      }
      
      subdomain = queryTarget.split('.')[0].toLowerCase();
    } else {
      // nslookup -type=txt bio.cv.local
      const typeArgIdx = args.findIndex(a => a.toLowerCase().includes('-type='));
      let queryTarget = '';
      if (typeArgIdx !== -1) {
        const typeValue = args[typeArgIdx].split('=')[1];
        if (typeValue.toUpperCase() !== 'TXT') {
          recordType = typeValue.toUpperCase();
        }
        const filteredArgs = args.slice(1).filter((_, idx) => idx !== (typeArgIdx - 1));
        queryTarget = filteredArgs[0] || '';
      } else {
        queryTarget = args[1] || '';
      }
      
      if (!queryTarget) {
        printToTerminal('Erro: Uso correto: nslookup -type=txt [subdominio].cv.local', false, true);
        return;
      }
      subdomain = queryTarget.split('.')[0].toLowerCase();
    }
    
    // Simulate DNS Response
    if (recordType !== 'TXT') {
      printToTerminal(`; <<>> DiG 9.18.0 <<>> ${cmdText}`, true);
      printToTerminal(`;; Got answer:`);
      printToTerminal(`;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random() * 60000)}`);
      printToTerminal(`;; flags: qr aa rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0`);
      printToTerminal(`;; WARNING: Este servidor simulado apenas responde a registros TXT.`);
      return;
    }
    
    simulateDnsLookup(subdomain, cmdText);
    
    // Trigger Server Log visual trigger as if the query actually hit the backend
    triggerMockServerLog(subdomain);
    return;
  }
  
  // Default fallback for unknown commands
  printToTerminal(`bash: ${escapeHtml(command)}: comando não encontrado. Digite 'help' para ajuda.`, false, true);
}

// Convert accents to ASCII for DNS display
function stripAccents(str) {
  if (typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function simulateDnsLookup(section, cmdText) {
  const validSections = ['bio', 'contact', 'skills', 'experience', 'projects', 'education', 'help'];
  const targetSection = validSections.includes(section) ? section : 'help';
  const nameLabel = cvData.personal?.name ? stripAccents(cvData.personal.name).toUpperCase() : 'DEVELOPER';
  
  // ANSI colors definitions
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';
  const gray = '\x1b[90m';
  
  let records = [];
  
  if (targetSection === 'bio') {
    records = [
      `${cyan}=== ${nameLabel} - BIO ===${reset}`,
      `${green}Nome:${reset} ${bold}${stripAccents(cvData.personal?.name)}${reset}`,
      `${green}Cargo:${reset} ${bold}${stripAccents(cvData.personal?.title)}${reset}`,
      `${green}Local:${reset} ${stripAccents(cvData.personal?.location)}`,
      `${green}Resumo:${reset} ${gray}${stripAccents(cvData.personal?.bio)}${reset}`
    ];
  } else if (targetSection === 'contact') {
    records = [`${cyan}=== ${nameLabel} - CONTATO ===${reset}`];
    if (cvData.contact) {
      Object.entries(cvData.contact).forEach(([key, val]) => {
        records.push(`${green}${key.toUpperCase()}:${reset} ${bold}${stripAccents(val)}${reset}`);
      });
    }
  } else if (targetSection === 'skills') {
    records = [`${cyan}=== ${nameLabel} - HABILIDADES ===${reset}`];
    if (Array.isArray(cvData.skills)) {
      cvData.skills.forEach(s => {
        const rawSkill = stripAccents(s);
        const parts = rawSkill.split(':');
        if (parts.length > 1) {
          records.push(`${yellow}${parts[0]}:${reset}${parts.slice(1).join(':')}`);
        } else {
          records.push(`- ${rawSkill}`);
        }
      });
    }
  } else if (targetSection === 'experience') {
    records = [`${cyan}=== ${nameLabel} - EXPERIENCIA PROFISSIONAL ===${reset}`];
    if (Array.isArray(cvData.experience)) {
      cvData.experience.forEach((exp, idx) => {
        records.push(`${yellow}${idx + 1}.${reset} ${bold}${stripAccents(exp.role)}${reset} @ ${green}${stripAccents(exp.company)}${reset} (${cyan}${stripAccents(exp.period)}${reset})`);
        records.push(`   ${gray}Descr: ${stripAccents(exp.description)}${reset}`);
      });
    }
  } else if (targetSection === 'education') {
    records = [`${cyan}=== ${nameLabel} - FORMACAO ===${reset}`];
    if (Array.isArray(cvData.education)) {
      cvData.education.forEach((edu, idx) => {
        records.push(`${yellow}${idx + 1}.${reset} ${bold}${stripAccents(edu.degree)}${reset} @ ${green}${stripAccents(edu.school)}${reset} (${cyan}${stripAccents(edu.period)}${reset})`);
      });
    }
  } else if (targetSection === 'projects') {
    records = [`${cyan}=== ${nameLabel} - PROJETOS ===${reset}`];
    if (Array.isArray(cvData.projects)) {
      cvData.projects.forEach((proj, idx) => {
        records.push(`${yellow}${idx + 1}.${reset} ${bold}${stripAccents(proj.name)}${reset}: ${gray}${stripAccents(proj.description)}${reset}`);
        records.push(`   ${green}URL:${reset} ${cyan}${stripAccents(proj.link)}${reset}`);
      });
    }
  } else {
    records = [
      `${cyan}=== ${nameLabel} - CURRICULO VIA DNS ===${reset}`,
      `Ola! Seja bem-vindo ao meu curriculo hospedado no DNS.`,
      `Para consultar as secoes deste curriculo, use dig no terminal:`,
      ``,
      `  ${green}dig TXT <subdominio>.cv.local${reset}`,
      ``,
      `Subdominios disponiveis:`,
      `  ${yellow}bio${reset}        - Informacoes pessoais e bio`,
      `  ${yellow}skills${reset}     - Tecnologias e habilidades`,
      `  ${yellow}experience${reset} - Experiencia profissional`,
      `  ${yellow}projects${reset}   - Projetos desenvolvidos`,
      `  ${yellow}education${reset}  - Formacao academica`,
      `  ${yellow}contact${reset}    - Informacoes de contato`,
      `  ${yellow}help${reset}       - Mostra este menu de ajuda`
    ];
  }

  // Print raw output resembling DIG command response
  printToTerminal(`; <<>> DiG 9.18.0 <<>> TXT ${section}.cv.local`, true);
  printToTerminal(`;; Got answer:`);
  printToTerminal(`;; ->Header<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random() * 60000)}`);
  printToTerminal(`;; flags: qr aa rd; QUERY: 1, ANSWER: ${records.length}, AUTHORITY: 0, ADDITIONAL: 0`);
  printToTerminal('<br>;; ANSWER SECTION:');
  
  records.forEach(rec => {
    printToTerminal(`${section}.cv.local.&nbsp;&nbsp;&nbsp;&nbsp;10&nbsp;&nbsp;&nbsp;&nbsp;IN&nbsp;&nbsp;&nbsp;&nbsp;TXT&nbsp;&nbsp;&nbsp;&nbsp;"${escapeHtml(rec)}"`);
  });
  
  printToTerminal(`<br>;; Query time: ${Math.floor(Math.random() * 15) + 1} msec`);
  printToTerminal(`;; SERVER: 127.0.0.1#${serverConfig.dnsPort || 1053}(127.0.0.1)`);
  printToTerminal(`;; WHEN: ${new Date().toString()}`);
  printToTerminal(`;; MSG SIZE  rcvd: ${256 + records.length * 40}`);
}

// Generate a visual connection line on the monitor when a mock query is run
function triggerMockServerLog(section) {
  // We can push to the SSE route or mock it by appending directly. Let's make an actual DNS query to the server or fake an API call that triggers a real DNS log.
  // Actually, wait! The local DNS server is running, but standard browser JavaScript cannot run UDP queries.
  // However, we can send a mock query request to the server, so the server actually records it in its SSE log stream!
  // Let's create an API endpoint in the server `/api/mock-query` that triggers a DNS log visually!
  // This is an incredibly smart way to sync the terminal logs in the UI with the live DNS traffic log!
  fetch(`/api/mock-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `${section}.cv.local`, type: 'TXT', ip: '127.0.0.1 (Web)' })
  }).catch(err => {
    // If endpoints fails, just append mock log directly to keep UI working
    const logsContainer = document.getElementById('dns-logs-list');
    const logCountBadge = document.getElementById('log-count');
    const count = parseInt(logCountBadge.innerText) + 1;
    logCountBadge.innerText = `${count} conexões`;
    
    appendLogToUi({
      time: new Date().toLocaleTimeString('pt-BR'),
      type: 'TXT',
      name: `${section}.cv.local`,
      ip: '127.0.0.1 (Web)',
      answersCount: 1
    }, true);
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
