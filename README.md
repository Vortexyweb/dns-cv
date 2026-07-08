# 🪐 DNS-CV | Seu Currículo no Servidor DNS

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/DNS--Protocol-UDP%20%2F%20TCP-blueviolet?style=for-the-badge&logo=generic" alt="DNS">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License">
</p>

---

### 🚀 O que é o DNS-CV?

Um projeto extremamente criativo de **infraestrutura e redes** que serve as informações do meu currículo profissional diretamente através do protocolo **DNS (Domain Name System)**! 

Qualquer pessoa pode consultar meu perfil técnico diretamente do terminal de seu computador executando uma simples consulta `dig` ou `nslookup`, recebendo respostas coloridas formatadas em registros do tipo `TXT`. O projeto também conta com um **Dashboard Web interativo** em tempo real que monitora as consultas recebidas e simula o terminal de comandos.

---

### ✨ Funcionalidades Principais

- **Servidor DNS Híbrido (UDP & TCP):** Responde a consultas DNS padrão na porta configurada, com suporte nativo a fallback TCP para pacotes que excedem o limite de 512 bytes (RFC 1035).
- **Formatação ANSI Colorida:** As respostas no terminal são colorizadas dinamicamente utilizando códigos de escape ANSI, destacando nomes, links e cargos.
- **Quebra Automática de Linhas:** Ajuste dinâmico de descrições longas para blocos de 80 caracteres para evitar quebras feias no console e respeitar o limite de 255 bytes por string do protocolo DNS.
- **Dashboard Web Moderno (Cyberpunk/Glassmorphism):** Uma interface interativa com monitoramento de tráfego em tempo real via **Server-Sent Events (SSE)** e simulador de terminal interativo.

---

### 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, `dns2` (biblioteca de protocolo DNS)
- **Frontend:** HTML5, CSS3 (Vanilla com Glassmorphism), JavaScript ES6, Lucide Icons
- **Comunicação:** Server-Sent Events (SSE) para logs em tempo real

---

### 💻 Como Consultar no Terminal (Exemplo)

Caso o servidor esteja rodando localmente (porta 1053):

```bash
# Consultar as informações biográficas (Bio):
dig TXT bio.cv.local @127.0.0.1 -p 1053

# Consultar habilidades técnicas (Skills):
dig TXT skills.cv.local @127.0.0.1 -p 1053

# Consultar experiência profissional (Experience):
dig TXT experience.cv.local @127.0.0.1 -p 1053
```

---

### ⚙️ Como Instalar e Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/Vortexyweb/dns-cv.git
   cd dns-cv
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

4. Acesse o painel de monitoramento no navegador:
   👉 **`http://localhost:3000`**

---

### 👤 Autor

* **Gabriel Bueno** - *ADS Student & Tech Enthusiast*
* GitHub: [@Vortexyweb](https://github.com/Vortexyweb)
* LinkedIn: [Gabriel Bueno](https://linkedin.com/in/gabriel-bueno)
