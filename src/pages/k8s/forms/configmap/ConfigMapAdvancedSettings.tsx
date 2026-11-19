import CollapsibleField from '../shared/CollapsibleField';
import ResourceFormSection from '../shared/ResourceFormSection';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';

const ConfigMapAdvancedSettings = () => (
  <ResourceFormSection title="元数据">
    <CollapsibleField
      description="为配置字典资源添加标签和注解。"
      title="添加元数据"
    >
      <ResourceMetadataFields />
    </CollapsibleField>
  </ResourceFormSection>
);

export default ConfigMapAdvancedSettings;
