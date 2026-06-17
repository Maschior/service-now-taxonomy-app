# Plano de Implementação do Portal Centralizado de Suporte IT

## 1. Visão Geral
Criação de um portal unificado para acesso a diversas ferramentas de suporte (desenvolvidas internamente e open-source) através de um único domínio, provendo autenticação centralizada (SSO - Single Sign-On) e controle de permissões por usuário/grupo.

## 2. Arquitetura Proposta

### Componentes Core:
1. **SSO / Identity Provider (IdP)**:
   - **Recomendação:** **Authentik** ou **Authelia/Keycloak**. O IdP gerenciará os usuários, grupos e permissões, fornecendo autenticação OIDC (OpenID Connect) / OAuth2 para todas as aplicações. Isso permite que o usuário faça login uma única vez no Portal.
2. **Reverse Proxy / API Gateway**:
   - **Nginx** (ou Traefik/Caddy). Será a única porta de entrada exposta na web (ex: porta 80/443). Ele vai interceptar todo o tráfego de `itsupportworkstation.com` e rotear internamente para o respectivo container Docker ou porta local.
3. **Portal Dashboard (Página Central)**:
   - Uma aplicação web (ex: Vite + React + Tailwind/CSS Vanilla) hospedada na raiz `/` (ou `portal.itsupportworkstation.com`).
   - Atuará como a "Landing Page". O usuário acessa, faz login via SSO e visualiza um painel com os ícones das ferramentas que tem permissão para acessar.

### Mapeamento de Serviços (Via Nginx):
Pode ser feito via **Sub-rotas (Subpaths)** ou **Subdomínios**. 
*(Recomendação técnica: Subdomínios geralmente evitam problemas de reescrita de URLs de arquivos estáticos no frontend de aplicações complexas).*

**Exemplo de Roteamento:**
- `https://itsupportworkstation.com` -> Portal Central
- `https://sso.itsupportworkstation.com` -> Serviço de IdP (Authentik)
- `https://taxonomy.itsupportworkstation.com` -> Service Now Taxonomy App
- `https://dsno.itsupportworkstation.com` -> DSNO Processor
- `https://docs.itsupportworkstation.com` -> Cummins Docs
- `https://wiki.itsupportworkstation.com` -> Wiki.js
- `https://git.itsupportworkstation.com` -> Gitea

*(Caso opte obrigatoriamente por caminhos como `/taxonomy`, precisaremos garantir que todas as aplicações suportam configuração de `Base URL / Root Path`).*

## 3. Estratégia de Autenticação e Permissionamento

Para evitar que o usuário precise logar separadamente em cada aba:

- **Gitea e Wiki.js**: Ambas possuem suporte nativo de fábrica a login corporativo via OAuth2/OIDC. Serão configuradas para delegar o login ao nosso IdP central. Os grupos do IdP (ex: `admins`) podem ser mapeados para cargos internos nelas.
- **Aplicações Customizadas (Taxonomy, DSNO Processor)**: O backend Node.js dessas aplicações precisará de pequenos ajustes para validar os tokens JWT gerados pelo IdP central. Se usarem autenticação própria hoje, ela será substituída pela confiança no provedor central.
- **Cummins Docs (MkDocs - Site Estático)**: Como é um site gerado estaticamente, não possui backend para validar login. Para protegê-lo, usaremos a técnica de **Forward Auth** direto no Nginx. Antes do Nginx entregar a página do MkDocs, ele pergunta ao IdP se a requisição possui um cookie de sessão válido e se o usuário tem a role necessária.

## 4. Fases de Implementação

### Fase 1: Infraestrutura de Proxy e Rede
- [ ] Criar uma infraestrutura base (pode ser um repositório novo como `itsupport-proxy-infra` contendo um `docker-compose.yml` mestre).
- [ ] Configurar a rede Docker compartilhada entre os projetos para que o Nginx consiga enxergar os containers de outras aplicações.
- [ ] Levantar o Nginx configurado com os blocos de roteamento (ex: proxy_pass para cada aplicação).

### Fase 2: Gestão de Identidade (Single Sign-On)
- [ ] Escolher e levantar um serviço de IdP via Docker (Authentik é fortemente sugerido por ter uma UI moderna e ser fácil de configurar via Web).
- [ ] Criar a estrutura inicial de Grupos (ex: `Admins`, `Suporte`, `Devs`).
- [ ] Criar usuários de teste e vincular aos grupos.

### Fase 3: Portal Landing Page
- [ ] Criar o projeto Frontend do Portal.
- [ ] Integrar o login do Portal com o IdP via OIDC.
- [ ] Desenvolver a tela inicial (Dashboard) que renderiza os botões (links para os outros apps) de forma dinâmica, checando os "claims/groups" do usuário logado no token JWT para exibir apenas o que ele tem acesso.

### Fase 4: Integração das Ferramentas Open Source (Prontas)
- [ ] **Gitea**: Registrar um client OIDC no IdP e configurar a UI do Gitea para logar por lá.
- [ ] **Wiki.js**: Configurar o Provider OIDC.
- [ ] **Cummins Docs**: Configurar a anotação/rota do Nginx com `auth_request` atrelado ao IdP.

### Fase 5: Integração das Ferramentas Customizadas (Em Desenvolvimento)
- [ ] **Taxonomy App**: Implementar a verificação do Auth OIDC/JWT no backend `/server` e no frontend `/client`.
- [ ] **DSNO Processor**: Repetir o processo de validação de autenticação centralizada.

---

## 5. Pontos de Decisão (Para Discutirmos Agora)

Para prosseguir para ações mais práticas, precisamos definir:

1. **Topologia de Domínio:** Vamos utilizar **sub-rotas** (ex: `site.com/taxonomy`) ou **subdomínios** (ex: `taxonomy.site.com`)? Subdomínios são bem mais fáceis de configurar sem quebrar CSS/JS das aplicações, mesmo usando `localhost` (basta alterar o arquivo `/etc/hosts` ou usar extensões de proxy no dev).
2. **Orquestração:** Os projetos hoje rodam em `docker-compose` separados? O ideal será criar uma "docker network" externa compartilhada, para que o Nginx consiga conversar com todos eles mesmo que subam independentemente. O que acha?
3. **IdP (Provedor de Identidade):** Você tem familiaridade com ferramentas como Authentik ou Keycloak? O Authentik une bem a parte de Single Sign-On corporativo (OIDC) com o Forward Auth (proteger rotas estáticas no Nginx).
