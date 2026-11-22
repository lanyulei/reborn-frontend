import { useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import ResourceFormSection from '../shared/ResourceFormSection';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';

const IngressClassAdvancedSettings = () => {
  const t = useT();

  return (
    <ResourceFormSection title={t('pages.k8s.forms.common.metadata')}>
      <CollapsibleField
        description={t('pages.k8s.forms.ingressclass.metadata.description')}
        title={t('pages.k8s.forms.common.addMetadata')}
      >
        <ResourceMetadataFields />
      </CollapsibleField>
    </ResourceFormSection>
  );
};

export default IngressClassAdvancedSettings;
