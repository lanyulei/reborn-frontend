/** Container platform · resource create / edit forms (workload, config, network, storage, RBAC wizards) */
export default {
  'pages.k8s.forms.common.set': 'Set',
  'pages.k8s.forms.common.unset': 'Not set',
  'pages.k8s.forms.common.name': 'Name',
  'pages.k8s.forms.common.name.required': 'Please enter a name',
  'pages.k8s.forms.common.name.maxLength': 'Name must be at most 63 characters',
  'pages.k8s.forms.common.name.maxLength253':
    'Name must be at most 253 characters',
  'pages.k8s.forms.common.name.pattern':
    'Name may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.common.name.dnsLabel':
    'Name may only contain lowercase letters, digits and hyphens (-), must start and end with a lowercase letter or digit, and be at most 63 characters',
  'pages.k8s.forms.common.namespace': 'Namespace',
  'pages.k8s.forms.common.namespace.required': 'Please select a namespace',
  'pages.k8s.forms.common.namespace.placeholder':
    'Select the namespace to create the resource in',
  'pages.k8s.forms.common.labels': 'Labels',
  'pages.k8s.forms.common.annotations': 'Annotations',
  'pages.k8s.forms.common.metadata': 'Metadata',
  'pages.k8s.forms.common.addMetadata': 'Add metadata',
  'pages.k8s.forms.common.advanced': 'Advanced settings',
  'pages.k8s.forms.common.current': 'Current',
  'pages.k8s.forms.common.yes': 'Yes',
  'pages.k8s.forms.common.no': 'No',
  'pages.k8s.forms.common.type': 'Type',
  'pages.k8s.forms.common.type.required': 'Please select a type',
  'pages.k8s.forms.common.select': 'Please select',
  'pages.k8s.forms.common.labelKey': 'Label key',
  'pages.k8s.forms.common.labelValue': 'Label value',
  'pages.k8s.forms.common.key.required': 'Please enter a key',
  'pages.k8s.forms.common.key.maxLength': 'Key must be at most 253 characters',
  'pages.k8s.forms.common.key.pattern':
    'Key may only contain letters, digits, dots (.), underscores (_) and hyphens (-)',
  'pages.k8s.forms.common.deleteLabel': 'Remove label',
  'pages.k8s.forms.common.deleteAnnotation': 'Remove annotation',
  'pages.k8s.forms.common.labelKeyFirst':
    'Fill in the key of the existing label first.',
  'pages.k8s.forms.common.annotationKeyFirst':
    'Fill in the key of the existing annotation first.',
  'pages.k8s.forms.common.username': 'Username',
  'pages.k8s.forms.common.username.required': 'Please enter a username',
  'pages.k8s.forms.common.password': 'Password',
  'pages.k8s.forms.common.password.required': 'Please enter a password',
  'pages.k8s.forms.common.accessMode': 'Access mode',
  'pages.k8s.forms.common.accessMode.required': 'Please select an access mode',
  'pages.k8s.forms.common.data': 'Data',
  'pages.k8s.forms.common.editData': 'Edit data',
  'pages.k8s.forms.common.addData': 'Add data',
  'pages.k8s.forms.common.deleteData': 'Remove data',
  'pages.k8s.forms.common.dataKeyDuplicate': 'Data keys must be unique',
  'pages.k8s.forms.common.storage': 'Storage settings',
  'pages.k8s.forms.common.capacity': 'Capacity',
  'pages.k8s.forms.common.capacity.required': 'Please enter a capacity',
  'pages.k8s.forms.common.volumeName.required': 'Please enter a volume name',
  'pages.k8s.forms.common.volumeMode.required': 'Please select a volume mode',
  'pages.k8s.forms.common.storageClass': 'Storage class',
  'pages.k8s.forms.common.empty': 'Empty',
  'pages.k8s.forms.common.hidden': 'Hidden',
  'pages.k8s.forms.common.port.required': 'Please enter a port',
  'pages.k8s.forms.common.port.range': 'Port must be between 1 and 65535',
  'pages.k8s.forms.common.deletePort': 'Remove port',
  'pages.k8s.forms.common.protocol.required': 'Please select a protocol',
  'pages.k8s.forms.common.command': 'Command',
  'pages.k8s.forms.common.container': 'Container',
  'pages.k8s.forms.common.user': 'User',
  'pages.k8s.forms.common.podSelector': 'Pod selector',
  'pages.k8s.forms.common.noResources': 'No resources available',
  'pages.k8s.forms.common.editSettings': 'Edit settings',
  'pages.k8s.forms.common.yaml.nameNamespaceRequired':
    'YAML must include metadata.name and metadata.namespace',
  'pages.k8s.forms.common.yaml.nameRequired': 'YAML must include metadata.name',
  'pages.k8s.forms.common.yaml.invalidObject':
    'Invalid YAML: the content must be a valid resource object',
  'pages.k8s.forms.common.yaml.invalid':
    'Invalid YAML or not a valid resource object; please check and try again',
  'pages.k8s.forms.common.yaml.kindMismatch': 'YAML kind must be {kind}',
  'pages.k8s.forms.common.yaml.apiVersionMismatch':
    'YAML apiVersion must be {apiVersion}',
  'pages.k8s.forms.workload.container.delete': 'Delete container',
  'pages.k8s.forms.workload.container.delete.content':
    'Delete container “{name}”? Its configuration and volume mount settings will be removed as well.',
  'pages.k8s.forms.workload.container.delete.aria': 'Delete {name}',
  'pages.k8s.forms.workload.container.new': 'New container',
  'pages.k8s.forms.workload.container.add': 'Add container',
  'pages.k8s.forms.workload.container.add.description':
    'Customize container settings to create a container',
  'pages.k8s.forms.workload.container.edit': 'Edit container configuration',
  'pages.k8s.forms.workload.container.edit.aria': 'Edit {name} configuration',
  'pages.k8s.forms.workload.container.keepOne':
    'At least one container is required',
  'pages.k8s.forms.workload.container.image.line': 'Image: {image}',
  'pages.k8s.forms.workload.container.image.unset': 'Not specified',
  'pages.k8s.forms.workload.container.noLimit': 'No limit',
  'pages.k8s.forms.workload.container.noResourceLimit': 'No resource limits',
  'pages.k8s.forms.workload.container.replicas': 'Pod replicas',
  'pages.k8s.forms.workload.container.replicas.decrease':
    'Decrease pod replicas',
  'pages.k8s.forms.workload.container.replicas.increase':
    'Increase pod replicas',
  'pages.k8s.forms.workload.container.replicas.required':
    'Please enter the number of replicas',
  'pages.k8s.forms.workload.container.command.required':
    'Please enter a command',
  'pages.k8s.forms.workload.container.command.placeholder': 'e.g. /bin/sh',
  'pages.k8s.forms.workload.container.arg.delete': 'Remove argument',
  'pages.k8s.forms.workload.container.args': 'Arguments',
  'pages.k8s.forms.workload.container.args.add': 'Add argument',
  'pages.k8s.forms.workload.container.args.placeholder': 'Enter an argument',
  'pages.k8s.forms.workload.container.args.help':
    'Arguments for the container startup command. Enter one argument per item; each is passed through as-is (commas and spaces are allowed).',
  'pages.k8s.forms.workload.container.settings': 'Container settings',
  'pages.k8s.forms.workload.container.settings.description':
    'Configure the container image, name, type and compute resources',
  'pages.k8s.forms.workload.container.image.tooltip':
    'To use a private registry, create a registry Secret first',
  'pages.k8s.forms.workload.container.image.required':
    'Please enter a container image',
  'pages.k8s.forms.workload.container.image.placeholder':
    'Image name or path, e.g. nginx:latest',
  'pages.k8s.forms.workload.container.name': 'Container name',
  'pages.k8s.forms.workload.container.name.required':
    'Please enter a container name',
  'pages.k8s.forms.workload.container.name.maxLength':
    'Container name must be at most 63 characters',
  'pages.k8s.forms.workload.container.name.pattern':
    'Container name may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.workload.container.name.duplicate':
    'Container name already exists',
  'pages.k8s.forms.workload.container.name.placeholder':
    'e.g. container-ab12cd34',
  'pages.k8s.forms.workload.container.type': 'Container type',
  'pages.k8s.forms.workload.container.type.worker': 'Worker container',
  'pages.k8s.forms.workload.container.type.required':
    'Please select a container type',
  'pages.k8s.forms.workload.container.ports': 'Port settings',
  'pages.k8s.forms.workload.container.ports.description':
    'Set the ports used to access the container.',
  'pages.k8s.forms.workload.container.ports.protocolHint':
    'HTTP/HTTPS are submitted as TCP container port protocols.',
  'pages.k8s.forms.workload.container.ports.name.maxLength':
    'Port name must be at most 15 characters',
  'pages.k8s.forms.workload.container.ports.name.pattern':
    'Port name may only contain lowercase letters, digits and hyphens (-)',
  'pages.k8s.forms.workload.container.ports.name.placeholder': 'e.g. http-0',
  'pages.k8s.forms.workload.container.ports.containerPort': 'Container port',
  'pages.k8s.forms.workload.container.ports.containerPort.required':
    'Please enter a container port',
  'pages.k8s.forms.workload.container.ports.add': 'Add port',
  'pages.k8s.forms.workload.container.required': 'Required',
  'pages.k8s.forms.workload.container.protocol': 'Protocol',
  'pages.k8s.forms.workload.container.path': 'Path',
  'pages.k8s.forms.workload.container.path.required': 'Please enter a path',
  'pages.k8s.forms.workload.container.http.scheme.aria': 'Request scheme',
  'pages.k8s.forms.workload.container.http.path.aria': 'Request path',
  'pages.k8s.forms.workload.container.http.port.aria': 'Request port',
  'pages.k8s.forms.workload.container.resources.cpuRequest': 'CPU request',
  'pages.k8s.forms.workload.container.resources.cpuRequest.exceedsLimit':
    'CPU request cannot exceed the CPU limit',
  'pages.k8s.forms.workload.container.resources.cpuLimit': 'CPU limit',
  'pages.k8s.forms.workload.container.resources.memoryRequest':
    'Memory request',
  'pages.k8s.forms.workload.container.resources.memoryRequest.exceedsLimit':
    'Memory request cannot exceed the memory limit',
  'pages.k8s.forms.workload.container.resources.memoryLimit': 'Memory limit',
  'pages.k8s.forms.workload.container.resources.noRequest': 'No request',
  'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent':
    'Prefer local image',
  'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent.description':
    'Use the local image if it is already present.',
  'pages.k8s.forms.workload.container.pullPolicy.always': 'Always pull image',
  'pages.k8s.forms.workload.container.pullPolicy.always.description':
    'Try to pull a fresh image every time the pod is created or updated.',
  'pages.k8s.forms.workload.container.pullPolicy.never': 'Local image only',
  'pages.k8s.forms.workload.container.pullPolicy.never.description':
    'Only use the local image. The container will fail if the image is not present locally.',
  'pages.k8s.forms.workload.container.healthCheck': 'Health checks',
  'pages.k8s.forms.workload.container.healthCheck.description':
    'Add probes to check container health periodically.',
  'pages.k8s.forms.workload.container.lifecycle': 'Lifecycle management',
  'pages.k8s.forms.workload.container.lifecycle.description':
    'Set actions to run after the container starts or before it stops, for environment checks or graceful shutdown.',
  'pages.k8s.forms.workload.container.lifecycle.postStart': 'Post-start action',
  'pages.k8s.forms.workload.container.lifecycle.postStart.description':
    'Set the action to run after the container starts.',
  'pages.k8s.forms.workload.container.lifecycle.preStop': 'Pre-stop action',
  'pages.k8s.forms.workload.container.lifecycle.preStop.description':
    'Set the action to run before the container stops.',
  'pages.k8s.forms.workload.container.lifecycle.command.help':
    'Enter one argument per item, e.g. /bin/sh, -c, and the script to run.',
  'pages.k8s.forms.workload.container.lifecycle.remove': 'Remove action',
  'pages.k8s.forms.workload.container.lifecycle.add': 'Add action',
  'pages.k8s.forms.workload.container.handler.httpGet': 'HTTP request',
  'pages.k8s.forms.workload.container.handler.tcpSocket': 'TCP port',
  'pages.k8s.forms.workload.container.startupCommand.description':
    'Customize the command run when the container starts. By default the image’s default command is used.',
  'pages.k8s.forms.workload.container.startupCommand.add': 'Add command',
  'pages.k8s.forms.workload.container.startupCommand.help':
    'The container startup command. Enter one argument per item, e.g. /bin/sh, -c.',
  'pages.k8s.forms.workload.container.env.description':
    'Add environment variables to the container.',
  'pages.k8s.forms.workload.container.env.source.custom': 'Custom',
  'pages.k8s.forms.workload.container.env.source.configMap': 'From ConfigMap',
  'pages.k8s.forms.workload.container.env.source.secret': 'From Secret',
  'pages.k8s.forms.workload.container.env.source.required':
    'Please select a source',
  'pages.k8s.forms.workload.container.env.resource': 'Resource',
  'pages.k8s.forms.workload.container.env.resource.required':
    'Please select a resource',
  'pages.k8s.forms.workload.container.env.resourceKey': 'Key in resource',
  'pages.k8s.forms.workload.container.env.resourceKey.required':
    'Please select a key in the resource',
  'pages.k8s.forms.workload.container.env.key.pattern':
    'Key may only contain letters, digits and underscores, and must not start with a digit',
  'pages.k8s.forms.workload.container.env.delete':
    'Remove environment variable',
  'pages.k8s.forms.workload.container.env.add': 'Add environment variable',
  'pages.k8s.forms.workload.container.env.helper.prefix':
    'If no ConfigMap or Secret fits your needs, you can',
  'pages.k8s.forms.workload.container.env.helper.createConfigMap':
    'create a ConfigMap',
  'pages.k8s.forms.workload.container.env.helper.or': 'or',
  'pages.k8s.forms.workload.container.env.helper.createSecret':
    'create a Secret',
  'pages.k8s.forms.workload.container.env.helper.suffix': '.',
  'pages.k8s.forms.workload.container.securityContext':
    'Container security context',
  'pages.k8s.forms.workload.container.securityContext.description':
    'Customize the container permission settings.',
  'pages.k8s.forms.workload.container.resizePolicy': 'Resize policy',
  'pages.k8s.forms.workload.container.resizePolicy.description':
    'Declare whether the container must restart when Kubernetes 1.35+ resizes CPU or memory in place.',
  'pages.k8s.forms.workload.container.resizePolicy.cpu': 'CPU resize policy',
  'pages.k8s.forms.workload.container.resizePolicy.memory':
    'Memory resize policy',
  'pages.k8s.forms.workload.container.resizePolicy.notRequired':
    'No restart required',
  'pages.k8s.forms.workload.container.resizePolicy.restartContainer':
    'Restart container',
  'pages.k8s.forms.workload.container.resizePolicy.placeholder':
    'Default: no restart required',
  'pages.k8s.forms.workload.container.resizePolicy.help':
    'When the pod restartPolicy is Never, the container resizePolicy must stay at NotRequired.',
  'pages.k8s.forms.workload.container.syncTimezone': 'Sync host time zone',
  'pages.k8s.forms.workload.container.syncTimezone.description':
    'Use the host time zone inside the container.',
  'pages.k8s.forms.workload.container.probe.liveness': 'Liveness check',
  'pages.k8s.forms.workload.container.probe.liveness.description':
    'Checks whether the container is alive.',
  'pages.k8s.forms.workload.container.probe.readiness': 'Readiness check',
  'pages.k8s.forms.workload.container.probe.readiness.description':
    'Checks whether the container can serve requests.',
  'pages.k8s.forms.workload.container.probe.startup': 'Startup check',
  'pages.k8s.forms.workload.container.probe.startup.description':
    'Checks whether the container has started successfully.',
  'pages.k8s.forms.workload.container.probe.initialDelay': 'Initial delay (s)',
  'pages.k8s.forms.workload.container.probe.initialDelay.min':
    'Initial delay must be at least 0',
  'pages.k8s.forms.workload.container.probe.initialDelay.description':
    'Delay after the container starts before the probe begins.',
  'pages.k8s.forms.workload.container.probe.timeout': 'Timeout (s)',
  'pages.k8s.forms.workload.container.probe.timeout.min':
    'Timeout must be at least 0',
  'pages.k8s.forms.workload.container.probe.timeout.description':
    'Probe timeout. The check is considered failed once it times out. Must be an integer of at least 0.',
  'pages.k8s.forms.workload.container.probe.period': 'Period (s)',
  'pages.k8s.forms.workload.container.probe.period.min':
    'Period must be at least 1',
  'pages.k8s.forms.workload.container.probe.period.description':
    'Interval between checks. Must be an integer of at least 1.',
  'pages.k8s.forms.workload.container.probe.successThreshold':
    'Success threshold',
  'pages.k8s.forms.workload.container.probe.successThreshold.min':
    'Success threshold must be at least 1',
  'pages.k8s.forms.workload.container.probe.successThreshold.description':
    'Minimum consecutive successes required to be considered successful after a failure. Minimum is 1; must be 1 for liveness and startup probes.',
  'pages.k8s.forms.workload.container.probe.failureThreshold':
    'Failure threshold',
  'pages.k8s.forms.workload.container.probe.failureThreshold.min':
    'Failure threshold must be at least 1',
  'pages.k8s.forms.workload.container.probe.failureThreshold.description':
    'Minimum consecutive failures required to be considered failed after a success. Minimum is 1.',
  'pages.k8s.forms.workload.container.probe.timing.required':
    'Please enter {label}',
  'pages.k8s.forms.workload.container.probe.command.placeholder': 'e.g. cat',
  'pages.k8s.forms.workload.container.probe.command.help':
    'Enter one argument per item, e.g. cat, /tmp/healthy.',
  'pages.k8s.forms.workload.container.probe.remove': 'Remove probe',
  'pages.k8s.forms.workload.container.probe.add': 'Add probe',
  'pages.k8s.forms.workload.container.security.capability.delete':
    'Remove {label} capability',
  'pages.k8s.forms.workload.container.security.access': 'Access control',
  'pages.k8s.forms.workload.container.security.privileged.description':
    'Run container processes as the root user on the host.',
  'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation':
    'Allow privilege escalation',
  'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation.description':
    'Allow container processes to gain more privileges than their parent. Enabled by default when privileged mode is on.',
  'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem':
    'Read-only root filesystem',
  'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem.description':
    'Mount the container root filesystem as read-only.',
  'pages.k8s.forms.workload.container.security.userGroup': 'User and group',
  'pages.k8s.forms.workload.container.security.runAsNonRoot':
    'Run as non-root only',
  'pages.k8s.forms.workload.container.security.runAsNonRoot.description':
    'Check whether the container would run as root before starting it; if so, the container is not started.',
  'pages.k8s.forms.workload.container.security.runAsUser.placeholder':
    'Enter a user ID',
  'pages.k8s.forms.workload.container.security.runAsUser.help':
    'UID that runs the container entrypoint. Defaults to the UID specified in the image metadata.',
  'pages.k8s.forms.workload.container.security.group': 'Group',
  'pages.k8s.forms.workload.container.security.runAsGroup.placeholder':
    'Enter a group ID',
  'pages.k8s.forms.workload.container.security.runAsGroup.help':
    'GID that runs the container entrypoint. Defaults to the container runtime default GID.',
  'pages.k8s.forms.workload.container.security.seLinux': 'SELinux context',
  'pages.k8s.forms.workload.container.security.seLinux.level': 'Level',
  'pages.k8s.forms.workload.container.security.seLinux.level.placeholder':
    'Enter the SELinux level',
  'pages.k8s.forms.workload.container.security.seLinux.role.placeholder':
    'Enter the SELinux role',
  'pages.k8s.forms.workload.container.security.seLinux.type.placeholder':
    'Enter the SELinux type',
  'pages.k8s.forms.workload.container.security.seLinux.user.placeholder':
    'Enter the SELinux user',
  'pages.k8s.forms.workload.container.security.capabilities': 'Capabilities',
  'pages.k8s.forms.workload.container.security.capabilities.add.placeholder':
    'e.g. NET_ADMIN',
  'pages.k8s.forms.workload.container.security.capabilities.drop.placeholder':
    'e.g. ALL',
  'pages.k8s.forms.workload.container.security.seccomp': 'Seccomp profile',
  'pages.k8s.forms.workload.container.security.seccomp.type': 'Profile type',
  'pages.k8s.forms.workload.container.security.seccomp.type.placeholder':
    'Select a Seccomp profile type',
  'pages.k8s.forms.workload.container.security.seccomp.localhost':
    'Localhost profile path',
  'pages.k8s.forms.workload.container.security.seccomp.localhost.required':
    'Please enter the localhost profile path',
  'pages.k8s.forms.workload.container.security.seccomp.localhost.placeholder':
    'e.g. profiles/audit.json',
  'pages.k8s.forms.workload.container.security.seccomp.help':
    'RuntimeDefault uses the container runtime default profile; Localhost requires a profile file path on the node.',
  'pages.k8s.forms.workload.step.pod': 'Pod settings',
  'pages.k8s.forms.workload.selectField': 'Please select {label}',
  'pages.k8s.forms.workload.listSeparator': ', ',
  'pages.k8s.forms.workload.metadata.description':
    'Add metadata to the resource',
  'pages.k8s.forms.workload.check.containersRequired':
    'Add a container and fill in its name and image first',
  'pages.k8s.forms.workload.check.workerContainerRequired':
    'Add at least one worker container',
  'pages.k8s.forms.workload.check.containerNameDuplicate':
    'Container names must be unique',
  'pages.k8s.forms.workload.check.nameNamespaceRequired':
    'Fill in the name and namespace first',
  'pages.k8s.forms.workload.yaml.invalid':
    'Invalid YAML; please check and try again',
  'pages.k8s.forms.workload.yaml.invalidObject':
    'YAML content must be a valid resource object',
  'pages.k8s.forms.workload.termination.title': 'Graceful pod termination',
  'pages.k8s.forms.workload.termination.enable':
    'Enable graceful pod termination',
  'pages.k8s.forms.workload.termination.tip':
    'Set how long to wait before a container is terminated; after the timeout the container is force-killed.',
  'pages.k8s.forms.workload.termination.description':
    'Set the wait time before containers are terminated.',
  'pages.k8s.forms.workload.termination.config': 'Termination settings',
  'pages.k8s.forms.workload.termination.gracePeriod': 'Grace period (s)',
  'pages.k8s.forms.workload.termination.gracePeriod.required':
    'Please enter the grace period',
  'pages.k8s.forms.workload.podMetadata.tip': 'Add metadata to pod replicas.',
  'pages.k8s.forms.workload.node.role.controlPlane': 'Control plane node',
  'pages.k8s.forms.workload.node.role.worker': 'Worker node',
  'pages.k8s.forms.workload.node.status.unschedulable': 'Unschedulable',
  'pages.k8s.forms.workload.node.assign': 'Assign nodes',
  'pages.k8s.forms.workload.node.assign.description':
    'Assign replicas to specific nodes.',
  'pages.k8s.forms.workload.node.select': 'Select nodes',
  'pages.k8s.forms.workload.node.select.description':
    'Assign pod replicas to specific nodes. You can select nodes by label or assign them manually',
  'pages.k8s.forms.workload.node.selector.add': 'Add node selector',
  'pages.k8s.forms.workload.node.selector.delete': 'Remove node selector',
  'pages.k8s.forms.workload.node.selector.keyFirst':
    'Fill in the key of the existing node selector first.',
  'pages.k8s.forms.workload.scheduling.label': 'Pod scheduling rule',
  'pages.k8s.forms.workload.scheduling.tip':
    'Set the rule for scheduling pod replicas onto nodes',
  'pages.k8s.forms.workload.scheduling.default': 'Default rule',
  'pages.k8s.forms.workload.scheduling.default.description':
    'Schedule pod replicas onto nodes using the default rule.',
  'pages.k8s.forms.workload.scheduling.spread': 'Spread',
  'pages.k8s.forms.workload.scheduling.spread.description':
    'Schedule pod replicas onto different nodes whenever possible.',
  'pages.k8s.forms.workload.scheduling.centralized': 'Pack',
  'pages.k8s.forms.workload.scheduling.centralized.description':
    'Schedule pod replicas onto the same node whenever possible.',
  'pages.k8s.forms.workload.scheduling.custom': 'Custom rule',
  'pages.k8s.forms.workload.scheduling.custom.description':
    'Schedule pod replicas onto nodes using custom rules.',
  'pages.k8s.forms.workload.scheduling.type.affinity': 'Schedule with target',
  'pages.k8s.forms.workload.scheduling.type.antiAffinity':
    'Schedule away from target',
  'pages.k8s.forms.workload.scheduling.strategy.preferred': 'Preferred',
  'pages.k8s.forms.workload.scheduling.strategy.required':
    'Please select a strategy',
  'pages.k8s.forms.workload.scheduling.strategy.must': 'Required',
  'pages.k8s.forms.workload.scheduling.target.required':
    'Please select a target',
  'pages.k8s.forms.workload.scheduling.target.empty': 'No targets',
  'pages.k8s.forms.workload.scheduling.clearRule':
    'Clear custom scheduling rule',
  'pages.k8s.forms.workload.podSecurity.title': 'Pod security context',
  'pages.k8s.forms.workload.podSecurity.enable': 'Enable pod security context',
  'pages.k8s.forms.workload.podSecurity.tip':
    'If user, group and SELinux settings are set in both the pod and container security contexts, the container security context takes precedence.',
  'pages.k8s.forms.workload.podSecurity.description':
    'Customize the permission settings of the pod.',
  'pages.k8s.forms.workload.podSecurity.userAndGroup': 'User and group',
  'pages.k8s.forms.workload.podSecurity.runAsNonRoot': 'Run as non-root only',
  'pages.k8s.forms.workload.podSecurity.runAsNonRoot.tip':
    'Before starting, check whether the container would run as root; if so, the container is not started',
  'pages.k8s.forms.workload.podSecurity.runAsUser.tip':
    'UID that runs the container entrypoint. Defaults to the UID specified in the image metadata',
  'pages.k8s.forms.workload.podSecurity.runAsUser.placeholder':
    'Please enter a user ID',
  'pages.k8s.forms.workload.podSecurity.runAsGroup': 'Group',
  'pages.k8s.forms.workload.podSecurity.runAsGroup.tip':
    'GID that runs the container entrypoint. Defaults to the container runtime default GID',
  'pages.k8s.forms.workload.podSecurity.runAsGroup.placeholder':
    'Please enter a group ID',
  'pages.k8s.forms.workload.podSecurity.fsGroup': 'Filesystem group',
  'pages.k8s.forms.workload.podSecurity.fsGroup.tip':
    'FSGroup used when mounting volumes.',
  'pages.k8s.forms.workload.podSecurity.fsGroup.placeholder':
    'Please enter a filesystem group ID',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy':
    'Supplemental groups policy',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.tip':
    'GA in Kubernetes 1.35. Strict attaches only explicitly declared groups, so implicit groups from the image /etc/group cannot affect volume permissions.',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.placeholder':
    'Default: Merge',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups':
    'Supplemental groups',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups.tip':
    'Separate multiple GIDs with commas or line breaks.',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups.placeholder':
    'e.g. 3000,4000',
  'pages.k8s.forms.workload.podSecurity.seLinux': 'SELinux context',
  'pages.k8s.forms.workload.podSecurity.seLinux.level': 'Level',
  'pages.k8s.forms.workload.podSecurity.seLinux.level.placeholder':
    'Please enter the SELinux level',
  'pages.k8s.forms.workload.podSecurity.seLinux.role.placeholder':
    'Please enter the SELinux role',
  'pages.k8s.forms.workload.podSecurity.seLinux.type.placeholder':
    'Please enter the SELinux type',
  'pages.k8s.forms.workload.podSecurity.seLinux.user.placeholder':
    'Please enter the SELinux user',
  'pages.k8s.forms.workload.updateStrategy.tip':
    'Configure the strategy used when the workload updates its pod replicas',
  'pages.k8s.forms.workload.updateStrategy.rolling':
    'Rolling update (recommended)',
  'pages.k8s.forms.workload.updateStrategy.rolling.description':
    'Gradually replace old pod replicas with new ones. During the upgrade, traffic is balanced across old and new replicas and the service is not interrupted.',
  'pages.k8s.forms.workload.updateStrategy.recreate': 'Recreate',
  'pages.k8s.forms.workload.updateStrategy.recreate.description':
    'Delete all old pod replicas before creating new ones. The service is interrupted during the upgrade.',
  'pages.k8s.forms.workload.updateStrategy.onDelete': 'Update on delete',
  'pages.k8s.forms.workload.updateStrategy.onDelete.description':
    'Pod replicas are updated only after they are deleted manually.',
  'pages.k8s.forms.workload.updateStrategy.rollingSettings':
    'Rolling update settings',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable':
    'Max unavailable pods',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable.extra':
    'Maximum number or percentage of pod replicas that may be unavailable during the update.',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable.required':
    'Please enter the max unavailable pods',
  'pages.k8s.forms.workload.updateStrategy.intOrPercent':
    'Enter an integer or a percentage, e.g. 1 or 25%',
  'pages.k8s.forms.workload.updateStrategy.maxSurge': 'Max surge pods',
  'pages.k8s.forms.workload.updateStrategy.maxSurge.tip':
    'Maximum number or percentage of extra pod replicas allowed during the update',
  'pages.k8s.forms.workload.updateStrategy.maxSurge.required':
    'Please enter the max surge pods',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds':
    'Min ready seconds (s)',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds.extra':
    'Minimum time a pod replica must run stably before it is considered ready.',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds.required':
    'Please enter the min ready seconds',
  'pages.k8s.forms.workload.updateStrategy.partition': 'Partition ordinal',
  'pages.k8s.forms.workload.updateStrategy.partition.extra':
    'Set a partition ordinal to split pod replicas into two groups. When the StatefulSet is updated, only replicas with an ordinal greater than or equal to the partition are updated.',
  'pages.k8s.forms.workload.updateStrategy.partition.required':
    'Please enter the partition ordinal',
  'pages.k8s.forms.workload.storage.type.emptyDir': 'Ephemeral volume',
  'pages.k8s.forms.workload.storage.type.hostPath': 'HostPath volume',
  'pages.k8s.forms.workload.storage.mountMode.readWrite': 'Read-write',
  'pages.k8s.forms.workload.storage.mountMode.none': 'Do not mount',
  'pages.k8s.forms.workload.storage.mountMode.placeholder':
    'Please select a mount mode',
  'pages.k8s.forms.workload.storage.defaultStorageClass':
    'Default storage class',
  'pages.k8s.forms.workload.storage.subPath.invalid':
    'Enter an absolute or relative path that does not contain ..',
  'pages.k8s.forms.workload.storage.mountPath.required':
    'Please enter a mount path',
  'pages.k8s.forms.workload.storage.absolutePath':
    'Enter an absolute path starting with /',
  'pages.k8s.forms.workload.storage.mountPath.incomplete':
    'Please complete the mount path settings',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate.add.description':
    'Add a persistent volume claim template to mount a persistent volume for each pod of the StatefulSet',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate.add':
    'Add volume claim template',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate':
    'Volume claim template',
  'pages.k8s.forms.workload.storage.volume.mount.description':
    'Mount a persistent, ephemeral or HostPath volume into containers',
  'pages.k8s.forms.workload.storage.volume.mount': 'Mount volume',
  'pages.k8s.forms.workload.storage.config.mount.description':
    'Mount a ConfigMap or Secret into containers',
  'pages.k8s.forms.workload.storage.config.mount': 'Mount ConfigMap or Secret',
  'pages.k8s.forms.workload.storage.pvc.required':
    'Please select a persistent volume claim',
  'pages.k8s.forms.workload.storage.pvc.description':
    'Mount the persistent volume created from the claim into containers',
  'pages.k8s.forms.workload.storage.pvc.select':
    'Select a persistent volume claim',
  'pages.k8s.forms.workload.storage.configResource.required':
    'Please select a {label}.',
  'pages.k8s.forms.workload.storage.configResource.description':
    'Mount the {label} into containers.',
  'pages.k8s.forms.workload.storage.configResource.select': 'Select a {label}',
  'pages.k8s.forms.workload.storage.hostPath.info':
    'Use a HostPath volume to mount a file or directory from the host filesystem into containers.',
  'pages.k8s.forms.workload.storage.volumeName': 'Volume name',
  'pages.k8s.forms.workload.storage.volumeName.maxLength':
    'Volume name must be at most 63 characters',
  'pages.k8s.forms.workload.storage.volumeName.pattern':
    'Volume name may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.workload.storage.hostPath': 'Host path',
  'pages.k8s.forms.workload.storage.hostPath.required':
    'Please enter a host path',
  'pages.k8s.forms.workload.storage.sizeLimit': 'Size limit',
  'pages.k8s.forms.workload.storage.sizeLimit.required':
    'Please enter a size limit',
  'pages.k8s.forms.workload.storage.sizeLimit.tip':
    'Size limit of this volume. Defaults to 200Mi and must not exceed 2Gi',
  'pages.k8s.forms.workload.storage.quantity.invalid':
    'Enter a valid quantity, e.g. 200Mi or 2Gi',
  'pages.k8s.forms.workload.storage.quantity.placeholder': 'e.g. 200Mi or 2Gi',
  'pages.k8s.forms.workload.storage.pvcPrefix': 'PVC name prefix',
  'pages.k8s.forms.workload.storage.pvcPrefix.tip':
    'Prefix of the persistent volume claim name. It may only contain lowercase letters, digits and hyphens (-), must start and end with a lowercase letter or digit, and be at most 253 characters',
  'pages.k8s.forms.workload.storage.pvcPrefix.required':
    'Please enter a PVC name prefix',
  'pages.k8s.forms.workload.storage.pvcPrefix.maxLength':
    'PVC name prefix must be at most 253 characters',
  'pages.k8s.forms.workload.storage.pvcPrefix.pattern':
    'PVC name prefix may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.workload.storage.storageClass.tip':
    'Select a storage class to provision a specific kind of volume',
  'pages.k8s.forms.workload.storage.storageClass.required':
    'Please select a storage class',
  'pages.k8s.forms.workload.storage.storageClass.empty':
    'No storage classes available',
  'pages.k8s.forms.workload.storage.accessMode.tip':
    'Select one or more access modes supported by the storage class',
  'pages.k8s.forms.workload.storage.volumeCapacity': 'Volume capacity',
  'pages.k8s.forms.workload.storage.volumeCapacity.required':
    'Please enter a volume capacity',
  'pages.k8s.forms.workload.storage.subPath.title': 'Set sub path',
  'pages.k8s.forms.workload.storage.subPath.description':
    'Specify the sub path of the volume to mount into the container.',
  'pages.k8s.forms.workload.storage.subPath': 'Sub path',
  'pages.k8s.forms.workload.storage.containersFirst': 'Add a container first',
  'pages.k8s.forms.workload.storage.mountPath': 'Mount path',
  'pages.k8s.forms.workload.storage.key.required': 'Please select a key',
  'pages.k8s.forms.workload.storage.path.required': 'Please enter a path',
  'pages.k8s.forms.workload.storage.relativePath.required':
    'Please use a relative path.',
  'pages.k8s.forms.workload.storage.relativePath': 'Relative path',
  'pages.k8s.forms.workload.storage.keyPath.delete': 'Remove key mapping',
  'pages.k8s.forms.workload.storage.specificKeys': 'Select specific keys',
  'pages.k8s.forms.workload.storage.specificKeys.description':
    'Select the specific keys to mount into the container',
  'pages.k8s.forms.workload.storage.volumeType': 'Volume type',
  'pages.k8s.forms.workload.storage.volumeTypeOf': 'Volume type: {type}',
  'pages.k8s.forms.workload.storage.mount.readWrite': ' (read-write)',
  'pages.k8s.forms.workload.storage.mount.subPath': '· Sub path: {subPath}',
  'pages.k8s.forms.workload.storage.delete': 'Remove storage configuration',
  'pages.k8s.forms.workload.storage.edit': 'Edit storage configuration',
  'pages.k8s.forms.job.title': 'Create job',
  'pages.k8s.forms.job.step.strategy': 'Strategy settings',
  'pages.k8s.forms.job.restartPolicy': 'Restart policy',
  'pages.k8s.forms.job.restartPolicy.required':
    'Please select a restart policy',
  'pages.k8s.forms.job.restartPolicy.never': 'Recreate pod',
  'pages.k8s.forms.job.restartPolicy.onFailure': 'Restart container',
  'pages.k8s.forms.job.backoffLimit': 'Max retries',
  'pages.k8s.forms.job.backoffLimit.extra':
    'Maximum number of retries before the job is marked as failed. Defaults to 6.',
  'pages.k8s.forms.job.backoffLimit.placeholder':
    'Please enter the max retries',
  'pages.k8s.forms.job.completions': 'Completions',
  'pages.k8s.forms.job.completions.extra':
    'Number of pods that must succeed before the job is marked as complete.',
  'pages.k8s.forms.job.completions.placeholder':
    'Please enter the number of completions',
  'pages.k8s.forms.job.parallelism': 'Parallelism',
  'pages.k8s.forms.job.parallelism.extra':
    'Number of pods that run in parallel.',
  'pages.k8s.forms.job.parallelism.placeholder': 'Please enter the parallelism',
  'pages.k8s.forms.job.activeDeadlineSeconds': 'Active deadline (s)',
  'pages.k8s.forms.job.activeDeadlineSeconds.extra':
    'Maximum running time of the job. The job is terminated once it is reached.',
  'pages.k8s.forms.job.activeDeadlineSeconds.placeholder':
    'Please enter the active deadline',
  'pages.k8s.forms.cronjob.title': 'Create cron job',
  'pages.k8s.forms.cronjob.project': 'Project',
  'pages.k8s.forms.cronjob.project.tip':
    'Projects group resources and control which users can manage them',
  'pages.k8s.forms.cronjob.schedule': 'Schedule',
  'pages.k8s.forms.cronjob.schedule.tip':
    'Schedule of the cron job. Kubernetes interprets it in the time zone configured on the CronJob',
  'pages.k8s.forms.cronjob.schedule.required':
    'Please select or enter a schedule',
  'pages.k8s.forms.cronjob.schedule.invalid':
    'Enter a valid cron expression, e.g. */5 * * * * or @hourly',
  'pages.k8s.forms.cronjob.schedule.placeholder':
    'Select or enter a cron expression, e.g. */5 * * * *',
  'pages.k8s.forms.cronjob.schedule.quickPick': '{label} ({value})',
  'pages.k8s.forms.cronjob.schedule.everyMinute': 'Every minute',
  'pages.k8s.forms.cronjob.schedule.every5Minutes': 'Every 5 minutes',
  'pages.k8s.forms.cronjob.schedule.hourly': 'Hourly',
  'pages.k8s.forms.cronjob.schedule.daily': 'Daily',
  'pages.k8s.forms.cronjob.schedule.weekly': 'Weekly',
  'pages.k8s.forms.cronjob.startingDeadline': 'Starting deadline (s)',
  'pages.k8s.forms.cronjob.startingDeadline.tip':
    'Maximum delay allowed for starting the job if it misses its scheduled time for any reason',
  'pages.k8s.forms.cronjob.startingDeadline.placeholder':
    'Please enter the starting deadline',
  'pages.k8s.forms.cronjob.successfulHistory': 'Successful jobs to keep',
  'pages.k8s.forms.cronjob.successfulHistory.tip':
    'Number of successful jobs to keep. Defaults to 3',
  'pages.k8s.forms.cronjob.successfulHistory.placeholder':
    'Please enter the number of successful jobs to keep',
  'pages.k8s.forms.cronjob.failedHistory': 'Failed jobs to keep',
  'pages.k8s.forms.cronjob.failedHistory.tip':
    'Number of failed jobs to keep. Defaults to 1',
  'pages.k8s.forms.cronjob.failedHistory.placeholder':
    'Please enter the number of failed jobs to keep',
  'pages.k8s.forms.cronjob.concurrency.tip':
    'What to do when jobs created by the cron job overlap',
  'pages.k8s.forms.cronjob.concurrency.required':
    'Please select a concurrency policy',
  'pages.k8s.forms.cronjob.concurrency.allow': 'Allow concurrent runs',
  'pages.k8s.forms.cronjob.concurrency.forbid': 'Skip new job',
  'pages.k8s.forms.cronjob.concurrency.replace': 'Replace old job',
  'pages.k8s.forms.cronjob.timeZone': 'Time zone',
  'pages.k8s.forms.cronjob.timeZone.tip':
    'Maps to spec.timeZone of the Kubernetes CronJob. If empty, the cluster controller uses its default time zone',
  'pages.k8s.forms.cronjob.timeZone.placeholder': 'e.g. Asia/Shanghai',
  'pages.k8s.forms.shared.input.placeholder': 'Please enter',
  'pages.k8s.forms.shared.prevStep': 'Previous',
  'pages.k8s.forms.shared.nextStep': 'Next',
  'pages.k8s.forms.shared.toggleYamlMode': 'Toggle YAML editing mode',
  'pages.k8s.forms.shared.metadata.description':
    'Add labels and annotations to the resource (optional)',
  'pages.k8s.forms.editRegistry.serviceSettings': 'Edit service settings',
  'pages.k8s.forms.editRegistry.serviceExternalAccess': 'Edit external access',
  'pages.k8s.forms.editRegistry.ingressRules': 'Edit routing rules',
  'pages.k8s.forms.editRegistry.ingressAnnotations': 'Edit annotations',
  'pages.k8s.forms.editRegistry.pvcExpand': 'Expand',
  'pages.k8s.forms.editRegistry.pvcClone': 'Clone',
  'pages.k8s.forms.editRegistry.storageClassDefault': 'Set or unset default',
  'pages.k8s.forms.editRegistry.storageClassExpansion':
    'Allow volume expansion',
  'pages.k8s.forms.serviceaccount.title': 'Create service account',
  'pages.k8s.forms.serviceaccount.name.length':
    'Name must be 1 to 63 characters',
  'pages.k8s.forms.serviceaccount.name.pattern':
    'Name may only contain lowercase letters, digits and hyphens, and must not start or end with a hyphen',
  'pages.k8s.forms.serviceaccount.metadata.keyRequired':
    'Please enter the key for {title}',
  'pages.k8s.forms.serviceaccount.metadata.keyDuplicate':
    '{title} keys must be unique',
  'pages.k8s.forms.serviceaccount.imagePullSecrets': 'Image pull secrets',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.extra':
    'Pods using this service account pull images with these secrets by default. You can type a name directly.',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.placeholder':
    'Select or enter a secret name',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.invalid':
    'Invalid image pull secret name: {name}',
  'pages.k8s.forms.hpa.title': 'Create horizontal pod autoscaler',
  'pages.k8s.forms.hpa.step.target': 'Scale target',
  'pages.k8s.forms.hpa.step.metrics': 'Scaling metrics',
  'pages.k8s.forms.hpa.step.behavior': 'Behavior',
  'pages.k8s.forms.hpa.metadata.description': 'Add metadata to the autoscaler',
  'pages.k8s.forms.hpa.error.metricLabel': 'Metric {index}',
  'pages.k8s.forms.hpa.error.resourceName':
    '{label}: please select a resource name',
  'pages.k8s.forms.hpa.error.container':
    '{label}: please enter a container name',
  'pages.k8s.forms.hpa.error.metricName': '{label}: please enter a metric name',
  'pages.k8s.forms.hpa.error.describedObject':
    '{label}: please fill in the object API version, kind and name',
  'pages.k8s.forms.hpa.error.averageUtilization':
    '{label}: please enter an average utilization',
  'pages.k8s.forms.hpa.error.averageValue':
    '{label}: please enter an average target value',
  'pages.k8s.forms.hpa.error.value': '{label}: please enter a target value',
  'pages.k8s.forms.hpa.error.nameNamespace':
    'Please fill in the name and namespace',
  'pages.k8s.forms.hpa.error.target':
    'Please fill in the scale target completely',
  'pages.k8s.forms.hpa.error.policiesRequired':
    '{label}: add at least one scaling policy',
  'pages.k8s.forms.hpa.errorSeparator': ', ',
  'pages.k8s.forms.hpa.target.pick': 'Select workload',
  'pages.k8s.forms.hpa.target.pick.description':
    'Select the workload in the current namespace whose replicas the HPA manages.',
  'pages.k8s.forms.hpa.target.repick': 'Change',
  'pages.k8s.forms.hpa.target.namespaceFirst': 'Select a namespace first',
  'pages.k8s.forms.hpa.target.description':
    'Pick a workload from the current namespace to fill in automatically, or enter any other object that implements the scale subresource.',
  'pages.k8s.forms.hpa.target.workload': 'Target workload',
  'pages.k8s.forms.hpa.target.hint':
    'Select a workload in the same namespace that the HPA can reference; its name is written to scaleTargetRef.',
  'pages.k8s.forms.hpa.targetType': 'Target type',
  'pages.k8s.forms.hpa.targetType.required': 'Please select a target type',
  'pages.k8s.forms.hpa.targetName': 'Target name',
  'pages.k8s.forms.hpa.targetName.required': 'Please enter a target name',
  'pages.k8s.forms.hpa.targetApiVersion': 'Target API version',
  'pages.k8s.forms.hpa.targetApiVersion.required':
    'Please enter the target API version',
  'pages.k8s.forms.hpa.targetApiVersion.tooltip':
    'Filled in automatically when you select a workload; adjust it manually when referencing another object that implements the scale subresource.',
  'pages.k8s.forms.hpa.apiVersion.placeholder': 'e.g. apps/v1',
  'pages.k8s.forms.hpa.metricType': 'Metric type',
  'pages.k8s.forms.hpa.metricType.required': 'Please select a metric type',
  'pages.k8s.forms.hpa.metricType.Resource': 'Resource',
  'pages.k8s.forms.hpa.metricType.ContainerResource': 'Container resource',
  'pages.k8s.forms.hpa.metricType.Pods': 'Pods',
  'pages.k8s.forms.hpa.metricType.Object': 'Object',
  'pages.k8s.forms.hpa.metricType.External': 'External',
  'pages.k8s.forms.hpa.metricType.Resource.description':
    'Scale based on CPU or memory usage of the pods.',
  'pages.k8s.forms.hpa.metricType.ContainerResource.description':
    'Scale based on CPU or memory usage of a specific container.',
  'pages.k8s.forms.hpa.metricType.Pods.description':
    'Scale based on the average of a custom metric reported by each pod.',
  'pages.k8s.forms.hpa.metricType.Object.description':
    'Scale based on a metric of a specific Kubernetes object.',
  'pages.k8s.forms.hpa.metricType.External.description':
    'Scale based on a metric provided by a system outside the cluster.',
  'pages.k8s.forms.hpa.metric': 'Metric',
  'pages.k8s.forms.hpa.metric.title': 'Metric {index} · {type}',
  'pages.k8s.forms.hpa.metric.description.empty':
    'Choose a metric source, then configure the target.',
  'pages.k8s.forms.hpa.metric.delete': 'Remove metric',
  'pages.k8s.forms.hpa.metric.add': 'Add metric',
  'pages.k8s.forms.hpa.metrics.description':
    'Configure at least one metric. Each source maps to the resource, containerResource, pods, object or external field.',
  'pages.k8s.forms.hpa.metrics.required': 'Add at least one scaling metric',
  'pages.k8s.forms.hpa.containerName': 'Container name',
  'pages.k8s.forms.hpa.containerName.required': 'Please enter a container name',
  'pages.k8s.forms.hpa.containerName.placeholder': 'e.g. nginx',
  'pages.k8s.forms.hpa.resourceName': 'Resource name',
  'pages.k8s.forms.hpa.resourceName.required': 'Please select a resource name',
  'pages.k8s.forms.hpa.metricName': 'Metric name',
  'pages.k8s.forms.hpa.metricName.required': 'Please enter a metric name',
  'pages.k8s.forms.hpa.metricName.placeholder': 'e.g. requests_per_second',
  'pages.k8s.forms.hpa.objectApiVersion': 'Object API version',
  'pages.k8s.forms.hpa.objectApiVersion.required':
    'Please enter the object API version',
  'pages.k8s.forms.hpa.objectKind.required': 'Please enter the object kind',
  'pages.k8s.forms.hpa.objectKind.placeholder': 'e.g. Deployment',
  'pages.k8s.forms.hpa.objectName.required': 'Please enter the object name',
  'pages.k8s.forms.hpa.targetType.Utilization': 'Average utilization',
  'pages.k8s.forms.hpa.targetType.AverageValue': 'Average value',
  'pages.k8s.forms.hpa.targetType.Value': 'Value',
  'pages.k8s.forms.hpa.targetValue.required': 'Please enter a target value',
  'pages.k8s.forms.hpa.averageUtilization.required':
    'Please enter an average utilization',
  'pages.k8s.forms.hpa.averageUtilization.range':
    'Average utilization must be between 1 and 100',
  'pages.k8s.forms.hpa.averageValue': 'Average target value',
  'pages.k8s.forms.hpa.averageValue.placeholder': 'e.g. 500m / 512Mi / 100',
  'pages.k8s.forms.hpa.value': 'Target value',
  'pages.k8s.forms.hpa.value.placeholder': 'e.g. 100',
  'pages.k8s.forms.hpa.selector': 'Metric selector',
  'pages.k8s.forms.hpa.selector.description':
    'Optional. Leave empty to match any metric labels; written to metric.selector.',
  'pages.k8s.forms.hpa.selector.addLabel': 'Add label',
  'pages.k8s.forms.hpa.selector.deleteLabel': 'Remove metric label',
  'pages.k8s.forms.hpa.selector.expressionKey': 'Expression key',
  'pages.k8s.forms.hpa.selector.expressionKey.required':
    'Please enter an expression key',
  'pages.k8s.forms.hpa.selector.operator': 'Operator',
  'pages.k8s.forms.hpa.selector.operator.required': 'Please select an operator',
  'pages.k8s.forms.hpa.selector.values.required':
    'Please enter values to match',
  'pages.k8s.forms.hpa.selector.values.placeholder':
    'Separate multiple values with commas or new lines',
  'pages.k8s.forms.hpa.selector.deleteExpression': 'Remove metric expression',
  'pages.k8s.forms.hpa.selector.addExpression': 'Add expression',
  'pages.k8s.forms.hpa.replicas': 'Replica range',
  'pages.k8s.forms.hpa.replicas.description':
    'Set the minimum and maximum replica counts the HPA may use.',
  'pages.k8s.forms.hpa.replicas.tooltip':
    'maxReplicas is required; when minReplicas is empty Kubernetes defaults it to 1.',
  'pages.k8s.forms.hpa.minReplicas': 'Minimum replicas',
  'pages.k8s.forms.hpa.minReplicas.min': 'Minimum replicas must be at least 1',
  'pages.k8s.forms.hpa.minReplicas.aboveMax':
    'Minimum replicas cannot exceed maximum replicas',
  'pages.k8s.forms.hpa.minReplicas.placeholder':
    'Please enter the minimum replicas',
  'pages.k8s.forms.hpa.maxReplicas': 'Maximum replicas',
  'pages.k8s.forms.hpa.maxReplicas.required':
    'Please enter the maximum replicas',
  'pages.k8s.forms.hpa.maxReplicas.min': 'Maximum replicas must be at least 1',
  'pages.k8s.forms.hpa.maxReplicas.belowMin':
    'Maximum replicas cannot be less than minimum replicas',
  'pages.k8s.forms.hpa.behavior': 'Scaling behavior',
  'pages.k8s.forms.hpa.behavior.params': 'Scaling parameters',
  'pages.k8s.forms.hpa.behavior.selectPolicy': 'Select policy',
  'pages.k8s.forms.hpa.behavior.stabilizationWindow': 'Stabilization window',
  'pages.k8s.forms.hpa.behavior.stabilizationWindow.range':
    'Stabilization window must be between 0 and 3600 seconds',
  'pages.k8s.forms.hpa.behavior.seconds': 'Seconds',
  'pages.k8s.forms.hpa.behavior.tolerance': 'Tolerance',
  'pages.k8s.forms.hpa.behavior.tolerance.tooltip':
    'Written to behavior.scaleUp/scaleDown.tolerance, for example 0.1.',
  'pages.k8s.forms.hpa.behavior.tolerance.placeholder': 'Optional, e.g. 0.1',
  'pages.k8s.forms.hpa.behavior.policies': 'Scaling policies',
  'pages.k8s.forms.hpa.scaleUp': 'Scale-up policy',
  'pages.k8s.forms.hpa.scaleUp.description':
    'Controls the select policy, stabilization window and rate of change when replicas increase.',
  'pages.k8s.forms.hpa.scaleDown': 'Scale-down policy',
  'pages.k8s.forms.hpa.scaleDown.description':
    'Controls the select policy, stabilization window and rate of change when replicas decrease.',
  'pages.k8s.forms.hpa.policy.percent': 'Percent',
  'pages.k8s.forms.hpa.policy.type': 'Policy type',
  'pages.k8s.forms.hpa.policy.type.required': 'Please select a policy type',
  'pages.k8s.forms.hpa.policy.value': 'Policy value',
  'pages.k8s.forms.hpa.policy.value.required': 'Please enter a policy value',
  'pages.k8s.forms.hpa.policy.value.min': 'Policy value must be at least 1',
  'pages.k8s.forms.hpa.policy.period': 'Period (seconds)',
  'pages.k8s.forms.hpa.policy.period.required':
    'Please enter the period in seconds',
  'pages.k8s.forms.hpa.policy.period.range':
    'Period must be between 1 and 1800 seconds',
  'pages.k8s.forms.hpa.policy.required': 'Add at least one scaling policy',
  'pages.k8s.forms.hpa.policy.delete': 'Remove scaling policy',
  'pages.k8s.forms.hpa.policy.add': 'Add policy',
  'pages.k8s.forms.binding.title': 'Create {kind}',
  'pages.k8s.forms.binding.roleRef': 'Role reference',
  'pages.k8s.forms.binding.subjects': 'Subjects',
  'pages.k8s.forms.binding.name.tooltip':
    'Name may only contain lowercase letters, digits, hyphens (-) and dots (.)',
  'pages.k8s.forms.binding.name.pattern':
    'Name may only contain lowercase letters, digits, hyphens (-) and dots (.), and must not start or end with a hyphen or dot',
  'pages.k8s.forms.binding.namespace.notNeeded':
    'ClusterRoleBinding does not need a namespace',
  'pages.k8s.forms.binding.namespaceFirst': 'Select a namespace first',
  'pages.k8s.forms.binding.roleKind': 'Referenced role type',
  'pages.k8s.forms.binding.roleKind.required':
    'Please select the referenced role type',
  'pages.k8s.forms.binding.roleKind.clusterOnly':
    'A ClusterRoleBinding can only bind a ClusterRole',
  'pages.k8s.forms.binding.roleKind.hint':
    'A RoleBinding can bind a Role in the same namespace or a cluster-wide ClusterRole',
  'pages.k8s.forms.binding.roleName.extra':
    'The referenced role cannot be changed after creation; you may reference a role that does not exist yet.',
  'pages.k8s.forms.binding.roleName.required':
    'Please select a role to reference',
  'pages.k8s.forms.binding.roleName.empty': 'No roles available',
  'pages.k8s.forms.binding.roleName.placeholder.role':
    'Select a Role in the same namespace',
  'pages.k8s.forms.binding.roleName.placeholder.clusterRole':
    'Select a ClusterRole',
  'pages.k8s.forms.binding.subject.placeholder.serviceAccount':
    'Select or enter a ServiceAccount',
  'pages.k8s.forms.binding.subject.placeholder.user':
    'Username, for example reborn:<user ID>',
  'pages.k8s.forms.binding.subject.placeholder.group':
    'Group name, for example reborn:role:<role ID>',
  'pages.k8s.forms.binding.subject.name.required':
    'Please enter the subject name',
  'pages.k8s.forms.binding.subject.name.maxLength':
    'Subject name must be at most 253 characters',
  'pages.k8s.forms.binding.subject.empty': 'No subjects available',
  'pages.k8s.forms.binding.subject.namespace.notNeeded':
    'User/Group does not need a namespace',
  'pages.k8s.forms.binding.subject.hint.intro':
    'Enter User and Group names directly. When accessing the cluster, this platform impersonates the user',
  'pages.k8s.forms.binding.subject.hint.userPattern': 'reborn:<user ID>',
  'pages.k8s.forms.binding.subject.hint.roleGroup': ' and the role group',
  'pages.k8s.forms.binding.subject.hint.rolePattern': 'reborn:role:<role ID>',
  'pages.k8s.forms.binding.subject.hint.outro':
    '; use this format when granting access to platform users or roles.',
  'pages.k8s.forms.binding.subject.kind.placeholder': 'Subject type',
  'pages.k8s.forms.binding.subject.delete': 'Remove subject',
  'pages.k8s.forms.binding.subject.add': 'Add subject',
  'pages.k8s.forms.binding.metadata.description':
    'Add labels and annotations to the binding for filtering, identification and automation',
  'pages.k8s.forms.binding.annotationKey': 'Annotation key',
  'pages.k8s.forms.binding.annotationValue': 'Annotation value',
  'pages.k8s.forms.binding.subjects.required': 'Add at least one subject',
  'pages.k8s.forms.binding.subjects.kindRequired':
    'Subject {index} needs a type',
  'pages.k8s.forms.binding.subjects.nameRequired':
    'Subject {index} needs a name',
  'pages.k8s.forms.binding.subjects.namespaceRequired':
    'Subject {index} needs a namespace',
  'pages.k8s.forms.binding.yaml.kind':
    'YAML kind must be RoleBinding or ClusterRoleBinding',
  'pages.k8s.forms.binding.yaml.namespaceRequired':
    'RoleBinding YAML must include metadata.namespace',
  'pages.k8s.forms.binding.yaml.namespaceForbidden':
    'ClusterRoleBinding YAML must not include metadata.namespace',
  'pages.k8s.forms.binding.yaml.roleRefRequired':
    'YAML must include roleRef.kind, roleRef.name and roleRef.apiGroup',
  'pages.k8s.forms.binding.yaml.roleRefApiGroup':
    'YAML roleRef.apiGroup must be {apiGroup}',
  'pages.k8s.forms.binding.yaml.clusterRoleOnly':
    'A ClusterRoleBinding can only reference a ClusterRole',
  'pages.k8s.forms.binding.yaml.roleKind':
    'A RoleBinding can only reference a Role or a ClusterRole',
  'pages.k8s.forms.binding.yaml.subjectsRequired':
    'YAML must include at least one subjects entry',
  'pages.k8s.forms.binding.yaml.subjectInvalid':
    'YAML subjects[{index}] must include kind and name; a ServiceAccount also needs namespace',
  'pages.k8s.forms.role.title': 'Create {kind}',
  'pages.k8s.forms.role.rules': 'Policy rules',
  'pages.k8s.forms.role.name.tooltip':
    'Name may only contain lowercase letters, digits, hyphens (-) and dots (.)',
  'pages.k8s.forms.role.name.pattern':
    'Name may only contain lowercase letters, digits, hyphens (-) and dots (.), and must not start or end with a hyphen or dot',
  'pages.k8s.forms.role.namespace.notNeeded':
    'ClusterRole does not need a namespace',
  'pages.k8s.forms.role.selector.operator': 'Operator',
  'pages.k8s.forms.role.selector.deleteExpression': 'Remove match expression',
  'pages.k8s.forms.role.selector.addExpression': 'Add match expression',
  'pages.k8s.forms.role.aggregation': 'Aggregation rule',
  'pages.k8s.forms.role.aggregation.enable': 'Aggregate ClusterRoles',
  'pages.k8s.forms.role.aggregation.description':
    'Aggregate the rules of other ClusterRoles by label selector; useful for combining fine-grained roles',
  'pages.k8s.forms.role.aggregation.labels': 'Aggregation label selector',
  'pages.k8s.forms.role.aggregation.deleteLabel': 'Remove match label',
  'pages.k8s.forms.role.aggregation.labelKeyFirst':
    'Fill in the key of the existing match label first.',
  'pages.k8s.forms.role.aggregation.expressions':
    'Aggregation match expressions',
  'pages.k8s.forms.role.aggregation.selectorRequired':
    'Configure at least one label selector for the aggregation rule',
  'pages.k8s.forms.role.aggregation.expressionInvalid':
    'Aggregation match expression {index} needs an operator; In/NotIn also need label values',
  'pages.k8s.forms.role.metadata.description':
    'Add labels and annotations to the role for filtering, identification and automation',
  'pages.k8s.forms.role.annotationKey': 'Annotation key',
  'pages.k8s.forms.role.annotationValue': 'Annotation value',
  'pages.k8s.forms.role.rule.mode.resource': 'Resource permissions',
  'pages.k8s.forms.role.rule.mode.nonResource':
    'Non-resource URLs (ClusterRole only)',
  'pages.k8s.forms.role.rule.title': 'Rule {index}',
  'pages.k8s.forms.role.rule.description':
    'Configure API groups, resource scope and allowed verbs',
  'pages.k8s.forms.role.rule.delete': 'Remove rule',
  'pages.k8s.forms.role.rule.mode': 'Rule type',
  'pages.k8s.forms.role.rule.mode.required': 'Please select a rule type',
  'pages.k8s.forms.role.rule.nonResource.unsupported':
    'Non-resource URL permissions only apply to ClusterRole; switch to resource permissions or remove this rule.',
  'pages.k8s.forms.role.rule.nonResourceURLs': 'Non-resource URLs',
  'pages.k8s.forms.role.rule.nonResourceURLs.required':
    'Please enter a non-resource URL',
  'pages.k8s.forms.role.rule.nonResourceURLs.placeholder': '/healthz or /api/*',
  'pages.k8s.forms.role.rule.verbs': 'Verbs',
  'pages.k8s.forms.role.rule.verbs.required': 'Please select verbs',
  'pages.k8s.forms.role.rule.apiGroups': 'API groups',
  'pages.k8s.forms.role.rule.apiGroups.required': 'Please select API groups',
  'pages.k8s.forms.role.rule.apiGroups.placeholder': 'core, apps or *',
  'pages.k8s.forms.role.rule.resources': 'Resources',
  'pages.k8s.forms.role.rule.resources.required': 'Please select resources',
  'pages.k8s.forms.role.rule.resources.placeholder': 'pods, deployments or *',
  'pages.k8s.forms.role.rule.resourceNames': 'Resource names',
  'pages.k8s.forms.role.rule.resourceNames.tooltip':
    'Leave empty to match all objects of the resource type',
  'pages.k8s.forms.role.rule.add': 'Add rule',
  'pages.k8s.forms.role.rule.add.description':
    'Configure another API access scope and its allowed verbs',
  'pages.k8s.forms.role.rules.required': 'Add at least one rule',
  'pages.k8s.forms.role.rules.verbsRequired': 'Rule {index} needs verbs',
  'pages.k8s.forms.role.rules.nonResourceClusterOnly':
    'Non-resource URL permissions only apply to ClusterRole',
  'pages.k8s.forms.role.rules.nonResourceURLsRequired':
    'Rule {index} needs non-resource URLs',
  'pages.k8s.forms.role.rules.apiGroupsRequired':
    'Rule {index} needs API groups',
  'pages.k8s.forms.role.rules.resourcesRequired':
    'Rule {index} needs resources',
  'pages.k8s.forms.role.yaml.kind': 'YAML kind must be Role or ClusterRole',
  'pages.k8s.forms.role.yaml.namespaceRequired':
    'Role YAML must include metadata.namespace',
  'pages.k8s.forms.role.yaml.namespaceForbidden':
    'ClusterRole YAML must not include metadata.namespace',
  'pages.k8s.forms.role.yaml.rulesRequired':
    'YAML must include at least one rules entry',
  'pages.k8s.forms.role.yaml.ruleInvalid':
    'YAML rules[{index}] must include verbs; resource rules need apiGroups and resources; exactly one of resources or nonResourceURLs must be set (nonResourceURLs only applies to ClusterRole)',
  'pages.k8s.forms.role.risk.level.critical': 'Critical',
  'pages.k8s.forms.role.risk.level.high': 'High',
  'pages.k8s.forms.role.risk.level.medium': 'Medium',
  'pages.k8s.forms.role.risk.level.none': 'None',
  'pages.k8s.forms.role.risk.reason.all':
    'Full access to all API groups, resources and verbs',
  'pages.k8s.forms.role.risk.reason.writeSecret': 'Can write Secrets',
  'pages.k8s.forms.role.risk.reason.readSecret': 'Can read Secrets',
  'pages.k8s.forms.role.risk.reason.writeRbac': 'Can modify RBAC resources',
  'pages.k8s.forms.role.risk.reason.podAccess':
    'Can exec into or port-forward to Pods',
  'pages.k8s.forms.role.risk.reason.impersonate':
    'Can impersonate other subjects',
  'pages.k8s.forms.role.risk.reason.wildcard': 'Contains wildcard permissions',
  'pages.k8s.forms.role.risk.reason.clusterAdmin': 'Binds cluster-admin',
  'pages.k8s.forms.role.risk.reason.broadGroup':
    'Grants access to the broad system group {name}',
  'pages.k8s.forms.endpointslice.title': 'Create endpoint slice',
  'pages.k8s.forms.endpointslice.step.endpoints': 'Endpoint settings',
  'pages.k8s.forms.endpointslice.step.ports': 'Port settings',
  'pages.k8s.forms.endpointslice.status.endpointCount': '{count} endpoints',
  'pages.k8s.forms.endpointslice.status.portCount': '{count} ports',
  'pages.k8s.forms.endpointslice.status.metadataCount':
    '{count} metadata entries',
  'pages.k8s.forms.endpointslice.namespace.tooltip':
    'Endpoint slices are namespace-scoped resources.',
  'pages.k8s.forms.endpointslice.serviceName': 'Associated service',
  'pages.k8s.forms.endpointslice.serviceName.tooltip':
    'Written to metadata.labels.kubernetes.io/service-name automatically. Pick a service from the selected namespace or type a name.',
  'pages.k8s.forms.endpointslice.serviceName.required':
    'Please select or enter the associated service',
  'pages.k8s.forms.endpointslice.serviceName.maxLength':
    'Service name must be at most 63 characters',
  'pages.k8s.forms.endpointslice.serviceName.pattern':
    'Service name may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.endpointslice.serviceName.placeholder':
    'Select or enter a service name',
  'pages.k8s.forms.endpointslice.addressType': 'Address type',
  'pages.k8s.forms.endpointslice.addressType.tooltip':
    'Must match the format of the endpoint addresses.',
  'pages.k8s.forms.endpointslice.addressType.required':
    'Please select an address type',
  'pages.k8s.forms.endpointslice.validation.endpoints.required':
    'Add at least one endpoint',
  'pages.k8s.forms.endpointslice.validation.endpoint.addressRequired':
    'Endpoint {index} needs at least one address',
  'pages.k8s.forms.endpointslice.validation.endpoint.addressMismatch':
    'Address {address} of endpoint {index} does not match address type {addressType}',
  'pages.k8s.forms.endpointslice.validation.port.nameDuplicate':
    'Port {index} has a duplicate name',
  'pages.k8s.forms.endpointslice.validation.port.range':
    'Port {index} must be between 1 and 65535',
  'pages.k8s.forms.endpointslice.validation.name.invalid':
    'Name may only contain lowercase letters, digits and hyphens (-), must not start or end with a hyphen, and be at most 63 characters',
  'pages.k8s.forms.endpointslice.validation.serviceName.invalid':
    'Service name may only contain lowercase letters, digits and hyphens (-), must not start or end with a hyphen, and be at most 63 characters',
  'pages.k8s.forms.endpointslice.yaml.endpoint.notObject':
    'YAML endpoints[{index}] must be an object',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotArray':
    'YAML endpoints[{index}].addresses must be an array of strings',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotStrings':
    'YAML endpoints[{index}].addresses must all be non-empty strings',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesEmpty':
    'YAML endpoints[{index}].addresses must contain at least one address',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressMismatch':
    'Address {address} in YAML endpoints[{index}] does not match address type {addressType}',
  'pages.k8s.forms.endpointslice.yaml.ports.notArray':
    'YAML ports must be an array',
  'pages.k8s.forms.endpointslice.yaml.port.notObject':
    'YAML ports[{index}] must be an object',
  'pages.k8s.forms.endpointslice.yaml.port.protocolInvalid':
    'YAML ports[{index}].protocol must be SCTP, TCP or UDP',
  'pages.k8s.forms.endpointslice.yaml.port.portInvalid':
    'YAML ports[{index}].port must be an integer between 1 and 65535',
  'pages.k8s.forms.endpointslice.yaml.port.nameNotString':
    'YAML ports[{index}].name must be a string',
  'pages.k8s.forms.endpointslice.yaml.port.nameInvalid':
    'YAML ports[{index}].name may only contain lowercase letters, digits and hyphens (-), and be at most 15 characters',
  'pages.k8s.forms.endpointslice.yaml.port.nameDuplicate':
    'YAML ports[{index}].name must be unique',
  'pages.k8s.forms.endpointslice.yaml.port.appProtocolNotString':
    'YAML ports[{index}].appProtocol must be a string',
  'pages.k8s.forms.endpointslice.yaml.serviceLabelRequired':
    'YAML must include metadata.labels.{label}',
  'pages.k8s.forms.endpointslice.yaml.addressTypeInvalid':
    'YAML addressType must be FQDN, IPv4 or IPv6',
  'pages.k8s.forms.endpointslice.yaml.endpointsRequired':
    'YAML endpoints must contain at least one endpoint',
  'pages.k8s.forms.endpointslice.example': 'e.g. {value}',
  'pages.k8s.forms.endpointslice.condition.unset': 'Omit',
  'pages.k8s.forms.endpointslice.endpoints': 'Endpoints',
  'pages.k8s.forms.endpointslice.endpoints.description':
    'Enter at least one endpoint address matching the address type.',
  'pages.k8s.forms.endpointslice.endpoints.addressRequired':
    'Add at least one endpoint address',
  'pages.k8s.forms.endpointslice.endpoint.title': 'Endpoint {index}',
  'pages.k8s.forms.endpointslice.endpoint.delete': 'Remove endpoint',
  'pages.k8s.forms.endpointslice.endpoint.addresses': 'Addresses',
  'pages.k8s.forms.endpointslice.endpoint.addresses.extra':
    'Must be a valid IPv4, IPv6 or FQDN address.',
  'pages.k8s.forms.endpointslice.endpoint.addresses.add': 'Add address',
  'pages.k8s.forms.endpointslice.endpoint.addresses.delete': 'Remove address',
  'pages.k8s.forms.endpointslice.endpoint.addresses.fillFirst':
    'Fill in the existing address first',
  'pages.k8s.forms.endpointslice.endpoint.location': 'Location',
  'pages.k8s.forms.endpointslice.endpoint.hostname': 'Hostname',
  'pages.k8s.forms.endpointslice.endpoint.hostname.maxLength':
    'Hostname must be at most 63 characters',
  'pages.k8s.forms.endpointslice.endpoint.nodeName': 'Node name',
  'pages.k8s.forms.endpointslice.endpoint.nodeName.maxLength':
    'Node name must be at most 253 characters',
  'pages.k8s.forms.endpointslice.endpoint.zone': 'Zone',
  'pages.k8s.forms.endpointslice.endpoint.zone.maxLength':
    'Zone must be at most 63 characters',
  'pages.k8s.forms.endpointslice.endpoint.advanced': 'Advanced endpoint fields',
  'pages.k8s.forms.endpointslice.endpoint.advanced.description':
    'Conditions, target reference and traffic hints.',
  'pages.k8s.forms.endpointslice.endpoint.conditions': 'Endpoint conditions',
  'pages.k8s.forms.endpointslice.endpoint.targetRef': 'Target reference',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion': 'API version',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion.maxLength':
    'API version must be at most 100 characters',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.kind.maxLength':
    'Kind must be at most 63 characters',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.namespace.maxLength':
    'Namespace must be at most 63 characters',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath': 'Field path',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath.maxLength':
    'Field path must be at most 250 characters',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion':
    'Resource version',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion.maxLength':
    'Resource version must be at most 100 characters',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.uid.maxLength':
    'UID must be at most 100 characters',
  'pages.k8s.forms.endpointslice.endpoint.hints': 'Traffic hints',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes': 'Node hints',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.add': 'Add node',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.delete': 'Remove node',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.fillFirst':
    'Fill in the existing node name first',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones': 'Zone hints',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.add': 'Add zone',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.delete': 'Remove zone',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.placeholder':
    'Zone name',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.fillFirst':
    'Fill in the existing zone name first',
  'pages.k8s.forms.endpointslice.endpoint.add': 'Add endpoint',
  'pages.k8s.forms.endpointslice.port.min': 'Port must be at least 1',
  'pages.k8s.forms.endpointslice.port.max': 'Port must be at most 65535',
  'pages.k8s.forms.endpointslice.ports.description':
    'Ports are optional; when set they are written to the ports array, and port names must be unique within this endpoint slice.',
  'pages.k8s.forms.endpointslice.port.name.maxLength':
    'Port name must be at most 15 characters',
  'pages.k8s.forms.endpointslice.port.name.pattern':
    'Port name may only contain lowercase letters, digits and hyphens (-)',
  'pages.k8s.forms.endpointslice.port.protocol': 'Protocol',
  'pages.k8s.forms.endpointslice.port.appProtocol': 'Application protocol',
  'pages.k8s.forms.endpointslice.port.appProtocol.tooltip':
    'For example http, kubernetes.io/h2c or a custom prefixed protocol.',
  'pages.k8s.forms.endpointslice.port.appProtocol.maxLength':
    'Application protocol must be at most 250 characters',
  'pages.k8s.forms.endpointslice.port.add': 'Add port',
  'pages.k8s.forms.endpointslice.metadata.description':
    'Add custom labels and annotations to the endpoint slice.',
  'pages.k8s.forms.service.title': 'Create service',
  'pages.k8s.forms.service.step.settings': 'Service settings',
  'pages.k8s.forms.service.namespace.invalid': 'Invalid namespace name',
  'pages.k8s.forms.service.validation.ports.required': 'Add at least one port',
  'pages.k8s.forms.service.validation.port.label': 'Port {index}',
  'pages.k8s.forms.service.validation.port.servicePortRequired':
    '{label}: please enter a service port',
  'pages.k8s.forms.service.validation.port.servicePortRange':
    '{label}: service port must be between 1 and 65535',
  'pages.k8s.forms.service.validation.port.containerPortRange':
    '{label}: container port must be between 1 and 65535',
  'pages.k8s.forms.service.validation.port.nameRequiredMultiple':
    '{label}: port name is required when there are multiple ports',
  'pages.k8s.forms.service.validation.port.nameMaxLength':
    '{label}: port name must be at most {max} characters',
  'pages.k8s.forms.service.validation.port.namePattern':
    '{label}: port name may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.service.validation.port.nameDuplicate':
    '{label}: duplicate port name {name}',
  'pages.k8s.forms.service.validation.port.servicePortDuplicate':
    '{label}: duplicate service port {key}',
  'pages.k8s.forms.service.validation.port.nodePortRange':
    '{label}: node port must be between {min} and {max}',
  'pages.k8s.forms.service.validation.port.nodePortDuplicate':
    '{label}: duplicate node port {key}',
  'pages.k8s.forms.service.validation.nameNamespaceRequired':
    'Please enter a name and namespace',
  'pages.k8s.forms.service.validation.selectorRequired':
    'Add at least one workload selector',
  'pages.k8s.forms.service.validation.headlessExternalAccess':
    'Internal DNS (headless) mode cannot be combined with external access',
  'pages.k8s.forms.service.example': 'e.g. {value}',
  'pages.k8s.forms.service.required': 'Required',
  'pages.k8s.forms.service.accessMode.clusterIP': 'Virtual IP address',
  'pages.k8s.forms.service.accessMode.clusterIP.description':
    'Assigns a virtual IP to the service so it can be reached inside the cluster through that IP.',
  'pages.k8s.forms.service.accessMode.headless': 'Internal DNS name',
  'pages.k8s.forms.service.accessMode.headless.description':
    'Assigns no IP to the service; it is reached inside the cluster through cluster DNS.',
  'pages.k8s.forms.service.port.protocol': 'Protocol',
  'pages.k8s.forms.service.port.protocol.tooltip':
    'Protocols such as HTTP/HTTPS are written to appProtocol on submit; the Kubernetes port protocol is derived as TCP/UDP/SCTP.',
  'pages.k8s.forms.service.port.name.maxLength':
    'Port name must be at most {max} characters',
  'pages.k8s.forms.service.port.name.pattern':
    'Port name may only contain lowercase letters, digits and hyphens (-), and must not start or end with a hyphen',
  'pages.k8s.forms.service.port.containerPort': 'Container port',
  'pages.k8s.forms.service.port.servicePort': 'Service port',
  'pages.k8s.forms.service.port.servicePort.required':
    'Please enter a service port',
  'pages.k8s.forms.service.port.add': 'Add port',
  'pages.k8s.forms.service.internalAccess': 'Internal access mode',
  'pages.k8s.forms.service.internalAccess.tooltip':
    'Choose how the service is addressed inside the cluster',
  'pages.k8s.forms.service.workloadSelector': 'Workload selection',
  'pages.k8s.forms.service.workloadSelector.tooltip':
    'Select workloads by label; service traffic is forwarded to the matching pods',
  'pages.k8s.forms.service.workloadSelector.add': 'Add selector',
  'pages.k8s.forms.service.workloadSelector.delete': 'Remove workload selector',
  'pages.k8s.forms.service.workloadSelector.pick': 'Choose workload',
  'pages.k8s.forms.service.workloadSelector.keyFirst':
    'Fill in the key of the existing workload selector first.',
  'pages.k8s.forms.service.workloadSelector.noMatch':
    'No workloads match the current selector.',
  'pages.k8s.forms.service.workloadSelector.noLabels':
    'Could not read labels from this workload; fill in the selector manually.',
  'pages.k8s.forms.service.workloadSelector.hint':
    'Use the labels of a workload as the selector.',
  'pages.k8s.forms.service.ports.tooltip':
    'Set service ports and target container ports; the port protocol is written to the service manifest',
  'pages.k8s.forms.service.nodePort': 'Node port',
  'pages.k8s.forms.service.nodePort.range':
    'Node port must be between {min} and {max}',
  'pages.k8s.forms.service.nodePort.duplicate': 'Duplicate node port {value}',
  'pages.k8s.forms.service.nodePort.ariaLabel':
    'Node port for service port {port}',
  'pages.k8s.forms.service.nodePort.auto': 'Auto-assigned',
  'pages.k8s.forms.service.nodePort.extra':
    'Optional. Range {min} to {max}; leave empty to let the cluster assign one.',
  'pages.k8s.forms.service.externalAccess': 'External access',
  'pages.k8s.forms.service.externalAccess.description':
    'Configure how the service is reached from outside the cluster.',
  'pages.k8s.forms.service.externalTrafficPolicy': 'External traffic policy',
  'pages.k8s.forms.service.externalTrafficPolicy.extra':
    'Local preserves the client source IP; Cluster forwards across the whole cluster.',
  'pages.k8s.forms.service.placeholder.clusterDefault': 'Cluster default',
  'pages.k8s.forms.service.loadBalancerClass.extra':
    'Specifies which load balancer implementation handles this Service.',
  'pages.k8s.forms.service.allocateNodePorts': 'Allocate NodePorts',
  'pages.k8s.forms.service.allocateNodePorts.checkbox':
    'Automatically allocate NodePorts for the LoadBalancer service',
  'pages.k8s.forms.service.networking': 'Networking',
  'pages.k8s.forms.service.networking.notice':
    'Kubernetes 1.35+ Service networking features',
  'pages.k8s.forms.service.networking.notice.dualStack':
    'Dual-stack clusters should set IP Family Policy and IP Families explicitly.',
  'pages.k8s.forms.service.networking.notice.trafficDistribution':
    'trafficDistribution affects topology-aware routing preferences through EndpointSlices.',
  'pages.k8s.forms.service.ipFamilies.placeholder': 'Select IP families',
  'pages.k8s.forms.service.internalTrafficPolicy': 'Internal traffic policy',
  'pages.k8s.forms.service.internalTrafficPolicy.extra':
    'Local only forwards to node-local endpoints; Cluster forwards across the whole cluster.',
  'pages.k8s.forms.service.placeholder.defaultCluster': 'Default: Cluster',
  'pages.k8s.forms.service.trafficDistribution': 'Traffic distribution',
  'pages.k8s.forms.service.trafficDistribution.extra':
    'Expresses a preference for topology-close or same-node routing on supported clusters.',
  'pages.k8s.forms.service.placeholder.unspecified': 'Not specified by default',
  'pages.k8s.forms.service.sessionAffinity': 'Session affinity',
  'pages.k8s.forms.service.sessionAffinity.description':
    'Forward all requests from the same client to the same pod for the configured period.',
  'pages.k8s.forms.service.sessionAffinity.timeout':
    'Maximum session duration (s)',
  'pages.k8s.forms.service.sessionAffinity.timeout.required':
    'Please enter the maximum session duration',
  'pages.k8s.forms.service.sessionAffinity.timeout.range':
    'Must be between 1 and 86400',
  'pages.k8s.forms.service.sessionAffinity.timeout.extra':
    'Sets the maximum session duration. Range 1 to 86400; default 10800.',
  'pages.k8s.forms.service.metadata.description':
    'Add metadata to the service.',
  'pages.k8s.forms.pv.title': 'Create persistent volume',
  'pages.k8s.forms.pv.volumeSource': 'Volume source',
  'pages.k8s.forms.pv.volumeSource.required': 'Please select a volume source',
  'pages.k8s.forms.pv.source.hostPath.desc':
    'Uses a local path on the node; suitable for development or single-node setups.',
  'pages.k8s.forms.pv.source.local.desc':
    'Uses a local disk on the node; requires node affinity.',
  'pages.k8s.forms.pv.source.nfs.desc':
    'Uses a directory exported by an NFS server.',
  'pages.k8s.forms.pv.source.csi.desc':
    'Uses a volume provided by a CSI driver.',
  'pages.k8s.forms.pv.hostPathType.unspecified': 'Unspecified',
  'pages.k8s.forms.pv.nfs.server': 'Server',
  'pages.k8s.forms.pv.nfs.server.required': 'Please enter the NFS server',
  'pages.k8s.forms.pv.nfs.server.placeholder': 'e.g. 10.0.0.10',
  'pages.k8s.forms.pv.nfs.path': 'Export path',
  'pages.k8s.forms.pv.nfs.path.required': 'Please enter the NFS export path',
  'pages.k8s.forms.pv.nfs.path.placeholder': 'e.g. /exports/data',
  'pages.k8s.forms.pv.csi.driver': 'Driver',
  'pages.k8s.forms.pv.csi.driver.required': 'Please enter the CSI driver',
  'pages.k8s.forms.pv.csi.driver.placeholder': 'e.g. ebs.csi.aws.com',
  'pages.k8s.forms.pv.csi.volumeHandle': 'Volume handle',
  'pages.k8s.forms.pv.csi.volumeHandle.required':
    'Please enter the volume handle',
  'pages.k8s.forms.pv.csi.volumeHandle.placeholder': 'Enter volumeHandle',
  'pages.k8s.forms.pv.fsType': 'File system',
  'pages.k8s.forms.pv.fsType.placeholder': 'e.g. ext4',
  'pages.k8s.forms.pv.csi.volumeAttributes': 'Volume attributes',
  'pages.k8s.forms.pv.csi.volumeAttributes.extra':
    'Fill in volumeAttributes as required by the CSI driver.',
  'pages.k8s.forms.pv.csi.volumeAttributes.delete': 'Remove volume attribute',
  'pages.k8s.forms.pv.csi.volumeAttributes.keyFirst':
    'Fill in the key of the existing attribute first.',
  'pages.k8s.forms.pv.local.path': 'Local path',
  'pages.k8s.forms.pv.local.path.required': 'Please enter the local path',
  'pages.k8s.forms.pv.local.path.placeholder': 'e.g. /mnt/disks/ssd1',
  'pages.k8s.forms.pv.nodeAffinity': 'Node affinity',
  'pages.k8s.forms.pv.nodeAffinity.desc':
    'A Local persistent volume must be pinned to the node that actually has the disk.',
  'pages.k8s.forms.pv.nodeAffinity.key.required': 'Please enter a label key',
  'pages.k8s.forms.pv.nodeAffinity.key.placeholder':
    'e.g. kubernetes.io/hostname',
  'pages.k8s.forms.pv.nodeAffinity.operator': 'Operator',
  'pages.k8s.forms.pv.nodeAffinity.operator.required':
    'Please select an operator',
  'pages.k8s.forms.pv.nodeAffinity.selectNode': 'Pick from cluster nodes',
  'pages.k8s.forms.pv.nodeAffinity.selectNode.extra':
    'Selecting a node adds its name to the match values below (applies when the label key is kubernetes.io/hostname).',
  'pages.k8s.forms.pv.nodeAffinity.selectNode.placeholder': 'Select a node',
  'pages.k8s.forms.pv.nodeAffinity.values': 'Match values',
  'pages.k8s.forms.pv.nodeAffinity.values.extra':
    'In/NotIn accept multiple values; Gt/Lt accept a single numeric value.',
  'pages.k8s.forms.pv.nodeAffinity.values.delete': 'Remove match value',
  'pages.k8s.forms.pv.nodeAffinity.values.placeholder': 'Enter a match value',
  'pages.k8s.forms.pv.nodeAffinity.values.first':
    'Fill in the existing match value first.',
  'pages.k8s.forms.pv.nodeAffinity.values.required':
    'Please enter node affinity match values',
  'pages.k8s.forms.pv.nodeAffinity.values.single':
    'Gt/Lt operators accept exactly one node affinity match value',
  'pages.k8s.forms.pv.nodeAffinity.values.numeric':
    'Match values for Gt/Lt operators must be numeric',
  'pages.k8s.forms.pv.hostPath': 'Host path',
  'pages.k8s.forms.pv.hostPath.extra':
    'HostPath suits development or single-node setups; prefer CSI/NFS/Local in production.',
  'pages.k8s.forms.pv.hostPath.required': 'Please enter the host path',
  'pages.k8s.forms.pv.hostPath.placeholder': 'e.g. /tmp/example-pv',
  'pages.k8s.forms.pv.hostPathType': 'Path type',
  'pages.k8s.forms.pv.capacity.extra':
    'The storage capacity the persistent volume advertises.',
  'pages.k8s.forms.pv.capacity.positive': 'Capacity must be greater than 0',
  'pages.k8s.forms.pv.capacity.unit': 'Capacity unit',
  'pages.k8s.forms.pv.accessModes.extra':
    'Select one or more access modes; they must match what the backing volume supports.',
  'pages.k8s.forms.pv.reclaimPolicy': 'Reclaim policy',
  'pages.k8s.forms.pv.reclaimPolicy.extra':
    'What happens to the persistent volume after its PVC is deleted.',
  'pages.k8s.forms.pv.reclaimPolicy.required': 'Please select a reclaim policy',
  'pages.k8s.forms.pv.volumeMode': 'Volume mode',
  'pages.k8s.forms.pv.storageClass.extra':
    'Leave empty to not specify a storage class.',
  'pages.k8s.forms.pv.storageClass.placeholder': 'Enter a storage class name',
  'pages.k8s.forms.pv.mountOptions': 'Mount options',
  'pages.k8s.forms.pv.mountOptions.desc':
    'Add mount options for the PV, such as nfsvers=4.1 or noatime.',
  'pages.k8s.forms.pv.mountOptions.delete': 'Remove mount option',
  'pages.k8s.forms.pv.mountOptions.placeholder': 'Enter a mount option',
  'pages.k8s.forms.pv.mountOptions.first':
    'Fill in the existing mount option first.',
  'pages.k8s.forms.pv.claimRef': 'Pre-bound claim',
  'pages.k8s.forms.pv.claimRef.desc':
    'Pre-bind to a specific PVC; only fill this in when static binding is really needed.',
  'pages.k8s.forms.pv.claimRef.namespace.placeholder':
    'Enter the PVC namespace',
  'pages.k8s.forms.pv.claimRef.name': 'Claim name',
  'pages.k8s.forms.pv.claimRef.name.placeholder': 'Enter the PVC name',
  'pages.k8s.forms.pv.claimRef.namespace.required':
    'A pre-bound claim requires a namespace',
  'pages.k8s.forms.pv.claimRef.name.required':
    'A pre-bound claim requires a claim name',
  'pages.k8s.forms.pv.metadata.desc':
    'Add labels and annotations to the persistent volume.',
  'pages.k8s.forms.pvc.title': 'Create persistent volume claim',
  'pages.k8s.forms.pvc.mode': 'Creation method',
  'pages.k8s.forms.pvc.mode.required': 'Please select a creation method',
  'pages.k8s.forms.pvc.mode.storageClass': 'From storage class',
  'pages.k8s.forms.pvc.mode.storageClass.desc':
    'Create the volume from an existing storage class.',
  'pages.k8s.forms.pvc.mode.persistentVolume':
    'Bind existing persistent volume',
  'pages.k8s.forms.pvc.mode.persistentVolume.desc':
    'Create the volume by binding an existing persistent volume.',
  'pages.k8s.forms.pvc.storageClass.default': '{name} (default)',
  'pages.k8s.forms.pvc.storageClass.extra':
    'Select a storage class to create a specific kind of volume.',
  'pages.k8s.forms.pvc.storageClass.required': 'Please select a storage class',
  'pages.k8s.forms.pvc.storageClass.notFound': 'No storage classes available',
  'pages.k8s.forms.pvc.storageClass.placeholder':
    'Select or enter a storage class',
  'pages.k8s.forms.pvc.volume.extra':
    'Select or enter the persistent volume to bind (only volumes not yet bound to a claim are listed).',
  'pages.k8s.forms.pvc.volume.notFound': 'No bindable persistent volumes found',
  'pages.k8s.forms.pvc.volumeStorageClass':
    'Storage class of the persistent volume',
  'pages.k8s.forms.pvc.volumeStorageClass.extra':
    'Must match the storage class of the persistent volume; leave empty if the volume has none.',
  'pages.k8s.forms.pvc.volumeStorageClass.placeholder':
    'Leave empty if the persistent volume has no storage class',
  'pages.k8s.forms.pvc.accessModes.extra.bind':
    'Must be among the access modes supported by the persistent volume.',
  'pages.k8s.forms.pvc.accessModes.extra.storageClass':
    'Select one or more access modes supported by the storage class.',
  'pages.k8s.forms.pvc.volumeMode': 'Volume mode',
  'pages.k8s.forms.pvc.volumeMode.extra':
    'Filesystem mounts as a directory; Block exposes a raw block device to the container.',
  'pages.k8s.forms.pvc.capacity': 'Volume capacity',
  'pages.k8s.forms.pvc.capacity.extra.bind':
    'The requested capacity cannot exceed that of the bound persistent volume.',
  'pages.k8s.forms.pvc.capacity.required': 'Please enter the volume capacity',
  'pages.k8s.forms.pvc.capacity.positive':
    'Volume capacity must be greater than 0',
  'pages.k8s.forms.pvc.capacity.unit': 'Capacity unit',
  'pages.k8s.forms.pvc.metadata.desc': 'Add metadata to the volume.',
  'pages.k8s.forms.storageclass.title': 'Create storage class',
  'pages.k8s.forms.storageclass.step.settings': 'Storage class settings',
  'pages.k8s.forms.storageclass.listSeparator': ', ',
  'pages.k8s.forms.storageclass.isDefault': 'Set as default storage class',
  'pages.k8s.forms.storageclass.isDefault.required':
    'Please choose whether to set it as the default storage class',
  'pages.k8s.forms.storageclass.isDefault.extra':
    'Persistent volume claims without a storage class use the default storage class.',
  'pages.k8s.forms.storageclass.isDefault.existing':
    'The cluster already has default storage class {names}; with multiple defaults, claims without a storage class use the most recently created one.',
  'pages.k8s.forms.storageclass.provisioner': 'Provisioner',
  'pages.k8s.forms.storageclass.provisioner.extra':
    'The name of the CSI driver or volume plugin, e.g. ebs.csi.aws.com.',
  'pages.k8s.forms.storageclass.provisioner.required':
    'Please enter a provisioner',
  'pages.k8s.forms.storageclass.reclaimPolicy': 'Reclaim policy',
  'pages.k8s.forms.storageclass.reclaimPolicy.required':
    'Please select a reclaim policy',
  'pages.k8s.forms.storageclass.bindingMode': 'Volume binding mode',
  'pages.k8s.forms.storageclass.bindingMode.required':
    'Please select a volume binding mode',
  'pages.k8s.forms.storageclass.bindingMode.extra':
    'Delayed binding waits until a pod uses the volume before provisioning and binding the persistent volume.',
  'pages.k8s.forms.storageclass.bindingMode.immediate': 'Immediate',
  'pages.k8s.forms.storageclass.bindingMode.waitForFirstConsumer':
    'Wait for first consumer',
  'pages.k8s.forms.storageclass.expansion': 'Volume expansion',
  'pages.k8s.forms.storageclass.expansion.extra':
    'Whether volumes of this storage class may be expanded after creation.',
  'pages.k8s.forms.storageclass.expansion.required':
    'Please choose whether to allow volume expansion',
  'pages.k8s.forms.storageclass.parameters': 'Parameters',
  'pages.k8s.forms.storageclass.parameters.extra':
    'Fill in as required by the provisioner (CSI driver); parameters are passed through as-is.',
  'pages.k8s.forms.storageclass.parameters.delete': 'Remove parameter',
  'pages.k8s.forms.storageclass.parameters.keyFirst':
    'Fill in the key of the existing parameter first.',
  'pages.k8s.forms.storageclass.parameters.duplicate':
    'Parameter keys must be unique',
  'pages.k8s.forms.storageclass.mountOptions': 'Mount options',
  'pages.k8s.forms.storageclass.mountOptions.extra':
    'Persistent volumes dynamically provisioned by this storage class get these mount options, e.g. noatime or nfsvers=4.1.',
  'pages.k8s.forms.storageclass.mountOptions.delete': 'Remove mount option',
  'pages.k8s.forms.storageclass.mountOptions.placeholder':
    'Enter a mount option',
  'pages.k8s.forms.storageclass.mountOptions.first':
    'Fill in the existing mount option first.',
  'pages.k8s.forms.storageclass.yaml.provisionerRequired':
    'YAML must include provisioner',
  'pages.k8s.forms.edit.pvc.clone.title': 'Clone persistent volume claim',
  'pages.k8s.forms.edit.pvc.clone.name.pattern':
    'Name may only contain lowercase letters, digits and hyphens',
  'pages.k8s.forms.edit.pvc.clone.name.sameAsSource':
    'Name must differ from the current persistent volume claim',
  'pages.k8s.forms.edit.pvc.clone.help':
    'Cloning creates a new persistent volume claim from the current PVC (capacity {capacity}), keeping the same access modes, volume mode and storage class.',
  'pages.k8s.forms.edit.pvc.expand.title': 'Expand persistent volume claim',
  'pages.k8s.forms.edit.pvc.expand.denied':
    'Storage class {name} does not allow volume expansion, so the claim cannot be expanded. Enable it on the storage class first and try again.',
  'pages.k8s.forms.edit.pvc.expand.noStorageClass':
    'This persistent volume claim has no storage class and cannot be expanded.',
  'pages.k8s.forms.edit.pvc.expand.unknown':
    'Storage class {name} could not be read, so it is unclear whether it allows volume expansion; if not, the cluster will reject the change.',
  'pages.k8s.forms.edit.pvc.expand.help':
    'Current capacity {capacity}. Capacity can only be increased, and the storage class must allow volume expansion.',
  'pages.k8s.forms.edit.pvc.size.belowCurrent':
    'Capacity cannot be less than the current capacity {current}',
  'pages.k8s.forms.edit.storageclass.default.unset.title':
    'Unset default storage class',
  'pages.k8s.forms.edit.storageclass.default.set.title':
    'Set as default storage class',
  'pages.k8s.forms.edit.storageclass.default.others':
    'Default storage class already exists: {names}. With multiple defaults, claims without a storage class use the most recently created one; consider unsetting the existing default first.',
  'pages.k8s.forms.edit.storageclass.default.unset.confirm':
    'Unset {name} as the default storage class?',
  'pages.k8s.forms.edit.storageclass.default.unset.hint':
    'Afterwards, claims without a storage class will no longer use it; existing claims are not affected.',
  'pages.k8s.forms.edit.storageclass.default.set.confirm':
    'Set {name} as the default storage class?',
  'pages.k8s.forms.edit.storageclass.default.set.hint':
    'Afterwards, claims without a storage class will use it; existing claims are not affected.',
  'pages.k8s.forms.edit.storageclass.volumeOps.title': 'Volume operations',
  'pages.k8s.forms.edit.storageclass.volumeOps.allowExpansion':
    'Allow volume expansion',
  'pages.k8s.forms.edit.storageclass.volumeOps.help':
    'When enabled, claims using this storage class can be expanded (the storage plugin must also support it); disabling only affects future expansion requests.',
  'pages.k8s.forms.ingress.title': 'Create ingress',
  'pages.k8s.forms.ingress.nameNamespaceRequired':
    'Please enter a name and namespace',
  'pages.k8s.forms.ingress.rules': 'Routing rules',
  'pages.k8s.forms.ingress.rules.required':
    'Please add at least one routing rule',
  'pages.k8s.forms.ingress.rewriteTarget': 'Rewrite target',
  'pages.k8s.forms.ingress.rewriteTarget.required':
    'Please enter a rewrite target',
  'pages.k8s.forms.ingress.metadata.description':
    'Add metadata to the ingress.',
  'pages.k8s.forms.ingress.host': 'Host',
  'pages.k8s.forms.ingress.host.maxLength':
    'Host must be at most 253 characters',
  'pages.k8s.forms.ingress.host.pattern':
    'Host may only contain lowercase letters, digits, hyphens (-) and dots (.), and may start with *.',
  'pages.k8s.forms.ingress.host.requiredForHttps':
    'HTTPS routes require a host',
  'pages.k8s.forms.ingress.host.tooltip': 'Leave empty to match all hosts.',
  'pages.k8s.forms.ingress.protocol': 'Protocol',
  'pages.k8s.forms.ingress.path': 'Paths',
  'pages.k8s.forms.ingress.rewrite.example.all': 'Match all paths',
  'pages.k8s.forms.ingress.rewrite.example.apiPrefix':
    'Match paths starting with /api',
  'pages.k8s.forms.ingress.rewrite.example.htmlSuffix':
    'Match paths ending with .html',
  'pages.k8s.forms.ingress.rewrite.example.userId': 'Match /user/:id',
  'pages.k8s.forms.ingress.rewrite.example.oldToNew': 'Rewrite /old to /new',
  'pages.k8s.forms.ingress.rewrite.tooltip.intro':
    'Rewrites the client request path. Supports static paths (e.g. /new-path), dynamic paths (e.g. /$1, /$2), combined paths (e.g. /v1/$1) and regular expressions',
  'pages.k8s.forms.ingress.rewrite.tooltip.usage': 'Example',
  'pages.k8s.forms.ingress.rewrite.tooltip.regex': 'Regular expression',
  'pages.k8s.forms.ingress.rewrite.tooltip.note':
    'Note: the regular expression must match the one used in the path field',
  'pages.k8s.forms.ingress.notice.title':
    'Kubernetes 1.35+ routing recommendations',
  'pages.k8s.forms.ingress.notice.gatewayApi':
    'Ingress resources still work; consider the Gateway API for new, complex traffic management.',
  'pages.k8s.forms.ingress.notice.tls':
    'HTTPS routes should specify a TLS Secret explicitly; backend ports accept a port number or a named port.',
  'pages.k8s.forms.ingress.ingressClass.tooltip':
    'The controller class that handles this Ingress.',
  'pages.k8s.forms.ingress.ingressClass.placeholder':
    'e.g. nginx, alb, traefik',
  'pages.k8s.forms.ingress.tlsSecret.tooltip':
    'The TLS Secret used by HTTPS routes; it must contain tls.crt and tls.key.',
  'pages.k8s.forms.ingress.tlsSecret.placeholder': 'e.g. example-com-tls',
  'pages.k8s.forms.ingress.summary.separator': ', ',
  'pages.k8s.forms.ingress.customBackend': 'Custom backend',
  'pages.k8s.forms.ingress.resourceBackend': 'Resource backend: {kind}/{name}',
  'pages.k8s.forms.ingress.allHosts': 'All hosts',
  'pages.k8s.forms.ingress.summary.protocol': 'Protocol: {protocol}',
  'pages.k8s.forms.ingress.summary.paths': 'Paths: {paths}',
  'pages.k8s.forms.ingress.summary.services': 'Services: {services}',
  'pages.k8s.forms.ingress.summary.count': 'Count: {count}',
  'pages.k8s.forms.ingress.rule.add': 'Add routing rule',
  'pages.k8s.forms.ingress.rule.edit': 'Edit routing rule',
  'pages.k8s.forms.ingress.rule.delete': 'Remove routing rule',
  'pages.k8s.forms.ingress.rule.addDescription':
    'Add a routing rule to map host paths to services.',
  'pages.k8s.forms.ingress.rule.incomplete': 'Please complete the routing rule',
  'pages.k8s.forms.ingress.rewrite': 'Path rewrite',
  'pages.k8s.forms.ingress.rewrite.description':
    'Use a regular expression to configure the rewrite target applied to the current routing rules',
  'pages.k8s.forms.ingress.port.notFound': 'Enter a port number or port name',
  'pages.k8s.forms.ingress.port.required': 'Please select a port',
  'pages.k8s.forms.ingress.paths.required': 'Please add at least one path',
  'pages.k8s.forms.ingress.path.required': 'Please enter a path',
  'pages.k8s.forms.ingress.path.leadingSlash': 'Path must start with /',
  'pages.k8s.forms.ingress.path.delete': 'Remove path',
  'pages.k8s.forms.ingress.pathType': 'Path type',
  'pages.k8s.forms.ingress.pathType.required': 'Please select a path type',
  'pages.k8s.forms.ingress.service.required': 'Please select a service',
  'pages.k8s.forms.ingressclass.title': 'Create ingress class',
  'pages.k8s.forms.ingressclass.parameters': 'Parameters',
  'pages.k8s.forms.ingressclass.parameters.extra':
    'Parameters reference the configuration resource required by the controller; spec.parameters is omitted when disabled.',
  'pages.k8s.forms.ingressclass.parameters.required':
    'Please choose whether to enable parameters',
  'pages.k8s.forms.ingressclass.parameters.notEnabled': 'Disabled',
  'pages.k8s.forms.ingressclass.parameters.kindRequired':
    'Parameters require a kind',
  'pages.k8s.forms.ingressclass.parameters.nameRequired':
    'Parameters require a name',
  'pages.k8s.forms.ingressclass.parameters.namespaceRequired':
    'Namespace-scoped parameters require a namespace',
  'pages.k8s.forms.ingressclass.labelKeyDuplicate': 'Label keys must be unique',
  'pages.k8s.forms.ingressclass.annotationKeyDuplicate':
    'Annotation keys must be unique',
  'pages.k8s.forms.ingressclass.controller': 'Controller',
  'pages.k8s.forms.ingressclass.controller.required':
    'Please enter a controller',
  'pages.k8s.forms.ingressclass.controller.maxLength':
    'Controller must be at most 250 characters',
  'pages.k8s.forms.ingressclass.controller.extra':
    'Usually a domain-style path, e.g. k8s.io/ingress-nginx.',
  'pages.k8s.forms.ingressclass.isDefault': 'Default ingress class',
  'pages.k8s.forms.ingressclass.isDefault.extra':
    'When enabled, the ingressclass.kubernetes.io/is-default-class annotation is added.',
  'pages.k8s.forms.ingressclass.isDefault.required':
    'Please choose whether this is the default class',
  'pages.k8s.forms.ingressclass.metadata.description':
    'Add labels and annotations to the ingress class.',
  'pages.k8s.forms.ingressclass.scope': 'Scope',
  'pages.k8s.forms.ingressclass.scope.cluster': 'Cluster',
  'pages.k8s.forms.ingressclass.scope.namespace': 'Namespace',
  'pages.k8s.forms.ingressclass.scope.required':
    'Please select a parameter scope',
  'pages.k8s.forms.ingressclass.scope.placeholder': 'Select a scope',
  'pages.k8s.forms.ingressclass.apiGroup': 'API group',
  'pages.k8s.forms.ingressclass.apiGroup.extra':
    'e.g. k8s.example.com; leave empty for the core API group.',
  'pages.k8s.forms.ingressclass.apiGroup.placeholder':
    'Please enter an API group',
  'pages.k8s.forms.ingressclass.parameterKind.required':
    'Please enter the parameter resource kind',
  'pages.k8s.forms.ingressclass.parameterName.required':
    'Please enter the parameter resource name',
  'pages.k8s.forms.ingressclass.parameterNamespace.required':
    'Please enter the parameter namespace',
  'pages.k8s.forms.ingressclass.yaml.noNamespace':
    'IngressClass is cluster-scoped; the YAML must not include metadata.namespace',
  'pages.k8s.forms.ingressclass.yaml.controllerRequired':
    'YAML must include spec.controller',
  'pages.k8s.forms.ingressclass.yaml.parametersKindName':
    'YAML spec.parameters must include kind and name',
  'pages.k8s.forms.ingressclass.yaml.parametersScope':
    'YAML spec.parameters.scope must be Cluster or Namespace',
  'pages.k8s.forms.ingressclass.yaml.parametersNamespaceRequired':
    'Namespace-scoped parameters must include namespace',
  'pages.k8s.forms.ingressclass.yaml.parametersNamespaceOnlyNamespaced':
    'Only Namespace-scoped parameters may include namespace',
  'pages.k8s.forms.networkpolicy.title': 'Create network policy',
  'pages.k8s.forms.networkpolicy.denyAll': 'Deny all',
  'pages.k8s.forms.networkpolicy.ingress': 'Ingress rules',
  'pages.k8s.forms.networkpolicy.egress': 'Egress rules',
  'pages.k8s.forms.networkpolicy.source': 'Sources',
  'pages.k8s.forms.networkpolicy.destination': 'Destinations',
  'pages.k8s.forms.networkpolicy.metadata.description':
    'Add labels and annotations to the NetworkPolicy.',
  'pages.k8s.forms.networkpolicy.policyTypes': 'Policy types',
  'pages.k8s.forms.networkpolicy.policyTypes.required':
    'Please select at least one policy type',
  'pages.k8s.forms.networkpolicy.policyTypes.ingress': 'Ingress traffic',
  'pages.k8s.forms.networkpolicy.policyTypes.egress': 'Egress traffic',
  'pages.k8s.forms.networkpolicy.policyTypes.description':
    'Choose the traffic directions this policy applies to. Rules for unselected directions are omitted.',
  'pages.k8s.forms.networkpolicy.policyTypes.tooltip':
    'Maps to spec.policyTypes.',
  'pages.k8s.forms.networkpolicy.podSelector.description':
    'When empty, all Pods in the namespace are selected.',
  'pages.k8s.forms.networkpolicy.podSelector.tooltip':
    'Maps to spec.podSelector; supports matchLabels and matchExpressions.',
  'pages.k8s.forms.networkpolicy.podSelector.emptyHint':
    'No match conditions: an empty podSelector is emitted and the policy applies to all Pods in the namespace.',
  'pages.k8s.forms.networkpolicy.selector.expressionKeyFirst':
    'Fill in the key of the existing expression first.',
  'pages.k8s.forms.networkpolicy.selector.expressionKeyRequired':
    '{label}: expression key is required',
  'pages.k8s.forms.networkpolicy.selector.expressionValuesRequired':
    '{label}: {operator} expression requires at least one value',
  'pages.k8s.forms.networkpolicy.matchLabels': 'Match labels',
  'pages.k8s.forms.networkpolicy.matchLabels.description':
    'Match Kubernetes labels exactly by key/value.',
  'pages.k8s.forms.networkpolicy.matchLabels.delete': 'Remove match label',
  'pages.k8s.forms.networkpolicy.matchExpressions': 'Match expressions',
  'pages.k8s.forms.networkpolicy.matchExpressions.description':
    'Supports In, NotIn, Exists and DoesNotExist expressions.',
  'pages.k8s.forms.networkpolicy.matchExpressions.valuesPlaceholder':
    'Type a value and press Enter',
  'pages.k8s.forms.networkpolicy.matchExpressions.noValues': 'No values needed',
  'pages.k8s.forms.networkpolicy.matchExpressions.delete': 'Remove expression',
  'pages.k8s.forms.networkpolicy.namespaceSelector': 'Namespace selector',
  'pages.k8s.forms.networkpolicy.peerType.podAndNamespace': 'Pod + namespace',
  'pages.k8s.forms.networkpolicy.peerType.ipBlock': 'IP block',
  'pages.k8s.forms.networkpolicy.ipBlock.cidrPlaceholder':
    'CIDR, e.g. 10.0.0.0/24',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptPlaceholder':
    'Excluded CIDRs, press Enter to add',
  'pages.k8s.forms.networkpolicy.ipBlock.cidrInvalid':
    'Invalid CIDR, e.g. 10.0.0.0/24 or fd00::/64',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptInvalid':
    'Excluded range {item} is not a valid CIDR',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptNotSubset':
    'Excluded range {item} must be a strict subset of {cidr}',
  'pages.k8s.forms.networkpolicy.port.range':
    'Port number must be between 1 and 65535',
  'pages.k8s.forms.networkpolicy.port.namePattern':
    'Port name must be at most 15 characters, may only contain lowercase letters, digits and hyphens (-), and must include at least one letter',
  'pages.k8s.forms.networkpolicy.port.placeholder': 'Port number or name',
  'pages.k8s.forms.networkpolicy.port.add': 'Add port',
  'pages.k8s.forms.networkpolicy.endPort': 'End port',
  'pages.k8s.forms.networkpolicy.endPort.portMustBeNumber':
    'Port must be a number when an end port is set',
  'pages.k8s.forms.networkpolicy.endPort.range':
    'End port must be between 1 and 65535',
  'pages.k8s.forms.networkpolicy.endPort.lessThanPort':
    'End port must not be less than the start port',
  'pages.k8s.forms.networkpolicy.endPort.hint':
    'The end port defines a port range: the start port must be a number and the end port must not be less than it.',
  'pages.k8s.forms.networkpolicy.peer.cidrRequired':
    '{peer} {index}: IP block requires a CIDR',
  'pages.k8s.forms.networkpolicy.peer.cidrInvalid':
    '{peer} {index}: CIDR {cidr} is invalid',
  'pages.k8s.forms.networkpolicy.peer.prefix': '{peer} {index}: {message}',
  'pages.k8s.forms.networkpolicy.peer.podSelectorOf':
    '{peer} {index} pod selector',
  'pages.k8s.forms.networkpolicy.peer.namespaceSelectorOf':
    '{peer} {index} namespace selector',
  'pages.k8s.forms.networkpolicy.rule.prefix': '{rule} {index}: {message}',
  'pages.k8s.forms.networkpolicy.summary.peers': '{label}: {text}',
  'pages.k8s.forms.networkpolicy.summary.ports': 'Ports: {text}',
  'pages.k8s.forms.networkpolicy.summary.portCount': '{count} ports',
  'pages.k8s.forms.networkpolicy.summary.allPorts': 'All ports',
  'pages.k8s.forms.networkpolicy.ingress.add': 'Add ingress rule',
  'pages.k8s.forms.networkpolicy.ingress.addDescription':
    'Configure the sources and ports allowed to reach the selected Pods.',
  'pages.k8s.forms.networkpolicy.ingress.description':
    'Allow matching sources to reach the selected Pods',
  'pages.k8s.forms.networkpolicy.ingress.delete': 'Remove ingress rule',
  'pages.k8s.forms.networkpolicy.ingress.addPeer': 'Add source',
  'pages.k8s.forms.networkpolicy.ingress.deletePeer': 'Remove source',
  'pages.k8s.forms.networkpolicy.ingress.peerCount': '{count} sources',
  'pages.k8s.forms.networkpolicy.ingress.allPeers': 'All sources',
  'pages.k8s.forms.networkpolicy.ingress.denyAll':
    'No ingress rules: ingress: [] is emitted and all inbound traffic to the selected Pods is denied.',
  'pages.k8s.forms.networkpolicy.ingress.disabled':
    'Ingress traffic is not selected in policy types; no ingress rules are emitted.',
  'pages.k8s.forms.networkpolicy.ingress.tooltip':
    'Maps to spec.ingress. Without rules an empty array is emitted, denying all inbound traffic.',
  'pages.k8s.forms.networkpolicy.egress.add': 'Add egress rule',
  'pages.k8s.forms.networkpolicy.egress.addDescription':
    'Configure the destinations and ports the selected Pods may reach.',
  'pages.k8s.forms.networkpolicy.egress.description':
    'Allow the selected Pods to reach matching destinations',
  'pages.k8s.forms.networkpolicy.egress.delete': 'Remove egress rule',
  'pages.k8s.forms.networkpolicy.egress.addPeer': 'Add destination',
  'pages.k8s.forms.networkpolicy.egress.deletePeer': 'Remove destination',
  'pages.k8s.forms.networkpolicy.egress.peerCount': '{count} destinations',
  'pages.k8s.forms.networkpolicy.egress.allPeers': 'All destinations',
  'pages.k8s.forms.networkpolicy.egress.denyAll':
    'No egress rules: egress: [] is emitted and all outbound traffic from the selected Pods is denied.',
  'pages.k8s.forms.networkpolicy.egress.disabled':
    'Egress traffic is not selected in policy types; no egress rules are emitted.',
  'pages.k8s.forms.networkpolicy.egress.tooltip':
    'Maps to spec.egress. Without rules an empty array is emitted, denying all outbound traffic.',
  'pages.k8s.forms.secret.binaryValue': 'Binary data',
  'pages.k8s.forms.secret.type.opaque': 'Default',
  'pages.k8s.forms.secret.type.tls': 'TLS',
  'pages.k8s.forms.secret.type.dockerconfigjson': 'Image registry credentials',
  'pages.k8s.forms.secret.type.basicAuth': 'Username and password',
  'pages.k8s.forms.secret.data.atLeastOne': 'Add at least one data entry',
  'pages.k8s.forms.secret.metadata.keyRequired':
    'Please enter the key for {title}',
  'pages.k8s.forms.secret.metadata.keyInvalid':
    'Invalid {title} key “{keyName}”',
  'pages.k8s.forms.secret.metadata.keyDuplicate': '{title} keys must be unique',
  'pages.k8s.forms.secret.certificate': 'Certificate',
  'pages.k8s.forms.secret.certificate.required': 'Please enter a certificate',
  'pages.k8s.forms.secret.privateKey': 'Private key',
  'pages.k8s.forms.secret.privateKey.required': 'Please enter a private key',
  'pages.k8s.forms.secret.registryAddress': 'Registry address',
  'pages.k8s.forms.secret.registryAddress.required':
    'Please enter a registry address',
  'pages.k8s.forms.secret.registryAddress.extra':
    'Set the registry address, for example docker.io.',
  'pages.k8s.forms.secret.registryAddress.placeholder': 'e.g. docker.io',
  'pages.k8s.forms.secret.email': 'Email',
  'pages.k8s.forms.secret.email.placeholder': 'Please enter an email',
  'pages.k8s.forms.secret.registry.incomplete':
    'Set the registry address, username and password.',
  'pages.k8s.forms.secret.dataSettings': 'Data settings',
  'pages.k8s.forms.secret.createTitle': 'Create secret',
  'pages.k8s.forms.secret.metadata.description':
    'Add labels and annotations to the secret.',
  'pages.k8s.forms.secret.dataEditor.addDescription': 'Add key-value data.',
  'pages.k8s.forms.secret.dataEditor.keyDuplicate': 'Keys must be unique',
  'pages.k8s.forms.secret.dataEditor.systemKey':
    '{keyName} is a system-generated field',
  'pages.k8s.forms.configmap.createTitle': 'Create config map',
  'pages.k8s.forms.configmap.metadata.description':
    'Add labels and annotations to the config map.',
  'pages.k8s.forms.configmap.data.keyRequired': 'Please enter a data key',
  'pages.k8s.forms.configmap.data.keyUsedByBinary':
    'Key {keyName} is already used by binary data',
  'pages.k8s.forms.configmap.yaml.dataNotObject':
    'YAML data must be a key-value object',
  'pages.k8s.forms.configmap.yaml.dataValueNotString':
    'YAML data values must be strings',
  'pages.k8s.forms.edit.secret.hiddenPlaceholder':
    'Hidden; enter new content to replace it',
  'pages.k8s.forms.edit.secret.keepHint':
    'Leave empty to keep the current value.',
  'pages.k8s.forms.edit.secret.docker.hiddenCanReveal':
    'The registry credentials are hidden. Click “Reveal values” to edit the registry address, username and password, or replace the whole .dockerconfigjson content below.',
  'pages.k8s.forms.edit.secret.docker.hiddenNoPermission':
    'The registry credentials are hidden and the current account cannot reveal them, so the registry address, username and password cannot be edited. You can replace the whole .dockerconfigjson content below, or edit only labels and annotations.',
  'pages.k8s.forms.edit.secret.docker.unparsed':
    'Registry credentials could not be parsed from .dockerconfigjson; you can only replace its whole content below.',
  'pages.k8s.forms.edit.secret.docker.replaced':
    '.dockerconfigjson has been replaced as a whole and the replacement takes precedence; undo the replacement to edit it with the form again.',
  'pages.k8s.forms.edit.secret.mask.notAllowed': 'Must not be the mask {mask}',
  'pages.k8s.forms.edit.secret.mask.valueNotAllowed':
    'The value must not be the mask {mask}',
  'pages.k8s.forms.edit.secret.mask.keyValueNotAllowed':
    'The value of key {keyName} must not be the mask {mask}',
  'pages.k8s.forms.edit.secret.mask.fieldNotAllowed':
    '{title} must not be the mask {mask}',
  'pages.k8s.forms.edit.secret.data.renameHidden':
    'The value of key {sourceKey} is hidden; enter a new value before renaming it',
  'pages.k8s.forms.edit.secret.typeImmutable':
    'The type cannot be changed after creation.',
  'pages.k8s.forms.edit.secret.otherData': 'Other data',
  'pages.k8s.forms.edit.secret.revealed':
    'Values are revealed. Unchanged data keeps its current value when saved.',
  'pages.k8s.forms.edit.secret.hiddenNoPermission':
    'Existing values are hidden and the current account cannot reveal them; you can enter new values to replace them.',
  'pages.k8s.forms.edit.secret.reveal': 'Reveal values',
  'pages.k8s.forms.edit.secret.hiddenHint':
    'Existing values are hidden. Revealing them is recorded in the audit log; you can also enter new values to replace them.',
  'pages.k8s.forms.edit.secret.immutable':
    'This secret is immutable; its data cannot be changed and only labels and annotations can be edited.',
  'pages.k8s.forms.edit.secret.tag.new': 'New',
  'pages.k8s.forms.edit.secret.tag.modified': 'Modified',
  'pages.k8s.forms.edit.secret.undo': 'Undo changes',
  'pages.k8s.forms.edit.secret.replaceData': 'Replace data',
  'pages.k8s.forms.edit.secret.replaceNotice':
    'The current value is hidden. Saving replaces it with the content entered below; click Cancel to keep it.',
  'pages.k8s.forms.edit.secret.dataEditor.fillAbove':
    'Fill in {keyName} using the form fields above',
  'pages.k8s.forms.edit.configmap.immutable':
    'This config map is immutable; its data cannot be changed and only labels and annotations can be edited.',
  'pages.k8s.forms.edit.configmap.binaryKeysNotice':
    'Binary data ({keys}) is not edited here and is kept as is when saving.',
  'pages.k8s.forms.edit.service.accessMode.description':
    'Set how the service is accessed from outside the cluster.',
  'pages.k8s.forms.edit.service.accessMode.none': 'None',
  'pages.k8s.forms.edit.service.lbClass.description':
    'Specify which load balancer implementation handles this Service.',
  'pages.k8s.forms.edit.service.lbClass.placeholder':
    'e.g. service.k8s.aws/nlb',
  'pages.k8s.forms.edit.service.nodePortAllocation': 'NodePort allocation',
  'pages.k8s.forms.edit.service.nodePortAllocation.description':
    'Control whether the LoadBalancer automatically allocates NodePorts.',
  'pages.k8s.forms.edit.service.nodePortAllocation.checkbox':
    'Automatically allocate NodePorts for the LoadBalancer service',
  'pages.k8s.forms.edit.service.externalTrafficPolicy':
    'External traffic policy',
  'pages.k8s.forms.edit.service.externalTrafficPolicy.description':
    'Local preserves the client source IP; Cluster forwards traffic across the cluster.',
  'pages.k8s.forms.edit.service.externalTrafficPolicy.placeholder':
    'Cluster default',
  'pages.k8s.forms.edit.service.annotations.description':
    'Add load balancer configuration via annotations.',
  'pages.k8s.forms.edit.service.externalAccessTitle': 'Edit external access',
  'pages.k8s.forms.edit.service.settingsTitle': 'Edit service settings',
  'pages.k8s.forms.edit.ingress.annotationsTitle': 'Edit annotations',
  'pages.k8s.forms.edit.ingress.annotations.description':
    'Configure annotations for the ingress.',
  'pages.k8s.forms.edit.ingress.annotations.keyRequired':
    'Annotation key must not be empty',
  'pages.k8s.forms.edit.ingress.annotations.keyDuplicate':
    'Annotation keys must be unique',
  'pages.k8s.forms.edit.ingress.rulesTitle': 'Edit routing rules',
  'pages.k8s.forms.edit.workload.updateStrategy.description':
    'Configure the strategy used when the workload updates its pod replicas.',
  'pages.k8s.forms.edit.workload.strategyType': 'Strategy type',
  'pages.k8s.forms.edit.workload.containers.description':
    'Manage container images, ports, resources and advanced settings.',
  'pages.k8s.forms.edit.workload.storage.description':
    'Mount persistent volumes, ephemeral volumes, config maps or secrets into the pod.',
  'pages.k8s.forms.edit.workload.scheduling': 'Pod scheduling rules',
  'pages.k8s.forms.edit.workload.scheduling.description':
    'Set the rules for scheduling pod replicas onto nodes.',
  'pages.k8s.forms.edit.workload.ruleType': 'Rule type',
  'pages.k8s.forms.edit.workload.termination': 'Pod graceful termination',
  'pages.k8s.forms.edit.workload.termination.description':
    'Set how long to wait before a container is terminated; after the timeout it is force-killed.',
};
