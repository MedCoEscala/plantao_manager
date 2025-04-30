// app/components/form/FormBuilder.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { FormFieldProps } from './FormField';
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

  // Update values when initialValues change
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Form validation for a single field
  const validateField = (field: FormFieldProps, value: any): string => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} é obrigatório`;
    }

    // For certain field types, add specific validation
    if (
      field.type === 'currency' &&
      value &&
      isNaN(parseFloat(value.replace(',', '.').replace(/\./g, '')))
    ) {
      return `${field.label} deve ser um valor numérico`;
    }

    return '';
  };

  // Validate all form fields
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

  // Update form state when a field changes
  const handleChange = (id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setTouched((prev) => ({ ...prev, [id]: true }));

    const field = fields.find((f) => f.id === id);
    if (field) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [id]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Mark all fields as touched to show validation errors
    const allTouched: Record<string, boolean> = {};
    fields.forEach((field) => {
      allTouched[field.id] = true;
    });
    setTouched(allTouched);

    // Validate and submit if valid
    if (validateForm()) {
      onSubmit(values);
    }
  };

  // Render all form fields with their current values and errors
  const renderFields = useMemo(() => {
    return fields.map((field) => {
      // Create field props with current values
      const fieldProps: any = {
        ...field,
        value:
          values[field.id] !== undefined && values[field.id] !== null
            ? values[field.id]
            : field.type === 'toggle'
              ? false
              : '',
        error: touched[field.id] ? errors[field.id] : undefined,
      };

      // Add appropriate handlers based on field type
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
  }, [fields, values, touched, errors]);

  // Content of the form
  const Content = (
    <View style={styles.formContent}>
      {formTitle && (
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{formTitle}</Text>
          {formDescription && <Text style={styles.description}>{formDescription}</Text>}
        </View>
      )}

      <View style={styles.fieldsContainer}>{renderFields}</View>

      <View style={styles.buttonContainer}>
        {onCancel && (
          <Button
            variant="outline"
            onPress={onCancel}
            disabled={loading}
            style={styles.cancelButton}>
            {cancelLabel}
          </Button>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          style={[styles.submitButton, onCancel ? {} : styles.fullWidthButton]}>
          {submitLabel}
        </Button>
      </View>
    </View>
  );

  // Use ScrollView if scrollable is true, otherwise just render the content
  if (scrollable) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled">
          {Content}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.container}>{Content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  formContent: {
    width: '100%',
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
  },
  fieldsContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 0,
    alignSelf: 'flex-end',
  },
});

export default FormBuilder;
