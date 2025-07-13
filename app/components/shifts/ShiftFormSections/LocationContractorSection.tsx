import React, { memo } from 'react';

import { useContractors } from '../../../contexts/ContractorsContext';
import { useLocations } from '../../../contexts/LocationsContext';
import SelectField from '../../form/SelectField';
import Card from '../../ui/Card';
import SectionHeader from '../../ui/SectionHeader';

interface LocationContractorSectionProps {
  locationId: string;
  contractorId: string;
  onLocationChange: (locationId: string) => void;
  onContractorChange: (contractorId: string) => void;
  errors: Record<string, string>;
}

const LocationContractorSection = memo<LocationContractorSectionProps>(
  ({ locationId, contractorId, onLocationChange, onContractorChange, errors }) => {
    const { locationOptions } = useLocations();
    const { contractorOptions } = useContractors();

    return (
      <Card className="mx-6 mb-4">
        <SectionHeader
          title="Local e Contratante"
          subtitle="Onde e para quem será o plantão"
          icon="location-outline"
        />

        <SelectField
          label="Local"
          value={locationId}
          onValueChange={onLocationChange}
          options={locationOptions}
          placeholder="Selecione o local"
          error={errors.locationId}
          className="mb-4"
        />

        <SelectField
          label="Contratante (opcional)"
          value={contractorId}
          onValueChange={onContractorChange}
          options={contractorOptions}
          placeholder="Selecione o contratante"
          error={errors.contractorId}
        />
      </Card>
    );
  }
);

LocationContractorSection.displayName = 'LocationContractorSection';

export default LocationContractorSection;
