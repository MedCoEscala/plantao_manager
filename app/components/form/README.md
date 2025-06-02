# Componentes de Formulário Atualizados

Este documento descreve os componentes de formulário modernizados e suas funcionalidades.

## FormModal

Modal moderno e responsivo para exibir formulários com animações suaves.

### Características:

- Animações de entrada e saída suaves
- Handle bar para indicar que é um modal
- Responsivo com diferentes tamanhos
- Backdrop clicável para fechar
- Shadow e elevation para profundidade

### Uso:

```tsx
<FormModal
  visible={visible}
  onClose={onClose}
  title="Título do Modal"
  subtitle="Subtítulo opcional"
  size="large"
  showCloseButton={true}>
  {/* Conteúdo do formulário */}
</FormModal>
```

## ShiftForm

Formulário de plantões com funcionalidade de recorrência e design moderno.

### Características:

- Card de preview visual do plantão
- Suporte a plantões recorrentes (semanal, quinzenal, mensal)
- Validação em tempo real
- Formatação automática de valores
- Cálculo automático de duração
- Preview das datas de recorrência

### Novos campos:

- `isRecurring`: boolean para habilitar recorrência
- `recurrenceType`: tipo de recorrência (weekly, biweekly, monthly)
- `recurrenceCount`: quantidade de plantões a criar
- Preview das datas geradas

## PaymentForm

Formulário de pagamentos com melhor organização visual.

### Características:

- Card de preview do pagamento
- Status colorido (pendente, recebido, cancelado)
- Melhor organização dos campos
- Informações detalhadas do plantão selecionado

## RecurrenceSelector

Componente reutilizável para seleção de recorrência.

### Características:

- Preview visual das datas
- Validação de limites (máximo 52 registros)
- Suporte a diferentes frequências
- Contagem de registros a serem criados

### Uso:

```tsx
<RecurrenceSelector
  isRecurring={isRecurring}
  onRecurringChange={setIsRecurring}
  recurrenceType={recurrenceType}
  onRecurrenceTypeChange={setRecurrenceType}
  recurrenceCount={recurrenceCount}
  onRecurrenceCountChange={setRecurrenceCount}
  startDate={startDate}
  errors={errors}
/>
```

## Melhorias Implementadas

### Design

- Cards de preview mais informativos
- Gradientes e cores mais modernas
- Melhor espaçamento e tipografia
- Ícones e status coloridos
- Animações suaves

### Funcionalidade

- Plantões recorrentes
- Validação aprimorada
- Estados de carregamento
- Tratamento de erros melhorado
- Feedback visual em tempo real

### UX/UI

- Fluxo mais intuitivo
- Informações contextuais
- Preview de ações
- Feedbacks visuais
- Responsividade

## Backend Support

O backend já suporta criação em lote através do endpoint `/shifts/batch` com as seguintes funcionalidades:

- `skipConflicts`: pula plantões que já existem
- `continueOnError`: continua criando outros plantões se um falhar
- Retorna estatísticas de criação (criados, pulados, falharam)

## Estados dos Formulários

### Estados de Loading

- Carregamento inicial de dados
- Estados de submissão
- Indicadores visuais apropriados

### Estados de Erro

- Validação em tempo real
- Mensagens de erro contextual
- Recuperação de erros

### Estados de Sucesso

- Feedback imediato
- Toasts informativos
- Redirecionamento apropriado
