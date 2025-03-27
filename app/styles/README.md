# Sistema de Design do Plantão Manager

Este documento descreve o sistema de design baseado em TailwindCSS/NativeWind utilizado nesta aplicação.

## Cores

O sistema de cores é baseado no seguinte esquema:

- **Primary**: `#0077B6` - Cor principal utilizada para ações primárias, links e elementos de destaque
- **Secondary**: `#90E0EF` - Cor secundária utilizada para elementos complementares
- **Text**:
  - Dark: `#2B2D42` - Texto principal
  - Light: `#8D99AE` - Texto secundário, legendas
- **Estados**:
  - Error: `#E63946` - Mensagens de erro, alertas críticos
  - Success: `#2A9D8F` - Confirmações, ações concluídas com sucesso
  - Warning: `#E9C46A` - Alertas, avisos
- **Background**: `#F8F9FA` - Cor de fundo padrão

Cada cor possui variações de intensidade, de 50 (mais clara) a 900 (mais escura).

## Componentes

### Button

```jsx
import { Button } from "@app/components/ui";

// Variantes
<Button variant="primary">Botão Primário</Button>
<Button variant="secondary">Botão Secundário</Button>
<Button variant="outline">Botão Outline</Button>
<Button variant="ghost">Botão Ghost</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>

// Largura total
<Button fullWidth>Largura Total</Button>

// Loading
<Button loading>Carregando...</Button>
```

### Input

```jsx
import { Input } from "@app/components/ui";

<Input
  label="Email"
  placeholder="Digite seu email"
  error="Email inválido"
  fullWidth
/>;
```

### Card

```jsx
import { Card } from "@app/components/ui";

// Card básico
<Card>
  <Text>Conteúdo do card</Text>
</Card>

// Card com título
<Card title="Título do Card">
  <Text>Conteúdo do card</Text>
</Card>

// Card com footer
<Card
  title="Título do Card"
  footer={<Button>Ação</Button>}
>
  <Text>Conteúdo do card</Text>
</Card>

// Variantes
<Card variant="default">Default</Card>
<Card variant="elevated">Com sombra</Card>
<Card variant="outlined">Com borda</Card>
<Card variant="flat">Fundo cinza</Card>

// Clicável
<Card onPress={() => console.log('Clicado')}>
  <Text>Card clicável</Text>
</Card>
```

### Badge

```jsx
import { Badge } from "@app/components/ui";

// Variantes
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>

// Tamanhos
<Badge size="sm">Pequeno</Badge>
<Badge size="md">Médio</Badge>
<Badge size="lg">Grande</Badge>

// Arredondamento
<Badge rounded>Arredondado</Badge>
```

### Divider

```jsx
import { Divider } from "@app/components/ui";

// Básico
<Divider />

// Com label
<Divider label="OU" />

// Variantes
<Divider variant="solid" />
<Divider variant="dashed" />
<Divider variant="dotted" />

// Cor personalizada
<Divider color="primary" />

// Vertical (necessita de um container com altura definida)
<View className="h-20">
  <Divider orientation="vertical" />
</View>
```

### Toast

```jsx
import { useToast } from "@app/components/ui";

function MyComponent() {
  const { showToast } = useToast();

  const handleAction = () => {
    showToast("Operação realizada com sucesso", "success");
    // Tipos: "success" | "error" | "info" | "warning"
  };

  return <Button onPress={handleAction}>Mostrar Toast</Button>;
}
```

## Classes Utilitárias Comuns

### Layout

- `flex-1` - Flex grow 1
- `flex-row` - Direção horizontal
- `flex-col` - Direção vertical
- `justify-center` - Centraliza horizontalmente
- `items-center` - Centraliza verticalmente
- `p-4` - Padding 16
- `m-4` - Margin 16
- `gap-2` - Espaçamento entre elementos 8

### Tipografia

- `text-base` - Tamanho base (16px)
- `text-sm` - Texto pequeno (14px)
- `text-lg` - Texto grande (18px)
- `font-bold` - Negrito
- `text-center` - Centralizado
- `text-primary` - Cor primária
- `text-text-dark` - Texto principal

### Bordas e Sombras

- `rounded-lg` - Bordas arredondadas (8px)
- `border` - Borda padrão
- `border-gray-200` - Borda cinza
- `shadow-sm` - Sombra pequena
- `shadow-md` - Sombra média
