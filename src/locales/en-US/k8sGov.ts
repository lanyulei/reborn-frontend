/** 容器平台 · 治理（限时 kubeconfig、巡检、终端录制回放、调试容器、文件传输、告警规则模板） */
export default {
  'menu.k8s.inspection': 'Inspection',
  'menu.k8s.kubeconfig': 'Access Tokens',
  'permission.k8s.workload.debug': 'Debug container',
  'permission.k8s.workload.file': 'File transfer',
  'permission.k8s.audit.replay': 'Replay terminal recordings',
  'permission.k8s.inspection.run': 'Run inspection',
  'permission.k8s.kubeconfig.issue': 'Issue kubeconfig',
  'pages.k8s.action.debug': 'Debug',
  'pages.k8s.action.debug.title': 'Start a debug container in {name}?',
  'pages.k8s.action.debug.content':
    'An ephemeral container is added to this Pod and opened in the terminal, for troubleshooting containers without a shell. It cannot be removed on its own and stays until the Pod is recreated.',
  'pages.k8s.action.file': 'Files',
  'pages.k8s.exec.debug': 'debug',
  'pages.k8s.file.title': 'File transfer · {pod}',
  'pages.k8s.file.hint':
    'Needs tar in the container. Max 100 MB; audited without content.',
  'pages.k8s.file.download': 'Download',
  'pages.k8s.file.download.path': 'File or directory in the container',
  'pages.k8s.file.download.help':
    'Absolute path; a directory is downloaded as a tar archive',
  'pages.k8s.file.downloaded': 'Downloaded ({size})',
  'pages.k8s.file.upload': 'Upload',
  'pages.k8s.file.upload.dir': 'Target directory',
  'pages.k8s.file.upload.choose': 'Choose file',
  'pages.k8s.file.uploaded': 'Uploaded to {path}',
  'pages.k8s.file.path.invalid':
    'Enter a clean absolute path (no ".", ".." or repeated slashes)',
  'pages.k8s.file.tooLarge': 'The file exceeds the 100 MB transfer limit',
  'pages.k8s.error.fileTooLarge': 'The file exceeds the transfer size limit',
  'pages.k8s.error.approvalRequired':
    'Changes on this cluster require approval',
  'pages.k8s.error.kubeTokenLimit':
    'Too many active kubeconfigs; revoke unused ones first',
  'pages.k8s.error.inspectionBusy':
    'An inspection is already pending or running for this cluster',
  'pages.k8s.record.replay': 'Replay',
  'pages.k8s.record.title': 'Terminal replay · {pod} ({user})',
  'pages.k8s.record.hint':
    'Output only, never keyboard input; idle gaps are shortened. This replay has been audited.',
  'pages.k8s.record.truncated':
    'Output exceeded the recording limit, so the replay is incomplete. Keyboard input is never recorded.',
  'pages.k8s.record.failed': 'Failed to load the recording',
  'pages.k8s.audit.action.debug': 'Debug container',
  'pages.k8s.audit.action.file_upload': 'File upload',
  'pages.k8s.audit.action.file_download': 'File download',
  'pages.k8s.audit.action.exec_replay': 'Replay recording',
  'pages.k8s.audit.action.kubeconfig_issue': 'Issue kubeconfig',
  'pages.k8s.audit.action.kubeconfig_revoke': 'Revoke kubeconfig',
  'pages.k8s.audit.action.inspect': 'Run inspection',
  'pages.k8s.kubeconfig.issue': 'Issue kubeconfig',
  'pages.k8s.kubeconfig.hint':
    'Same permissions as your account; void once expired, revoked or disabled. Writes are audited.',
  'pages.k8s.kubeconfig.ttl': 'Validity',
  'pages.k8s.kubeconfig.ttl.hours': '{n} h',
  'pages.k8s.kubeconfig.ttl.days': '{n} d',
  'pages.k8s.kubeconfig.note': 'Note',
  'pages.k8s.kubeconfig.once':
    'This is shown only once — save it now. Valid until {time}.',
  'pages.k8s.kubeconfig.usage':
    'Usage: kubectl --kubeconfig <file> get pods. No port-forward / proxy; no changes on clusters that require approval.',
  'pages.k8s.kubeconfig.saved': 'I have saved it',
  'pages.k8s.kubeconfig.copied': 'Copied',
  'pages.k8s.kubeconfig.copyFailed': 'Copy failed; select and copy manually',
  'pages.k8s.kubeconfig.download': 'Download',
  'pages.k8s.kubeconfig.status': 'Status',
  'pages.k8s.kubeconfig.active': 'Active',
  'pages.k8s.kubeconfig.revoked': 'Revoked',
  'pages.k8s.kubeconfig.expired': 'Expired',
  'pages.k8s.kubeconfig.createTime': 'Issued',
  'pages.k8s.kubeconfig.expireTime': 'Expires',
  'pages.k8s.kubeconfig.lastUsed': 'Last used',
  'pages.k8s.kubeconfig.neverUsed': 'Never',
  'pages.k8s.kubeconfig.revoke': 'Revoke',
  'pages.k8s.kubeconfig.revoke.title': 'Revoke this kubeconfig?',
  'pages.k8s.kubeconfig.revoke.content':
    'It stops working immediately; kubectl sessions using it are refused. This cannot be undone.',
  'pages.k8s.kubeconfig.revoke.done': 'Revoked',
  'pages.k8s.kubeconfig.activeOnly': 'Active only',
  'pages.k8s.kubeconfig.all': 'All users',
  'pages.k8s.inspection.run': 'Run now',
  'pages.k8s.inspection.run.title': 'Inspect cluster {name} now?',
  'pages.k8s.inspection.run.content':
    'The inspection pages through nodes, workloads, Pods and TLS certificates; large clusters take a few minutes.',
  'pages.k8s.inspection.run.started': 'Inspection started',
  'pages.k8s.inspection.running': 'Inspection in progress',
  'pages.k8s.inspection.pending':
    'This inspection has not finished yet; results appear automatically.',
  'pages.k8s.inspection.failed': 'Inspection failed',
  'pages.k8s.inspection.none': 'No inspections yet',
  'pages.k8s.inspection.empty':
    'No inspections yet. One runs automatically every day, or run one now.',
  'pages.k8s.inspection.trigger.1': 'Scheduled',
  'pages.k8s.inspection.trigger.2': 'Manual',
  'pages.k8s.inspection.status.1': 'Pending',
  'pages.k8s.inspection.status.2': 'Running',
  'pages.k8s.inspection.status.3': 'Done',
  'pages.k8s.inspection.status.4': 'Failed',
  'pages.k8s.inspection.score': 'Score',
  'pages.k8s.inspection.score.n': 'score {n}',
  'pages.k8s.inspection.severity.critical': 'Critical',
  'pages.k8s.inspection.severity.warning': 'Warning',
  'pages.k8s.inspection.severity.info': 'Info',
  'pages.k8s.inspection.objects': 'Coverage',
  'pages.k8s.inspection.objects.detail':
    '{nodes} nodes · {workloads} workloads · {pods} Pods · {certs} certificates',
  'pages.k8s.inspection.partial':
    'The cluster has more objects than the inspection limit; results are incomplete.',
  'pages.k8s.inspection.scoped':
    'The totals above cover the whole cluster; the findings below are limited to namespaces you can access plus cluster-level ones.',
  'pages.k8s.inspection.findings': 'Findings',
  'pages.k8s.inspection.clean': 'No findings',
  'pages.k8s.inspection.message': 'Detail',
  'pages.k8s.inspection.more':
    'Showing {shown} of {total} (at most 500 are kept per check, or the rest are outside your data scope)',
  'pages.k8s.inspection.check.no_requests': 'No resource requests',
  'pages.k8s.inspection.check.no_requests.desc':
    'Containers without CPU or memory requests get no reserved resources and are evicted first under pressure.',
  'pages.k8s.inspection.check.no_limits': 'No memory limit',
  'pages.k8s.inspection.check.no_limits.desc':
    'Containers without a memory limit can starve other workloads on the node when they leak.',
  'pages.k8s.inspection.check.image_latest': 'Image uses latest or has no tag',
  'pages.k8s.inspection.check.image_latest.desc':
    'A floating tag may pull a different version when the Pod is recreated and makes rollbacks unreliable.',
  'pages.k8s.inspection.check.single_replica': 'Single replica',
  'pages.k8s.inspection.check.single_replica.desc':
    'A Deployment or StatefulSet with one replica is interrupted by node failures and rollouts.',
  'pages.k8s.inspection.check.no_probe': 'No probes',
  'pages.k8s.inspection.check.no_probe.desc':
    'Containers with neither readiness nor liveness probes receive traffic before they are ready and are not restarted when they hang.',
  'pages.k8s.inspection.check.cert_expiring':
    'TLS certificate expiring or expired',
  'pages.k8s.inspection.check.cert_expiring.desc':
    'The certificate in a kubernetes.io/tls Secret has expired or expires within 30 days.',
  'pages.k8s.inspection.check.pod_restarts': 'Pod restarting frequently',
  'pages.k8s.inspection.check.pod_restarts.desc':
    'A container has restarted 10 times or more.',
  'pages.k8s.inspection.check.pvc_pending': 'PVC pending for long',
  'pages.k8s.inspection.check.pvc_pending.desc':
    'A PVC pending for over an hour usually means no matching storage class or insufficient capacity.',
  'pages.k8s.inspection.check.node_unhealthy': 'Unhealthy node',
  'pages.k8s.inspection.check.node_unhealthy.desc':
    'The node is NotReady or under memory, disk or PID pressure.',
  'pages.k8s.inspection.check.version_skew': 'Node version skew',
  'pages.k8s.inspection.check.version_skew.desc':
    'The kubelet is two or more minor versions behind the control plane, or newer than it.',
  'pages.k8s.ruleTemplate.use': 'Use the K8s alert rule pack',
  'pages.k8s.ruleTemplate.loaded':
    'Loaded {n} K8s alert rules; review them in the preview',
  'pages.k8s.alertLink': 'View the resource in Container Platform',
};
