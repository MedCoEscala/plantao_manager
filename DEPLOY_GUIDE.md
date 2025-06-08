# 🚀 Guia Completo de Deploy - MedEscala

## Pré-requisitos

- [ ] Conta no Clerk (nova/corporativa)
- [ ] Conta no NeonDB
- [ ] Conta no Railway
- [ ] Repositório transferido para MedCoEscala ✅

## FASE 1: Setup do Clerk (Produção)

### 1.1 Criar Aplicação de Produção

1. Acesse [clerk.com](https://clerk.com)
2. Crie conta com email da **MedCoEscala**
3. **Create Application** → Nome: "MedEscala Production"
4. Selecione providers de login desejados

### 1.2 Configurar Domínios

- **Dashboard** → **Domains**
- Adicionar domínio do Railway (depois do deploy)

### 1.3 Copiar Chaves

```env
# Chaves que você vai precisar:
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx (para frontend)
CLERK_SECRET_KEY=sk_live_xxxxx (para backend)
```

## FASE 2: Setup do NeonDB

### 2.1 Criar Database

1. Acesse [neon.tech](https://neon.tech)
2. **Create Project** → Nome: "medescala-prod"
3. Região: **US East** (mais próximo do Railway)

### 2.2 Copiar Connection String

```env
DATABASE_URL=postgresql://user:password@host/medescala-prod?sslmode=require
```

## FASE 3: Deploy no Railway

### 3.1 Configurar Projeto

1. Acesse [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Selecionar: **MedCoEscala/plantao_manager**
4. **Root Directory**: `backend`

### 3.2 Variáveis de Ambiente

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/medescala-prod?sslmode=require
CLERK_SECRET_KEY=sk_live_xxxxx
PORT=3000
```

### 3.3 Deploy Automático

- Railway vai detectar NestJS automaticamente
- Rodará: `npm install && npm run build && npm run start:prod`
- Gerará URL: `https://backend-production-xxxx.up.railway.app`

## FASE 4: Atualizar Frontend

### 4.1 Configurar Ambiente de Produção

```env
# Arquivo .env (local)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
EXPO_PUBLIC_API_URL=https://sua-url-do-railway.up.railway.app
```

### 4.2 Build e Deploy

```bash
# Build de produção
npm run build:prod

# Submit para Play Store
npx eas submit --platform android
```

## FASE 5: Configurações Finais

### 5.1 Clerk - Adicionar Domínio do Railway

- **Clerk Dashboard** → **Domains**
- Adicionar: `https://sua-url-do-railway.up.railway.app`

### 5.2 Prisma - Executar Migrations

```bash
# No Railway, será executado automaticamente:
npx prisma migrate deploy
```

## ✅ Checklist Final

### Backend (Railway)

- [ ] Projeto conectado ao GitHub da empresa
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Banco NeonDB conectado
- [ ] Migrations executadas

### Frontend (EAS)

- [ ] Chave pública do Clerk configurada
- [ ] URL da API apontando para Railway
- [ ] Build de produção realizada
- [ ] Submetido para Play Store

### Segurança

- [ ] Chaves de desenvolvimento removidas
- [ ] Arquivo .env no .gitignore
- [ ] Credenciais apenas em produção

## 🔧 Comandos Úteis

```bash
# Verificar status do backend local
npm run config:status

# Executar migrations localmente (teste)
cd backend && npx prisma migrate dev

# Build de produção
npm run build:prod

# Status do EAS
npx eas build:list
```

## 🆘 Troubleshooting

### Erro de CORS

- Verificar se domínio está configurado no Clerk
- Verificar CORS no backend NestJS

### Erro de Database

- Verificar CONNECTION_STRING do Neon
- Executar migrations: `npx prisma migrate deploy`

### Erro de Auth

- Verificar se chaves do Clerk estão corretas
- Verificar se ambiente está como "production"
