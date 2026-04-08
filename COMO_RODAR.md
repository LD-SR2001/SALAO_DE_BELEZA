# Como rodar o sistema

## Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

---

## 1. Banco de dados

Crie o banco no PostgreSQL:
```sql
CREATE DATABASE salao_db;
```

---

## 2. Backend (Django)

```bash
cd backend

# Configure o .env (copie o .env.example e preencha)
cp .env.example .env

# Ative o virtualenv (já existe na pasta raiz)
source ../venv/bin/activate

# Migrações
python manage.py makemigrations
python manage.py migrate

# Popula dados iniciais (profissionais, serviços, admin)
python setup_inicial.py

# Roda o servidor
python manage.py runserver
```

---

## 3. Celery (lembretes automáticos)

Em outro terminal:
```bash
cd backend
source ../venv/bin/activate

# Worker
celery -A config worker -l info

# Scheduler (lembretes periódicos) — em outro terminal
celery -A config beat -l info
```

---

## 4. Frontend (React)

```bash
cd frontend

# Instale as dependências (primeiro corrija as permissões do npm se necessário)
# sudo chown -R $(whoami) ~/.npm
npm install

# Rode o dev server
npm run dev
```

Acesse: http://localhost:5173

---

## 5. Evolution API (WhatsApp)

1. Baixe e rode a Evolution API via Docker:
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-aqui \
  atendai/evolution-api:latest
```

2. Acesse o painel da Evolution API em http://localhost:8080
3. Crie uma instância chamada `salao`
4. Escaneie o QR Code com o WhatsApp Business
5. Configure o webhook para apontar para: `http://SEU_IP:8000/api/whatsapp/webhook/`

---

## 6. Variáveis de ambiente (.env)

| Variável | Descrição |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Claude (anthropic.com) |
| `EVOLUTION_API_KEY` | Chave configurada na Evolution API |
| `EVOLUTION_API_URL` | URL da Evolution API (padrão: http://localhost:8080) |
| `EVOLUTION_INSTANCE` | Nome da instância (padrão: salao) |
| `DB_*` | Configurações do PostgreSQL |

---

## Usuário padrão
- **Login:** admin
- **Senha:** admin123
