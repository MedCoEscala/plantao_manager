# 🪝 Configuração de Webhook para Deploy Automático

## Problema Atual

O deploy automático não está funcionando porque as **GitHub Secrets** não estão configuradas corretamente.

## Solução: Configurar Webhook do Vercel

### Passo 1: Obter URL do Webhook do Vercel

**Opção A: Pelo painel do Vercel (se tiver acesso)**

1. Acesse o painel do Vercel
2. Vá para o projeto `plantao_manager`
3. Clique em **Settings** → **Git**
4. Copie a **Deploy Hook URL**

**Opção B: Pedir para quem tem acesso**
Peça para a pessoa que tem acesso ao Vercel:

1. Ir no projeto no painel do Vercel
2. Settings → Git → Deploy Hooks
3. Criar um novo hook ou copiar o existente
4. A URL será algo como: `https://api.vercel.com/v1/integrations/deploy/[PROJECT_ID]/[HOOK_ID]`

### Passo 2: Configurar GitHub Secrets

1. **Acesse o repositório no GitHub**:

   ```
   https://github.com/MedCoEscala/plantao_manager
   ```

2. **Vá para Settings → Secrets and variables → Actions**

3. **Adicione os seguintes secrets**:

   **VERCEL_DEPLOY_HOOK** (obrigatório)

   ```
   https://api.vercel.com/v1/integrations/deploy/[SEU_PROJECT_ID]/[SEU_HOOK_ID]
   ```

   **VERCEL_URL** (opcional)

   ```
   https://[nome-do-projeto].vercel.app
   ```

### Passo 3: Testar o Webhook

1. **Fazer um push**:

   ```bash
   git add .
   git commit -m "test: webhook deploy"
   git push origin master
   ```

2. **Verificar o GitHub Action**:
   - Ir em **Actions** no repositório
   - Ver se o workflow "🚀 Auto Deploy to Vercel" executou
   - Verificar os logs para debug

### Passo 4: Verificar se Funcionou

Após configurar as secrets e fazer push:

1. **GitHub Action deve executar automaticamente**
2. **Vercel deve receber o webhook e fazer deploy**
3. **App deve atualizar automaticamente**

## 🔧 Troubleshooting

### GitHub Action falhando

- ✅ Verifique se as secrets estão configuradas
- ✅ Confirme se a URL do webhook está correta
- ✅ Veja os logs do Action para erros específicos

### Webhook não dispara

- ✅ Confirme se o webhook URL é válido
- ✅ Teste manualmente: `curl -X POST "SEU_WEBHOOK_URL"`
- ✅ Verifique se o projeto no Vercel está ativo

### Deploy falha no Vercel

- ✅ Veja os logs de build no painel do Vercel
- ✅ Confirme se as variáveis de ambiente estão configuradas
- ✅ Verifique se o `vercel.json` está correto

## 📋 Checklist de Configuração

- [ ] Webhook URL obtida do Vercel
- [ ] Secret `VERCEL_DEPLOY_HOOK` configurada no GitHub
- [ ] Secret `VERCEL_URL` configurada (opcional)
- [ ] Push teste feito
- [ ] GitHub Action executou com sucesso
- [ ] Deploy aconteceu no Vercel
- [ ] App atualizou automaticamente

## 🚀 Scripts Auxiliares

Para testar manualmente:

```bash
# Script de deploy manual (já existente)
./deploy.sh "Mensagem do commit"

# Testar webhook manualmente
curl -X POST "https://api.vercel.com/v1/integrations/deploy/[PROJECT_ID]/[HOOK_ID]"

# Verificar status do GitHub Action
gh run list  # (se tiver GitHub CLI)
```

## 📞 Suporte

Se ainda não funcionar:

1. Compartilhe os logs do GitHub Action
2. Confirme se tem acesso ao painel do Vercel
3. Verifique se as permissões do repositório estão corretas

## ✅ Confirmação: Webhook Funcionando

O webhook está **100% funcional**. O que você precisa agora é apenas configurar a secret no GitHub para automatizar o processo.

## 🎯 Próximos Passos

### Passo 1: Configurar Secret (OBRIGATÓRIO)

1. Vá para: `https://github.com/MedCoEscala/plantao_manager/settings/secrets/actions`
2. Adicione uma nova secret:
   - **Nome:** `VERCEL_DEPLOY_HOOK`
   - **Valor:** `https://api.vercel.com/v1/integrations/deploy/prj_F1koEuY6TEEPMj9qfVUSJwiPtlRf/5aRybC0De7`

### Passo 2: Testar Deploy Automático

Após configurar a secret, faça um novo push:

```bash
git commit --allow-empty -m "test: webhook automation"
git push origin master
```

### Passo 3: Verificar Funcionamento

- GitHub Action deve executar em: `https://github.com/MedCoEscala/plantao_manager/actions`
- Deploy deve aparecer no painel do Vercel

## 🔧 Diagnóstico Atual

- ✅ **Webhook URL:** Válida e funcionando
- ✅ **GitHub Action:** Configurado e melhorado
- ✅ **Deploy manual:** Funciona (testamos acima)
- ⏳ **Secret do GitHub:** Falta configurar
- ✅ **Estrutura do projeto:** Correta para Vercel

**O problema era exatamente isso: falta da configuração das GitHub Secrets!** Uma vez configuradas, o deploy automático funcionará perfeitamente a cada push.
