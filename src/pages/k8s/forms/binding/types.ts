type CreateBindingType = 'RoleBinding' | 'ClusterRoleBinding';

type CreateBindingRoleKind = 'Role' | 'ClusterRole';

type BindingSubjectKind = 'ServiceAccount' | 'User' | 'Group';

type MetadataItem = {
  id: string;
  keyName: string;
  value: string;
};

type BindingSubjectFormValue = {
  id: string;
  kind?: BindingSubjectKind;
  name?: string;
  namespace?: string;
};

type CreateBindingFormValues = {
  type?: CreateBindingType;
  name?: string;
  namespace?: string;
  roleKind?: CreateBindingRoleKind;
  roleName?: string;
  subjects?: BindingSubjectFormValue[];
  labels?: MetadataItem[];
  annotations?: MetadataItem[];
};

export type {
  BindingSubjectFormValue,
  BindingSubjectKind,
  CreateBindingFormValues,
  CreateBindingRoleKind,
  CreateBindingType,
  MetadataItem,
};
