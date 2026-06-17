# Software Design Document (SDD): Workspaces & Tenancy Model

Este documento descreve a arquitetura de múltiplos locatários (Workspaces) implementada no Service Now Taxonomy App. Ele deve ser lido e respeitado por qualquer desenvolvedor ou agente que for modificar rotas, consultas ou a árvore de estado do Frontend.

## 1. Visão Geral do Modelo (Herança Global)
O sistema não utiliza permissões nó-a-nó (RLS/ABAC). Em vez disso, utiliza um modelo de **Herança Global**.
- Todo usuário pertence a um ou mais `Workspaces`.
- O sistema possui um Workspace especial e explícito chamado **Global** (`isGlobal: true`).
- A árvore visualizada por um usuário é sempre a soma matemática estrita: `Árvore Global + Árvore do Workspace Atual`.
- Isso evita a quebra da integridade da UI (Slicers do Frontend) porque a árvore enviada sempre será consistente e completa do ponto de vista do Locatário.

## 2. Decisões Críticas de Arquitetura (Regras Inegociáveis)

### 2.1. Workspace Global Explícito
- O Workspace "Global" não é inferido por valores `null`. É um documento físico na collection `workspaces` no MongoDB.
- Isso previne que requisições malformadas (faltando o envio do `workspaceId`) transformem itens locais em globais acidentalmente.

### 2.2. Soft Delete em Cascata (Cascade Soft Delete)
- Registros da taxonomia **nunca** são deletados fisicamente. Eles ganham a flag `isActive: false`.
- **REGRA DE OURO:** Se um Pai (ex: Application) for inativado, um hook do Mongoose DEVE inativar recursivamente todos os seus descendentes (Modules, Incidents, Actions). Isso previne a falha crítica de "Registros Órfãos" (Orphaned Records) no Frontend.

### 2.3. Validação de Unicidade e Sombreamento (Shadowing)
- A chave lógica de unicidade de uma entidade é `(name, parentId)`.
- No `POST`, o backend deve garantir que a entidade não exista nem no Workspace atual, nem no Workspace Global, unificando a verificação de colisão.

### 2.4. Validação de Hierarquia Segura (Prevenção de Inversão)
- Uma entidade classificada como **Global** SÓ PODE ter um Pai que também seja **Global**.
- Permitir que um "Filho" Global tenha um "Pai" Local causaria Orphaned Records para todos os outros workspaces do sistema.
- Uma entidade **Local** tem liberdade total: pode ter um Pai Local ou Global.

### 2.5. Imutabilidade Global (Read-Only)
- Itens Globais não podem ser editados ou inativados por usuários logados sob o escopo de um Workspace Local.
- Não existe funcionalidade de "Ocultar Item Global Localmente". A gestão da árvore Global é centralizada e feita apenas por Admins usando a visão da entidade global.

### 2.6. Isolamento de Cache no Frontend
- O estado da taxonomia persiste no `localStorage` via Zustand `persist`.
- **REGRA DE OURO:** A chave do cache deve ser dinamicamente atrelada ao ID do workspace logado (ex: `taxonomy-store-{workspaceId}`) para evitar o carregamento cruzado de estados ou crash da interface ao alternar de workspace.
