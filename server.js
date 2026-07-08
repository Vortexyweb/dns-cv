const dns2 = require('dns2');
const express = require('express');
const fs = require('fs');
const path = require('path');

const CV_PATH = path.join(__dirname, 'cv-data.json');
let cvData = loadCvData();

// Utility: reload CV data from file
function loadCvData() {
  try {
    const data = fs.readFileSync(CV_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar cv-data.json. Criando um modelo padrao...', error);
    return {};
  }
}

// Utility: convert accented chars to ascii for terminal safety (avoids octal escape code display in dig/nslookup)
function toAscii(str) {
  if (typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9\s\-\.\_\@\:\/\(\)\#\@\+\,\=\[\]\{\}\$\!\%\&\*\;\?]/g, ''); // keep safe chars
}

// Global query logs list for the dashboard (limit to last 50)
const dnsLogs = [];
const clients = [];

function addDnsLog(ip, name, type, answersCount) {
  const logEntry = {
    id: Date.now() + '-' + Math.random(),
    time: new Date().toLocaleTimeString('pt-BR'),
    ip,
    name,
    type,
    answersCount
  };
  dnsLogs.unshift(logEntry);
  if (dnsLogs.length > 50) dnsLogs.pop();

  // Notify SSE clients
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  });
}

// Helper: split long strings into chunks of max N chars to respect the DNS TXT 255-char limit
function splitLongString(str, maxLength = 80) {
  if (typeof str !== 'string') return [];
  const words = str.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).length > maxLength) {
      if (currentLine !== '') {
        lines.push(currentLine.trim());
      }
      currentLine = word;
    } else {
      currentLine += (currentLine === '' ? '' : ' ') + word;
    }
  });
  if (currentLine !== '') {
    lines.push(currentLine.trim());
  }
  return lines;
}

// Prepare CV data responses formatted for DNS TXT records (array of string lines)
function getDnsRecords(section, hostname) {
  const nameLabel = cvData.personal?.name ? toAscii(cvData.personal.name).toUpperCase() : 'DEVELOPER';
  
  // ANSI colors definitions
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';
  const gray = '\x1b[90m';

  switch (section) {
    case 'bio':
      const bioLines = [
        `${cyan}=== ${nameLabel} - BIO ===${reset}`,
        `${green}Nome:${reset} ${bold}${toAscii(cvData.personal?.name)}${reset}`,
        `${green}Cargo:${reset} ${bold}${toAscii(cvData.personal?.title)}${reset}`,
        `${green}Local:${reset} ${toAscii(cvData.personal?.location)}`
      ];
      
      const rawBio = toAscii(cvData.personal?.bio);
      const bioChunks = splitLongString(rawBio, 80);
      bioChunks.forEach((chunk, index) => {
        if (index === 0) {
          bioLines.push(`${green}Resumo:${reset} ${gray}${chunk}${reset}`);
        } else {
          bioLines.push(`        ${gray}${chunk}${reset}`);
        }
      });
      return bioLines;

    case 'contact':
      const contactLines = [`${cyan}=== ${nameLabel} - CONTATO ===${reset}`];
      if (cvData.contact) {
        Object.entries(cvData.contact).forEach(([key, val]) => {
          contactLines.push(`${green}${key.toUpperCase()}:${reset} ${bold}${toAscii(val)}${reset}`);
        });
      }
      return contactLines;

    case 'skills':
      const skillLines = [`${cyan}=== ${nameLabel} - HABILIDADES ===${reset}`];
      if (Array.isArray(cvData.skills)) {
        cvData.skills.forEach(skill => {
          const rawSkill = toAscii(skill);
          const parts = rawSkill.split(':');
          if (parts.length > 1) {
            skillLines.push(`${yellow}${parts[0]}:${reset}${parts.slice(1).join(':')}`);
          } else {
            skillLines.push(`- ${rawSkill}`);
          }
        });
      }
      return skillLines;

    case 'experience':
      const expLines = [`${cyan}=== ${nameLabel} - EXPERIENCIA PROFISSIONAL ===${reset}`];
      if (Array.isArray(cvData.experience)) {
        cvData.experience.forEach((exp, index) => {
          expLines.push(`${yellow}${index + 1}.${reset} ${bold}${toAscii(exp.role)}${reset} @ ${green}${toAscii(exp.company)}${reset} (${cyan}${toAscii(exp.period)}${reset})`);
          const descChunks = splitLongString(toAscii(exp.description), 75);
          descChunks.forEach((chunk, idx) => {
            if (idx === 0) {
              expLines.push(`   ${gray}Descr: ${chunk}${reset}`);
            } else {
              expLines.push(`          ${chunk}${reset}`);
            }
          });
        });
      }
      return expLines;

    case 'education':
      const eduLines = [`${cyan}=== ${nameLabel} - FORMACAO ===${reset}`];
      if (Array.isArray(cvData.education)) {
        cvData.education.forEach((edu, index) => {
          eduLines.push(`${yellow}${index + 1}.${reset} ${bold}${toAscii(edu.degree)}${reset} @ ${green}${toAscii(edu.school)}${reset} (${cyan}${toAscii(edu.period)}${reset})`);
        });
      }
      return eduLines;

    case 'projects':
      const projLines = [`${cyan}=== ${nameLabel} - PROJETOS ===${reset}`];
      if (Array.isArray(cvData.projects)) {
        cvData.projects.forEach((proj, index) => {
          projLines.push(`${yellow}${index + 1}.${reset} ${bold}${toAscii(proj.name)}${reset}:`);
          const descChunks = splitLongString(toAscii(proj.description), 75);
          descChunks.forEach(chunk => {
            projLines.push(`   ${gray}${chunk}${reset}`);
          });
          projLines.push(`   ${green}URL:${reset} ${cyan}${toAscii(proj.link)}${reset}`);
        });
      }
      return projLines;

    case 'help':
    default:
      return [
        `${cyan}=== ${nameLabel} - CURRICULO VIA DNS ===${reset}`,
        `Ola! Seja bem-vindo ao meu curriculo hospedado no DNS.`,
        `Para consultar as secoes deste curriculo, use dig no terminal:`,
        ``,
        `  ${green}dig TXT <subdominio>.${hostname || 'seudominio.com'}${reset}`,
        ``,
        `Subdominios disponiveis:`,
        `  ${yellow}bio${reset}        - Informacoes pessoais e bio`,
        `  ${yellow}skills${reset}     - Tecnologias e habilidades`,
        `  ${yellow}experience${reset} - Experiencia profissional`,
        `  ${yellow}projects${reset}   - Projetos desenvolvidos`,
        `  ${yellow}education${reset}  - Formacao academica`,
        `  ${yellow}contact${reset}    - Informacoes de contato`,
        `  ${yellow}help${reset}       - Mostra este menu de ajuda`,
        ``,
        `Exemplo: ${green}dig TXT skills.${hostname || 'seudominio.com'}${reset}`,
        `${cyan}========================================================${reset}`
      ];
  }
}

// Create DNS server
const dnsServer = dns2.createServer({
  udp: true,
  tcp: true,
  handle: (request, send, rinfo) => {
    const response = dns2.Packet.createResponseFromRequest(request);
    const [question] = request.questions;
    if (!question) {
      send(response);
      return;
    }

    const { name, type } = question;
    const typeString = dns2.Packet.TYPE[type] || 'UNKNOWN';

    // We only answer TXT queries
    if (type !== dns2.Packet.TYPE.TXT) {
      send(response);
      addDnsLog(rinfo.address, name, typeString, 0);
      return;
    }

    // Parse the queried subdomain
    // For a name like "skills.cv.domain.com", we want the first label ("skills")
    const cleanName = name.toLowerCase().replace(/\.$/, ''); // remove trailing dot
    const parts = cleanName.split('.');
    const firstLabel = parts[0];

    // Determine domain (re-construct the rest as host representation)
    const hostname = parts.slice(1).join('.') || 'cv-dns.local';

    let section = 'help';
    const validSections = ['bio', 'contact', 'skills', 'experience', 'education', 'projects', 'help'];
    if (validSections.includes(firstLabel)) {
      section = firstLabel;
    }

    const txtLines = getDnsRecords(section, cleanName);

    // Add TXT records to the answer section. 
    // In DNS, a TXT record can return multiple character-strings, or multiple answer packets.
    // Pushing a single answer with all strings is robust, or pushing separate answers is also clean.
    // To make sure 'dig' lists them line by line in order, we add multiple TXT answers.
    txtLines.forEach(line => {
      response.answers.push({
        name,
        type: dns2.Packet.TYPE.TXT,
        class: dns2.Packet.CLASS.IN,
        ttl: 10, // Short TTL so changes are immediately visible
        data: line
      });
    });

    send(response);
    addDnsLog(rinfo.address, name, typeString, response.answers.length);
  }
});

// Port configuration
const DNS_PORT = process.env.DNS_PORT || 1053;
const WEB_PORT = process.env.PORT || 3000;

// Start DNS Server
function startDns(port) {
  dnsServer.listen({ udp: port, tcp: port })
    .then(() => {
      const udpAddr = dnsServer.addresses().udp;
      const tcpAddr = dnsServer.addresses().tcp;
      console.log(`[DNS] Servidor escutando nas portas UDP ${udpAddr.port} e TCP ${tcpAddr.port} (0.0.0.0)`);
    })
    .catch(err => {
      if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
        if (port === 53) {
          console.warn(`[DNS] Nao foi possivel rodar na porta 53 (requer Administrador/sudo). Tentando porta alternativa 1053...`);
          startDns(1053);
        } else {
          console.error(`[DNS] Erro ao iniciar servidor na porta ${port}:`, err.message);
        }
      } else {
        console.error(`[DNS] Falha critica no servidor DNS:`, err);
      }
    });
}

startDns(DNS_PORT);

// Express Web Dashboard Setup
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get CV
app.get('/api/cv', (req, res) => {
  res.json(cvData);
});

// API: Save CV
app.post('/api/cv', (req, res) => {
  try {
    const newCv = req.body;
    // Validate schema basic fields
    if (!newCv.personal || !newCv.contact) {
      return res.status(400).json({ error: 'Os campos "personal" e "contact" sao obrigatorios.' });
    }
    cvData = newCv;
    fs.writeFileSync(CV_PATH, JSON.stringify(cvData, null, 2), 'utf8');
    res.json({ message: 'Curriculo atualizado com sucesso!', cv: cvData });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar alteracoes: ' + error.message });
  }
});

// API: Server configuration details
app.get('/api/config', (req, res) => {
  const currentDnsPort = dnsServer.addresses().udp?.port || 1053;
  res.json({
    dnsPort: currentDnsPort,
    webPort: WEB_PORT,
    platform: process.platform,
    isStandardPort: currentDnsPort === 53
  });
});

// API: Mock a DNS query from the web terminal
app.post('/api/mock-query', (req, res) => {
  const { name, type, ip } = req.body;
  const cleanName = name || 'help.cv.local';
  const queryType = type || 'TXT';
  const clientIp = ip || '127.0.0.1';
  
  // Calculate potential answer count
  const parts = cleanName.toLowerCase().replace(/\.$/, '').split('.');
  const firstLabel = parts[0];
  const validSections = ['bio', 'contact', 'skills', 'experience', 'education', 'projects', 'help'];
  const section = validSections.includes(firstLabel) ? firstLabel : 'help';
  const answersCount = getDnsRecords(section, cleanName).length;

  addDnsLog(clientIp, cleanName, queryType, answersCount);
  res.json({ success: true });
});


// API: Real-time logs via Server-Sent Events (SSE)
app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  // Send initial logs
  res.write(`data: ${JSON.stringify({ type: 'init', logs: dnsLogs })}\n\n`);

  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// Start Web Dashboard
app.listen(WEB_PORT, () => {
  console.log(`[Web] Dashboard disponivel em http://localhost:${WEB_PORT}`);
});
