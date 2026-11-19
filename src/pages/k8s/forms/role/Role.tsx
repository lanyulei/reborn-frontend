import type { CreateFormProps } from '../types';
import CreateRoleDrawer from './index';

const CreateRole = (props: CreateFormProps) => (
  <CreateRoleDrawer {...props} kind="Role" />
);

export default CreateRole;
