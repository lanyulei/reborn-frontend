/** 容器平台 · 资源详情（命名空间 / 节点 / 工作负载 / 容器组及各类资源的详情页与共用组件） */
export default {
  // ---- 共用 ----
  'pages.k8s.detail.tab.metadata': 'Metadata',
  'pages.k8s.detail.basicInfo': 'Basic information',
  'pages.k8s.detail.loading': 'Loading',
  'pages.k8s.detail.index': '#',
  'pages.k8s.detail.ip': 'IP address',
  'pages.k8s.detail.capacity': 'Capacity',
  'pages.k8s.detail.usage': 'Usage',
  'pages.k8s.detail.used': 'Used',
  'pages.k8s.detail.usedPercent': 'Used: {percent}%',
  'pages.k8s.detail.noLimit': 'No limit',
  'pages.k8s.detail.noRequest': 'No request',
  'pages.k8s.detail.keyLabel': 'Key:',
  'pages.k8s.detail.valueLabel': 'Value:',
  'pages.k8s.detail.containerName': 'Container: {name}',
  'pages.k8s.detail.containerEnv': 'Environment variables',
  'pages.k8s.detail.containerPorts': 'Container ports',
  'pages.k8s.detail.containerMounts': 'Volume mounts',
  'pages.k8s.detail.source': 'Source',
  'pages.k8s.detail.target': 'Target',
  'pages.k8s.detail.all': 'All',
  'pages.k8s.detail.resourceName': 'Resource name',
  'pages.k8s.detail.shell.empty': 'No resource details',

  // ---- 状态原文 → 文案 ----
  'pages.k8s.detail.status.succeeded': 'Succeeded',
  'pages.k8s.detail.status.terminated': 'Terminated',
  'pages.k8s.detail.status.containerCreating': 'Creating container',
  'pages.k8s.detail.status.podInitializing': 'Initializing',
  'pages.k8s.detail.status.crashLoopBackOff': 'Crash loop',
  'pages.k8s.detail.status.imagePullFailed': 'Image pull failed',
  'pages.k8s.detail.status.invalidImageName': 'Invalid image name',
  'pages.k8s.detail.status.createContainerConfigError':
    'Container config error',
  'pages.k8s.detail.status.oomKilled': 'OOM killed',
  'pages.k8s.detail.status.unschedulable': 'Unschedulable',
  'pages.k8s.detail.status.notReady': 'Not ready',
  'pages.k8s.detail.status.schedulingDisabled': 'Scheduling disabled',
  'pages.k8s.detail.status.active': 'Active',
  'pages.k8s.detail.status.bound': 'Bound',
  'pages.k8s.detail.status.available': 'Available',
  'pages.k8s.detail.status.released': 'Released',
  'pages.k8s.detail.status.lost': 'Lost',

  // ---- 命名空间 ----
  'pages.k8s.detail.namespace.notFound': 'Namespace not found',
  'pages.k8s.detail.namespace.resourceStatus': 'Resource status',
  'pages.k8s.detail.quota.cpuRequest': 'CPU request',
  'pages.k8s.detail.quota.cpuLimit': 'CPU limit',
  'pages.k8s.detail.quota.memoryRequest': 'Memory request',
  'pages.k8s.detail.quota.memoryLimit': 'Memory limit',
  'pages.k8s.detail.quota.empty':
    'No resource quota or default container limits are set for this namespace. Set them from the "Quota" action in the namespace list.',
  'pages.k8s.detail.quota.defaultContainer': 'Default container limits',
  'pages.k8s.detail.quota.project': 'Namespace quota',
  'pages.k8s.detail.quota.resourceType': 'Resource type',

  // ---- 事件 ----
  'pages.k8s.detail.event.daysAgo': '{count} days ago',
  'pages.k8s.detail.event.hoursAgo': '{count} hours ago',
  'pages.k8s.detail.event.minutesAgo': '{count} minutes ago',
  'pages.k8s.detail.event.justNow': 'Just now',
  'pages.k8s.detail.event.normal': 'Normal',
  'pages.k8s.detail.event.warning': 'Warning',
  'pages.k8s.detail.event.lastTime': 'Time',
  'pages.k8s.detail.event.source': 'Source',
  'pages.k8s.detail.event.message': 'Message',
  'pages.k8s.detail.event.search': 'Search type / reason / source / message',

  // ---- 副本 ----
  'pages.k8s.detail.replica.title': 'Replicas',
  'pages.k8s.detail.replica.desired': 'Desired: {count}',
  'pages.k8s.detail.replica.current': 'Current: {count}',
  'pages.k8s.detail.replica.increase': 'Add replica',
  'pages.k8s.detail.replica.decrease': 'Remove replica',
  'pages.k8s.detail.replica.unsupported':
    'This kind does not support manual scaling',

  // ---- 工作负载 ----
  'pages.k8s.detail.workload.stopped': 'Stopped',
  'pages.k8s.detail.workload.updating': 'Updating',
  'pages.k8s.detail.workload.starting': 'Starting',
  'pages.k8s.detail.workload.env.configMap': 'ConfigMap {name} / {key}',
  'pages.k8s.detail.workload.env.secret': 'Secret {name} / {key}',
  'pages.k8s.detail.workload.env.field': 'Field {path}',
  'pages.k8s.detail.workload.env.resource': 'Resource {resource}',
  'pages.k8s.detail.workload.notFound': 'Workload not found',
  'pages.k8s.detail.workload.scaled': 'Replicas updated',
  'pages.k8s.detail.workload.scale.title': 'Change the replica count?',
  'pages.k8s.detail.workload.scale.content':
    'Desired replicas are currently {current}. Change to {next}?',
  'pages.k8s.detail.workload.scale.ok': 'Confirm',
  'pages.k8s.detail.workload.scale.noPermission':
    'No permission to scale replicas',
  'pages.k8s.detail.workload.containers': 'Containers',
  'pages.k8s.detail.workload.revisions': 'Revisions',
  'pages.k8s.detail.workload.metadata.title': 'Labels and annotations',
  'pages.k8s.detail.workload.metadata.desc':
    'Labels and annotations of the workload itself.',

  // ---- 容器（工作负载模板） ----
  'pages.k8s.detail.container.memory': 'Memory {value}',
  'pages.k8s.detail.container.pull.always': 'Always pull',
  'pages.k8s.detail.container.pull.never': 'Local image only',
  'pages.k8s.detail.container.pull.ifNotPresent': 'Pull if not present',
  'pages.k8s.detail.container.volume.pvc': 'Volume claim',
  'pages.k8s.detail.container.registry': 'Image registry',
  'pages.k8s.detail.container.requests': 'Resource requests',
  'pages.k8s.detail.container.pullPolicy': 'Image pull policy',
  'pages.k8s.detail.container.protocol': 'Protocol',
  'pages.k8s.detail.container.volumeType': 'Volume type: {type}',
  'pages.k8s.detail.container.readOnly': ' (read-only)',
  'pages.k8s.detail.container.current': 'Container: {name}',
  'pages.k8s.detail.container.empty': 'No containers',

  // ---- 容器组表格 / 容器组详情 ----
  'pages.k8s.detail.pod.nodeIp': 'Node IP',
  'pages.k8s.detail.pod.nodeName': 'Node',
  'pages.k8s.detail.pod.containerLogs': 'Container logs',
  'pages.k8s.detail.pod.logsTitle': 'Container logs · {pod} / {container}',
  'pages.k8s.detail.pod.search': 'Search pod name / IP / node / status',
  'pages.k8s.detail.pod.image': 'Image: {image}',
  'pages.k8s.detail.pod.desiredCpu': 'Desired CPU',
  'pages.k8s.detail.pod.actualCpu': 'Actual CPU',
  'pages.k8s.detail.pod.desiredMemory': 'Desired memory',
  'pages.k8s.detail.pod.actualMemory': 'Actual memory',
  'pages.k8s.detail.pod.allocatedCpu': 'Allocated CPU',
  'pages.k8s.detail.pod.allocatedMemory': 'Allocated memory',
  'pages.k8s.detail.pod.cpuPolicy': 'CPU resize policy',
  'pages.k8s.detail.pod.memoryPolicy': 'Memory resize policy',
  'pages.k8s.detail.pod.volumes': 'Volumes',
  'pages.k8s.detail.pod.path': 'Path',
  'pages.k8s.detail.pod.noVolumes': 'No volumes',
  'pages.k8s.detail.pod.env.fieldRef': 'Field ref: {path}',
  'pages.k8s.detail.pod.env.resourceRef': 'Resource ref: {resource}',
  'pages.k8s.detail.pod.cond.scheduled': 'Pod scheduled',
  'pages.k8s.detail.pod.cond.scheduled.desc':
    'The pod has been scheduled to a node in the cluster.',
  'pages.k8s.detail.pod.cond.initialized': 'Initialized',
  'pages.k8s.detail.pod.cond.initialized.desc':
    'All init containers have started.',
  'pages.k8s.detail.pod.cond.containersReady': 'Containers ready',
  'pages.k8s.detail.pod.cond.containersReady.desc':
    'All containers in the pod have started.',
  'pages.k8s.detail.pod.cond.ready': 'Pod ready',
  'pages.k8s.detail.pod.cond.ready.desc':
    'The pod is running and can receive traffic.',
  'pages.k8s.detail.pod.scheduleResult': 'Scheduling',
  'pages.k8s.detail.pod.scheduledTo': 'Scheduled to {node}',
  'pages.k8s.detail.pod.scheduleResultTip': 'Pod scheduling result',
  'pages.k8s.detail.pod.statusInfo': 'Status',
  'pages.k8s.detail.pod.currentStatus': 'Current status',

  // ---- 健康检查 ----
  'pages.k8s.detail.probe.readiness.desc':
    'The pod receives traffic only after this probe passes.',
  'pages.k8s.detail.probe.liveness.desc':
    'The container is restarted when this probe fails.',
  'pages.k8s.detail.probe.startup.desc':
    'Other probes are disabled until this probe passes.',
  'pages.k8s.detail.probe.times': '{value} times',
  'pages.k8s.detail.probe.notConfigured': 'Not configured',
  'pages.k8s.detail.probe.initialDelay': 'Initial delay',
  'pages.k8s.detail.probe.timeout': 'Timeout',
  'pages.k8s.detail.probe.period': 'Period',
  'pages.k8s.detail.probe.items': '{count} items',
  'pages.k8s.detail.probe.imageDefault': 'Image default',
  'pages.k8s.detail.probe.httpDetail': '{path} (port {port})',
  'pages.k8s.detail.probe.tcpDetail': 'Port {port}',
  'pages.k8s.detail.probe.exec': 'Command',
  'pages.k8s.detail.probe.generic': 'Probe',

  // ---- QoS ----
  'pages.k8s.detail.qos.title': 'QoS class',
  'pages.k8s.detail.qos.help': 'About QoS classes',
  'pages.k8s.detail.qos.guaranteed':
    'CPU/memory requests and limits are all set and equal. Highest resource guarantee; evicted last under node pressure.',
  'pages.k8s.detail.qos.burstable':
    'At least one request or limit is set but the Guaranteed conditions are not met. Can burst into idle resources.',
  'pages.k8s.detail.qos.bestEffort':
    'No CPU/memory requests or limits are set. No resource guarantee; evicted first under node pressure.',

  // ---- 原地调整资源 ----
  'pages.k8s.detail.resize.action': 'Resize container resources',
  'pages.k8s.detail.resize.noPermission': 'No permission to resize resources',
  'pages.k8s.detail.resize.noContainer':
    'Container data is missing. Refresh and try again',
  'pages.k8s.detail.resize.windows':
    'In-place resize is not supported for Windows pods',
  'pages.k8s.detail.resize.terminating':
    'The pod is being deleted and cannot be resized',
  'pages.k8s.detail.resize.finished': 'Finished pods cannot be resized',
  'pages.k8s.detail.resize.notMainContainer':
    'Init and ephemeral containers do not support in-place resize',
  'pages.k8s.detail.resize.bestEffort':
    'This BestEffort pod declares no resources. Adding resources in place would change its QoS class; update the workload template and recreate the pod instead',
  'pages.k8s.detail.resize.cpuExceeds':
    'CPU request cannot exceed the CPU limit',
  'pages.k8s.detail.resize.memoryExceeds':
    'Memory request cannot exceed the memory limit',
  'pages.k8s.detail.resize.qosChange':
    'In-place resize cannot change the QoS class: currently {current}, would become {next}',

  // ---- 节点 ----
  'pages.k8s.detail.node.notFound': 'Node not found',
  'pages.k8s.detail.node.role.controlPlane': 'Control plane',
  'pages.k8s.detail.node.role.worker': 'Worker',
  'pages.k8s.detail.node.osImage': 'OS image',
  'pages.k8s.detail.node.os': 'Operating system',
  'pages.k8s.detail.node.kernel': 'Kernel version',
  'pages.k8s.detail.node.runtime': 'Container runtime',
  'pages.k8s.detail.node.kubelet': 'kubelet version',
  'pages.k8s.detail.node.kubeProxy': 'kube-proxy version',
  'pages.k8s.detail.node.arch': 'Architecture',
  'pages.k8s.detail.node.tab.status': 'Status',
  'pages.k8s.detail.node.tab.capacity': 'Resource usage',
  'pages.k8s.detail.node.cores': '{value} cores',
  'pages.k8s.detail.node.allocatableCpu': 'Allocatable CPU · total {total}',
  'pages.k8s.detail.node.allocatableMemory':
    'Allocatable memory · total {total}',
  'pages.k8s.detail.node.allocatableStorage':
    'Allocatable ephemeral storage · total {total}',
  'pages.k8s.detail.node.allocatable': 'Allocatable resources',
  'pages.k8s.detail.node.scheduled': 'Scheduled',
  'pages.k8s.detail.node.health': 'Health',
  'pages.k8s.detail.node.taints': 'Taints',
  'pages.k8s.detail.node.taintEffect': 'Effect:',
  'pages.k8s.detail.node.cond.memoryPressure': 'Memory pressure',
  'pages.k8s.detail.node.cond.memoryPressure.desc':
    'Whether available memory on the node is below the threshold.',
  'pages.k8s.detail.node.cond.diskPressure': 'Disk pressure',
  'pages.k8s.detail.node.cond.diskPressure.desc':
    'Whether available disk space or inodes on the node are below the threshold.',
  'pages.k8s.detail.node.cond.pidPressure': 'PID pressure',
  'pages.k8s.detail.node.cond.pidPressure.desc':
    'Whether the number of processes the node can create is below the threshold.',
  'pages.k8s.detail.node.cond.ready.desc': 'Whether the node can accept pods.',

  // ---- 应用路由 / 服务 ----
  'pages.k8s.detail.ingress.rules': 'Rules',
  'pages.k8s.detail.ingress.protocol': 'Protocol: {protocol}',
  'pages.k8s.detail.ingress.inaccessible': 'Service not reachable',
  'pages.k8s.detail.ingress.noAddress':
    'The rule provides no directly reachable host or gateway address',
  'pages.k8s.detail.ingress.path': 'Path:',
  'pages.k8s.detail.ingress.service': 'Service:',
  'pages.k8s.detail.ingress.port': 'Port:',
  'pages.k8s.detail.ingress.visit': 'Open service',
  'pages.k8s.detail.service.port': 'Service port',
  'pages.k8s.detail.service.nodePort': 'Node port',

  // ---- 任务 / 定时任务 ----
  'pages.k8s.detail.cronjob.concurrency.allow': 'Allow concurrent runs',
  'pages.k8s.detail.cronjob.concurrency.forbid': 'Skip new run',
  'pages.k8s.detail.cronjob.concurrency.replace': 'Replace old run',

  // ---- 存储 ----
  'pages.k8s.detail.storage.reclaim.retain': 'Retain',
  'pages.k8s.detail.storage.reclaim.recycle': 'Recycle',

  // ---- 网络策略 ----
  'pages.k8s.detail.netpol.expressions': '{count} expressions',
  'pages.k8s.detail.netpol.any': 'any',
  'pages.k8s.detail.netpol.anyPeer': '{label} any',
  'pages.k8s.detail.netpol.ports': 'Ports {ports}',
  'pages.k8s.detail.netpol.allPorts': 'Ports all',

  // ---- 基本信息列 ----
  'pages.k8s.detail.basic.apiVersion': 'API version',
  'pages.k8s.detail.basic.scope': 'Scope',
  'pages.k8s.detail.basic.defaultClass': 'Default class',
  'pages.k8s.detail.basic.provisioner': 'Provisioner',
  'pages.k8s.detail.basic.allowClone': 'Allow volume clone',
  'pages.k8s.detail.basic.allowExpansion': 'Allow volume expansion',
  'pages.k8s.detail.basic.scReclaimPolicy': 'Reclaim policy',
  'pages.k8s.detail.basic.allowSnapshot': 'Allow volume snapshot',
  'pages.k8s.detail.basic.accessModes': 'Access modes',
  'pages.k8s.detail.basic.pvReclaimPolicy': 'Reclaim policy',
  'pages.k8s.detail.basic.claimRef': 'Bound claim',
  'pages.k8s.detail.basic.nodeAffinity': 'Node affinity',
  'pages.k8s.detail.basic.volumeMode': 'Volume mode',
  'pages.k8s.detail.basic.scaleTarget': 'Scale target',
  'pages.k8s.detail.basic.minReplicas': 'Min replicas',
  'pages.k8s.detail.basic.maxReplicas': 'Max replicas',
  'pages.k8s.detail.basic.currentReplicas': 'Current replicas',
  'pages.k8s.detail.basic.desiredReplicas': 'Desired replicas',
  'pages.k8s.detail.basic.currentMetrics': 'Current metrics',
  'pages.k8s.detail.basic.podSelector': 'Pod selector',
  'pages.k8s.detail.basic.policyTypes': 'Policy types',
  'pages.k8s.detail.basic.ingressRules': 'Ingress rules',
  'pages.k8s.detail.basic.egressRules': 'Egress rules',
  'pages.k8s.detail.basic.default': 'Default',
  'pages.k8s.detail.basic.controller': 'Controller',
  'pages.k8s.detail.basic.parameters': 'Parameters',
  'pages.k8s.detail.basic.addressType': 'Address type',
  'pages.k8s.detail.basic.endpoints': 'Endpoints',
  'pages.k8s.detail.basic.readyEndpoints': 'Ready endpoints',
  'pages.k8s.detail.basic.gatewayAddress': 'Gateway address',
  'pages.k8s.detail.basic.clusterIp': 'Cluster IP',
  'pages.k8s.detail.basic.externalIp': 'External IP',
  'pages.k8s.detail.basic.ipFamilyPolicy': 'IP family policy',
  'pages.k8s.detail.basic.internalTrafficPolicy': 'Internal traffic policy',
  'pages.k8s.detail.basic.externalTrafficPolicy': 'External traffic policy',
  'pages.k8s.detail.basic.trafficDistribution': 'Traffic distribution',
  'pages.k8s.detail.basic.sessionAffinity': 'Session affinity',
  'pages.k8s.detail.basic.selector': 'Selector',
  'pages.k8s.detail.basic.backoffLimit': 'Backoff limit',
  'pages.k8s.detail.basic.completions': 'Completions',
  'pages.k8s.detail.basic.parallelism': 'Parallelism',
  'pages.k8s.detail.basic.activeDeadline': 'Active deadline (s)',
  'pages.k8s.detail.basic.schedule': 'Schedule',
  'pages.k8s.detail.basic.startingDeadline': 'Starting deadline (s)',
  'pages.k8s.detail.basic.successfulHistory': 'Successful jobs to keep',
  'pages.k8s.detail.basic.failedHistory': 'Failed jobs to keep',
  'pages.k8s.detail.basic.podIp': 'Pod IP',
  'pages.k8s.detail.basic.nodeIp': 'Node IP',

  // ---- RBAC ----
  'pages.k8s.detail.rbac.apiGroups': 'API groups',
  'pages.k8s.detail.rbac.resources': 'Resources / non-resource URLs',
  'pages.k8s.detail.rbac.verbs': 'Verbs',
  'pages.k8s.detail.rbac.risk': 'Risk',
  'pages.k8s.detail.rbac.rules': 'Rules',
  'pages.k8s.detail.rbac.roleRef': 'Role reference',
  'pages.k8s.detail.rbac.subjects': 'Subjects',
  'pages.k8s.detail.rbac.refRules': 'Rules of the referenced role',

  // ---- 资源列表空态 / 回退 ----
  'pages.k8s.detail.view.empty': 'No resources of this kind yet',
  'pages.k8s.detail.view.emptyNamespaced':
    'No resources of this kind in namespace {namespace} yet',
  'pages.k8s.detail.rollback.done': 'Workload rolled back',
  'pages.k8s.detail.rollback.current': 'Current revision',
  'pages.k8s.detail.rollback.target': 'Target revision',
  'pages.k8s.detail.rollback.selectTarget': 'Select the target revision',

  // ---- Generic resource detail (Job / CronJob / Service / storage / NetworkPolicy…) ----
  'pages.k8s.detail.tab.resourceStatus': 'Resource status',
  'pages.k8s.detail.tab.scheduling': 'Scheduling',
  'pages.k8s.detail.tab.health': 'Health checks',
  'pages.k8s.detail.tab.env': 'Environment variables',
  'pages.k8s.detail.tab.runs': 'Runs',
  'pages.k8s.detail.tab.claim': 'Claim binding',
  'pages.k8s.detail.tab.persistentVolumeClaims': 'Volume claims',
  'pages.k8s.detail.tab.hpaTarget': 'Scale target & metrics',
  'pages.k8s.detail.tab.networkPolicyRules': 'Rule summary',
  'pages.k8s.detail.tab.customResources': 'Custom resources',
  'pages.k8s.detail.tab.rbac': 'Rules & bindings',
  'pages.k8s.detail.job.parallelismHint':
    'Change the parallelism of a Job via "Edit YAML"',
  'pages.k8s.detail.pvc.claimPodsTruncated':
    'This namespace has many pods; only the first {n} were checked.',
  'pages.k8s.detail.netpol.noRules': 'No ingress/egress rules',
  'pages.k8s.detail.noEndpoints': 'No endpoints',
};
