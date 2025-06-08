# Sistema de Notificações Push - Plantão Manager

## 📱 Visão Geral

O sistema de notificações push foi implementado para manter os usuários informados sobre seus plantões de forma proativa. Utiliza tecnologias comprovadas e aprovadas pelas stores (Expo Push Notifications).

## 🏗️ Arquitetura

### Backend (NestJS)

- **NotificationsService**: Gerencia envio de notificações e jobs automáticos
- **NotificationsController**: Endpoints REST para configurações
- **Banco de dados**: Novas tabelas para tokens, configurações e logs
- **Jobs automáticos**: Cron jobs para lembretes diários e antes dos plantões

### Frontend (React Native/Expo)

- **useNotifications**: Hook para registro automático de tokens
- **NotificationsAPI**: Serviço para comunicação com backend
- **Tela de configurações**: Interface para personalizar notificações

## 📋 Funcionalidades Implementadas

### 1. Lembretes Diários (8:00)

- 🏥 Resumo dos plantões do dia
- 📍 Localização e horários
- ✅ Configurável pelo usuário

### 2. Lembretes Antes dos Plantões

- ⏰ Notificação X minutos antes do plantão
- 📍 Local e horário específico
- ⚙️ Tempo configurável (padrão: 60 minutos)

### 3. Relatórios Automáticos

- 📊 Semanais (segundas-feiras)
- 📈 Mensais (dia configurável)
- 💰 Resumo de ganhos e estatísticas

### 4. Lembretes de Pagamento

- 💳 Plantões pendentes de pagamento
- 🔔 Notificações personalizáveis

## 🛠️ Tecnologias Utilizadas

### ✅ Aprovadas para Produção

- **expo-notifications**: ~0.31.2 (oficial Expo)
- **expo-device**: ~7.1.4 (oficial Expo)
- **expo-server-sdk**: 3.15.0 (backend)
- **@nestjs/schedule**: 4.1.2 (jobs automáticos)

### 🔧 Configurações Necessárias

#### 1. app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#ffffff",
          "defaultChannel": "default"
        }
      ]
    ]
  }
}
```

#### 2. Permissões Automáticas

- iOS: Solicitadas automaticamente
- Android: Canal de notificação configurado

## 📊 Estrutura do Banco de Dados

### device_tokens

```sql
- id: string (PK)
- user_id: string (FK)
- token: string (unique)
- device_name: string?
- device_type: string? (ios/android)
- app_version: string?
- is_active: boolean
- last_used_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

### notification_configs

```sql
- id: string (PK)
- user_id: string (FK unique)
- daily_reminder: boolean (default: true)
- daily_reminder_time: string (default: "08:00")
- before_shift_reminder: boolean (default: true)
- before_shift_minutes: int (default: 60)
- weekly_report: boolean (default: true)
- weekly_report_day: int (default: 1)
- weekly_report_time: string (default: "09:00")
- monthly_report: boolean (default: true)
- monthly_report_day: int (default: 1)
- monthly_report_time: string (default: "09:00")
- shift_confirmation: boolean (default: false)
- payment_reminder: boolean (default: true)
- created_at: timestamp
- updated_at: timestamp
```

### notification_logs

```sql
- id: string (PK)
- user_id: string
- device_token: string
- title: string
- body: string
- data: json?
- type: string
- status: string (pending/sent/delivered/failed)
- sent_at: timestamp?
- delivered_at: timestamp?
- failure_reason: string?
- created_at: timestamp
- updated_at: timestamp
```

## 🚀 Como Usar

### 1. Registro Automático

O sistema registra automaticamente o dispositivo quando o usuário abre o app:

```typescript
// Acontece automaticamente no _layout.tsx
useNotifications();
```

### 2. Configurar Notificações

```typescript
// Navegar para configurações
router.push('/settings/notifications');
```

### 3. Envio Manual (Admin)

```typescript
const { sendNotification } = useNotificationsApi();

await sendNotification({
  title: 'Título',
  body: 'Mensagem',
  type: 'manual',
  data: { customData: 'value' },
});
```

## 📅 Jobs Automáticos

### Lembrete Diário

```typescript
@Cron('0 8 * * *') // Todo dia às 8:00
async sendDailyReminders()
```

### Lembrete Antes do Plantão

```typescript
@Cron('0 * * * *') // A cada hora
async sendBeforeShiftReminders()
```

## 🔧 API Endpoints

### POST /notifications/device-token

Registra token do dispositivo

```json
{
  "token": "ExponentPushToken[...]",
  "deviceName": "iPhone de João",
  "deviceType": "ios",
  "appVersion": "1.0.0"
}
```

### GET /notifications/config

Busca configurações do usuário

### PUT /notifications/config

Atualiza configurações

```json
{
  "dailyReminder": true,
  "dailyReminderTime": "08:00",
  "beforeShiftReminder": true,
  "beforeShiftMinutes": 60
}
```

### POST /notifications/send

Envia notificação manual

```json
{
  "title": "Título",
  "body": "Mensagem",
  "type": "manual",
  "data": {}
}
```

### DELETE /notifications/device-token/:token

Remove token do dispositivo

## ⚠️ Considerações para Produção

### 1. Segurança

- ✅ Autenticação via Clerk
- ✅ Validação de dados com class-validator
- ✅ Logs de todas as notificações

### 2. Performance

- ✅ Jobs otimizados com batch processing
- ✅ Limpeza automática de tokens inativos
- ✅ Índices no banco de dados

### 3. Escalabilidade

- ✅ Suporta múltiplos dispositivos por usuário
- ✅ Configurações granulares
- ✅ Sistema de retry automático

### 4. Monitoramento

- ✅ Logs detalhados
- ✅ Status de entrega
- ✅ Métricas de falhas

## 🐛 Troubleshooting

### Token não registra

1. Verificar permissões do dispositivo
2. Confirmar se é dispositivo físico
3. Verificar configuração do Expo project ID

### Notificações não chegam

1. Verificar status do token no banco
2. Confirmar configurações do usuário
3. Verificar logs de erro no backend

### Jobs não executam

1. Verificar se ScheduleModule está importado
2. Confirmar timezone do servidor
3. Verificar logs do NestJS

## 📱 Testando

### 1. Ambiente de Desenvolvimento

```bash
# Backend
cd backend && npm run start:dev

# Frontend
npm start
```

### 2. Teste de Notificação

- Acesse Configurações > Notificações
- Clique em "Enviar Notificação de Teste"
- Deve aparecer imediatamente no dispositivo

### 3. Teste de Jobs

- Configure lembrete diário/antes do plantão
- Criar plantão para hoje/próxima hora
- Aguardar execução automática

## 🎯 Próximos Passos

1. **Notificações Rich**: Imagens e botões de ação
2. **Notificações programadas**: Lembretes personalizados
3. **Analytics**: Métricas de engajamento
4. **A/B Testing**: Otimização de mensagens
5. **Deep Links**: Navegação direta para telas específicas

---

> 💡 **Nota**: Todo o sistema foi desenvolvido com foco em compatibilidade com App Store e Google Play Store, utilizando apenas bibliotecas oficiais e estáveis.
