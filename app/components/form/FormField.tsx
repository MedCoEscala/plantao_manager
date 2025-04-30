import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
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
  const [isDatePickerVisible, setDatePickerVisible] = React.useState(false);

  const renderLabel = () => {
    if (!props.label) return null;

    return (
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <Text className="text-error"> *</Text>}
        </Text>
      </View>
    );
  };

  const renderHelper = () => {
    if (!props.helperText && !props.error) return null;

    return (
      <Text className={`mt-1 text-xs ${props.error ? 'text-error' : 'text-gray-500'}`}>
        {props.error || props.helperText}
      </Text>
    );
  };

  switch (props.type) {
    case 'text':
      return (
        <View className="mb-4">
          {renderLabel()}
          <TextInput
            className={`h-12 w-full rounded-lg px-4 ${
              props.error ? 'border-2 border-error' : 'border border-gray-300'
            } bg-white ${props.disabled ? 'bg-gray-100' : ''}`}
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
            style={props.multiline ? { height: 100, paddingTop: 12 } : {}}
          />
          {renderHelper()}
        </View>
      );

    case 'number':
    case 'currency':
      return (
        <View className="mb-4">
          {renderLabel()}
          <View
            className={`w-full flex-row items-center rounded-lg ${
              props.error ? 'border-2 border-error' : 'border border-gray-300'
            } bg-white ${props.disabled ? 'bg-gray-100' : ''}`}>
            {props.type === 'currency' && (
              <View className="pl-4">
                <Text className="text-gray-500">R$</Text>
              </View>
            )}
            <TextInput
              className="h-12 flex-1 px-4"
              placeholder={props.placeholder}
              value={typeof props.value === 'number' ? props.value.toString() : props.value}
              onChangeText={props.onChangeText}
              keyboardType="numeric"
              editable={!props.disabled}
            />
          </View>
          {renderHelper()}
        </View>
      );

    case 'date':
      return (
        <View className="mb-4">
          {renderLabel()}
          <TouchableOpacity
            className={`h-12 w-full flex-row items-center justify-between rounded-lg px-4 ${
              props.error ? 'border-2 border-error' : 'border border-gray-300'
            } bg-white ${props.disabled ? 'bg-gray-100' : ''}`}
            onPress={() => !props.disabled && setDatePickerVisible(true)}
            disabled={props.disabled}>
            <Text className={`${props.value ? 'text-gray-800' : 'text-gray-400'}`}>
              {props.value
                ? format(props.value, props.format || 'dd/MM/yyyy', { locale: ptBR })
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
        <View className="mb-4">
          {renderLabel()}
          <TouchableOpacity
            className={`h-12 w-full flex-row items-center justify-between rounded-lg px-4 ${
              props.error ? 'border-2 border-error' : 'border border-gray-300'
            } bg-white ${props.disabled ? 'bg-gray-100' : ''}`}
            onPress={() => !props.disabled && setDatePickerVisible(true)}
            disabled={props.disabled}>
            <Text className={`${props.value ? 'text-gray-800' : 'text-gray-400'}`}>
              {props.value
                ? format(props.value, props.format || 'HH:mm', { locale: ptBR })
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
        <View className="mb-4">
          {renderLabel()}
          <TouchableOpacity
            className={`h-12 w-full flex-row items-center justify-between rounded-lg px-4 ${
              props.error ? 'border-2 border-error' : 'border border-gray-300'
            } bg-white ${props.disabled ? 'bg-gray-100' : ''}`}
            disabled={props.disabled}>
            <Text className={`${props.value !== null ? 'text-gray-800' : 'text-gray-400'}`}>
              {props.value !== null
                ? props.options.find((opt) => opt.value === props.value)?.label || 'Selecione'
                : props.placeholder || 'Selecione uma opção'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {renderHelper()}
        </View>
      );

    case 'toggle':
      return (
        <View className="mb-4">
          {renderLabel()}
          <View className="flex-row items-center">
            <TouchableOpacity
              className={`h-8 w-14 rounded-full ${props.value ? 'bg-primary' : 'bg-gray-300'} 
                ${props.disabled ? 'opacity-50' : ''}`}
              onPress={() => !props.disabled && props.onChange(!props.value)}
              disabled={props.disabled}>
              <View
                className={`absolute top-1 h-6 w-6 rounded-full bg-white 
                  ${props.value ? 'right-1' : 'left-1'}`}
              />
            </TouchableOpacity>
            <Text className="ml-2 text-sm text-gray-700">
              {props.value ? props.trueLabel || 'Ativado' : props.falseLabel || 'Desativado'}
            </Text>
          </View>
          {renderHelper()}
        </View>
      );

    case 'checkbox':
      return (
        <View className="mb-4">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => !props.disabled && props.onChange(!props.value)}
            disabled={props.disabled}>
            <View
              className={`h-6 w-6 items-center justify-center rounded border 
                ${props.value ? 'border-primary bg-primary' : 'border-gray-400'} 
                ${props.disabled ? 'opacity-50' : ''}`}>
              {props.value && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text className="ml-2 text-sm text-gray-700">{props.label}</Text>
            {props.required && <Text className="text-error"> *</Text>}
          </TouchableOpacity>
          {renderHelper()}
        </View>
      );

    default:
      return null;
  }
};

export default FormField;
