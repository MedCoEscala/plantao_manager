# Plantão Manager

Um aplicativo para gerenciar plantões médicos, construído com React Native (Expo), Prisma, NeonDB e Clerk para autenticação.

## Configuração do Ambiente

### Pré-requisitos

- Node.js (v16+)
- Expo CLI (`npm install -g expo-cli`)
- Uma conta no [NeonDB](https://neon.tech) para o banco de dados PostgreSQL
- Uma conta no [Clerk](https://clerk.dev) para autenticação

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/plantao_manager.git
cd plantao_manager
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:
   Copie o arquivo `.env.example` para `.env` e preencha com suas informações:

```
# Configurações do banco de dados
DATABASE_URL="postgresql://usuario:senha@host:5432/banco?schema=public"

# Configurações do Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=sua-chave-clerk-publicavel
CLERK_SECRET_KEY=sua-chave-clerk-secreta

# URL da API - Deixe em branco para detecção automática em dev ou defina em produção
EXPO_PUBLIC_API_URL=
```

4. Execute as migrações do Prisma:

```bash
npx prisma generate
npx prisma migrate deploy
```

5. Inicie o servidor de desenvolvimento:

```bash
npm start
```

6. Importante: Ao usar expo-router com API routes no mesmo projeto, certifique-se de:
   - Não usar o caractere '+' no início dos nomes de arquivos de rota
   - Usar 'middleware.ts' em vez de '+middleware.ts'
   - Se estiver usando Expo Go, permita que o aplicativo detecte automaticamente seu endereço IP

### Resolução de Problemas Comuns

1. **Erro de Rota inválida com '+'**: O expo-router não aceita nomes de arquivos de rota começando com '+'. Renomeie para remover o caractere '+'

2. **Problemas de conexão com o banco**: Verifique se a URL do banco no .env está correta e se você gerou os clientes Prisma com `npx prisma generate`

3. **Erro de autenticação**: Certifique-se de que as chaves do Clerk estão corretas no arquivo .env

4. **API não encontrada no Expo Go**: O aplicativo tenta detectar automaticamente seu IP, mas você pode precisar defini-lo manualmente no .env

## Estrutura do Projeto

- `/app` - Componentes principais do aplicativo usando Expo Router
  - `/(auth)` - Rotas de autenticação
  - `/(root)` - Rotas protegidas (requerem autenticação)
  - `/api` - API routes para comunicação com o backend
  - `/contexts` - Context Providers React
  - `/services` - Serviços para comunicação com APIs e banco de dados
- `/prisma` - Schema e migrações do Prisma
- `/hooks` - React Hooks customizados

## Autenticação

O projeto utiliza Clerk para autenticação. O fluxo é o seguinte:

1. O usuário faz login/registro usando Clerk
2. Os dados do usuário são salvos no NeonDB via Prisma
3. As rotas protegidas verificam a autenticação via Clerk

## Banco de Dados

O esquema do banco de dados inclui as seguintes entidades:

- `User` - Informações do usuário
- `Location` - Locais de plantão
- `Shift` - Plantões agendados
- `Payment` - Pagamentos dos plantões

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Tecnologias

- React Native 0.76.7
- Expo 52.0.41
- NativeWind 4.1.23 / TailwindCSS 3.4.0
- TypeScript
- Expo Router

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

## Estrutura do Projeto

```
plantao_manager/
├── app/                    # Diretório principal da aplicação
│   ├── (app)/              # Rotas protegidas (requerem autenticação)
│   ├── (auth)/             # Rotas de autenticação (login, registro, etc.)
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # Componentes de UI reutilizáveis
│   │   └── ...
│   ├── contexts/           # Contextos React
│   ├── database/           # Configurações de banco de dados
│   ├── hooks/              # Hooks personalizados
│   ├── lib/                # Bibliotecas e utilitários
│   ├── services/           # Serviços (API, etc.)
│   ├── styles/             # Estilos globais e temas
│   ├── types/              # Definições de tipos TypeScript
│   ├── utils/              # Funções utilitárias
│   └── ...
├── assets/                 # Recursos estáticos (imagens, fontes, etc.)
└── ...
```

## Sistema de Design

O projeto utiliza NativeWind (TailwindCSS para React Native) para estilização. O sistema de design está documentado em `app/styles/README.md` e inclui:

- **Componentes**: Button, Input, Card, Badge, Divider, Toast, etc.
- **Cores**: Esquema de cores consistente com variações (primary, secondary, etc.)
- **Tipografia**: Sistema de textos consistente
- **Espaçamento**: Sistema de espaçamento padronizado

## Funcionalidades Principais

- Autenticação de usuários
- Gerenciamento de plantões
- Calendário de plantões
- Notificações

## Componentes UI

### Button

```jsx
import { Button } from '@app/components/ui';

<Button variant="primary" size="md" fullWidth onPress={handlePress}>
  Entrar
</Button>;
```

### Input

```jsx
import { Input } from '@app/components/ui';

<Input
  label="Email"
  placeholder="Seu email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
/>;
```

### Card

```jsx
import { Card } from '@app/components/ui';

<Card title="Detalhes do Plantão" variant="elevated">
  <Text className="text-text-dark">Conteúdo do card</Text>
</Card>;
```

Para mais informações sobre componentes de UI, consulte a documentação em `app/styles/README.md`.
# Deploy trigger Wed Jun 25 08:57:12 PM -03 2025
