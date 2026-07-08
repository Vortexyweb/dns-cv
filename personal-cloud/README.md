# Personal Cloud

Servidor de nuvem pessoal autohospedado com gerenciamento de arquivos em disco via painel web dinâmico.

**Link do repositório:** https://github.com/Vortexyweb/personal-cloud

## Descrição
Plataforma self-hosted para armazenar, organizar e compartilhar arquivos pessoais, com autenticação de usuários, controle de acesso e visualização de mídia.

## Tecnologias
- Backend: Node.js, Express, MongoDB
- Frontend: React, Tailwind CSS
- Autenticação: JWT + HTTP-only cookies
- Deploy: Docker, Docker‑Compose, NGINX reverse proxy
- Outros: WebSocket para notificações em tempo real

## Como rodar localmente
1. Clone o repositório
2. Copie `.env.example` para `.env` e preencha as variáveis
3. Rode `docker-compose up --build`
4. Acesse `http://localhost:3000`