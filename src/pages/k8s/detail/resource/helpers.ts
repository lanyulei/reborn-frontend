import { statusLabel } from '../../components/statusText';
import { getRecordValue, getStringValue } from '../../forms/shared/manifest';

const getArrayValue = (value: unknown) =>
  Array.isArray(value) ? (value as unknown[]) : [];

const getNumberValue = (value: unknown) =>
  typeof value === 'number' ? value : undefined;

const formatValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

const getJobStatusLabel = (status?: string) => statusLabel(status) || '-';

const getJobStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'completed' || normalizedStatus === 'succeeded') {
    return 'success';
  }
  if (
    normalizedStatus === 'active' ||
    normalizedStatus === 'running' ||
    normalizedStatus === 'bound'
  ) {
    return 'success';
  }
  if (normalizedStatus === 'suspended') {
    return 'warning';
  }
  if (normalizedStatus === 'failed') {
    return 'error';
  }
  if (
    normalizedStatus === 'pending' ||
    normalizedStatus === 'containercreating' ||
    normalizedStatus === 'terminating'
  ) {
    return 'warning';
  }
  if (
    normalizedStatus === 'imagepullbackoff' ||
    normalizedStatus === 'crashloopbackoff' ||
    normalizedStatus === 'unknown' ||
    normalizedStatus === 'lost'
  ) {
    return 'error';
  }
  return 'default';
};

export {
  formatValue,
  getArrayValue,
  getJobStatusLabel,
  getJobStatusType,
  getNumberValue,
  getRecordValue,
  getStringValue,
};
