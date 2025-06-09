import React, { memo } from 'react';

import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SectionHeader from '@/components/ui/SectionHeader';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const NotesSection = memo<NotesSectionProps>(({ notes, onNotesChange }) => {
  return (
    <Card className="mx-6 mb-4">
      <SectionHeader
        title="Observações"
        subtitle="Informações adicionais (opcional)"
        icon="document-text-outline"
      />

      <Input
        label="Observações Adicionais"
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Observações sobre este plantão (opcional)"
        multiline
        numberOfLines={3}
        autoCapitalize="sentences"
        textAlignVertical="top"
      />
    </Card>
  );
});

NotesSection.displayName = 'NotesSection';

export default NotesSection;
