import CollapsibleField from '../shared/CollapsibleField';
import ResourceFormSection from '../shared/ResourceFormSection';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';

const SecretAdvancedSettings = () => (
  <ResourceFormSection title="元数据">
    <CollapsibleField
      description="为保密字典资源添加标签和注解。"
      title="添加元数据"
    >
      <ResourceMetadataFields />
    </CollapsibleField>
  </ResourceFormSection>
);

export default SecretAdvancedSettings;
