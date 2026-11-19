import type { CreateFormProps } from '../types';
import CreateWorkloadForm from './index';

const CreateDeploymentForm = (props: CreateFormProps) => (
  <CreateWorkloadForm {...props} kind="Deployment" />
);

export default CreateDeploymentForm;
