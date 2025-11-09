import React from 'react';

import TemplateForm from './TemplateForm';
import { ShiftTemplate } from '../../services/shift-templates-api';
import KeyboardAwareFormModal from '../form/KeyboardAwareFormModal';

interface TemplateFormModalProps {
  visible: boolean;
  onClose: () => void;
  template?: ShiftTemplate | null;
  onSuccess?: () => void;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  visible,
  onClose,
  template,
  onSuccess,
}) => {
  const getModalTitle = () => {
    if (template) {
      return `Editar Template - ${template.name}`;
    }
    return 'Novo Template';
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <KeyboardAwareFormModal visible={visible} onClose={onClose} title={getModalTitle()}>
      <TemplateForm
        templateId={template?.id}
        initialData={template}
        onSuccess={handleSuccess}
        onCancel={onClose}
        isModal
      />
    </KeyboardAwareFormModal>
  );
};

export default TemplateFormModal;
