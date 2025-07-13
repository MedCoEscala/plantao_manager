import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';

import { useDialog } from '../../contexts/DialogContext';
import Button from '../ui/Button';

// Tipo para definição de um campo de formulário
export interface FormField {
  id: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'number' | 'phone' | 'date' | 'textarea' | 'select' | 'toggle' | 'color';
  value: any;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
  options?: { label: string; value: any; icon?: string }[];
  validator?: (value: any) => string | null;
  formatter?: (value: any) => string;
  parser?: (value: string) => any;
  icon?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  renderCustomInput?: (params: {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    error: string | null;
    touched: boolean;
  }) => ReactNode;
  // Estilos personalizados
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
}

// Props para o componente FormBuilder
export interface FormBuilderProps {
  fields: FormField[];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialLoading?: boolean;
  id?: string;
  showHeaderTitle?: boolean;
  style?: ViewStyle;
  initialValues?: Record<string, any>;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  title = 'Formulário',
  subtitle,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  onSubmit,
  onCancel,
  isLoading = false,
  initialLoading = false,
  id,
  showHeaderTitle = true,
  style,
  initialValues = {},
}) => {
  // Estado para os valores dos campos
  const [values, setValues] = useState<Record<string, any>>(initialValues);

  // Estado para os erros de validação
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Estado para os campos que foram tocados (para mostrar erros apenas após interação)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Estado para os campos expandidos (como seletores)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Animação para fade-in do formulário
  const formOpacity = useState(new Animated.Value(0))[0];

  // Estado para a alteração do formulário
  const [isDirty, setIsDirty] = useState(false);

  const { showDialog } = useDialog();

  // Inicializar valores ao carregar
  useEffect(() => {
    const newValues = { ...initialValues };

    // Para cada campo, garantir que há um valor inicial
    fields.forEach((field) => {
      if (!(field.id in newValues)) {
        // Valor padrão com base no tipo
        switch (field.type) {
          case 'toggle':
            newValues[field.id] = false;
            break;
          case 'number':
            newValues[field.id] = '';
            break;
          case 'select':
            newValues[field.id] =
              field.options && field.options.length > 0 ? field.options[0].value : null;
            break;
          default:
            newValues[field.id] = '';
        }
      }
    });

    setValues(newValues);
  }, [fields, initialValues]);

  // Efeito para animação ao carregar
  useEffect(() => {
    if (!initialLoading) {
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [initialLoading, formOpacity]);

  // Função para atualizar um valor
  const handleChange = (fieldId: string, value: any) => {
    setValues((prev) => {
      const newValues = { ...prev, [fieldId]: value };
      return newValues;
    });

    // Marcar campo como tocado
    if (!touched[fieldId]) {
      setTouched((prev) => ({ ...prev, [fieldId]: true }));
    }

    // Validar campo
    validateField(fieldId, value);

    // Marcar formulário como alterado
    setIsDirty(true);
  };

  // Validar um campo específico
  const validateField = (fieldId: string, value: any) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    let errorMessage: string | null = null;

    // Verificar se é obrigatório
    if (field.required && (value === undefined || value === null || value === '')) {
      errorMessage = `${field.label} é obrigatório.`;
    }
    // Usar validador personalizado se fornecido
    else if (field.validator) {
      errorMessage = field.validator(value);
    }

    setErrors((prev) => ({ ...prev, [fieldId]: errorMessage }));
    return errorMessage === null;
  };

  // Validar todos os campos
  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string | null> = {};
    const newTouched: Record<string, boolean> = { ...touched };

    // Validar cada campo
    fields.forEach((field) => {
      newTouched[field.id] = true; // Marcar todos como tocados
      const fieldValue = values[field.id];

      // Verificar se é obrigatório
      if (
        field.required &&
        (fieldValue === undefined || fieldValue === null || fieldValue === '')
      ) {
        newErrors[field.id] = `${field.label} é obrigatório.`;
        isValid = false;
      }
      // Usar validador personalizado se fornecido
      else if (field.validator) {
        const errorMessage = field.validator(fieldValue);
        if (errorMessage) {
          newErrors[field.id] = errorMessage;
          isValid = false;
        } else {
          newErrors[field.id] = null;
        }
      } else {
        newErrors[field.id] = null;
      }
    });

    setErrors(newErrors);
    setTouched(newTouched);
    return isValid;
  };

  // Função para submeter o formulário
  const handleSubmit = () => {
    const isValid = validateForm();

    if (isValid) {
      // Formatar valores antes de enviar
      const formattedValues = { ...values };
      fields.forEach((field) => {
        if (field.parser && typeof formattedValues[field.id] === 'string') {
          formattedValues[field.id] = field.parser(formattedValues[field.id]);
        }
      });

      onSubmit(formattedValues);
    }
  };

  // Função para cancelar com confirmação
  const handleCancel = () => {
    if (isDirty) {
      showDialog({
        title: 'Cancelar alterações',
        message: 'Há alterações não salvas. Deseja realmente cancelar?',
        type: 'confirm',
        onConfirm: () => {
          if (onCancel) onCancel();
        },
      });
    } else {
      if (onCancel) onCancel();
    }
  };

  // Função para alternar expansão de campo
  const toggleExpanded = (fieldId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  // Quando estiver carregando, mostrar indicador
  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-text-light">Carregando...</Text>
      </View>
    );
  }

  // Renderizar o campo com base no tipo
  const renderField = (field: FormField) => {
    const value = values[field.id];
    const error = touched[field.id] ? errors[field.id] : null;
    const isExpanded = expanded[field.id] || false;

    // Se o campo tem um renderizador personalizado, usá-lo
    if (field.renderCustomInput) {
      return (
        <View key={field.id} style={[styles.fieldContainer, field.containerStyle]}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, field.labelStyle]}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
          </View>

          {field.renderCustomInput({
            field,
            value,
            onChange: (newValue) => handleChange(field.id, newValue),
            error,
            touched: touched[field.id] || false,
          })}

          {error && <Text style={[styles.errorText, field.errorStyle]}>{error}</Text>}
        </View>
      );
    }

    // Renderizar com base no tipo do campo
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <View key={field.id} style={[styles.fieldContainer, field.containerStyle]}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, field.labelStyle]}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
            </View>

            <View
              style={[styles.inputContainer, error ? styles.inputError : null, field.inputStyle]}>
              {field.icon && (
                <Ionicons name={field.icon as any} size={20} color="#64748b" style={styles.icon} />
              )}

              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                value={field.formatter ? field.formatter(value) : String(value || '')}
                onChangeText={(text) => handleChange(field.id, text)}
                keyboardType={
                  field.keyboardType || (field.type === 'number' ? 'numeric' : 'default')
                }
                maxLength={field.maxLength}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : 1}
                autoCapitalize={field.autoCapitalize || 'sentences'}
              />
            </View>

            {error && <Text style={[styles.errorText, field.errorStyle]}>{error}</Text>}
          </View>
        );

      case 'textarea':
        return (
          <View key={field.id} style={[styles.fieldContainer, field.containerStyle]}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, field.labelStyle]}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
            </View>

            <TextInput
              style={[
                styles.inputContainer,
                styles.textArea,
                error ? styles.inputError : null,
                field.inputStyle,
              ]}
              placeholder={field.placeholder}
              value={String(value || '')}
              onChangeText={(text) => handleChange(field.id, text)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoCapitalize={field.autoCapitalize || 'sentences'}
            />

            {error && <Text style={[styles.errorText, field.errorStyle]}>{error}</Text>}
          </View>
        );

      case 'select':
        return (
          <View key={field.id} style={[styles.fieldContainer, field.containerStyle]}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, field.labelStyle]}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.inputContainer,
                styles.selectContainer,
                error ? styles.inputError : null,
                field.inputStyle,
              ]}
              onPress={() => toggleExpanded(field.id)}>
              <Text style={[styles.selectText, !value ? styles.placeholderText : null]}>
                {value
                  ? field.options?.find((opt) => opt.value === value)?.label || 'Selecione'
                  : field.placeholder || 'Selecione'}
              </Text>

              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {isExpanded && field.options && (
              <View style={styles.optionsContainer}>
                {field.options.map((option) => (
                  <TouchableOpacity
                    key={String(option.value)}
                    style={[
                      styles.optionItem,
                      value === option.value ? styles.selectedOption : null,
                    ]}
                    onPress={() => {
                      handleChange(field.id, option.value);
                      toggleExpanded(field.id);
                    }}>
                    {option.icon && (
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color="#64748b"
                        style={styles.optionIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        value === option.value ? styles.selectedOptionText : null,
                      ]}>
                      {option.label}
                    </Text>

                    {value === option.value && (
                      <Ionicons name="checkmark" size={18} color="#18cb96" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {error && <Text style={[styles.errorText, field.errorStyle]}>{error}</Text>}
          </View>
        );

      case 'toggle':
        return (
          <View key={field.id} style={[styles.fieldContainer, field.containerStyle]}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => handleChange(field.id, !value)}>
              <View style={[styles.toggle, value ? styles.toggleActive : styles.toggleInactive]}>
                <View
                  style={[
                    styles.toggleHandle,
                    value ? styles.toggleHandleActive : styles.toggleHandleInactive,
                  ]}
                />
              </View>

              <Text style={[styles.label, field.labelStyle]}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
            </TouchableOpacity>

            {error && <Text style={[styles.errorText, field.errorStyle]}>{error}</Text>}
          </View>
        );

      case 'date':
        // O componente de data precisa de uma implementação personalizada
        // que não foi incluída neste exemplo básico
        return (
          <View key={field.id} style={[styles.fieldContainer, field.containerStyle]}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, field.labelStyle]}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.inputContainer, error ? styles.inputError : null, field.inputStyle]}
              onPress={() => {
                // Aqui implementaria lógica para mostrar um DatePicker
              }}>
              <Text style={[styles.selectText, !value ? styles.placeholderText : null]}>
                {value || field.placeholder || 'Selecione uma data'}
              </Text>

              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>

            {error && <Text style={[styles.errorText, field.errorStyle]}>{error}</Text>}
          </View>
        );

      // Outros tipos podem ser adicionados conforme necessário

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: formOpacity }}>
          {/* Título do formulário */}
          {showHeaderTitle && (
            <View style={styles.headerContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}

          {/* Campos do formulário */}
          <View style={styles.fieldsContainer}>{fields.map(renderField)}</View>

          {/* Botões de ação */}
          <View style={styles.buttonsContainer}>
            {onCancel && (
              <Button
                variant="outline"
                onPress={handleCancel}
                className="mr-2 flex-1"
                disabled={isLoading}>
                {cancelLabel}
              </Button>
            )}

            <Button
              variant="primary"
              onPress={handleSubmit}
              loading={isLoading}
              className={onCancel ? 'ml-2 flex-1' : 'flex-1'}>
              {submitLabel}
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b', // text-dark
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b', // text-light
  },
  fieldsContainer: {
    marginBottom: 20,
  },
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
    color: '#1e293b', // text-dark
  },
  required: {
    color: '#ef4444', // error
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-gray-200
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#ffffff',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#1e293b', // text-dark
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  inputError: {
    borderColor: '#ef4444', // error
  },
  errorText: {
    color: '#ef4444', // error
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: '#1e293b', // text-dark
  },
  placeholderText: {
    color: '#94a3b8', // text-gray-400
  },
  optionsContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-gray-200
    borderRadius: 8,
    backgroundColor: '#ffffff',
    maxHeight: 200,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b', // text-dark
  },
  selectedOption: {
    backgroundColor: '#f8fafc', // bg-gray-50
  },
  selectedOptionText: {
    fontWeight: '500',
    color: '#18cb96', // primary
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 24,
    borderRadius: 12,
    padding: 2,
    marginRight: 12,
  },
  toggleActive: {
    backgroundColor: '#18cb96', // primary
  },
  toggleInactive: {
    backgroundColor: '#cbd5e1', // gray-300
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  toggleHandleActive: {
    alignSelf: 'flex-end',
  },
  toggleHandleInactive: {
    alignSelf: 'flex-start',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

export default FormBuilder;
