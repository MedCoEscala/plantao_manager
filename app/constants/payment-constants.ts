export const PAYMENT_MESSAGES = {
  // Títulos
  SCREEN_TITLE: 'Controle de Pagamentos',
  SUMMARY_TITLE: 'Resumo de',

  // Status
  STATUS_PAID: 'Pago',
  STATUS_PENDING: 'Pendente',

  // Labels
  LABEL_TOTAL: 'Total do mês',
  LABEL_RECEIVED: 'Recebidos',
  LABEL_PENDING: 'Pendentes',
  LABEL_SHIFTS: 'plantões',
  LABEL_SHIFT: 'plantão',

  // Ações
  ACTION_MARK_PAID: 'Marcar Pago',
  ACTION_MARK_UNPAID: 'Marcar Pendente',
  ACTION_SELECT_ALL: 'Selecionar todos',
  ACTION_CANCEL: 'Cancelar',
  ACTION_CONFIRM: 'Confirmar',

  // Filtros
  FILTER_ALL_LOCATIONS: 'Todos os locais',
  FILTER_ALL_CONTRACTORS: 'Todos os contratantes',
  FILTER_BY_LOCATION: 'Filtrar por local',
  FILTER_BY_CONTRACTOR: 'Filtrar por contratante',

  // Placeholders
  PLACEHOLDER_SEARCH: 'Buscar plantão...',
  PLACEHOLDER_NO_LOCATION: 'Local não informado',

  // Mensagens de feedback
  TOAST_UPDATE_SUCCESS: 'Dados atualizados com sucesso',
  TOAST_LOAD_ERROR: 'Erro ao carregar plantões',
  TOAST_SELECT_WARNING: 'Selecione pelo menos um plantão',
  TOAST_PAYMENT_ERROR: 'Erro ao processar pagamentos',
  TOAST_MARK_PAID_SUCCESS: (count: number) =>
    `${count} ${count === 1 ? 'plantão marcado como pago' : 'plantões marcados como pagos'}`,
  TOAST_MARK_UNPAID_SUCCESS: (count: number) =>
    `${count} ${count === 1 ? 'plantão marcado como não pago' : 'plantões marcados como não pagos'}`,

  // Diálogos
  DIALOG_CONFIRM_PAYMENT_TITLE: 'Confirmar Pagamento',
  DIALOG_CONFIRM_PAYMENT_MESSAGE: (count: number, value: string) =>
    `Marcar ${count} ${count === 1 ? 'plantão' : 'plantões'} como ${count === 1 ? 'pago' : 'pagos'}?\n\nValor total: ${value}`,
  DIALOG_REMOVE_PAYMENT_TITLE: 'Remover Pagamento',
  DIALOG_REMOVE_PAYMENT_MESSAGE: (count: number) =>
    `Marcar ${count} ${count === 1 ? 'plantão' : 'plantões'} como não ${count === 1 ? 'pago' : 'pagos'}?`,

  // Estados vazios
  EMPTY_STATE_TITLE: 'Nenhum plantão encontrado',
  EMPTY_STATE_MESSAGE: 'Não há plantões registrados para o período selecionado.',

  // Instruções
  INSTRUCTION_LONG_PRESS: 'Pressione e segure um plantão para selecionar múltiplos',

  // Acessibilidade
  A11Y_SELECT_CHECKBOX: 'Selecionar plantão',
  A11Y_FILTER_BUTTON: 'Abrir filtros',
  A11Y_SEARCH_BUTTON: 'Abrir busca',
  A11Y_REFRESH_BUTTON: 'Atualizar dados',
};

export const PAYMENT_COLORS = {
  PAID: '#10B981', // success
  PENDING: '#F59E0B', // warning
  PRIMARY: '#18cb96',
  BACKGROUND: '#f8fafc',
  TEXT_DARK: '#1e293b',
  TEXT_LIGHT: '#64748b',
  BORDER: '#e2e8f0',
};

export const PAYMENT_ANIMATIONS = {
  FADE_DURATION: 300,
  SLIDE_DURATION: 350,
  LIST_ITEM_DELAY: 50,
  SELECTION_DURATION: 250,
  FILTERS_DURATION: 350,
};

export default {
  MESSAGES: PAYMENT_MESSAGES,
  COLORS: PAYMENT_COLORS,
  ANIMATIONS: PAYMENT_ANIMATIONS,
};
