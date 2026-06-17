# Setup Instructions

## Pré-requisitos
- Node.js 18+ (https://nodejs.org/)
- MongoDB 7.0+ instalado localmente, rodando via Docker, ou uma conta no MongoDB Atlas.
- Git

---

## Opção 1: Inicialização Rápida com Banco de Dados em Memória (Desenvolvimento Local)
Esta é a maneira mais fácil de testar e desenvolver a aplicação. O backend será executado com um MongoDB em memória (usando `mongodb-memory-server`) e auto-populará o banco com dados de exemplo (Workspaces, Usuários e Taxonomias).

### 1. Setup do Backend
```bash
cd server
npm install
npm run dev:mock    # Inicia o MongoDB em memória, popula os dados e roda o Express na porta 5005
```

### 2. Setup do Frontend (em um novo terminal)
```bash
cd client
npm install
npm run dev    # Inicia o Vite na porta 5173
```

Abra `http://localhost:5173` no seu navegador.

> **Credenciais Padrão (dev:mock):**
> - **Email**: `user@taxonomy.local`
> - **Senha**: `senha123`

---

## Opção 2: Docker Compose (Ambiente de Produção Local / Integração Completa)

O arquivo `docker-compose.yml` é pré-configurado para subir toda a stack (MongoDB, Backend Node.js e Frontend React) em uma rede isolada. **Nota:** No ambiente Docker as pastas locais de código (`volumes`) não são montadas no container. O código fonte será buildado e empacotado na imagem.

```bash
docker-compose up --build
```

- **Backend API**: http://localhost:5005
- **Frontend Vite**: http://localhost:5173
- **MongoDB**: Rodando internamente na porta 27017

---

## Funcionalidades Principais para Testar

### Login e Workspaces
1. Acesse o sistema e faça login usando as credenciais listadas acima.
2. O sistema suporta múltiplos Workspaces. Se um usuário pertencer a mais de um, ele poderá escolher qual Workspace acessar após o login.
3. Seus registros criados (Tags, Incidentes, Aplicações) ficarão isolados por Workspace (ou como dados Globais).

### Página Principal (Taxonomia)
1. Selecione uma **Aplicação** (ex: "Apriso").
2. Escolha um **Módulo** no dropdown.
3. Selecione o respectivo **Incidente** e **Ação**.
4. Adicione **Tags** clicando nas categorias.
5. Preencha os campos de texto livre **Motivo**, **Análise** e **Solução**.
6. Copie a **Short Description** e o **Resolution Notes** auto-gerados.
7. Clique em **Registrar Fechamento** no topo para salvar o ticket finalizado.

### Telas de Gerenciamento (Admin & Usuário Comum)
1. Navegue pelo menu lateral para gerenciar as bases do sistema.
2. As tabelas de gerenciamento possuem uma interface limpa com edição rápida (botões de lápis/lixeira) e modais para criação em lote (`Create` vs `Create and Close`).
3. O painel restrito **Gerenciar Usuários** `/manage/users` só fica visível para usuários com função de `ADMIN`.

---

## Solução de Problemas (Troubleshooting)

### "Cannot connect to MongoDB"
- Se estiver rodando sem o `dev:mock`, verifique se seu MongoDB local está rodando e aceite conexões na porta `27017`.
- Verifique a variável `MONGODB_URI` no arquivo `server/.env`.
- Para MongoDB Atlas, verifique se o seu IP está liberado no painel da AWS/Atlas (IP Whitelist).

### "Port 5005/5173 already in use"
- Altere a variável `PORT` no arquivo `.env` (backend).
- No frontend, o Vite vai automaticamente tentar usar a próxima porta disponível (ex: 5174), então atualize sua variável de ambiente `CORS_ORIGIN` no servidor para permitir a nova porta.

### Interface desalinhada ou Modais Cortados
- Certifique-se de realizar *hard refresh* (`Ctrl + F5`) no navegador após atualizações de versão de UI, para limpar qualquer arquivo antigo cacheado do Vite.

---

## População de Banco de Dados (Seed)
Caso você precise popular um banco de dados **real** (não-mockado) localmente ou no Atlas:

```bash
cd server
# Confirme que sua MONGODB_URI está configurada corretamente no seu .env local.
npm run seed
```
Isso inserirá um Workspace global padrão, um usuário de teste (ADMIN) e uma carga inicial das árvores de taxonomia.

---

## Parando os Serviços

```bash
# Docker Compose
docker-compose down

# Processos Manuais (Terminal)
Pressione Ctrl+C em cada terminal (Vite e Node).
```
