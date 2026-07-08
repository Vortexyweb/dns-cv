# Personal Wiki

Wiki pessoal auto‑hospedada baseada em Wiki.js ou semelhante, com busca full‑text, versionamento de páginas e autenticação LDAP/OAuth.

**Link do repositório:** https://github.com/Vortexyweb/personal-wiki

## Descrição
Plataforma para armazenar notas, tutoriais e documentação pessoal, com edição rica em Markdown, controle de acesso por usuário e backup automático.

## Tecnologias
- Backend: Node.js (Wiki.js) ou Python (MkDocs + Docker)
- Frontend: Vue.js (Wiki.js) ou tema customizado
- Banco: PostgreSQL
- Autenticação: LDAP, GitHub OAuth, local
- Deploy: Docker‑Compose, Traefik reverse proxy
- Backup: scripts cron para dump do BD e upload para S3/Wasabi

## Como rodar localmente
1. Clone o repositório
2. Copie `docker-compose.example.yml` para `docker-compose.yml` e ajuste variáveis
3. Rode `docker-compose up -d`
4. Acesse `http://localhost:3000` e complete o setup