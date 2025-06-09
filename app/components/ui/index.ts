// app/components/index.ts
// UI Components
export { Toast, ToastProvider, useToast } from './Toast';
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as FormModal } from '../form/FormModal';
export { default as Checkbox } from './CheckBox';
export { default as Select } from './Select';
export { default as DatePicker } from './DatePicker';

// Shifts components
export { default as ShiftForm } from '../shifts/ShiftForm';
export { default as ShiftFormModal } from '../shifts/ShiftFormModal';

// Locations components
export { default as LocationForm } from '../locations/LocationForm';
export { default as LocationFormModal } from '../locations/LocationModal';

// Payments components
export { default as PaymentForm } from '../payment/PaymentForm';
export { default as PaymentFormModal } from '../payment/PaymentFormModal';
export { default as SelectableListItem } from './SelectableListItem';

// Hooks
export { useSelection } from '../../hooks/useSelection';

// Constants
export {
  PAYMENT_MESSAGES,
  PAYMENT_COLORS,
  PAYMENT_ANIMATIONS,
} from '../../constants/payment-constants';

// Re-exportando qualquer outro componente que precise ser utilizado

// Exportação default para expo-router
export default {
  Toast: null, // Placeholder para satisfazer o expo-router
};
