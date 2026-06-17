# Guia de Deploy e Produção (Deployment)

Este guia cobre os fundamentos para hospedar o Service Now Taxonomy App em ambientes reais de Produção.

---

## 1. Variáveis de Ambiente Essenciais

### Backend (`server/.env`)
Em seu servidor de backend (Ex: Render, Railway, AWS, VPS), você **precisa** declarar as seguintes variáveis:
- `MONGODB_URI`: String de conexão para seu banco MongoDB. Ex: `mongodb+srv://usuario:senha@cluster0.mongodb.net/taxonomy-app`
- `PORT`: Porta na qual o servidor Node será exposto (Geralmente `5005` ou o que seu provedor exigir).
- `NODE_ENV`: Deve ser configurado obrigatoriamente para `production`.
- `CORS_ORIGIN`: A URL **exata** do seu frontend no ar (ex: `https://taxonomy-app.vercel.app`), garantindo a segurança das requisições via CORS.
- `JWT_SECRET`: Uma chave aleatória e segura para assinar os tokens de autenticação JWT dos usuários (ex: `openssl rand -base64 32`).
- `JWT_EXPIRES_IN`: Duração do token, por padrão deve ser `24h` ou `30d`.

### Frontend (`client/.env` ou Variáveis de Build)
No provedor de deploy do seu frontend (Ex: Vercel, Netlify):
- `VITE_API_URL`: A URL **exata** do seu backend recém-implantado. Ex: `https://meu-backend-api.railway.app`

---

## 2. Estratégias de Deploy

### Opção A: Frontend na Vercel + Backend na Render/Railway (Recomendado)
Esta é a estratégia mais estável, escalável e de menor custo (geralmente Free Tier) para aplicações MERN/PERN.

**Passo a Passo (Backend):**
1. Faça push do seu repositório para o GitHub.
2. Crie um projeto na Render (Web Service) ou Railway.
3. Configure o comando de Build: `npm install && npm run build` (rodado a partir da pasta `/server`).
4. Configure o comando de Inicialização (Start): `npm start`.
5. Adicione todas as variáveis de ambiente acima, incluindo as do `JWT` e o banco MongoDB.

**Passo a Passo (Frontend):**
1. No painel da Vercel, importe seu repositório Github.
2. Configure o Diretório Raiz (Root Directory) como `client`.
3. Adicione a variável de ambiente `VITE_API_URL` apontando para o link gerado pelo backend.
4. Finalize o deploy. A Vercel descobrirá que se trata de uma aplicação Vite/React e fará o build automaticamente.

---

### Opção B: Deploy Unificado via Docker (AWS EC2, DigitalOcean, VPS própria)

O arquivo `docker-compose.yml` da raiz do projeto já está devidamente estruturado para subir a aplicação sem mapeamento de volumes de disco, operando de forma isolada e portando os builds finais para produção (o arquivo `client/Dockerfile` realiza o *multi-stage build* via nginx para o frontend).

1. Clone o repositório em seu servidor Linux.
2. Modifique ou injete as variáveis de ambiente dentro do arquivo `docker-compose.yml` (especialmente `CORS_ORIGIN` e `VITE_API_URL`, que devem usar os IPs/Domínios públicos do seu servidor e não mais `localhost`).
3. Rode:
```bash
docker-compose up -d --build
```
4. Seus containers ficarão expostos na porta `5005` (backend) e `5173` ou porta customizada no NGINX (frontend). Use um proxy reverso geral em sua VPS (como o NGINX da máquina host) ou Caddy para apontar os domínios finais para o Docker e resolver certificados SSL.

---

## 3. Segurança e Banco de Dados (MongoDB)

### Ambiente Seguro (Atlas)
Recomendamos a utilização do **MongoDB Atlas** para bancos de produção. O *Free Tier* (M0) suporta tranquilamente o fluxo da taxonomia.
- **Auto-Backup**: O Atlas inclui backup automático diário.
- **Network Access**: Não se esqueça de adicionar o IP público do servidor Backend na lista de "IP Access List" (Whitelist) do painel do Atlas. Caso esteja usando Vercel/Railway e o IP seja flutuante, defina a política para `0.0.0.0/0` e garanta que sua senha MONGODB_URI seja *extremamente segura*.

### Lista de Verificações de Produção ✅
- [ ] Configurei e troquei a variável `JWT_SECRET` local para uma forte em produção.
- [ ] Não estou usando os usuários em-memória (`dev:mock`). Conectei um banco de dados real.
- [ ] Garanti que `CORS_ORIGIN` no Backend possui estritamente o domínio do Frontend.
- [ ] O Frontend foi construído (`vite build`) e aponta para o domínio do Backend (`VITE_API_URL`).
