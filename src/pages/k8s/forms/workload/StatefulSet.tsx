import type { CreateFormProps } from '../types';
import CreateWorkloadForm from './index';

const CreateStatefulSetForm = (props: CreateFormProps) => (
  <CreateWorkloadForm {...props} kind="StatefulSet" />
);

export default CreateStatefulSetForm;
