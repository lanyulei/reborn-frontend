import type { CreateFormProps } from '../types';
import CreateBindingDrawer from './index';

const CreateRoleBinding = (props: CreateFormProps) => (
  <CreateBindingDrawer {...props} kind="RoleBinding" />
);

export default CreateRoleBinding;
