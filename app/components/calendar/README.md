# Calendar Components

Este diretório contém componentes específicos do calendário do MedEscala.

## ShiftColorDots

Componente que exibe bolinhas coloridas representando os locais dos plantões no calendário.

### Funcionalidades

- **Visualização por cores**: Mostra a cor de cada local de plantão
- **Agrupamento**: Agrupa plantões do mesmo local (evita cores duplicadas)
- **Indicador de overflow**: Mostra "+N" quando há mais plantões do que o limite
- **Responsivo**: Adapta tamanho para vista semanal (medium) e mensal (small)
- **Estados visuais**: Muda aparência quando dia está selecionado

### Props

```typescript
interface ShiftColorDotsProps {
  colors: ShiftColorData[];      // Array de cores dos locais
  size?: 'small' | 'medium';     // Tamanho das bolinhas (default: 'small')
  maxVisible?: number;           // Máximo de bolinhas visíveis (default: 4)
  isSelected?: boolean;          // Se o dia está selecionado (default: false)
}
```

### Uso

```tsx
import { ShiftColorDots } from './calendar/ShiftColorDots';

<ShiftColorDots
  colors={[
    { locationId: '1', color: '#18cb96' },
    { locationId: '2', color: '#3b82f6' },
  ]}
  size="medium"
  maxVisible={4}
  isSelected={false}
/>
```

### Validações

- Filtra cores inválidas (null, undefined, strings vazias)
- Remove cores duplicadas do mesmo local
- Retorna null se não houver cores válidas
- Protege contra erros de dados inconsistentes

### Casos de Borda Tratados

1. **Plantões sem location**: Usa cor cinza padrão (#94a3b8)
2. **Múltiplos plantões no mesmo local**: Mostra apenas uma bolinha por local
3. **Mais plantões que o limite**: Mostra indicador "+N"
4. **Cores inválidas**: Filtra automaticamente
5. **Array vazio**: Não renderiza nada

### Layout Visual

**1-3 plantões:**
```
● ● ●
```

**4+ plantões:**
```
● ● ● +2
```

### Integração com CalendarComponent

O componente é usado em duas vistas:

1. **Vista Semanal**: `size="medium"`, `maxVisible={4}`
2. **Vista Mensal**: `size="small"`, `maxVisible={3}`

Ambas recebem os dados do mapa `shiftsByDate` que é calculado com `useMemo` para performance.
