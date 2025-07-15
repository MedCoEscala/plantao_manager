import React, { ReactNode } from 'react';
import { Platform } from 'react-native';

import FormModal from './FormModal';

interface KeyboardAwareFormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  height?: number;
  fullHeight?: boolean;
}

export default function KeyboardAwareFormModal({
  visible,
  onClose,
  title,
  children,
  height,
  fullHeight,
}: KeyboardAwareFormModalProps) {
  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={title}
      height={height}
      fullHeight={fullHeight}>
      {children}
    </FormModal>
  );
}
