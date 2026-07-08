# 🌐 DNS-CV — Currículo na Infraestrutura do DNS

Este projeto é uma implementação em **Node.js** inspirada no vídeo *"O Fim do Currículo em PDF"* do canal **Gambiarra Labs**. Ele permite que você hospede seu currículo diretamente em registros DNS do tipo `TXT` e o disponibilize para qualquer pessoa com acesso a um terminal rodando comandos como `dig` ou `nslookup`.

Além do servidor DNS em si, o projeto acompanha um **Dashboard Web interativo de altíssima qualidade** que contém:
- **Painel de Controle Visual:** Exibe o currículo de forma moderna, limpa e responsiva (Dark Mode).
- **Editor em Tempo Real:** Permite alterar os dados do currículo pela interface web e salvá-los imediatamente no arquivo JSON. O servidor DNS passa a responder com os novos dados sem precisar ser reiniciado!
- **Simulador de Terminal:** Um console interativo web onde recrutadores ou visitantes podem rodar `dig TXT bio.cv.local` para simular as consultas.
- **Monitor de Tráfego DNS:** Mostra os logs de acessos DNS em tempo real através de Server-Sent Events (SSE).
- **Guia de Produção:** Passo a passo detalhado para deploy real em uma VPS e delegação de subdomínio por NS.

---

## 🛠️ Como Executar e Testar Localmente

### 1. Requisitos
Você precisa ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Iniciar o Servidor
Com as dependências instaladas, navegue até a pasta do projeto e execute o comando:
```bash
npm start
```

Isso iniciará:
1. O **Servidor Web** na porta `3000` (disponível em `http://localhost:3000`).
2. O **Servidor DNS** na porta UDP `53`. 
   > **Nota para execução local:** Como a porta 53 é uma porta protegida do sistema, se você não rodar o terminal como Administrador (Windows) ou com `sudo` (Linux/macOS), o servidor automaticamente fará o fallback para a porta alternativa **`1053`**.

---

## 💻 Testando as consultas DNS

### Opção A: Pelo Simulador no Navegador
Abra [http://localhost:3000](http://localhost:3000) no seu navegador. No lado direito, você verá um simulador de terminal. Você pode digitar os seguintes comandos:
- `help` (Para ver a ajuda)
- `clear` (Para limpar a tela)
- `cat cv.json` (Exibe o JSON bruto)
- `dig TXT bio.cv.local`
- `dig TXT skills.cv.local`
- `dig TXT contact.cv.local`
- `dig TXT experience.cv.local`
- `dig TXT projects.cv.local`

Todas as consultas simuladas no terminal web aparecerão no painel **"Tráfego DNS em Tempo Real"** logo abaixo!

### Opção B: Pelo Terminal Real do seu Computador
Com o servidor rodando localmente (supondo que esteja rodando na porta de teste `1053`), abra um terminal do seu sistema operacional e execute:

#### No Linux / macOS (usando `dig`):
```bash
dig @127.0.0.1 -p 1053 TXT bio.cv.local
dig @127.0.0.1 -p 1053 TXT skills.cv.local
```

#### No Windows (usando `nslookup`):
```cmd
nslookup -type=TXT bio.cv.local 127.0.0.1
```
*(Nota: O nslookup padrão do Windows assume a porta 53, portanto se o servidor rodou na 1053 você pode precisar especificar a porta ou rodar o servidor como administrador para subir na porta 53 padrão)*.

---

## 🚀 Como Colocar na Internet com o seu Domínio?

Para tornar o seu currículo acessível publicamente via `dig TXT bio.cv.seudominio.com` em qualquer lugar do mundo, siga estes passos:

1. **Instale em uma VPS Linux:**
   Hospede este projeto em uma VPS (AWS EC2, DigitalOcean, Hetzner, etc.). Libere a porta **UDP 53** no painel de controle da VPS (Security Group/Firewall) e no firewall interno do Linux (ufw/iptables).

2. **Inicie o servidor como root:**
   Para poder escutar na porta 53 padrão, inicie com permissão elevada:
   ```bash
   sudo node server.js
   ```

3. **Crie um Registro Tipo A para o Nameserver:**
   No gerenciador de DNS do seu domínio principal (como Cloudflare, Registro.br, Namecheap, etc.):
   - Adicione um novo registro do tipo **A**.
   - Nome: `ns` (ou seja, `ns.seudominio.com`).
   - Valor/IP: O IP público da sua VPS.
   - Proxy: **Desativado** (DNS Only).

4. **Delegue o subdomínio com um registro NS:**
   Crie um registro do tipo **NS**:
   - Nome: `cv` (ou seja, `cv.seudominio.com` será o endereço do seu currículo).
   - Servidor de Nomes (Nameserver): `ns.seudominio.com` (o registro A criado no passo anterior).

5. **Pronto! 🎉**
   Agora, qualquer requisição para `*.cv.seudominio.com` será redirecionada automaticamente para a sua VPS. Qualquer recrutador ou colega poderá rodar no terminal deles:
   ```bash
   dig TXT bio.cv.seudominio.com
   dig TXT skills.cv.seudominio.com
   ```
   E eles receberão o seu currículo em texto puro formatado perfeitamente!

---

## 📂 Estrutura de Arquivos

- `server.js` - Arquivo principal contendo o servidor DNS (`dns2`) e o painel web express.
- `cv-data.json` - Banco de dados em formato JSON contendo o conteúdo do seu currículo.
- `public/` - Pasta com os arquivos estáticos do painel web.
  - `index.html` - Estrutura do dashboard.
  - `style.css` - Estilos em Vanilla CSS com estética Dark Cyber/Glassmorphism.
  - `app.js` - Lógica da interface, simulador de terminal e conexão SSE para logs em tempo real.
