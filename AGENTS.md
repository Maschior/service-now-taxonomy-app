# Agent Instructions & Project Context - Service Now Taxonomy App

Este arquivo contém o contexto, arquitetura, decisões de design, padrões de projeto e aprendizados acumulados sobre o **Service Now Taxonomy App**. Ele serve como guia para agentes de IA (e desenvolvedores humanos) que trabalharem nesta base de código, garantindo consistência, continuidade e prevenindo erros comuns.

---

## 1. Visão Geral do Projeto

O **Service Now Taxonomy App** é uma aplicação Full-Stack projetada para gerenciar e estruturar a taxonomia de classificação de incidentes (chamados) do ServiceNow. O objetivo principal é guiar analistas de suporte na construção padronizada de **Short Descriptions** e **Resolution Notes**, além de permitir o registro histórico de fechamentos de chamados.

A estrutura hierárquica base da taxonomia é:
`Application (1) ──> Module (N) ──> Incident (M) ──> Action (M)`

- **Short Description gerada:** `Application:Module:Local Support:Incident:Action`
- **Resolution Notes geradas:** Contêm tags selecionadas, seguidas de campos de texto livre (`Motivo`, `Análise` e `Solução`).

---

## 2. Arquitetura do Sistema

A aplicação segue uma arquitetura cliente-servidor padrão com persistência em banco de dados:

### 2.1. Backend (`/server`)
- **Runtime:** Node.js (com TypeScript compilado para ES Modules).
- **Framework:** Express.js para rotas RESTful.
- **Banco de Dados:** MongoDB, utilizando Mongoose como ODM.
- **Validação de Entrada:** `express-validator` para schemas de validação de requests.
- **Logs:** Winston/Custom logger para registrar inicialização de banco e rotas.

### 2.2. Frontend (`/client`)
- **Build Tool / Bundler:** Vite com React e TypeScript.
- **Estilização:** CSS Vanilla estruturado (`index.css`) para controle total de design e evitar overhead de frameworks CSS, usando variáveis de cor sofisticadas para modo escuro/claro e efeitos modernos.
- **Comunicação API:** Axios para requisições HTTP mapeadas em serviços tipados (`/src/services/api.ts`).
- **Icons:** Lucide React.

### 2.3. Execução via Containers (`Docker`)
- O projeto conta com um ambiente pré-configurado via `docker-compose.yml`, que sobe a aplicação inteira (Frontend, Backend e banco MongoDB) em rede isolada com volumes montados para desenvolvimento quente.

---

## 3. Modelagem de Dados & Decisões Críticas de Design

### 3.1. Relação Application ──> Module (1:N) com Agrupamento no Frontend
Uma decisão crucial de arquitetura de banco foi manter a relação entre `Application` e `Module` como **1:N** (um módulo possui apenas uma `applicationId`). 
- **O Problema:** Módulos com nomes idênticos (ex: "Financeiro", "Segurança") existem em múltiplas aplicações, mas são conceitualmente distintos pois se relacionam a incidentes e ações diferentes. Modelar como N:M (muitos-para-muitos) causaria *"incident leakage"*, fazendo com que incidentes de uma aplicação vazassem para outra através do módulo compartilhado.
- **A Solução (Group By no Frontend):** O banco de dados mantém documentos distintos para o módulo "Financeiro" sob cada aplicação. No entanto, no frontend, os módulos são agrupados por **nome único** na exibição (`uniqueFilteredModuleNames`). Quando o usuário clica em um chip de módulo:
  - Se uma aplicação já estiver selecionada, o ID do módulo correspondente àquela aplicação específica é selecionado no estado (`selectedModule`).
  - Se nenhuma aplicação estiver selecionada, o sistema seleciona o primeiro módulo com esse nome e resolve a aplicação correspondente automaticamente.
  - Se o usuário mudar de aplicação enquanto um módulo estiver selecionado, o frontend re-resolve dinamicamente o ID do módulo correspondente à nova aplicação, mantendo o nome do módulo selecionado intacto caso ele exista na nova aplicação.

### 3.2. Modelo de Registro de Fechamentos (`Closure`)
Para registrar os chamados fechados usando a taxonomia, foi criada a collection `closures` no MongoDB.
- **Model:** `Closure.ts` armazena a `shortDescription`, `resolutionNotes`, referências opcionais para `applicationId`, `moduleId`, `incidentId`, `actionId`, um array de referências a `tags` e os campos textuais (`motivo`, `analise`, `solucao`).
- **Endpoint:** `POST /api/closures` cria o registro e o valida por meio do middleware `closureValidation`.

---

## 4. Funcionalidades de Experiência do Usuário (UX)

- **Persistência de Estado (localStorage):** Para evitar perda de dados por recarregamento acidental da página, todos os campos preenchidos e seleções (App, Module, Incident, Action, Tags, Motivo, Análise, Solução) são persistidos no `localStorage` a cada alteração. No carregamento inicial, o estado do formulário é restaurado a partir do cache.
- **Confirmação de Limpeza:** O botão "Limpar Tudo" exige confirmação explícita (`window.confirm`) do usuário para prevenir a perda de dados acidental, limpando tanto os estados do React quanto o cache no `localStorage`.
- **Organização Visual:** As tags e as caixas de output foram deslocadas para uma barra lateral à esquerda, abrindo espaço para a exibição de chips confortáveis para Applications, Modules, Incidents e Actions na área central.
- **Registro de Fechamentos:** Um botão "Registrar Fechamento" no cabeçalho permite salvar a classificação no banco de dados, retornando feedback visual instantâneo de sucesso (ou erro).

---

## 5. Convenções de Código & Pitfalls Importantes

Ao modificar o código deste repositório, atente-se às seguintes convenções:

1. **Importações no Backend (ES Modules):**
   No backend, as importações locais de arquivos TypeScript devem incluir explicitamente a extensão `.js` no caminho do import (ex: `import { connectDB } from './utils/db.js'`). Omitir a extensão resultará em erro em tempo de execução devido à configuração do Node.js com ESM.
   
2. **Estilo de Seleção em Cascata (Slicer Logic):**
   O fluxo de filtragem é em cascata:
   - **Top-Down (Seleção descendente):** Selecionar uma Application filtra os Modules disponíveis; selecionar um Module filtra os Incidents; selecionar um Incident filtra as Actions. Se alguma seleção se tornar inválida ou vazia, o helper `autoSelectChain` preenche automaticamente os campos descendentes com as primeiras opções disponíveis em ordem alfabética.
   - **Bottom-Up (Destaque ascendente):** Selecionar um item abaixo na hierarquia (ex: Action) destaca (`highlightedIncidentIds`, `highlightedModuleNames`, `highlightedAppIds`) os nós superiores que estão associados àquela seleção, permitindo uma navegação visual intuitiva.

3. **Validação de Inputs:**
   Toda nova rota que aceite payloads deve obrigatoriamente registrar um validator no `server/src/middleware/validation.ts` e encadear o middleware `validateRequest` para interceptar e formatar erros de validação da API.

---

## 6. Comandos e Tarefas Úteis de Desenvolvimento

### Executando o Projeto
- Para rodar via Docker: `docker-compose up --build`
- Rodar o backend localmente: `cd server && npm run dev`
- Rodar o frontend localmente: `cd client && npm run dev`

### Verificação e Build local (TypeScript)
Como por padrão a execução usa Docker, os pacotes locais `node_modules` podem não existir fora dos containers. Para testar a tipagem localmente no Windows:
1. Instale as dependências localmente nas pastas `server` e `client`:
   ```bash
   cd server; npm install; cd ../client; npm install
   ```
2. Execute a validação do compilador do TypeScript (sem emitir arquivos):
   - No Backend (`server/`): `.\node_modules\.bin\tsc.cmd --noEmit`
   - No Frontend (`client/`): `.\node_modules\.bin\tsc.cmd --noEmit`

### Seed de Banco de Dados
Para semear o banco com dados de exemplo de taxonomia (úteis para desenvolvimento local):
- `cd server && npm run seed` (configurar a URI do MongoDB no arquivo `.env` local).
