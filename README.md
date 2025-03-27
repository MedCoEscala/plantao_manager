# Plantão Manager

Aplicativo para gerenciamento de plantões médicos desenvolvido com React Native, Expo e NativeWind.

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
import { Button } from "@app/components/ui";

<Button variant="primary" size="md" fullWidth onPress={handlePress}>
  Entrar
</Button>;
```

### Input

```jsx
import { Input } from "@app/components/ui";

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
import { Card } from "@app/components/ui";

<Card title="Detalhes do Plantão" variant="elevated">
  <Text className="text-text-dark">Conteúdo do card</Text>
</Card>;
```

Para mais informações sobre componentes de UI, consulte a documentação em `app/styles/README.md`.
