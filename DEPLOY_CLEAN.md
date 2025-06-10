# 🚀 Deploy Limpo no Vercel - Guia Definitivo

## ⚠️ Problema Atual

- Configurações conflitantes entre `vercel.json` e painel
- Conta diferente do repositório
- Builds falhando

## 🔥 Solução: Deploy Limpo

### Passo 1: Excluir Deploy Atual

1. Acesse: https://vercel.com/dashboard
2. Encontre o projeto `plantao_manager`
3. Settings → Advanced → **Delete Project**

### Passo 2: Reconectar com Conta Correta

1. **Sua conta** deve importar o repositório
2. **Não usar** a conta onde está o repo se não tem acesso

### Passo 3: Criar Novo Projeto no Vercel

**3.1 Importar Repositório**

```
Repository: https://github.com/MedCoEscala/plantao_manager
Branch: master
```

**3.2 Configurações de Build**

```
Framework Preset: Other
Build Command: npm run vercel-build
Output Directory: .
Install Command: npm install
Root Directory: (deixe vazio)
Node.js Version: 18.x
```

**3.3 Variáveis de Ambiente**

```
DATABASE_URL=sua_database_url
CLERK_SECRET_KEY=sua_clerk_secret
NODE_ENV=production
```

### Passo 4: Deploy

Após criar o projeto:

1. O Vercel fará deploy automaticamente
2. Aguarde o build completar
3. Verifique se a API responde

## 🧪 Testar Local

Antes do deploy, teste se funciona local:

```bash
# No diretório raiz
npm run build

# Verificar se criou backend/dist/
ls -la backend/dist/

# Testar o handler do Vercel
node -e "require('./api/index.js')"
```

## 🔍 Troubleshooting

### Se falhar no build:

- Verifique se `backend/dist/` foi criado
- Confirme se as dependências do backend estão corretas

### Se falhar no runtime:

- Verifique variáveis de ambiente
- Confirme se o Prisma foi configurado

### Se der timeout:

- Otimize imports no NestJS
- Considere lazy loading

## 📋 Checklist Final

- [ ] Deploy antigo excluído
- [ ] Novo projeto criado na sua conta
- [ ] Configurações corretas aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] Build passou sem erros
- [ ] API responde corretamente

## 🚨 Importante

- **NÃO** use configurações no painel que conflitem com `vercel.json`
- **USE** sua própria conta no Vercel
- **CONFIGURE** todas as variáveis de ambiente
- **AGUARDE** o primeiro deploy completar antes de testar
