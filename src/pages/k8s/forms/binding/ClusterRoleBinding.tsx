import type { CreateFormProps } from '../types';
import CreateBindingDrawer from './index';

const CreateClusterRoleBinding = (props: CreateFormProps) => (
  <CreateBindingDrawer {...props} kind="ClusterRoleBinding" />
);

export default CreateClusterRoleBinding;
