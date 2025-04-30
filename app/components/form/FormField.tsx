// app/components/form/FormField.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'toggle'
  | 'checkbox'
  | 'currency';

export interface BaseFieldProps {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  disabled?: boolean;
}

export interface TextFieldProps extends BaseFieldProps {
  type: 'text';
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  multiline?: boolean;
}

export interface NumberFieldProps extends BaseFieldProps {
  type: 'number' | 'currency';
  value: string | number;
  onChangeText: (text: string) => void;
  min?: number;
  max?: number;
}

export interface DateFieldProps extends BaseFieldProps {
  type: 'date';
  value: Date | null;
  onChange: (date: Date) => void;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
}

export interface TimeFieldProps extends BaseFieldProps {
  type: 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  format?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  color?: string;
}

export interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string | number | null;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  multiple?: boolean;
}

export interface ToggleFieldProps extends BaseFieldProps {
  type: 'toggle';
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
}

export interface CheckboxFieldProps extends BaseFieldProps {
  type: 'checkbox';
  value: boolean;
  onChange: (value: boolean) => void;
}

export type FormFieldProps =
  | TextFieldProps
  | NumberFieldProps
  | DateFieldProps
  | TimeFieldProps
  | SelectFieldProps
  | ToggleFieldProps
  | CheckboxFieldProps;

const FormField: React.FC<FormFieldProps> = (props) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isSelectModalVisible, setSelectModalVisible] = useState(false);

  // Render field label
  const renderLabel = () => {
    if (!props.label) return null;

    return (
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {props.label}
          {props.required && <Text style={styles.requiredMark}> *</Text>}
        </Text>
      </View>
    );
  };

  // Render helper text or error message
  const renderHelper = () => {
    if (!props.helperText && !props.error) return null;

    return (
      <Text style={[styles.helperText, props.error ? styles.errorText : null]}>
        {props.error || props.helperText}
      </Text>
    );
  };

  // Format date and time
  const formatDateTime = (date: Date | null, type: 'date' | 'time'): string => {
    if (!date) return '';

    try {
      if (type === 'date') {
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      } else {
        return format(date, 'HH:mm', { locale: ptBR });
      }
    } catch (e) {
      console.error('Error formatting date/time:', e);
      return '';
    }
  };

  // Format value for currency display
  const formatCurrencyValue = (value: string | number): string => {
    if (typeof value === 'string' && value.trim() === '') return '';

    try {
      const numValue =
        typeof value === 'string' ? parseFloat(value.replace(',', '.').replace(/\./g, '')) : value;

      if (isNaN(numValue)) return '';

      return `R$ ${numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch (e) {
      return typeof value === 'string' ? value : String(value);
    }
  };

  // Handle SelectField options rendering (simplified)
  const renderSelectOptions = (options: SelectOption[], selectedValue: string | number | null) => {
    const selectedOption = options.find((opt) => opt.value === selectedValue);
    return selectedOption?.label || props.placeholder || 'Selecione uma opção';
  };

  switch (props.type) {
    case 'text':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TextInput
            style={[
              styles.textInput,
              props.error ? styles.inputError : null,
              props.disabled ? styles.inputDisabled : null,
              props.multiline ? styles.textAreaInput : null,
            ]}
            placeholder={props.placeholder}
            value={props.value}
            onChangeText={props.onChangeText}
            keyboardType={props.keyboardType || 'default'}
            autoCapitalize={props.autoCapitalize || 'sentences'}
            secureTextEntry={props.secureTextEntry}
            editable={!props.disabled}
            multiline={props.multiline}
            numberOfLines={props.multiline ? 4 : 1}
            textAlignVertical={props.multiline ? 'top' : 'center'}
            placeholderTextColor="#A0AEC0"
          />
          {renderHelper()}
        </View>
      );

    case 'number':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TextInput
            style={[
              styles.textInput,
              props.error ? styles.inputError : null,
              props.disabled ? styles.inputDisabled : null,
            ]}
            placeholder={props.placeholder}
            value={typeof props.value === 'number' ? props.value.toString() : props.value}
            onChangeText={props.onChangeText}
            keyboardType="numeric"
            editable={!props.disabled}
            placeholderTextColor="#A0AEC0"
          />
          {renderHelper()}
        </View>
      );

    case 'currency':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <View
            style={[
              styles.currencyInputContainer,
              props.error ? styles.inputError : null,
              props.disabled ? styles.inputDisabled : null,
            ]}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder={props.placeholder || '0,00'}
              value={typeof props.value === 'number' ? props.value.toString() : props.value}
              onChangeText={props.onChangeText}
              keyboardType="numeric"
              editable={!props.disabled}
              placeholderTextColor="#A0AEC0"
            />
          </View>
          {renderHelper()}
        </View>
      );

    case 'date':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TouchableOpacity
            style={[
              styles.dateTimeButton,
              props.error ? styles.inputError : null,
              props.disabled ? styles.inputDisabled : null,
            ]}
            onPress={() => !props.disabled && setDatePickerVisible(true)}
            disabled={props.disabled}>
            <Text style={[styles.dateTimeText, !props.value ? styles.placeholderText : null]}>
              {props.value
                ? formatDateTime(props.value, 'date')
                : props.placeholder || 'Selecione uma data'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={(date) => {
              props.onChange(date);
              setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
            date={props.value || new Date()}
            locale="pt-BR"
            minimumDate={props.minDate}
            maximumDate={props.maxDate}
          />
          {renderHelper()}
        </View>
      );

    case 'time':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TouchableOpacity
            style={[
              styles.dateTimeButton,
              props.error ? styles.inputError : null,
              props.disabled ? styles.inputDisabled : null,
            ]}
            onPress={() => !props.disabled && setDatePickerVisible(true)}
            disabled={props.disabled}>
            <Text style={[styles.dateTimeText, !props.value ? styles.placeholderText : null]}>
              {props.value
                ? formatDateTime(props.value, 'time')
                : props.placeholder || 'Selecione um horário'}
            </Text>
            <Ionicons name="time-outline" size={20} color="#666" />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="time"
            onConfirm={(date) => {
              props.onChange(date);
              setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
            date={props.value || new Date()}
            locale="pt-BR"
          />
          {renderHelper()}
        </View>
      );

    case 'select':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TouchableOpacity
            style={[
              styles.selectButton,
              props.error ? styles.inputError : null,
              props.disabled ? styles.inputDisabled : null,
            ]}
            onPress={() => {
              // Simplified - in a real app, this would open a modal or dropdown
              if (!props.disabled) {
                // Just cycle through options for demo
                const currentIndex = props.options.findIndex((opt) => opt.value === props.value);
                const nextIndex = (currentIndex + 1) % props.options.length;
                props.onChange(props.options[nextIndex].value);
              }
            }}
            disabled={props.disabled}>
            <Text style={[styles.selectText, props.value === null ? styles.placeholderText : null]}>
              {renderSelectOptions(props.options, props.value)}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {renderHelper()}
        </View>
      );

    case 'toggle':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                props.value ? styles.toggleButtonActive : styles.toggleButtonInactive,
                props.disabled ? styles.toggleDisabled : null,
              ]}
              onPress={() => !props.disabled && props.onChange(!props.value)}
              disabled={props.disabled}>
              <View
                style={[
                  styles.toggleKnob,
                  props.value ? styles.toggleKnobActive : styles.toggleKnobInactive,
                ]}
              />
            </TouchableOpacity>
            <Text style={styles.toggleLabel}>
              {props.value ? props.trueLabel || 'Ativado' : props.falseLabel || 'Desativado'}
            </Text>
          </View>
          {renderHelper()}
        </View>
      );

    case 'checkbox':
      return (
        <View style={styles.fieldContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => !props.disabled && props.onChange(!props.value)}
            disabled={props.disabled}>
            <View
              style={[
                styles.checkbox,
                props.value ? styles.checkboxChecked : styles.checkboxUnchecked,
                props.disabled ? styles.checkboxDisabled : null,
              ]}>
              {props.value && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              {props.label}
              {props.required && <Text style={styles.requiredMark}> *</Text>}
            </Text>
          </TouchableOpacity>
          {renderHelper()}
        </View>
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b', // text-gray-500
  },
  requiredMark: {
    color: '#ef4444', // text-red-500
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db', // border-gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937', // text-gray-800
    backgroundColor: '#ffffff',
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#ef4444', // border-red-500
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6', // bg-gray-100
    opacity: 0.7,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b', // text-gray-500
  },
  errorText: {
    color: '#ef4444', // text-red-500
  },
  // Date and Time Picker styles
  dateTimeButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db', // border-gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1f2937', // text-gray-800
  },
  // Select styles
  selectButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db', // border-gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  selectText: {
    fontSize: 16,
    color: '#1f2937', // text-gray-800
  },
  placeholderText: {
    color: '#a0aec0', // text-gray-400
  },
  // Currency input styles
  currencyInputContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db', // border-gray-300
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  currencySymbol: {
    marginRight: 8,
    fontSize: 16,
    color: '#64748b', // text-gray-500
  },
  currencyInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1f2937', // text-gray-800
  },
  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    width: 50,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#18cb96', // bg-primary
  },
  toggleButtonInactive: {
    backgroundColor: '#cbd5e1', // bg-gray-300
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  toggleKnobInactive: {
    alignSelf: 'flex-start',
  },
  toggleLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#64748b', // text-gray-500
  },
  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#18cb96', // bg-primary
    borderColor: '#18cb96', // border-primary
  },
  checkboxUnchecked: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db', // border-gray-300
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1f2937', // text-gray-800
  },
});

export default FormField;
