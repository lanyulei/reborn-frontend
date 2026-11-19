export const RBAC_VERB_OPTIONS = [
  'get',
  'list',
  'watch',
  'create',
  'update',
  'patch',
  'delete',
  'deletecollection',
  'impersonate',
  '*',
].map((value) => ({ label: value, value }));
