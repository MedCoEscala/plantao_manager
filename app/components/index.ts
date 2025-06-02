// UI Components
export { default as NotificationModal } from './ui/NotificationModal';
export { NotificationProvider, useNotification } from '../contexts/NotificationContext';
export { default as Button } from './ui/Button';
export { default as Input } from './ui/Input';
export { default as Card } from './ui/Card';
export { default as Dialog } from './ui/Dialog';
export { DialogProvider, useDialog } from '../contexts/DialogContext';
export { default as Form } from './ui/Form';
export { default as SectionHeader } from './ui/SectionHeader';

// Form Components
export { default as DateField } from './form/DateField';

// Feature Components
export { default as CalendarComponent } from './CalendarComponent';
export { default as LocationForm } from './locations/LocationForm';
export { default as ShiftForm } from './shifts/ShiftForm';
export { default as ShiftFormModal } from './shifts/ShiftFormModal';
export { default as PaymentForm } from './payment/PaymentForm';

// Re-exportando qualquer outro componente que precise ser utilizado

// Exportação default para expo-router
export default {
  Toast: null, // Placeholder para satisfazer o expo-router
};
