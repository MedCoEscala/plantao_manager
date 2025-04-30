import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { FormFieldProps, BaseFieldProps } from './FormField';
import FormField from './FormField';
import Button from '../ui/Button';

export type FormConfig = {
  fields: FormFieldProps[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  scrollable?: boolean;
  formTitle?: string;
  formDescription?: string;
};

const FormBuilder: React.FC<FormConfig> = ({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  loading = false,
  scrollable = true,
  formTitle,
  formDescription,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const validateField = (field: FormFieldProps, value: any): string => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} é obrigatório`;
    }

    // Aqui poderia haver mais validações específicas para cada tipo de campo

    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, values[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setTouched((prev) => ({ ...prev, [id]: true }));

    const field = fields.find((f) => f.id === id);
    if (field) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [id]: error }));
    }
  };

  const handleSubmit = () => {
    const allTouched: Record<string, boolean> = {};
    fields.forEach((field) => {
      allTouched[field.id] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      onSubmit(values);
    }
  };

  const renderFields = () => {
    return fields.map((field) => {
      const fieldProps: any = {
        ...field,
        value: values[field.id] !== undefined ? values[field.id] : null,
        error: touched[field.id] ? errors[field.id] : undefined,
      };

      switch (field.type) {
        case 'text':
        case 'number':
        case 'currency':
          fieldProps.onChangeText = (text: string) => handleChange(field.id, text);
          break;
        case 'date':
        case 'time':
          fieldProps.onChange = (date: Date) => handleChange(field.id, date);
          break;
        case 'select':
          fieldProps.onChange = (value: string | number) => handleChange(field.id, value);
          break;
        case 'toggle':
        case 'checkbox':
          fieldProps.onChange = (value: boolean) => handleChange(field.id, value);
          break;
      }

      return <FormField key={field.id} {...fieldProps} />;
    });
  };

  const Content = (
    <>
      {formTitle && (
        <View className="mb-4">
          <Text className="text-xl font-bold text-gray-800">{formTitle}</Text>
          {formDescription && <Text className="mt-1 text-sm text-gray-600">{formDescription}</Text>}
        </View>
      )}

      {renderFields()}

      <View className="mt-4 flex-row justify-end space-x-4">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={loading} style={{ flex: 1 }}>
            {cancelLabel}
          </Button>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          style={{ flex: onCancel ? 1 : undefined }}>
          {submitLabel}
        </Button>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="handled">
          {Content}
        </ScrollView>
      ) : (
        <View className="flex-1 p-4">{Content}</View>
      )}
    </KeyboardAvoidingView>
  );
};

export default FormBuilder;
