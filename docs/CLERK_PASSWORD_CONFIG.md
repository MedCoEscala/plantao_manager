# Configuração de Senha com Clerk

## 🏗️ Arquitetura de Validação

### Como Funciona:

1. **Clerk (Principal)** - Gerencia autenticação e tem suas próprias regras de segurança
2. **Frontend (UX)** - Valida antes de enviar para melhor experiência do usuário
3. **Backend (Opcional)** - Para casos específicos onde você processa senhas diretamente

## 🔒 Validações do Clerk (Automáticas & Obrigatórias)

O Clerk **automaticamente** aplica as seguintes validações que **NÃO podem ser desabilitadas**:

- ✅ **Verificação contra vazamentos de dados** (Have I Been Pwned)
- ✅ **Força da senha baseada em entropia**
- ✅ **Padrões de senha comuns**
- ✅ **Proteção contra ataques de dicionário**

### Códigos de Erro Comuns:

- `form_password_pwned` - Senha encontrada em vazamentos
- `form_password_not_strong_enough` - Senha muito fraca
- `form_password_too_common` - Senha muito comum

## 📱 Validações do App (Complementares)

Implementamos validações **complementares** para melhor UX:

- **Mínimo 6 caracteres**
- **Pelo menos 1 letra minúscula** (a-z)
- **Pelo menos 1 caractere especial** (!@#$%^&\*()\_+-=[]{}|;':"\\,./<>?)

## ⚙️ Configuração do Clerk Dashboard

**IMPORTANTE:** As configurações de password policy podem não estar visíveis em todos os planos do Clerk.

### Se disponível:

1. Acesse o [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navegue para **Configure > Authentication**
3. Procure por **"Password settings"** ou **"Security settings"**

### Se não encontrar:

- Seu plano usa as configurações **padrão do Clerk**
- Essas configurações são **adequadas para produção**
- O Clerk gerencia a segurança automaticamente

## 🛠️ Como Resolver Erros Comuns

### Erro: "Password has been found in an online data breach"

**Solução:** Use uma senha **única** que não tenha sido usada em outros sites.

**Sugestões de senhas seguras:**

- `minhaApp2024!`
- `plantao@Seguro`
- `trabalho#123`
- `medico@2024`

### Erro: "Password is not strong enough"

**Solução:** Certifique-se de que a senha atende aos critérios mínimos.

## 🧪 Testes Recomendados

**Senhas válidas para teste:**

- `teste123!`
- `usuario@2024`
- `app#Segura`

**Senhas que devem falhar:**

- `password` (muito comum)
- `123456!` (muito comum)
- `admin123` (muito comum)

## 📋 Arquivos com Validação

### Frontend:

- `app/services/auth/utils.ts` - Função `validatePassword()`
- `app/(auth)/sign-up.tsx` - Tratamento de erros específicos
- `app/(auth)/reset-password.tsx` - Tratamento de erros específicos
- `app/(root)/settings/profile.tsx` - Validação na alteração de senha

### Backend:

- `backend/src/auth/utils/password-validation.ts` - Validação compartilhada
- `backend/src/auth/dto/password-validation.dto.ts` - DTO para validação

## 🎯 Resumo

- **Clerk gerencia a segurança principal** - você não precisa configurar
- **App fornece validação de UX** - para melhor experiência
- **Use senhas únicas** - evite senhas comuns ou vazadas
- **Teste com senhas reais** - evite senhas óbvias como "password123"
