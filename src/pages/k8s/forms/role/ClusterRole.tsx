import type { CreateFormProps } from '../types';
import CreateRoleDrawer from './index';

const CreateClusterRole = (props: CreateFormProps) => (
  <CreateRoleDrawer {...props} kind="ClusterRole" />
);

export default CreateClusterRole;
