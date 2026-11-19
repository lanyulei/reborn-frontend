import type { CreateFormProps } from '../types';
import CreateWorkloadForm from './index';

const CreateDaemonSetForm = (props: CreateFormProps) => (
  <CreateWorkloadForm {...props} kind="DaemonSet" />
);

export default CreateDaemonSetForm;
