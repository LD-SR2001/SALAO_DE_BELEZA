# Controle de Salão — Progresso do Projeto

> Última atualização: 08/04/2026

---

## Stack escolhida

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.14 + Django 6 + Django REST Framework |
| Frontend | React + Vite |
| Banco de dados | PostgreSQL 16 (via Homebrew) |
| Fila de tarefas | Celery + Redis |
| WhatsApp | Evolution API (self-hosted, gratuita) |
| IA / Chatbot | Claude API — Sonnet 4.6 (respostas) + Haiku 4.5 (extração de nome) |
| Tempo real | Django Channels + WebSocket |

---

## Como rodar (resumo rápido)

```bash
# 1. PostgreSQL e Redis devem estar rodando
brew services start postgresql@16
# Redis: brew services start redis  (instalar se necessário)

# 2. Backend
cd backend
source ../venv/bin/activate
python manage.py runserver

# 3. Celery (lembretes automáticos) — terminal separado
celery -A config worker -l info
celery -A config beat -l info

# 4. Frontend
cd frontend
npm run dev
```

- Painel: http://localhost:5173
- API: http://localhost:8000
- Docs da API: http://localhost:8000/api/docs/
- Admin Django: http://localhost:8000/admin/
- Login padrão: `admin` / `admin123`

---

## O que foi construído

### Backend — Apps Django

#### `salao` — Configuração base do salão
- **Models:** `Especialidade`, `Profissional`, `HorarioTrabalho`, `Servico`, `ConfiguracaoSalao`, `PortfolioItem`
- Profissional tem: nome, telefone, descrição, foto (upload), especialidades (M2M), horários por dia da semana
- `PortfolioItem` criado e migrado, pronto para implementar a galeria futuramente
- **Endpoints REST:** `/api/salao/profissionais/`, `/api/salao/servicos/`, `/api/salao/especialidades/`, `/api/salao/horarios-trabalho/`, `/api/salao/configuracao/`, `/api/salao/portfolio/`
- Upload de foto via `multipart/form-data` com `FlexPrimaryKeyRelatedField` para lidar com IDs enviados como string pelo FormData

#### `clientes` — Cadastro de clientes
- **Model:** `Cliente` — nome, telefone (único/WhatsApp), email, data de nascimento, observações, ativo
- Criação automática via chatbot (nome inicial = número de telefone)
- Criação e edição manual pelo painel
- **Endpoints REST:** `/api/clientes/` + action `historico` por cliente

#### `agenda` — Agendamentos
- **Models:** `Agendamento`, `BloqueioAgenda`
- Agendamento tem: cliente, profissional, serviços (M2M), data/hora início e fim, status, observações, motivo de cancelamento, valor total (calculado), flag de lembrete enviado
- **Statuses:** `aguardando`, `confirmado`, `concluido`, `cancelado`, `nao_compareceu`
- `AgendaService`: verifica disponibilidade por profissional/data/duração, cria agendamentos com validação de conflito
- Cancelamento exige motivo obrigatório (validado no backend)
- **Endpoints REST:** `/api/agenda/agendamentos/` com actions: `confirmar`, `cancelar` (exige `motivo`), `concluir`, `hoje`, `por_data`, `dashboard`

#### `whatsapp` — Integração WhatsApp
- **Models:** `Conversa`, `Mensagem`
- `EvolutionAPIClient` em `whatsapp/evolution.py` — envia mensagens, verifica conexão
- Webhook em `/api/whatsapp/webhook/` recebe eventos da Evolution API
- WebSocket consumer (`ConversaConsumer`) para atualização em tempo real no painel
- **Endpoints REST:** `/api/whatsapp/conversas/`, `/api/whatsapp/mensagens/`

#### `chatbot` — Lógica do assistente IA
- **Model:** `ContextoConversa` — armazena estado da conversa (aguardando serviço, data, confirmação etc.)
- `chatbot/services.py` — núcleo do sistema:
  - Busca/cria cliente ao receber mensagem
  - Monta histórico das últimas 10 mensagens para contexto
  - Chama Claude Sonnet 4.6 com system prompt contendo: serviços, profissionais, horários e regras do salão
  - **Extração automática de nome:** quando cliente ainda não tem nome, chama Claude Haiku para identificar se o cliente mencionou o nome na conversa e atualiza o cadastro automaticamente
  - Detecta intenção de ver disponibilidade e complementa resposta com horários reais

#### `notificacoes` — Lembretes automáticos
- **Model:** `Notificacao`
- **Celery tasks:**
  - `enviar_lembretes_do_dia` — roda a cada hora, envia lembrete X horas antes do agendamento
  - `notificar_cancelamento` — dispara quando agendamento é cancelado
  - `enviar_confirmacao_agendamento` — confirma agendamento via WhatsApp

---

### Frontend — Páginas React

#### `/` — Dashboard
- Cards de estatísticas do dia: total de agendamentos, confirmados, aguardando
- Lista da agenda de hoje com horário, cliente, serviços, profissional e status

#### `/agenda` — Calendário
- FullCalendar com views: semana (padrão), mês e dia
- Eventos coloridos por status
- Click no evento abre modal com detalhes e ações (confirmar, concluir, cancelar)
- Cancelamento abre modal de confirmação com campo de motivo obrigatório

#### `/atendimentos` — Lista de atendimentos
- Tabela paginada (15 por página) com todos os atendimentos
- Filtros: busca por cliente/profissional, status, profissional, período (data início/fim)
- Ações inline: confirmar, concluir, cancelar (com modal de motivo)
- Subtotal da página (excluindo cancelados)
- Modal "Novo atendimento": busca de cliente, seleção de profissional, serviços por especialidade com preço/duração acumulada, horários disponíveis carregados automaticamente

#### `/profissionais` — Gestão de profissionais
- Cards agrupados por especialidade (Cabelo, Unhas, Sobrancelha)
- Filtro por todas/ativas/inativas
- Modal de criação/edição: foto com preview, nome, telefone, descrição, chips de especialidade
- Ações de editar/excluir aparecem ao hover

#### `/servicos` — Gestão de serviços
- Tabela com CRUD completo
- Campos: nome, especialidade, duração (min), preço, status ativo/inativo

#### `/clientes` — Gestão de clientes
- Tabela com busca em tempo real
- Coluna de origem: WhatsApp (criado pelo chatbot) ou Manual
- Clientes sem nome identificado exibem aviso visual
- Painel lateral ao clicar: avatar, contatos, stats (total atendimentos, concluídos, valor gasto), histórico completo
- Modal de criação/edição: nome, telefone/WhatsApp, email, data de nascimento, observações

#### `/conversas` — Monitor WhatsApp
- Lista de conversas com atualização via WebSocket em tempo real
- Visualização do histórico de mensagens com bolhas (enviada/recebida)

---

### Componentes reutilizáveis

- `Layout.jsx` — sidebar com navegação
- `ModalCancelamento.jsx` — modal de confirmação de cancelamento com campo de motivo obrigatório (usado na Agenda e em Atendimentos)
- `AuthContext.jsx` — autenticação JWT com refresh automático de token

---

## Banco de dados — resumo das tabelas

```
salao_especialidade          salao_profissional
salao_horariotrabalho        salao_servico
salao_portfolioitem          salao_configuracaosalao
clientes_cliente
agenda_agendamento           agenda_bloqueioagenda
whatsapp_conversa            whatsapp_mensagem
chatbot_contextoconversa
notificacoes_notificacao
auth_user (Django padrão)
```

---

## Bugs corrigidos ao longo do desenvolvimento

| Problema | Causa | Solução |
|---|---|---|
| Criação de profissional falhava | `PrimaryKeyRelatedField` rejeitava IDs como string (FormData) | `FlexPrimaryKeyRelatedField` converte string→int |
| Campo `descricao` nulo no banco | `TextField(blank=True)` sem `default=''` | Adicionado `default=''` + migration |
| Criação de agendamento falhava | `data_hora_fim` calculado após `create()`, banco recebia NULL | Calcular `data_hora_fim` antes de inserir |
| Cancelamento sem confirmação | Ação direta sem modal | Modal com campo de motivo obrigatório no frontend e backend |

---

## Próximos passos

### Alta prioridade

- [ ] **Configurar Evolution API via Docker** e conectar um número WhatsApp Business real para testar o chatbot de ponta a ponta
- [ ] **Preencher `.env`** com chave real da Anthropic (`ANTHROPIC_API_KEY`) e chaves da Evolution API
- [ ] **Instalar e configurar Redis** (`brew install redis && brew services start redis`) para Celery funcionar
- [ ] **Página de Configurações do salão** — editar nome, horários de funcionamento, mensagens do chatbot, antecedência mínima para agendamento

### Funcionalidades planejadas

- [ ] **Portfólio das profissionais** — o model `PortfolioItem` já existe e está migrado, falta a página no painel para fazer upload das fotos e a exibição
- [ ] **Página de Profissionais — gestão de horários** — editar os horários de trabalho de cada profissional direto no painel (hoje só pelo admin Django)
- [ ] **Remarcação pelo chatbot** — cliente pode remarcar um agendamento existente pelo WhatsApp; o chatbot identifica o agendamento e oferece novos horários
- [ ] **Confirmação de agendamento pelo chatbot** — depois de criar o agendamento, o bot já envia a mensagem de confirmação automaticamente
- [ ] **Relatórios e financeiro** — faturamento por período, por profissional, por serviço; número de cancelamentos e taxa de ocupação
- [ ] **Bloqueio de agenda pelo painel** — interface para criar/visualizar bloqueios (férias, folgas) direto na agenda

### Site do salão (fase futura)

- [ ] Página pública com serviços e preços
- [ ] Perfil de cada profissional com portfólio
- [ ] Agendamento online pelo site (sem WhatsApp)
- [ ] Integração com o mesmo backend já construído

### Infraestrutura (quando for publicar)

- [ ] Escolher hospedagem (Railway, Render, VPS)
- [ ] Configurar variáveis de ambiente de produção
- [ ] Servir frontend como estático (build do Vite)
- [ ] Configurar HTTPS e domínio
- [ ] Configurar backups automáticos do PostgreSQL
