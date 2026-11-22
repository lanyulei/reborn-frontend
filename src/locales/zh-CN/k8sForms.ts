/** 容器平台 · 资源创建 / 编辑表单（工作负载、配置、网络、存储、RBAC 等向导的文案） */
export default {
  'pages.k8s.forms.common.set': '已设置',
  'pages.k8s.forms.common.unset': '未设置',
  'pages.k8s.forms.common.name': '名称',
  'pages.k8s.forms.common.name.required': '请输入名称',
  'pages.k8s.forms.common.name.maxLength': '名称最长 63 个字符',
  'pages.k8s.forms.common.name.maxLength253': '名称最长 253 个字符',
  'pages.k8s.forms.common.name.pattern':
    '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.common.name.dnsLabel':
    '名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符',
  'pages.k8s.forms.common.namespace': '命名空间',
  'pages.k8s.forms.common.namespace.required': '请选择命名空间',
  'pages.k8s.forms.common.namespace.placeholder': '选择将要创建资源的命名空间',
  'pages.k8s.forms.common.labels': '标签',
  'pages.k8s.forms.common.annotations': '注解',
  'pages.k8s.forms.common.metadata': '元数据',
  'pages.k8s.forms.common.addMetadata': '添加元数据',
  'pages.k8s.forms.common.advanced': '高级设置',
  'pages.k8s.forms.common.current': '当前',
  'pages.k8s.forms.common.yes': '是',
  'pages.k8s.forms.common.no': '否',
  'pages.k8s.forms.common.type': '类型',
  'pages.k8s.forms.common.type.required': '请选择类型',
  'pages.k8s.forms.common.select': '请选择',
  'pages.k8s.forms.common.labelKey': '标签键',
  'pages.k8s.forms.common.labelValue': '标签值',
  'pages.k8s.forms.common.key.required': '请输入键',
  'pages.k8s.forms.common.key.maxLength': '键最长 253 个字符',
  'pages.k8s.forms.common.key.pattern':
    '键只能包含字母、数字、点（.）、下划线（_）和连字符（-）',
  'pages.k8s.forms.common.deleteLabel': '删除标签',
  'pages.k8s.forms.common.deleteAnnotation': '删除注解',
  'pages.k8s.forms.common.labelKeyFirst': '请先填写已有标签的键。',
  'pages.k8s.forms.common.annotationKeyFirst': '请先填写已有注解的键。',
  'pages.k8s.forms.common.username': '用户名',
  'pages.k8s.forms.common.username.required': '请输入用户名',
  'pages.k8s.forms.common.password': '密码',
  'pages.k8s.forms.common.password.required': '请输入密码',
  'pages.k8s.forms.common.accessMode': '访问模式',
  'pages.k8s.forms.common.accessMode.required': '请选择访问模式',
  'pages.k8s.forms.common.data': '数据',
  'pages.k8s.forms.common.editData': '编辑数据',
  'pages.k8s.forms.common.addData': '添加数据',
  'pages.k8s.forms.common.deleteData': '删除数据',
  'pages.k8s.forms.common.dataKeyDuplicate': '数据键不能重复',
  'pages.k8s.forms.common.storage': '存储设置',
  'pages.k8s.forms.common.capacity': '容量',
  'pages.k8s.forms.common.capacity.required': '请输入容量',
  'pages.k8s.forms.common.volumeName.required': '请输入卷名称',
  'pages.k8s.forms.common.volumeMode.required': '请选择卷模式',
  'pages.k8s.forms.common.storageClass': '存储类',
  'pages.k8s.forms.common.empty': '空',
  'pages.k8s.forms.common.hidden': '已隐藏',
  'pages.k8s.forms.common.port.required': '请输入端口',
  'pages.k8s.forms.common.port.range': '端口范围为 1-65535',
  'pages.k8s.forms.common.deletePort': '删除端口',
  'pages.k8s.forms.common.protocol.required': '请选择协议',
  'pages.k8s.forms.common.command': '命令',
  'pages.k8s.forms.common.container': '容器',
  'pages.k8s.forms.common.user': '用户',
  'pages.k8s.forms.common.podSelector': 'Pod 选择器',
  'pages.k8s.forms.common.noResources': '未发现可用资源',
  'pages.k8s.forms.common.editSettings': '编辑设置',
  'pages.k8s.forms.common.yaml.nameNamespaceRequired':
    'YAML 必须包含 metadata.name 和 metadata.namespace',
  'pages.k8s.forms.common.yaml.nameRequired': 'YAML 必须包含 metadata.name',
  'pages.k8s.forms.common.yaml.invalidObject':
    'YAML 格式不正确，内容必须是有效的资源对象',
  'pages.k8s.forms.common.yaml.invalid':
    'YAML 格式不正确或不是有效的资源对象，请检查后重试',
  'pages.k8s.forms.common.yaml.kindMismatch': 'YAML kind 必须为 {kind}',
  'pages.k8s.forms.common.yaml.apiVersionMismatch':
    'YAML apiVersion 必须为 {apiVersion}',
  'pages.k8s.forms.workload.container.delete': '删除容器',
  'pages.k8s.forms.workload.container.delete.content':
    '确定删除容器「{name}」吗？该容器的配置和存储挂载设置将一并移除。',
  'pages.k8s.forms.workload.container.delete.aria': '删除 {name}',
  'pages.k8s.forms.workload.container.new': '新容器',
  'pages.k8s.forms.workload.container.add': '添加容器',
  'pages.k8s.forms.workload.container.add.description':
    '自定义容器的设置以创建容器',
  'pages.k8s.forms.workload.container.edit': '编辑容器配置',
  'pages.k8s.forms.workload.container.edit.aria': '编辑 {name} 配置',
  'pages.k8s.forms.workload.container.keepOne': '至少保留一个容器',
  'pages.k8s.forms.workload.container.image.line': '镜像：{image}',
  'pages.k8s.forms.workload.container.image.unset': '未填写',
  'pages.k8s.forms.workload.container.noLimit': '无上限',
  'pages.k8s.forms.workload.container.noResourceLimit': '无资源上限',
  'pages.k8s.forms.workload.container.replicas': '容器组副本数量',
  'pages.k8s.forms.workload.container.replicas.decrease': '减少容器组副本数量',
  'pages.k8s.forms.workload.container.replicas.increase': '增加容器组副本数量',
  'pages.k8s.forms.workload.container.replicas.required': '请输入副本数',
  'pages.k8s.forms.workload.container.command.required': '请输入命令',
  'pages.k8s.forms.workload.container.command.placeholder': '例如 /bin/sh',
  'pages.k8s.forms.workload.container.arg.delete': '删除参数',
  'pages.k8s.forms.workload.container.args': '参数',
  'pages.k8s.forms.workload.container.args.add': '添加参数',
  'pages.k8s.forms.workload.container.args.placeholder': '请输入参数',
  'pages.k8s.forms.workload.container.args.help':
    '容器启动命令的参数。每项填写一个参数，参数内容原样传递（可以包含逗号和空格）。',
  'pages.k8s.forms.workload.container.settings': '容器设置',
  'pages.k8s.forms.workload.container.settings.description':
    '配置容器的镜像、名称、类型和计算资源',
  'pages.k8s.forms.workload.container.image.tooltip':
    '如需使用私有镜像服务，您需要先创建镜像服务保密字典',
  'pages.k8s.forms.workload.container.image.required': '请输入容器镜像',
  'pages.k8s.forms.workload.container.image.placeholder':
    '镜像名称或路径，例如 nginx:latest',
  'pages.k8s.forms.workload.container.name': '容器名称',
  'pages.k8s.forms.workload.container.name.required': '请输入容器名称',
  'pages.k8s.forms.workload.container.name.maxLength': '容器名称最长 63 个字符',
  'pages.k8s.forms.workload.container.name.pattern':
    '容器名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.workload.container.name.duplicate': '容器名称已存在',
  'pages.k8s.forms.workload.container.name.placeholder':
    '例如 container-ab12cd34',
  'pages.k8s.forms.workload.container.type': '容器类型',
  'pages.k8s.forms.workload.container.type.worker': '工作容器',
  'pages.k8s.forms.workload.container.type.required': '请选择容器类型',
  'pages.k8s.forms.workload.container.ports': '端口设置',
  'pages.k8s.forms.workload.container.ports.description':
    '设置用于访问容器的端口。',
  'pages.k8s.forms.workload.container.ports.protocolHint':
    'HTTP/HTTPS 会在提交时按 TCP 容器端口协议生成。',
  'pages.k8s.forms.workload.container.ports.name.maxLength':
    '端口名称最长 15 个字符',
  'pages.k8s.forms.workload.container.ports.name.pattern':
    '端口名称只能包含小写字母、数字和连字符（-）',
  'pages.k8s.forms.workload.container.ports.name.placeholder': '例如 http-0',
  'pages.k8s.forms.workload.container.ports.containerPort': '容器端口',
  'pages.k8s.forms.workload.container.ports.containerPort.required':
    '请输入容器端口',
  'pages.k8s.forms.workload.container.ports.add': '添加端口',
  'pages.k8s.forms.workload.container.required': '必填',
  'pages.k8s.forms.workload.container.protocol': '协议',
  'pages.k8s.forms.workload.container.path': '路径',
  'pages.k8s.forms.workload.container.path.required': '请输入路径',
  'pages.k8s.forms.workload.container.http.scheme.aria': '请求协议',
  'pages.k8s.forms.workload.container.http.path.aria': '请求路径',
  'pages.k8s.forms.workload.container.http.port.aria': '请求端口',
  'pages.k8s.forms.workload.container.resources.cpuRequest': 'CPU 预留',
  'pages.k8s.forms.workload.container.resources.cpuRequest.exceedsLimit':
    'CPU 预留不能大于 CPU 限制',
  'pages.k8s.forms.workload.container.resources.cpuLimit': 'CPU 限制',
  'pages.k8s.forms.workload.container.resources.memoryRequest': '内存预留',
  'pages.k8s.forms.workload.container.resources.memoryRequest.exceedsLimit':
    '内存预留不能大于内存限制',
  'pages.k8s.forms.workload.container.resources.memoryLimit': '内存限制',
  'pages.k8s.forms.workload.container.resources.noRequest': '无预留',
  'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent':
    '优先使用本地镜像',
  'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent.description':
    '如果本地存在所需的镜像，则优先使用本地镜像。',
  'pages.k8s.forms.workload.container.pullPolicy.always': '每次都拉取镜像',
  'pages.k8s.forms.workload.container.pullPolicy.always.description':
    '在容器组创建及更新时，每次都尝试拉取新的镜像。',
  'pages.k8s.forms.workload.container.pullPolicy.never': '仅使用本地镜像',
  'pages.k8s.forms.workload.container.pullPolicy.never.description':
    '仅使用本地镜像。如果本地不存在所需的镜像，则会导致容器异常。',
  'pages.k8s.forms.workload.container.healthCheck': '健康检查',
  'pages.k8s.forms.workload.container.healthCheck.description':
    '添加探针以定时检查容器健康状态。',
  'pages.k8s.forms.workload.container.lifecycle': '生命周期管理',
  'pages.k8s.forms.workload.container.lifecycle.description':
    '设置容器启动后或终止前需要执行的动作，以进行环境检查或体面终止。',
  'pages.k8s.forms.workload.container.lifecycle.postStart': '启动后动作',
  'pages.k8s.forms.workload.container.lifecycle.postStart.description':
    '设置容器启动后需要执行的动作。',
  'pages.k8s.forms.workload.container.lifecycle.preStop': '终止前动作',
  'pages.k8s.forms.workload.container.lifecycle.preStop.description':
    '设置容器终止前需要执行的动作。',
  'pages.k8s.forms.workload.container.lifecycle.command.help':
    '每项填写命令的一个参数，例如 /bin/sh、-c、要执行的脚本。',
  'pages.k8s.forms.workload.container.lifecycle.remove': '移除动作',
  'pages.k8s.forms.workload.container.lifecycle.add': '添加动作',
  'pages.k8s.forms.workload.container.handler.httpGet': 'HTTP 请求',
  'pages.k8s.forms.workload.container.handler.tcpSocket': 'TCP 端口',
  'pages.k8s.forms.workload.container.startupCommand.description':
    '自定义容器启动时运行的命令。默认情况下，容器启动时将运行镜像默认命令。',
  'pages.k8s.forms.workload.container.startupCommand.add': '添加命令',
  'pages.k8s.forms.workload.container.startupCommand.help':
    '容器的启动命令。每项填写一个参数，例如 /bin/sh、-c。',
  'pages.k8s.forms.workload.container.env.description': '为容器添加环境变量。',
  'pages.k8s.forms.workload.container.env.source.custom': '自定义',
  'pages.k8s.forms.workload.container.env.source.configMap': '来自配置字典',
  'pages.k8s.forms.workload.container.env.source.secret': '来自保密字典',
  'pages.k8s.forms.workload.container.env.source.required': '请选择来源',
  'pages.k8s.forms.workload.container.env.resource': '资源',
  'pages.k8s.forms.workload.container.env.resource.required': '请选择资源',
  'pages.k8s.forms.workload.container.env.resourceKey': '资源中的键',
  'pages.k8s.forms.workload.container.env.resourceKey.required':
    '请选择资源中的键',
  'pages.k8s.forms.workload.container.env.key.pattern':
    '键只能包含字母、数字和下划线，且不能以数字开头',
  'pages.k8s.forms.workload.container.env.delete': '删除环境变量',
  'pages.k8s.forms.workload.container.env.add': '添加环境变量',
  'pages.k8s.forms.workload.container.env.helper.prefix':
    '如果没有配置字典或保密字典满足要求，您可以',
  'pages.k8s.forms.workload.container.env.helper.createConfigMap':
    '创建配置字典',
  'pages.k8s.forms.workload.container.env.helper.or': '或',
  'pages.k8s.forms.workload.container.env.helper.createSecret': '创建保密字典',
  'pages.k8s.forms.workload.container.env.helper.suffix': '。',
  'pages.k8s.forms.workload.container.securityContext': '容器安全上下文',
  'pages.k8s.forms.workload.container.securityContext.description':
    '自定义容器的权限设置。',
  'pages.k8s.forms.workload.container.resizePolicy': 'Resize 策略',
  'pages.k8s.forms.workload.container.resizePolicy.description':
    '声明 Kubernetes 1.35+ 原地调整 CPU 或内存时是否需要重启容器。',
  'pages.k8s.forms.workload.container.resizePolicy.cpu': 'CPU 调整策略',
  'pages.k8s.forms.workload.container.resizePolicy.memory': '内存调整策略',
  'pages.k8s.forms.workload.container.resizePolicy.notRequired': '无需重启',
  'pages.k8s.forms.workload.container.resizePolicy.restartContainer':
    '重启容器',
  'pages.k8s.forms.workload.container.resizePolicy.placeholder': '默认无需重启',
  'pages.k8s.forms.workload.container.resizePolicy.help':
    '当 Pod restartPolicy 为 Never 时，容器 resizePolicy 必须保持无需重启。',
  'pages.k8s.forms.workload.container.syncTimezone': '同步主机时区',
  'pages.k8s.forms.workload.container.syncTimezone.description':
    '同步容器与主机的时区。',
  'pages.k8s.forms.workload.container.probe.liveness': '存活检查',
  'pages.k8s.forms.workload.container.probe.liveness.description':
    '检查容器是否存活。',
  'pages.k8s.forms.workload.container.probe.readiness': '就绪检查',
  'pages.k8s.forms.workload.container.probe.readiness.description':
    '检查容器是否可以处理请求。',
  'pages.k8s.forms.workload.container.probe.startup': '启动检查',
  'pages.k8s.forms.workload.container.probe.startup.description':
    '检查容器是否启动成功。',
  'pages.k8s.forms.workload.container.probe.initialDelay': '初始延迟（s）',
  'pages.k8s.forms.workload.container.probe.initialDelay.min':
    '初始延迟最小值为 0',
  'pages.k8s.forms.workload.container.probe.initialDelay.description':
    '容器启动后探针启动前的延迟时间。',
  'pages.k8s.forms.workload.container.probe.timeout': '超时时间（s）',
  'pages.k8s.forms.workload.container.probe.timeout.min': '超时时间最小值为 0',
  'pages.k8s.forms.workload.container.probe.timeout.description':
    '探针超时时间。探针超时后，检查将被视为失败。取值必须为整数，最小值为 0。',
  'pages.k8s.forms.workload.container.probe.period': '检查间隔（s）',
  'pages.k8s.forms.workload.container.probe.period.min': '检查间隔最小值为 1',
  'pages.k8s.forms.workload.container.probe.period.description':
    '执行检查的时间间隔。取值必须为整数，最小值为 1。',
  'pages.k8s.forms.workload.container.probe.successThreshold': '成功阈值',
  'pages.k8s.forms.workload.container.probe.successThreshold.min':
    '成功阈值最小值为 1',
  'pages.k8s.forms.workload.container.probe.successThreshold.description':
    '检查失败后再次被视为成功所需的最小连续成功次数。最小值为 1。对于存活探针和启动探针，此参数值必须为 1。',
  'pages.k8s.forms.workload.container.probe.failureThreshold': '失败阈值',
  'pages.k8s.forms.workload.container.probe.failureThreshold.min':
    '失败阈值最小值为 1',
  'pages.k8s.forms.workload.container.probe.failureThreshold.description':
    '检查成功后再次被视为失败所需的最小连续失败次数。最小值为 1。',
  'pages.k8s.forms.workload.container.probe.timing.required': '请输入{label}',
  'pages.k8s.forms.workload.container.probe.command.placeholder': '例如 cat',
  'pages.k8s.forms.workload.container.probe.command.help':
    '每项填写命令的一个参数，例如 cat、/tmp/healthy。',
  'pages.k8s.forms.workload.container.probe.remove': '移除探针',
  'pages.k8s.forms.workload.container.probe.add': '添加探针',
  'pages.k8s.forms.workload.container.security.capability.delete':
    '删除{label}权能',
  'pages.k8s.forms.workload.container.security.access': '访问控制',
  'pages.k8s.forms.workload.container.security.privileged.description':
    '以主机上的 root 用户运行容器进程。',
  'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation':
    '允许特权提升',
  'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation.description':
    '允许容器进程获取比父进程更多的特权。当特权模式启用时，此选项默认启用。',
  'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem':
    '根目录只读',
  'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem.description':
    '将容器文件系统的根目录设置为只读。',
  'pages.k8s.forms.workload.container.security.userGroup': '用户和用户组',
  'pages.k8s.forms.workload.container.security.runAsNonRoot':
    '仅允许非 root 用户运行',
  'pages.k8s.forms.workload.container.security.runAsNonRoot.description':
    '启动容器之前检查容器是否将以 root 用户运行。如果容器将以 root 用户运行则不启动容器。',
  'pages.k8s.forms.workload.container.security.runAsUser.placeholder':
    '请输入用户 ID',
  'pages.k8s.forms.workload.container.security.runAsUser.help':
    '执行容器进程入口点的 UID。默认为镜像元数据中指定的 UID。',
  'pages.k8s.forms.workload.container.security.group': '用户组',
  'pages.k8s.forms.workload.container.security.runAsGroup.placeholder':
    '请输入用户组 ID',
  'pages.k8s.forms.workload.container.security.runAsGroup.help':
    '执行容器进程入口点的 GID。默认为容器运行时的默认 GID。',
  'pages.k8s.forms.workload.container.security.seLinux': 'SELinux 上下文',
  'pages.k8s.forms.workload.container.security.seLinux.level': '等级',
  'pages.k8s.forms.workload.container.security.seLinux.level.placeholder':
    '请输入 SELinux 等级',
  'pages.k8s.forms.workload.container.security.seLinux.role.placeholder':
    '请输入 SELinux 角色',
  'pages.k8s.forms.workload.container.security.seLinux.type.placeholder':
    '请输入 SELinux 类型',
  'pages.k8s.forms.workload.container.security.seLinux.user.placeholder':
    '请输入 SELinux 用户',
  'pages.k8s.forms.workload.container.security.capabilities': '权能',
  'pages.k8s.forms.workload.container.security.capabilities.add.placeholder':
    '例如 NET_ADMIN',
  'pages.k8s.forms.workload.container.security.capabilities.drop.placeholder':
    '例如 ALL',
  'pages.k8s.forms.workload.container.security.seccomp': 'Seccomp 配置',
  'pages.k8s.forms.workload.container.security.seccomp.type': '配置类型',
  'pages.k8s.forms.workload.container.security.seccomp.type.placeholder':
    '请选择 Seccomp 类型',
  'pages.k8s.forms.workload.container.security.seccomp.localhost':
    '本地配置路径',
  'pages.k8s.forms.workload.container.security.seccomp.localhost.required':
    '请输入本地配置路径',
  'pages.k8s.forms.workload.container.security.seccomp.localhost.placeholder':
    '例如 profiles/audit.json',
  'pages.k8s.forms.workload.container.security.seccomp.help':
    'RuntimeDefault 使用容器运行时默认配置；Localhost 需要填写节点上的配置文件路径。',
  'pages.k8s.forms.workload.step.pod': '容器组设置',
  'pages.k8s.forms.workload.selectField': '请选择{label}',
  'pages.k8s.forms.workload.listSeparator': '、',
  'pages.k8s.forms.workload.metadata.description': '为资源添加元数据',
  'pages.k8s.forms.workload.check.containersRequired':
    '请先添加容器并填写容器名称和镜像',
  'pages.k8s.forms.workload.check.workerContainerRequired':
    '请至少添加一个工作容器',
  'pages.k8s.forms.workload.check.containerNameDuplicate': '容器名称不能重复',
  'pages.k8s.forms.workload.check.nameNamespaceRequired':
    '请先填写名称和命名空间',
  'pages.k8s.forms.workload.yaml.invalid': 'YAML 格式不正确，请检查后重试',
  'pages.k8s.forms.workload.yaml.invalidObject':
    'YAML 内容必须是有效的资源对象',
  'pages.k8s.forms.workload.termination.title': '容器组优雅终止',
  'pages.k8s.forms.workload.termination.enable': '启用容器组优雅终止',
  'pages.k8s.forms.workload.termination.tip':
    '设置容器终止前等待的时间，超时后容器将强制终止。',
  'pages.k8s.forms.workload.termination.description':
    '设置容器终止前的等待时间。',
  'pages.k8s.forms.workload.termination.config': '终止配置',
  'pages.k8s.forms.workload.termination.gracePeriod': '终止宽限时间 (s)',
  'pages.k8s.forms.workload.termination.gracePeriod.required':
    '请输入终止宽限时间',
  'pages.k8s.forms.workload.podMetadata.tip': '为容器组副本添加元数据。',
  'pages.k8s.forms.workload.node.role.controlPlane': '控制平面节点',
  'pages.k8s.forms.workload.node.role.worker': '工作节点',
  'pages.k8s.forms.workload.node.status.unschedulable': '已禁止调度',
  'pages.k8s.forms.workload.node.assign': '指定节点',
  'pages.k8s.forms.workload.node.assign.description':
    '将容器副本分配给特定节点。',
  'pages.k8s.forms.workload.node.select': '选择节点',
  'pages.k8s.forms.workload.node.select.description':
    '将容器组副本分配给特定的节点。您可以使用标签选择节点或手动指定节点',
  'pages.k8s.forms.workload.node.selector.add': '添加节点选择器',
  'pages.k8s.forms.workload.node.selector.delete': '删除节点选择器',
  'pages.k8s.forms.workload.node.selector.keyFirst':
    '请先填写已有节点选择器的键。',
  'pages.k8s.forms.workload.scheduling.label': '容器组调度规则',
  'pages.k8s.forms.workload.scheduling.tip': '设置容器组副本调度到节点的规则',
  'pages.k8s.forms.workload.scheduling.default': '默认规则',
  'pages.k8s.forms.workload.scheduling.default.description':
    '按照默认的规则将容器组副本调度到节点。',
  'pages.k8s.forms.workload.scheduling.spread': '分散调度',
  'pages.k8s.forms.workload.scheduling.spread.description':
    '尽可能将容器组副本调度到不同的节点上。',
  'pages.k8s.forms.workload.scheduling.centralized': '集中调度',
  'pages.k8s.forms.workload.scheduling.centralized.description':
    '尽可能将容器组副本调度到同一节点上。',
  'pages.k8s.forms.workload.scheduling.custom': '自定义规则',
  'pages.k8s.forms.workload.scheduling.custom.description':
    '按照自定义的规则将容器组副本调度到节点。',
  'pages.k8s.forms.workload.scheduling.type.affinity': '与目标调度到一起',
  'pages.k8s.forms.workload.scheduling.type.antiAffinity': '远离目标调度',
  'pages.k8s.forms.workload.scheduling.strategy.preferred': '尽可能匹配',
  'pages.k8s.forms.workload.scheduling.strategy.required': '请选择策略',
  'pages.k8s.forms.workload.scheduling.strategy.must': '必须匹配',
  'pages.k8s.forms.workload.scheduling.target.required': '请选择目标',
  'pages.k8s.forms.workload.scheduling.target.empty': '暂无目标',
  'pages.k8s.forms.workload.scheduling.clearRule': '清空自定义调度规则',
  'pages.k8s.forms.workload.podSecurity.title': '容器组安全上下文',
  'pages.k8s.forms.workload.podSecurity.enable': '启用容器组安全上下文',
  'pages.k8s.forms.workload.podSecurity.tip':
    '如果容器组安全上下文和容器安全上下文中都设置了用户、用户组和 SELinux 上下文，容器安全上下文中的设置将覆盖容器组安全上下文中的设置。',
  'pages.k8s.forms.workload.podSecurity.description':
    '自定义容器组的权限设置。',
  'pages.k8s.forms.workload.podSecurity.userAndGroup': '用户和用户组',
  'pages.k8s.forms.workload.podSecurity.runAsNonRoot': '仅允许非 root 用户运行',
  'pages.k8s.forms.workload.podSecurity.runAsNonRoot.tip':
    '启动容器之前检查容器是否将以 root 用户运行。如果容器将以 root 用户运行则不启动容器',
  'pages.k8s.forms.workload.podSecurity.runAsUser.tip':
    '执行容器进程入口点的 UID。默认为镜像元数据中指定的 UID',
  'pages.k8s.forms.workload.podSecurity.runAsUser.placeholder': '请输入用户 ID',
  'pages.k8s.forms.workload.podSecurity.runAsGroup': '用户组',
  'pages.k8s.forms.workload.podSecurity.runAsGroup.tip':
    '执行容器进程入口点的 GID。默认为容器运行时的默认 GID',
  'pages.k8s.forms.workload.podSecurity.runAsGroup.placeholder':
    '请输入用户组 ID',
  'pages.k8s.forms.workload.podSecurity.fsGroup': '文件系统组',
  'pages.k8s.forms.workload.podSecurity.fsGroup.tip':
    '挂载卷时使用的 FSGroup。',
  'pages.k8s.forms.workload.podSecurity.fsGroup.placeholder':
    '请输入文件系统组 ID',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy': '附加组策略',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.tip':
    'Kubernetes 1.35 GA。Strict 仅附加显式声明的组，避免镜像 /etc/group 隐式组影响卷权限。',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.placeholder':
    '默认 Merge',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups': '附加用户组',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups.tip':
    '多个 GID 可使用英文逗号或换行分隔。',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups.placeholder':
    '例如 3000,4000',
  'pages.k8s.forms.workload.podSecurity.seLinux': 'SELinux 上下文',
  'pages.k8s.forms.workload.podSecurity.seLinux.level': '等级',
  'pages.k8s.forms.workload.podSecurity.seLinux.level.placeholder':
    '请输入 SELinux 等级',
  'pages.k8s.forms.workload.podSecurity.seLinux.role.placeholder':
    '请输入 SELinux 角色',
  'pages.k8s.forms.workload.podSecurity.seLinux.type.placeholder':
    '请输入 SELinux 类型',
  'pages.k8s.forms.workload.podSecurity.seLinux.user.placeholder':
    '请输入 SELinux 用户',
  'pages.k8s.forms.workload.updateStrategy.tip':
    '配置工作负载更新容器组副本时采用的策略',
  'pages.k8s.forms.workload.updateStrategy.rolling': '滚动更新（推荐）',
  'pages.k8s.forms.workload.updateStrategy.rolling.description':
    '用新容器组副本逐步替换旧容器组副本。升级过程中业务流量会负载均衡到新旧容器组副本上，业务不会中断。',
  'pages.k8s.forms.workload.updateStrategy.recreate': '同时更新',
  'pages.k8s.forms.workload.updateStrategy.recreate.description':
    '删除全部旧容器组副本再创建新容器组副本。升级过程中业务会中断。',
  'pages.k8s.forms.workload.updateStrategy.onDelete': '删除容器组时更新',
  'pages.k8s.forms.workload.updateStrategy.onDelete.description':
    '需要手动删除容器组副本才可对其进行更新。',
  'pages.k8s.forms.workload.updateStrategy.rollingSettings': '滚动更新设置',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable':
    '最大不可用容器组数量',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable.extra':
    '更新过程中允许的不可用容器组副本的最大数量或百分比。',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable.required':
    '请输入最大不可用容器组数量',
  'pages.k8s.forms.workload.updateStrategy.intOrPercent':
    '请输入整数或百分比，例如 1 或 25%',
  'pages.k8s.forms.workload.updateStrategy.maxSurge': '最大多余容器组数量',
  'pages.k8s.forms.workload.updateStrategy.maxSurge.tip':
    '更新过程中允许的多余容器组副本的最大数量或百分比',
  'pages.k8s.forms.workload.updateStrategy.maxSurge.required':
    '请输入最大多余容器组数量',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds':
    '容器组就绪最短运行时长（s）',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds.extra':
    '容器组副本被视为就绪所需要的最短稳定运行时长。',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds.required':
    '请输入容器组就绪最短运行时长',
  'pages.k8s.forms.workload.updateStrategy.partition': '容器组副本分组序号',
  'pages.k8s.forms.workload.updateStrategy.partition.extra':
    '设置一个分组序号以将容器组副本分成两组。更新有状态副本集时，只有序号大于或等于分组序号的容器组副本会被更新。',
  'pages.k8s.forms.workload.updateStrategy.partition.required':
    '请输入容器组副本分组序号',
  'pages.k8s.forms.workload.storage.type.emptyDir': '临时卷',
  'pages.k8s.forms.workload.storage.type.hostPath': 'HostPath 卷',
  'pages.k8s.forms.workload.storage.mountMode.readWrite': '读写',
  'pages.k8s.forms.workload.storage.mountMode.none': '不挂载',
  'pages.k8s.forms.workload.storage.mountMode.placeholder': '请选择挂载方式',
  'pages.k8s.forms.workload.storage.defaultStorageClass': '默认存储类',
  'pages.k8s.forms.workload.storage.subPath.invalid':
    '请输入绝对路径或相对路径，且不能包含 ..',
  'pages.k8s.forms.workload.storage.mountPath.required': '请输入挂载路径',
  'pages.k8s.forms.workload.storage.absolutePath': '请输入以 / 开头的绝对路径',
  'pages.k8s.forms.workload.storage.mountPath.incomplete': '请完善挂载路径设置',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate.add.description':
    '添加持久卷声明模板为有状态副本集的每个容器组挂载一个持久卷',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate.add':
    '添加持久卷声明模板',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate': '持久卷声明模板',
  'pages.k8s.forms.workload.storage.volume.mount.description':
    '为容器挂载持久卷、临时卷或 HostPath 卷',
  'pages.k8s.forms.workload.storage.volume.mount': '挂载卷',
  'pages.k8s.forms.workload.storage.config.mount.description':
    '为容器挂载配置字典或保密字典',
  'pages.k8s.forms.workload.storage.config.mount': '挂载配置字典或保密字典',
  'pages.k8s.forms.workload.storage.pvc.required': '请选择持久卷声明',
  'pages.k8s.forms.workload.storage.pvc.description':
    '将根据持久卷声明创建的持久卷挂载到容器',
  'pages.k8s.forms.workload.storage.pvc.select': '选择持久卷声明',
  'pages.k8s.forms.workload.storage.configResource.required': '请选择{label}。',
  'pages.k8s.forms.workload.storage.configResource.description':
    '将{label}挂载到容器。',
  'pages.k8s.forms.workload.storage.configResource.select': '选择{label}',
  'pages.k8s.forms.workload.storage.hostPath.info':
    '使用 HostPath 卷将主机文件系统中的文件或目录挂载到容器中。',
  'pages.k8s.forms.workload.storage.volumeName': '卷名称',
  'pages.k8s.forms.workload.storage.volumeName.maxLength':
    '卷名称最长 63 个字符',
  'pages.k8s.forms.workload.storage.volumeName.pattern':
    '卷名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.workload.storage.hostPath': '主机路径',
  'pages.k8s.forms.workload.storage.hostPath.required': '请输入主机路径',
  'pages.k8s.forms.workload.storage.sizeLimit': '容量上限',
  'pages.k8s.forms.workload.storage.sizeLimit.required': '请输入容量上限',
  'pages.k8s.forms.workload.storage.sizeLimit.tip':
    '设置当前存储卷的容量上限，默认值为 200Mi，最大值不能超过 2Gi',
  'pages.k8s.forms.workload.storage.quantity.invalid':
    '请输入合法的容量，例如 200Mi 或 2Gi',
  'pages.k8s.forms.workload.storage.quantity.placeholder': '例如 200Mi 或 2Gi',
  'pages.k8s.forms.workload.storage.pvcPrefix': 'PVC 名称前缀',
  'pages.k8s.forms.workload.storage.pvcPrefix.tip':
    '持久卷声明名称的前缀。前缀只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 253 个字符',
  'pages.k8s.forms.workload.storage.pvcPrefix.required': '请输入 PVC 名称前缀',
  'pages.k8s.forms.workload.storage.pvcPrefix.maxLength':
    'PVC 名称前缀最长 253 个字符',
  'pages.k8s.forms.workload.storage.pvcPrefix.pattern':
    'PVC 名称前缀只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.workload.storage.storageClass.tip':
    '选择一个存储类来创建特定种类的卷',
  'pages.k8s.forms.workload.storage.storageClass.required': '请选择存储类',
  'pages.k8s.forms.workload.storage.storageClass.empty': '未发现可用存储类',
  'pages.k8s.forms.workload.storage.accessMode.tip':
    '选择存储类支持的一种或多种访问模式',
  'pages.k8s.forms.workload.storage.volumeCapacity': '卷容量',
  'pages.k8s.forms.workload.storage.volumeCapacity.required': '请输入卷容量',
  'pages.k8s.forms.workload.storage.subPath.title': '指定子路径',
  'pages.k8s.forms.workload.storage.subPath.description':
    '指定需要挂载到容器的卷子路径。',
  'pages.k8s.forms.workload.storage.subPath': '子路径',
  'pages.k8s.forms.workload.storage.containersFirst': '请先添加容器',
  'pages.k8s.forms.workload.storage.mountPath': '挂载路径',
  'pages.k8s.forms.workload.storage.key.required': '请选择键',
  'pages.k8s.forms.workload.storage.path.required': '请输入路径',
  'pages.k8s.forms.workload.storage.relativePath.required': '请使用相对路径。',
  'pages.k8s.forms.workload.storage.relativePath': '相对路径',
  'pages.k8s.forms.workload.storage.keyPath.delete': '删除键映射',
  'pages.k8s.forms.workload.storage.specificKeys': '选择特定键',
  'pages.k8s.forms.workload.storage.specificKeys.description':
    '选择需要挂载到容器的特定键',
  'pages.k8s.forms.workload.storage.volumeType': '卷类型',
  'pages.k8s.forms.workload.storage.volumeTypeOf': '卷类型：{type}',
  'pages.k8s.forms.workload.storage.mount.readWrite': '（读写）',
  'pages.k8s.forms.workload.storage.mount.subPath': '· 子路径：{subPath}',
  'pages.k8s.forms.workload.storage.delete': '删除存储配置',
  'pages.k8s.forms.workload.storage.edit': '编辑存储配置',
  'pages.k8s.forms.job.title': '创建任务',
  'pages.k8s.forms.job.step.strategy': '策略设置',
  'pages.k8s.forms.job.restartPolicy': '重启策略',
  'pages.k8s.forms.job.restartPolicy.required': '请选择重启策略',
  'pages.k8s.forms.job.restartPolicy.never': '重新创建容器组',
  'pages.k8s.forms.job.restartPolicy.onFailure': '重启容器',
  'pages.k8s.forms.job.backoffLimit': '最大重试次数',
  'pages.k8s.forms.job.backoffLimit.extra':
    '将任务标记为失败前的最大重试次数。默认值为 6。',
  'pages.k8s.forms.job.backoffLimit.placeholder': '请输入最大重试次数',
  'pages.k8s.forms.job.completions': '容器组完成数量',
  'pages.k8s.forms.job.completions.extra':
    '将任务标记为完成所需成功运行的容器组数量。',
  'pages.k8s.forms.job.completions.placeholder': '请输入容器组完成数量',
  'pages.k8s.forms.job.parallelism': '并行容器组数量',
  'pages.k8s.forms.job.parallelism.extra': '并行运行的容器组数量。',
  'pages.k8s.forms.job.parallelism.placeholder': '请输入并行容器组数量',
  'pages.k8s.forms.job.activeDeadlineSeconds': '最大运行时间（s）',
  'pages.k8s.forms.job.activeDeadlineSeconds.extra':
    '任务的最大运行时间。任务达到最大运行时间时将被结束。',
  'pages.k8s.forms.job.activeDeadlineSeconds.placeholder': '请输入最大运行时间',
  'pages.k8s.forms.cronjob.title': '创建定时任务',
  'pages.k8s.forms.cronjob.project': '项目',
  'pages.k8s.forms.cronjob.project.tip':
    '项目用于对资源进行分组管理和控制不同用户的资源管理权限',
  'pages.k8s.forms.cronjob.schedule': '定时计划',
  'pages.k8s.forms.cronjob.schedule.tip':
    '为定时任务设置定时计划。Kubernetes 会按 CronJob 的时区设置解析该计划',
  'pages.k8s.forms.cronjob.schedule.required': '请选择或输入定时计划',
  'pages.k8s.forms.cronjob.schedule.invalid':
    '请输入合法的 cron 表达式，例如 */5 * * * * 或 @hourly',
  'pages.k8s.forms.cronjob.schedule.placeholder':
    '请选择或输入 cron 表达式，例如 */5 * * * *',
  'pages.k8s.forms.cronjob.schedule.quickPick': '{label}（{value}）',
  'pages.k8s.forms.cronjob.schedule.everyMinute': '每分钟',
  'pages.k8s.forms.cronjob.schedule.every5Minutes': '每 5 分钟',
  'pages.k8s.forms.cronjob.schedule.hourly': '每小时',
  'pages.k8s.forms.cronjob.schedule.daily': '每天',
  'pages.k8s.forms.cronjob.schedule.weekly': '每周',
  'pages.k8s.forms.cronjob.startingDeadline': '最大启动延后时间（s）',
  'pages.k8s.forms.cronjob.startingDeadline.tip':
    '由于某种原因未能按计划启动任务时，任务启动的最大延迟时间',
  'pages.k8s.forms.cronjob.startingDeadline.placeholder':
    '请输入最大启动延后时间',
  'pages.k8s.forms.cronjob.successfulHistory': '成功任务保留数量',
  'pages.k8s.forms.cronjob.successfulHistory.tip':
    '允许保留的成功任务的个数。默认值为 3',
  'pages.k8s.forms.cronjob.successfulHistory.placeholder':
    '请输入成功任务保留数量',
  'pages.k8s.forms.cronjob.failedHistory': '失败任务保留数量',
  'pages.k8s.forms.cronjob.failedHistory.tip':
    '允许保留的失败任务的个数。默认值为 1',
  'pages.k8s.forms.cronjob.failedHistory.placeholder': '请输入失败任务保留数量',
  'pages.k8s.forms.cronjob.concurrency.tip':
    '定时任务创建的多个任务发生重叠时，系统采取的策略',
  'pages.k8s.forms.cronjob.concurrency.required': '请选择并发策略',
  'pages.k8s.forms.cronjob.concurrency.allow': '允许并发运行',
  'pages.k8s.forms.cronjob.concurrency.forbid': '跳过新任务',
  'pages.k8s.forms.cronjob.concurrency.replace': '替换旧任务',
  'pages.k8s.forms.cronjob.timeZone': '时区',
  'pages.k8s.forms.cronjob.timeZone.tip':
    '对应 Kubernetes CronJob 的 spec.timeZone。不填写时由集群控制器使用默认时区',
  'pages.k8s.forms.cronjob.timeZone.placeholder': '例如 Asia/Shanghai',
  'pages.k8s.forms.shared.input.placeholder': '请输入',
  'pages.k8s.forms.shared.prevStep': '上一步',
  'pages.k8s.forms.shared.nextStep': '下一步',
  'pages.k8s.forms.shared.toggleYamlMode': '切换 YAML 编辑模式',
  'pages.k8s.forms.shared.metadata.description': '为资源添加标签与注解（可选）',
  'pages.k8s.forms.editRegistry.serviceSettings': '编辑服务设置',
  'pages.k8s.forms.editRegistry.serviceExternalAccess': '编辑外部访问',
  'pages.k8s.forms.editRegistry.ingressRules': '编辑路由规则',
  'pages.k8s.forms.editRegistry.ingressAnnotations': '编辑注解',
  'pages.k8s.forms.editRegistry.pvcExpand': '扩容',
  'pages.k8s.forms.editRegistry.pvcClone': '克隆',
  'pages.k8s.forms.editRegistry.storageClassDefault': '设为默认 / 取消默认',
  'pages.k8s.forms.editRegistry.storageClassExpansion': '允许卷扩容',
  'pages.k8s.forms.serviceaccount.title': '创建服务账户',
  'pages.k8s.forms.serviceaccount.name.length': '名称长度需在 1 到 63 位之间',
  'pages.k8s.forms.serviceaccount.name.pattern':
    '名称仅支持小写字母、数字和中划线，且不能以中划线开头或结尾',
  'pages.k8s.forms.serviceaccount.metadata.keyRequired': '请填写{title}的键',
  'pages.k8s.forms.serviceaccount.metadata.keyDuplicate': '{title}的键不能重复',
  'pages.k8s.forms.serviceaccount.imagePullSecrets': '镜像拉取密钥',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.extra':
    '容器组使用该服务账户时，默认用这些保密字典拉取镜像。可直接输入名称。',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.placeholder':
    '请选择或输入保密字典名称',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.invalid':
    '镜像拉取密钥名称不合法：{name}',
  'pages.k8s.forms.hpa.title': '创建水平伸缩',
  'pages.k8s.forms.hpa.step.target': '伸缩目标',
  'pages.k8s.forms.hpa.step.metrics': '伸缩指标',
  'pages.k8s.forms.hpa.step.behavior': '行为策略',
  'pages.k8s.forms.hpa.metadata.description': '为水平伸缩资源添加元数据',
  'pages.k8s.forms.hpa.error.metricLabel': '指标 {index}',
  'pages.k8s.forms.hpa.error.resourceName': '{label}：请选择资源名称',
  'pages.k8s.forms.hpa.error.container': '{label}：请输入容器名称',
  'pages.k8s.forms.hpa.error.metricName': '{label}：请输入指标名称',
  'pages.k8s.forms.hpa.error.describedObject':
    '{label}：请完整填写对象 API 版本、类型和名称',
  'pages.k8s.forms.hpa.error.averageUtilization': '{label}：请输入平均利用率',
  'pages.k8s.forms.hpa.error.averageValue': '{label}：请输入平均目标值',
  'pages.k8s.forms.hpa.error.value': '{label}：请输入目标值',
  'pages.k8s.forms.hpa.error.nameNamespace': '请填写名称和命名空间',
  'pages.k8s.forms.hpa.error.target': '请完整填写伸缩目标',
  'pages.k8s.forms.hpa.error.policiesRequired':
    '{label}：请至少添加一条伸缩策略',
  'pages.k8s.forms.hpa.errorSeparator': '，',
  'pages.k8s.forms.hpa.target.pick': '选择工作负载',
  'pages.k8s.forms.hpa.target.pick.description':
    '从当前命名空间选择 HPA 管理副本数的工作负载。',
  'pages.k8s.forms.hpa.target.repick': '重新选择',
  'pages.k8s.forms.hpa.target.namespaceFirst': '请先选择命名空间',
  'pages.k8s.forms.hpa.target.description':
    '可从当前命名空间选择工作负载自动回填，也可以直接填写其他实现 scale 子资源的对象。',
  'pages.k8s.forms.hpa.target.workload': '目标工作负载',
  'pages.k8s.forms.hpa.target.hint':
    '选择同命名空间下可被 HPA 引用的工作负载，名称会写入 scaleTargetRef。',
  'pages.k8s.forms.hpa.targetType': '目标类型',
  'pages.k8s.forms.hpa.targetType.required': '请选择目标类型',
  'pages.k8s.forms.hpa.targetName': '目标名称',
  'pages.k8s.forms.hpa.targetName.required': '请输入目标名称',
  'pages.k8s.forms.hpa.targetApiVersion': '目标 API 版本',
  'pages.k8s.forms.hpa.targetApiVersion.required': '请输入目标 API 版本',
  'pages.k8s.forms.hpa.targetApiVersion.tooltip':
    '选择工作负载时会自动带出，引用其他实现 scale 子资源的对象时可手动调整。',
  'pages.k8s.forms.hpa.apiVersion.placeholder': '如 apps/v1',
  'pages.k8s.forms.hpa.metricType': '指标类型',
  'pages.k8s.forms.hpa.metricType.required': '请选择指标类型',
  'pages.k8s.forms.hpa.metricType.Resource': '资源指标',
  'pages.k8s.forms.hpa.metricType.ContainerResource': '容器资源指标',
  'pages.k8s.forms.hpa.metricType.Pods': 'Pod 指标',
  'pages.k8s.forms.hpa.metricType.Object': '对象指标',
  'pages.k8s.forms.hpa.metricType.External': '外部指标',
  'pages.k8s.forms.hpa.metricType.Resource.description':
    '按 Pod 的 CPU 或内存资源使用情况触发伸缩。',
  'pages.k8s.forms.hpa.metricType.ContainerResource.description':
    '按指定容器的 CPU 或内存资源使用情况触发伸缩。',
  'pages.k8s.forms.hpa.metricType.Pods.description':
    '按每个 Pod 上报的自定义指标平均值触发伸缩。',
  'pages.k8s.forms.hpa.metricType.Object.description':
    '按指定 Kubernetes 对象上的指标触发伸缩。',
  'pages.k8s.forms.hpa.metricType.External.description':
    '按集群外部系统提供的指标触发伸缩。',
  'pages.k8s.forms.hpa.metric': '指标',
  'pages.k8s.forms.hpa.metric.title': '指标 {index} · {type}',
  'pages.k8s.forms.hpa.metric.description.empty': '选择指标来源后配置目标值。',
  'pages.k8s.forms.hpa.metric.delete': '删除伸缩指标',
  'pages.k8s.forms.hpa.metric.add': '添加指标',
  'pages.k8s.forms.hpa.metrics.description':
    '至少配置一条指标。不同来源会输出到 resource、containerResource、pods、object 或 external 字段。',
  'pages.k8s.forms.hpa.metrics.required': '请至少添加一条伸缩指标',
  'pages.k8s.forms.hpa.containerName': '容器名称',
  'pages.k8s.forms.hpa.containerName.required': '请输入容器名称',
  'pages.k8s.forms.hpa.containerName.placeholder': '如 nginx',
  'pages.k8s.forms.hpa.resourceName': '资源名称',
  'pages.k8s.forms.hpa.resourceName.required': '请选择资源名称',
  'pages.k8s.forms.hpa.metricName': '指标名称',
  'pages.k8s.forms.hpa.metricName.required': '请输入指标名称',
  'pages.k8s.forms.hpa.metricName.placeholder': '如 requests_per_second',
  'pages.k8s.forms.hpa.objectApiVersion': '对象 API 版本',
  'pages.k8s.forms.hpa.objectApiVersion.required': '请输入对象 API 版本',
  'pages.k8s.forms.hpa.objectKind.required': '请输入对象类型',
  'pages.k8s.forms.hpa.objectKind.placeholder': '如 Deployment',
  'pages.k8s.forms.hpa.objectName.required': '请输入对象名称',
  'pages.k8s.forms.hpa.targetType.Utilization': '平均利用率',
  'pages.k8s.forms.hpa.targetType.AverageValue': '平均值',
  'pages.k8s.forms.hpa.targetType.Value': '总量值',
  'pages.k8s.forms.hpa.targetValue.required': '请输入目标值',
  'pages.k8s.forms.hpa.averageUtilization.required': '请输入平均利用率',
  'pages.k8s.forms.hpa.averageUtilization.range': '平均利用率范围为 1-100',
  'pages.k8s.forms.hpa.averageValue': '平均目标值',
  'pages.k8s.forms.hpa.averageValue.placeholder': '如 500m / 512Mi / 100',
  'pages.k8s.forms.hpa.value': '目标值',
  'pages.k8s.forms.hpa.value.placeholder': '如 100',
  'pages.k8s.forms.hpa.selector': '指标选择器',
  'pages.k8s.forms.hpa.selector.description':
    '可选配置，留空时表示不限制指标标签；输出到 metric.selector。',
  'pages.k8s.forms.hpa.selector.addLabel': '添加标签',
  'pages.k8s.forms.hpa.selector.deleteLabel': '删除指标标签',
  'pages.k8s.forms.hpa.selector.expressionKey': '表达式键',
  'pages.k8s.forms.hpa.selector.expressionKey.required': '请输入表达式键',
  'pages.k8s.forms.hpa.selector.operator': '操作符',
  'pages.k8s.forms.hpa.selector.operator.required': '请选择操作符',
  'pages.k8s.forms.hpa.selector.values.required': '请输入匹配值',
  'pages.k8s.forms.hpa.selector.values.placeholder': '多个值用逗号或换行分隔',
  'pages.k8s.forms.hpa.selector.deleteExpression': '删除指标表达式',
  'pages.k8s.forms.hpa.selector.addExpression': '添加表达式',
  'pages.k8s.forms.hpa.replicas': '副本范围',
  'pages.k8s.forms.hpa.replicas.description': '设置 HPA 可调整的副本数上下限。',
  'pages.k8s.forms.hpa.replicas.tooltip':
    'maxReplicas 为必填字段，minReplicas 留空时 Kubernetes 默认按 1 处理。',
  'pages.k8s.forms.hpa.minReplicas': '最小副本数',
  'pages.k8s.forms.hpa.minReplicas.min': '最小副本数不能小于 1',
  'pages.k8s.forms.hpa.minReplicas.aboveMax': '最小副本数不能大于最大副本数',
  'pages.k8s.forms.hpa.minReplicas.placeholder': '请输入最小副本数',
  'pages.k8s.forms.hpa.maxReplicas': '最大副本数',
  'pages.k8s.forms.hpa.maxReplicas.required': '请输入最大副本数',
  'pages.k8s.forms.hpa.maxReplicas.min': '最大副本数不能小于 1',
  'pages.k8s.forms.hpa.maxReplicas.belowMin': '最大副本数不能小于最小副本数',
  'pages.k8s.forms.hpa.behavior': '伸缩行为',
  'pages.k8s.forms.hpa.behavior.params': '伸缩参数',
  'pages.k8s.forms.hpa.behavior.selectPolicy': '策略选择',
  'pages.k8s.forms.hpa.behavior.stabilizationWindow': '稳定窗口',
  'pages.k8s.forms.hpa.behavior.stabilizationWindow.range':
    '稳定窗口范围为 0-3600 秒',
  'pages.k8s.forms.hpa.behavior.seconds': '秒',
  'pages.k8s.forms.hpa.behavior.tolerance': '容忍阈值',
  'pages.k8s.forms.hpa.behavior.tolerance.tooltip':
    '写入 behavior.scaleUp/scaleDown.tolerance，可填写如 0.1。',
  'pages.k8s.forms.hpa.behavior.tolerance.placeholder': '可选，如 0.1',
  'pages.k8s.forms.hpa.behavior.policies': '伸缩策略',
  'pages.k8s.forms.hpa.scaleUp': '扩容策略',
  'pages.k8s.forms.hpa.scaleUp.description':
    '控制副本数上升时的选择策略、稳定窗口和变化速率。',
  'pages.k8s.forms.hpa.scaleDown': '缩容策略',
  'pages.k8s.forms.hpa.scaleDown.description':
    '控制副本数下降时的选择策略、稳定窗口和变化速率。',
  'pages.k8s.forms.hpa.policy.percent': '百分比',
  'pages.k8s.forms.hpa.policy.type': '策略类型',
  'pages.k8s.forms.hpa.policy.type.required': '请选择策略类型',
  'pages.k8s.forms.hpa.policy.value': '策略值',
  'pages.k8s.forms.hpa.policy.value.required': '请输入策略值',
  'pages.k8s.forms.hpa.policy.value.min': '策略值不能小于 1',
  'pages.k8s.forms.hpa.policy.period': '周期秒数',
  'pages.k8s.forms.hpa.policy.period.required': '请输入周期秒数',
  'pages.k8s.forms.hpa.policy.period.range': '周期范围为 1-1800 秒',
  'pages.k8s.forms.hpa.policy.required': '请至少添加一条伸缩策略',
  'pages.k8s.forms.hpa.policy.delete': '删除伸缩策略',
  'pages.k8s.forms.hpa.policy.add': '添加策略',
  'pages.k8s.forms.binding.title': '创建 {kind}',
  'pages.k8s.forms.binding.roleRef': '引用角色',
  'pages.k8s.forms.binding.subjects': '授权主体',
  'pages.k8s.forms.binding.name.tooltip':
    '名称只能包含小写字母、数字、连字符（-）和点（.）',
  'pages.k8s.forms.binding.name.pattern':
    '名称只能包含小写字母、数字、连字符（-）和点（.），且不能以连字符或点开头结尾',
  'pages.k8s.forms.binding.namespace.notNeeded':
    'ClusterRoleBinding 不需要命名空间',
  'pages.k8s.forms.binding.namespaceFirst': '请先选择命名空间',
  'pages.k8s.forms.binding.roleKind': '引用角色类型',
  'pages.k8s.forms.binding.roleKind.required': '请选择引用角色类型',
  'pages.k8s.forms.binding.roleKind.clusterOnly':
    'ClusterRoleBinding 只能绑定 ClusterRole',
  'pages.k8s.forms.binding.roleKind.hint':
    'RoleBinding 可绑定同命名空间 Role 或全集群 ClusterRole',
  'pages.k8s.forms.binding.roleName.extra':
    '创建后引用的角色不可修改；可以引用尚未创建的角色。',
  'pages.k8s.forms.binding.roleName.required': '请选择引用角色',
  'pages.k8s.forms.binding.roleName.empty': '暂无可选角色',
  'pages.k8s.forms.binding.roleName.placeholder.role': '请选择同命名空间 Role',
  'pages.k8s.forms.binding.roleName.placeholder.clusterRole':
    '请选择 ClusterRole',
  'pages.k8s.forms.binding.subject.placeholder.serviceAccount':
    '请选择或输入 ServiceAccount',
  'pages.k8s.forms.binding.subject.placeholder.user':
    '用户名，例如 reborn:<用户ID>',
  'pages.k8s.forms.binding.subject.placeholder.group':
    '组名，例如 reborn:role:<角色ID>',
  'pages.k8s.forms.binding.subject.name.required': '请填写主体名称',
  'pages.k8s.forms.binding.subject.name.maxLength': '主体名称最长 253 个字符',
  'pages.k8s.forms.binding.subject.empty': '暂无可选主体',
  'pages.k8s.forms.binding.subject.namespace.notNeeded':
    'User/Group 不需要命名空间',
  'pages.k8s.forms.binding.subject.hint.intro':
    'User 与 Group 的名称直接填写。本平台访问集群时会模拟为用户',
  'pages.k8s.forms.binding.subject.hint.userPattern': 'reborn:<用户ID>',
  'pages.k8s.forms.binding.subject.hint.roleGroup': '、角色组',
  'pages.k8s.forms.binding.subject.hint.rolePattern': 'reborn:role:<角色ID>',
  'pages.k8s.forms.binding.subject.hint.outro':
    '，给平台用户或角色授权时请按此格式填写。',
  'pages.k8s.forms.binding.subject.kind.placeholder': '主体类型',
  'pages.k8s.forms.binding.subject.delete': '删除授权主体',
  'pages.k8s.forms.binding.subject.add': '添加授权主体',
  'pages.k8s.forms.binding.metadata.description':
    '为绑定资源添加标签和注解，便于筛选、识别和自动化管理',
  'pages.k8s.forms.binding.annotationKey': '注解键',
  'pages.k8s.forms.binding.annotationValue': '注解值',
  'pages.k8s.forms.binding.subjects.required': '请至少添加一个授权主体',
  'pages.k8s.forms.binding.subjects.kindRequired':
    '授权主体 {index} 需要选择类型',
  'pages.k8s.forms.binding.subjects.nameRequired':
    '授权主体 {index} 需要填写名称',
  'pages.k8s.forms.binding.subjects.namespaceRequired':
    '授权主体 {index} 需要选择命名空间',
  'pages.k8s.forms.binding.yaml.kind':
    'YAML kind 必须为 RoleBinding 或 ClusterRoleBinding',
  'pages.k8s.forms.binding.yaml.namespaceRequired':
    'RoleBinding YAML 必须包含 metadata.namespace',
  'pages.k8s.forms.binding.yaml.namespaceForbidden':
    'ClusterRoleBinding YAML 不应包含 metadata.namespace',
  'pages.k8s.forms.binding.yaml.roleRefRequired':
    'YAML 必须包含 roleRef.kind、roleRef.name 和 roleRef.apiGroup',
  'pages.k8s.forms.binding.yaml.roleRefApiGroup':
    'YAML roleRef.apiGroup 必须为 {apiGroup}',
  'pages.k8s.forms.binding.yaml.clusterRoleOnly':
    'ClusterRoleBinding 只能引用 ClusterRole',
  'pages.k8s.forms.binding.yaml.roleKind':
    'RoleBinding 只能引用 Role 或 ClusterRole',
  'pages.k8s.forms.binding.yaml.subjectsRequired':
    'YAML 必须至少包含一个 subjects 项',
  'pages.k8s.forms.binding.yaml.subjectInvalid':
    'YAML subjects[{index}] 需要包含 kind 和 name，ServiceAccount 还需要 namespace',
  'pages.k8s.forms.role.title': '创建 {kind}',
  'pages.k8s.forms.role.rules': '权限规则',
  'pages.k8s.forms.role.name.tooltip':
    '名称只能包含小写字母、数字、连字符（-）和点（.）',
  'pages.k8s.forms.role.name.pattern':
    '名称只能包含小写字母、数字、连字符（-）和点（.），且不能以连字符或点开头结尾',
  'pages.k8s.forms.role.namespace.notNeeded': 'ClusterRole 不需要命名空间',
  'pages.k8s.forms.role.selector.operator': '操作符',
  'pages.k8s.forms.role.selector.deleteExpression': '删除匹配表达式',
  'pages.k8s.forms.role.selector.addExpression': '添加匹配表达式',
  'pages.k8s.forms.role.aggregation': '聚合规则',
  'pages.k8s.forms.role.aggregation.enable': '聚合 ClusterRole',
  'pages.k8s.forms.role.aggregation.description':
    '按标签选择器聚合其他 ClusterRole 的权限规则，适合组合多个细粒度角色',
  'pages.k8s.forms.role.aggregation.labels': '聚合标签选择器',
  'pages.k8s.forms.role.aggregation.deleteLabel': '删除匹配标签',
  'pages.k8s.forms.role.aggregation.labelKeyFirst':
    '请先填写已有匹配标签的键。',
  'pages.k8s.forms.role.aggregation.expressions': '聚合匹配表达式',
  'pages.k8s.forms.role.aggregation.selectorRequired':
    '请为聚合规则至少配置一个标签选择器',
  'pages.k8s.forms.role.aggregation.expressionInvalid':
    '聚合匹配表达式 {index} 需要选择操作符，In/NotIn 需要填写标签值',
  'pages.k8s.forms.role.metadata.description':
    '为角色资源添加标签和注解，便于筛选、识别和自动化管理',
  'pages.k8s.forms.role.annotationKey': '注解键',
  'pages.k8s.forms.role.annotationValue': '注解值',
  'pages.k8s.forms.role.rule.mode.resource': '资源权限',
  'pages.k8s.forms.role.rule.mode.nonResource': '非资源 URL（仅 ClusterRole）',
  'pages.k8s.forms.role.rule.title': '权限规则 {index}',
  'pages.k8s.forms.role.rule.description':
    '配置 API 组、资源范围和允许执行的动作',
  'pages.k8s.forms.role.rule.delete': '删除权限规则',
  'pages.k8s.forms.role.rule.mode': '规则类型',
  'pages.k8s.forms.role.rule.mode.required': '请选择规则类型',
  'pages.k8s.forms.role.rule.nonResource.unsupported':
    '非资源 URL 权限仅适用于 ClusterRole，请改为资源权限或删除这条规则。',
  'pages.k8s.forms.role.rule.nonResourceURLs': '非资源 URL',
  'pages.k8s.forms.role.rule.nonResourceURLs.required': '请输入非资源 URL',
  'pages.k8s.forms.role.rule.nonResourceURLs.placeholder': '/healthz 或 /api/*',
  'pages.k8s.forms.role.rule.verbs': '动作',
  'pages.k8s.forms.role.rule.verbs.required': '请选择动作',
  'pages.k8s.forms.role.rule.apiGroups': 'API 组',
  'pages.k8s.forms.role.rule.apiGroups.required': '请选择 API 组',
  'pages.k8s.forms.role.rule.apiGroups.placeholder': 'core、apps 或 *',
  'pages.k8s.forms.role.rule.resources': '资源',
  'pages.k8s.forms.role.rule.resources.required': '请选择资源',
  'pages.k8s.forms.role.rule.resources.placeholder': 'pods、deployments 或 *',
  'pages.k8s.forms.role.rule.resourceNames': '资源名限制',
  'pages.k8s.forms.role.rule.resourceNames.tooltip':
    '留空表示匹配该资源类型下的所有对象',
  'pages.k8s.forms.role.rule.add': '添加权限规则',
  'pages.k8s.forms.role.rule.add.description':
    '配置新的 API 访问范围和允许动作',
  'pages.k8s.forms.role.rules.required': '请至少添加一条权限规则',
  'pages.k8s.forms.role.rules.verbsRequired': '权限规则 {index} 需要选择动作',
  'pages.k8s.forms.role.rules.nonResourceClusterOnly':
    '非资源 URL 权限仅适用于 ClusterRole',
  'pages.k8s.forms.role.rules.nonResourceURLsRequired':
    '权限规则 {index} 需要填写非资源 URL',
  'pages.k8s.forms.role.rules.apiGroupsRequired':
    '权限规则 {index} 需要选择 API 组',
  'pages.k8s.forms.role.rules.resourcesRequired':
    '权限规则 {index} 需要选择资源',
  'pages.k8s.forms.role.yaml.kind': 'YAML kind 必须为 Role 或 ClusterRole',
  'pages.k8s.forms.role.yaml.namespaceRequired':
    'Role YAML 必须包含 metadata.namespace',
  'pages.k8s.forms.role.yaml.namespaceForbidden':
    'ClusterRole YAML 不应包含 metadata.namespace',
  'pages.k8s.forms.role.yaml.rulesRequired': 'YAML 必须至少包含一条 rules',
  'pages.k8s.forms.role.yaml.ruleInvalid':
    'YAML rules[{index}] 需要包含 verbs；资源权限需要 apiGroups 和 resources；resources 与 nonResourceURLs 不能同时或同时不配置（nonResourceURLs 仅适用于 ClusterRole）',
  'pages.k8s.forms.role.risk.level.critical': '严重',
  'pages.k8s.forms.role.risk.level.high': '高危',
  'pages.k8s.forms.role.risk.level.medium': '中危',
  'pages.k8s.forms.role.risk.level.none': '无',
  'pages.k8s.forms.role.risk.reason.all':
    '拥有所有 API 组、所有资源和所有动作权限',
  'pages.k8s.forms.role.risk.reason.writeSecret': '可写 Secret',
  'pages.k8s.forms.role.risk.reason.readSecret': '可读取 Secret',
  'pages.k8s.forms.role.risk.reason.writeRbac': '可修改 RBAC 授权资源',
  'pages.k8s.forms.role.risk.reason.podAccess': '可进入或转发 Pod 运行环境',
  'pages.k8s.forms.role.risk.reason.impersonate': '可模拟其他主体身份',
  'pages.k8s.forms.role.risk.reason.wildcard': '存在通配符权限',
  'pages.k8s.forms.role.risk.reason.clusterAdmin': '绑定 cluster-admin',
  'pages.k8s.forms.role.risk.reason.broadGroup': '授权给宽泛系统组 {name}',
  'pages.k8s.forms.endpointslice.title': '创建端点切片',
  'pages.k8s.forms.endpointslice.step.endpoints': '端点设置',
  'pages.k8s.forms.endpointslice.step.ports': '端口设置',
  'pages.k8s.forms.endpointslice.status.endpointCount': '{count} 个端点',
  'pages.k8s.forms.endpointslice.status.portCount': '{count} 个端口',
  'pages.k8s.forms.endpointslice.status.metadataCount': '{count} 项元数据',
  'pages.k8s.forms.endpointslice.namespace.tooltip':
    '端点切片是命名空间级资源。',
  'pages.k8s.forms.endpointslice.serviceName': '关联服务',
  'pages.k8s.forms.endpointslice.serviceName.tooltip':
    '将自动输出 metadata.labels.kubernetes.io/service-name。可从所选命名空间的服务中选择，也可直接输入。',
  'pages.k8s.forms.endpointslice.serviceName.required': '请选择或输入关联服务',
  'pages.k8s.forms.endpointslice.serviceName.maxLength':
    '服务名称最长 63 个字符',
  'pages.k8s.forms.endpointslice.serviceName.pattern':
    '服务名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.endpointslice.serviceName.placeholder':
    '请选择或输入服务名称',
  'pages.k8s.forms.endpointslice.addressType': '地址类型',
  'pages.k8s.forms.endpointslice.addressType.tooltip':
    '必须与端点地址格式一致。',
  'pages.k8s.forms.endpointslice.addressType.required': '请选择地址类型',
  'pages.k8s.forms.endpointslice.validation.endpoints.required':
    '请至少添加一个端点',
  'pages.k8s.forms.endpointslice.validation.endpoint.addressRequired':
    '端点 {index} 至少需要填写一个地址',
  'pages.k8s.forms.endpointslice.validation.endpoint.addressMismatch':
    '端点 {index} 的地址 {address} 与地址类型 {addressType} 不匹配',
  'pages.k8s.forms.endpointslice.validation.port.nameDuplicate':
    '端口 {index} 的名称不能重复',
  'pages.k8s.forms.endpointslice.validation.port.range':
    '端口 {index} 的端口号必须在 1-65535 之间',
  'pages.k8s.forms.endpointslice.validation.name.invalid':
    '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾，最长 63 个字符',
  'pages.k8s.forms.endpointslice.validation.serviceName.invalid':
    '服务名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾，最长 63 个字符',
  'pages.k8s.forms.endpointslice.yaml.endpoint.notObject':
    'YAML endpoints[{index}] 必须为对象',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotArray':
    'YAML endpoints[{index}].addresses 必须为字符串数组',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotStrings':
    'YAML endpoints[{index}].addresses 必须全部为非空字符串',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesEmpty':
    'YAML endpoints[{index}].addresses 必须至少包含一个字符串地址',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressMismatch':
    'YAML endpoints[{index}] 的地址 {address} 与地址类型 {addressType} 不匹配',
  'pages.k8s.forms.endpointslice.yaml.ports.notArray': 'YAML ports 必须为数组',
  'pages.k8s.forms.endpointslice.yaml.port.notObject':
    'YAML ports[{index}] 必须为对象',
  'pages.k8s.forms.endpointslice.yaml.port.protocolInvalid':
    'YAML ports[{index}].protocol 必须为 SCTP、TCP 或 UDP',
  'pages.k8s.forms.endpointslice.yaml.port.portInvalid':
    'YAML ports[{index}].port 必须为 1-65535 的整数',
  'pages.k8s.forms.endpointslice.yaml.port.nameNotString':
    'YAML ports[{index}].name 必须为字符串',
  'pages.k8s.forms.endpointslice.yaml.port.nameInvalid':
    'YAML ports[{index}].name 只能包含小写字母、数字和连字符（-），最长 15 个字符',
  'pages.k8s.forms.endpointslice.yaml.port.nameDuplicate':
    'YAML ports[{index}].name 不能重复',
  'pages.k8s.forms.endpointslice.yaml.port.appProtocolNotString':
    'YAML ports[{index}].appProtocol 必须为字符串',
  'pages.k8s.forms.endpointslice.yaml.serviceLabelRequired':
    'YAML 必须包含 metadata.labels.{label}',
  'pages.k8s.forms.endpointslice.yaml.addressTypeInvalid':
    'YAML addressType 必须为 FQDN、IPv4 或 IPv6',
  'pages.k8s.forms.endpointslice.yaml.endpointsRequired':
    'YAML endpoints 必须至少包含一个端点',
  'pages.k8s.forms.endpointslice.example': '例如 {value}',
  'pages.k8s.forms.endpointslice.condition.unset': '不输出',
  'pages.k8s.forms.endpointslice.endpoints': '端点',
  'pages.k8s.forms.endpointslice.endpoints.description':
    '至少填写一个端点地址，格式需匹配地址类型。',
  'pages.k8s.forms.endpointslice.endpoints.addressRequired':
    '请至少添加一个端点地址',
  'pages.k8s.forms.endpointslice.endpoint.title': '端点 {index}',
  'pages.k8s.forms.endpointslice.endpoint.delete': '删除端点',
  'pages.k8s.forms.endpointslice.endpoint.addresses': '地址配置',
  'pages.k8s.forms.endpointslice.endpoint.addresses.extra':
    '格式需匹配 IPv4、IPv6 或 FQDN。',
  'pages.k8s.forms.endpointslice.endpoint.addresses.add': '添加地址',
  'pages.k8s.forms.endpointslice.endpoint.addresses.delete': '删除地址',
  'pages.k8s.forms.endpointslice.endpoint.addresses.fillFirst':
    '请先填写已有地址',
  'pages.k8s.forms.endpointslice.endpoint.location': '位置标识',
  'pages.k8s.forms.endpointslice.endpoint.hostname': '主机名',
  'pages.k8s.forms.endpointslice.endpoint.hostname.maxLength':
    '主机名最长 63 个字符',
  'pages.k8s.forms.endpointslice.endpoint.nodeName': '节点名称',
  'pages.k8s.forms.endpointslice.endpoint.nodeName.maxLength':
    '节点名称最长 253 个字符',
  'pages.k8s.forms.endpointslice.endpoint.zone': '可用区',
  'pages.k8s.forms.endpointslice.endpoint.zone.maxLength':
    '可用区最长 63 个字符',
  'pages.k8s.forms.endpointslice.endpoint.advanced': '高级端点字段',
  'pages.k8s.forms.endpointslice.endpoint.advanced.description':
    '条件、目标引用、流量提示。',
  'pages.k8s.forms.endpointslice.endpoint.conditions': '端点条件',
  'pages.k8s.forms.endpointslice.endpoint.targetRef': '目标引用',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion': 'API 版本',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion.maxLength':
    'API 版本最长 100 个字符',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.kind.maxLength':
    '类型最长 63 个字符',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.namespace.maxLength':
    '命名空间最长 63 个字符',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath': '字段路径',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath.maxLength':
    '字段路径最长 250 个字符',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion':
    '资源版本',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion.maxLength':
    '资源版本最长 100 个字符',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.uid.maxLength':
    'UID 最长 100 个字符',
  'pages.k8s.forms.endpointslice.endpoint.hints': '流量提示',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes': '节点提示',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.add': '添加节点',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.delete': '删除节点',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.fillFirst':
    '请先填写已有节点名称',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones': '可用区提示',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.add': '添加可用区',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.delete': '删除可用区',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.placeholder':
    '可用区名称',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.fillFirst':
    '请先填写已有可用区名称',
  'pages.k8s.forms.endpointslice.endpoint.add': '添加端点',
  'pages.k8s.forms.endpointslice.port.min': '端口号不能小于 1',
  'pages.k8s.forms.endpointslice.port.max': '端口号不能大于 65535',
  'pages.k8s.forms.endpointslice.ports.description':
    '端口可选；填写后会输出 ports 数组，端口名称应在当前端点切片内保持唯一。',
  'pages.k8s.forms.endpointslice.port.name.maxLength': '端口名称最长 15 个字符',
  'pages.k8s.forms.endpointslice.port.name.pattern':
    '端口名称只能包含小写字母、数字和连字符（-）',
  'pages.k8s.forms.endpointslice.port.protocol': '协议',
  'pages.k8s.forms.endpointslice.port.appProtocol': '应用协议',
  'pages.k8s.forms.endpointslice.port.appProtocol.tooltip':
    '例如 http、kubernetes.io/h2c 或自定义前缀协议。',
  'pages.k8s.forms.endpointslice.port.appProtocol.maxLength':
    '应用协议最长 250 个字符',
  'pages.k8s.forms.endpointslice.port.add': '添加端口',
  'pages.k8s.forms.endpointslice.metadata.description':
    '为端点切片资源添加自定义标签和注解。',
  'pages.k8s.forms.service.title': '创建服务',
  'pages.k8s.forms.service.step.settings': '服务设置',
  'pages.k8s.forms.service.namespace.invalid': '命名空间名称不合法',
  'pages.k8s.forms.service.validation.ports.required': '请至少添加一个端口',
  'pages.k8s.forms.service.validation.port.label': '端口 {index}',
  'pages.k8s.forms.service.validation.port.servicePortRequired':
    '{label}：请输入服务端口',
  'pages.k8s.forms.service.validation.port.servicePortRange':
    '{label}：服务端口范围为 1-65535',
  'pages.k8s.forms.service.validation.port.containerPortRange':
    '{label}：容器端口范围为 1-65535',
  'pages.k8s.forms.service.validation.port.nameRequiredMultiple':
    '{label}：存在多个端口时必须填写端口名称',
  'pages.k8s.forms.service.validation.port.nameMaxLength':
    '{label}：端口名称最长 {max} 个字符',
  'pages.k8s.forms.service.validation.port.namePattern':
    '{label}：端口名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.service.validation.port.nameDuplicate':
    '{label}：端口名称 {name} 重复',
  'pages.k8s.forms.service.validation.port.servicePortDuplicate':
    '{label}：服务端口 {key} 重复',
  'pages.k8s.forms.service.validation.port.nodePortRange':
    '{label}：节点端口范围为 {min}-{max}',
  'pages.k8s.forms.service.validation.port.nodePortDuplicate':
    '{label}：节点端口 {key} 重复',
  'pages.k8s.forms.service.validation.nameNamespaceRequired':
    '请填写名称和命名空间',
  'pages.k8s.forms.service.validation.selectorRequired':
    '请添加至少一个工作负载选择器',
  'pages.k8s.forms.service.validation.headlessExternalAccess':
    '内部域名模式不支持同时开启外部访问',
  'pages.k8s.forms.service.example': '例如 {value}',
  'pages.k8s.forms.service.required': '必填',
  'pages.k8s.forms.service.accessMode.clusterIP': '虚拟 IP 地址',
  'pages.k8s.forms.service.accessMode.clusterIP.description':
    '为服务分配虚拟 IP 地址，可通过虚拟 IP 地址在集群内部访问服务。',
  'pages.k8s.forms.service.accessMode.headless': '内部域名',
  'pages.k8s.forms.service.accessMode.headless.description':
    '不为服务分配 IP 地址，可通过集群的 DNS 机制在集群内部访问服务。',
  'pages.k8s.forms.service.port.protocol': '协议',
  'pages.k8s.forms.service.port.protocol.tooltip':
    'HTTP/HTTPS 等协议会在提交时写入 appProtocol，Kubernetes 端口协议按 TCP/UDP/SCTP 生成。',
  'pages.k8s.forms.service.port.name.maxLength': '端口名称最长 {max} 个字符',
  'pages.k8s.forms.service.port.name.pattern':
    '端口名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
  'pages.k8s.forms.service.port.containerPort': '容器端口',
  'pages.k8s.forms.service.port.servicePort': '服务端口',
  'pages.k8s.forms.service.port.servicePort.required': '请输入服务端口',
  'pages.k8s.forms.service.port.add': '添加端口',
  'pages.k8s.forms.service.internalAccess': '内部访问模式',
  'pages.k8s.forms.service.internalAccess.tooltip':
    '选择服务在集群内部被访问时使用的地址形态',
  'pages.k8s.forms.service.workloadSelector': '工作负载选择',
  'pages.k8s.forms.service.workloadSelector.tooltip':
    '通过标签选择一组工作负载，服务流量会转发到匹配的容器组',
  'pages.k8s.forms.service.workloadSelector.add': '添加选择器',
  'pages.k8s.forms.service.workloadSelector.delete': '删除工作负载选择器',
  'pages.k8s.forms.service.workloadSelector.pick': '指定工作负载',
  'pages.k8s.forms.service.workloadSelector.keyFirst':
    '请先填写已有工作负载选择器的键。',
  'pages.k8s.forms.service.workloadSelector.noMatch':
    '没有工作负载匹配当前选择器。',
  'pages.k8s.forms.service.workloadSelector.noLabels':
    '未读取到该工作负载的标签，请手动填写选择器。',
  'pages.k8s.forms.service.workloadSelector.hint':
    '使用工作负载的标签作为选择器。',
  'pages.k8s.forms.service.ports.tooltip':
    '设置服务端口与目标容器端口，端口协议会同步写入服务清单',
  'pages.k8s.forms.service.nodePort': '节点端口',
  'pages.k8s.forms.service.nodePort.range': '节点端口范围为 {min}-{max}',
  'pages.k8s.forms.service.nodePort.duplicate': '节点端口 {value} 重复',
  'pages.k8s.forms.service.nodePort.ariaLabel': '服务端口 {port} 的节点端口',
  'pages.k8s.forms.service.nodePort.auto': '自动分配',
  'pages.k8s.forms.service.nodePort.extra':
    '可选。取值范围为 {min} 到 {max}，留空时由集群自动分配。',
  'pages.k8s.forms.service.externalAccess': '外部访问',
  'pages.k8s.forms.service.externalAccess.description':
    '设置从集群外访问服务的方式。',
  'pages.k8s.forms.service.externalTrafficPolicy': '外部流量策略',
  'pages.k8s.forms.service.externalTrafficPolicy.extra':
    'Local 可保留客户端源 IP，Cluster 会在集群范围内转发。',
  'pages.k8s.forms.service.placeholder.clusterDefault': '默认由集群决定',
  'pages.k8s.forms.service.loadBalancerClass.extra':
    '指定由哪类负载均衡器实现接管该 Service。',
  'pages.k8s.forms.service.allocateNodePorts': '分配 NodePort',
  'pages.k8s.forms.service.allocateNodePorts.checkbox':
    '为 LoadBalancer 服务自动分配 NodePort',
  'pages.k8s.forms.service.networking': '网络策略',
  'pages.k8s.forms.service.networking.notice':
    'Kubernetes 1.35+ Service 网络能力',
  'pages.k8s.forms.service.networking.notice.dualStack':
    '双栈集群建议显式设置 IP Family Policy 与 IP Families。',
  'pages.k8s.forms.service.networking.notice.trafficDistribution':
    'trafficDistribution 会通过 EndpointSlice 影响就近转发偏好。',
  'pages.k8s.forms.service.ipFamilies.placeholder': '请选择 IP 协议族',
  'pages.k8s.forms.service.internalTrafficPolicy': '内部流量策略',
  'pages.k8s.forms.service.internalTrafficPolicy.extra':
    'Local 仅转发到节点本地端点，Cluster 在集群范围内转发。',
  'pages.k8s.forms.service.placeholder.defaultCluster': '默认 Cluster',
  'pages.k8s.forms.service.trafficDistribution': '流量分布',
  'pages.k8s.forms.service.trafficDistribution.extra':
    '在支持的集群中用于表达就近或同节点转发偏好。',
  'pages.k8s.forms.service.placeholder.unspecified': '默认不指定',
  'pages.k8s.forms.service.sessionAffinity': '会话保持',
  'pages.k8s.forms.service.sessionAffinity.description':
    '设置系统在指定的时间内将同一个会话中来自同一个客户端的请求全部转发给同一个容器组。',
  'pages.k8s.forms.service.sessionAffinity.timeout': '最长会话保持时间（s）',
  'pages.k8s.forms.service.sessionAffinity.timeout.required':
    '请输入最长会话保持时间',
  'pages.k8s.forms.service.sessionAffinity.timeout.range':
    '取值范围为 1 到 86400',
  'pages.k8s.forms.service.sessionAffinity.timeout.extra':
    '设置最大会话保持时间。取值范围为 1 到 86400，默认值 10800。',
  'pages.k8s.forms.service.metadata.description': '为服务添加元数据。',
  'pages.k8s.forms.pv.title': '创建持久卷',
  'pages.k8s.forms.pv.volumeSource': '卷来源',
  'pages.k8s.forms.pv.volumeSource.required': '请选择卷来源',
  'pages.k8s.forms.pv.source.hostPath.desc':
    '使用节点本地路径，适合开发或单节点场景。',
  'pages.k8s.forms.pv.source.local.desc':
    '使用节点本地磁盘，需配置节点亲和性。',
  'pages.k8s.forms.pv.source.nfs.desc': '使用 NFS 服务器导出的目录。',
  'pages.k8s.forms.pv.source.csi.desc': '使用 CSI 驱动提供的卷。',
  'pages.k8s.forms.pv.hostPathType.unspecified': '不指定',
  'pages.k8s.forms.pv.nfs.server': '服务器',
  'pages.k8s.forms.pv.nfs.server.required': '请输入 NFS 服务器',
  'pages.k8s.forms.pv.nfs.server.placeholder': '例如 10.0.0.10',
  'pages.k8s.forms.pv.nfs.path': '导出路径',
  'pages.k8s.forms.pv.nfs.path.required': '请输入 NFS 导出路径',
  'pages.k8s.forms.pv.nfs.path.placeholder': '例如 /exports/data',
  'pages.k8s.forms.pv.csi.driver': '驱动',
  'pages.k8s.forms.pv.csi.driver.required': '请输入 CSI 驱动',
  'pages.k8s.forms.pv.csi.driver.placeholder': '例如 ebs.csi.aws.com',
  'pages.k8s.forms.pv.csi.volumeHandle': '卷句柄',
  'pages.k8s.forms.pv.csi.volumeHandle.required': '请输入卷句柄',
  'pages.k8s.forms.pv.csi.volumeHandle.placeholder': '请输入 volumeHandle',
  'pages.k8s.forms.pv.fsType': '文件系统',
  'pages.k8s.forms.pv.fsType.placeholder': '例如 ext4',
  'pages.k8s.forms.pv.csi.volumeAttributes': '卷属性',
  'pages.k8s.forms.pv.csi.volumeAttributes.extra':
    '按 CSI 驱动要求填写 volumeAttributes。',
  'pages.k8s.forms.pv.csi.volumeAttributes.delete': '删除卷属性',
  'pages.k8s.forms.pv.csi.volumeAttributes.keyFirst': '请先填写已有属性的键。',
  'pages.k8s.forms.pv.local.path': '本地路径',
  'pages.k8s.forms.pv.local.path.required': '请输入本地路径',
  'pages.k8s.forms.pv.local.path.placeholder': '例如 /mnt/disks/ssd1',
  'pages.k8s.forms.pv.nodeAffinity': '节点亲和性',
  'pages.k8s.forms.pv.nodeAffinity.desc':
    'Local 持久卷必须约束到实际存在该磁盘的节点。',
  'pages.k8s.forms.pv.nodeAffinity.key.required': '请输入标签键',
  'pages.k8s.forms.pv.nodeAffinity.key.placeholder':
    '例如 kubernetes.io/hostname',
  'pages.k8s.forms.pv.nodeAffinity.operator': '操作符',
  'pages.k8s.forms.pv.nodeAffinity.operator.required': '请选择操作符',
  'pages.k8s.forms.pv.nodeAffinity.selectNode': '从集群节点中选择',
  'pages.k8s.forms.pv.nodeAffinity.selectNode.extra':
    '选择节点会把节点名加入下方匹配值（标签键为 kubernetes.io/hostname 时适用）。',
  'pages.k8s.forms.pv.nodeAffinity.selectNode.placeholder': '请选择节点',
  'pages.k8s.forms.pv.nodeAffinity.values': '匹配值',
  'pages.k8s.forms.pv.nodeAffinity.values.extra':
    'In/NotIn 可填写多个值；Gt/Lt 仅支持一个数字值。',
  'pages.k8s.forms.pv.nodeAffinity.values.delete': '删除匹配值',
  'pages.k8s.forms.pv.nodeAffinity.values.placeholder': '请输入匹配值',
  'pages.k8s.forms.pv.nodeAffinity.values.first': '请先填写已有匹配值。',
  'pages.k8s.forms.pv.nodeAffinity.values.required': '请填写节点亲和性匹配值',
  'pages.k8s.forms.pv.nodeAffinity.values.single':
    'Gt/Lt 操作符只能填写一个节点亲和性匹配值',
  'pages.k8s.forms.pv.nodeAffinity.values.numeric':
    'Gt/Lt 操作符的匹配值必须是数字',
  'pages.k8s.forms.pv.hostPath': '主机路径',
  'pages.k8s.forms.pv.hostPath.extra':
    'HostPath 适合开发或单节点场景，生产环境建议优先使用 CSI/NFS/Local。',
  'pages.k8s.forms.pv.hostPath.required': '请输入主机路径',
  'pages.k8s.forms.pv.hostPath.placeholder': '例如 /tmp/example-pv',
  'pages.k8s.forms.pv.hostPathType': '路径类型',
  'pages.k8s.forms.pv.capacity.extra': '定义持久卷对外声明的存储容量。',
  'pages.k8s.forms.pv.capacity.positive': '容量必须大于 0',
  'pages.k8s.forms.pv.capacity.unit': '容量单位',
  'pages.k8s.forms.pv.accessModes.extra':
    '选择一个或多个访问模式，需与后端卷能力保持一致。',
  'pages.k8s.forms.pv.reclaimPolicy': '回收策略',
  'pages.k8s.forms.pv.reclaimPolicy.extra': '删除 PVC 后，持久卷应如何处理。',
  'pages.k8s.forms.pv.reclaimPolicy.required': '请选择回收策略',
  'pages.k8s.forms.pv.volumeMode': '卷模式',
  'pages.k8s.forms.pv.storageClass.extra': '留空表示不指定存储类。',
  'pages.k8s.forms.pv.storageClass.placeholder': '请输入存储类名称',
  'pages.k8s.forms.pv.mountOptions': '挂载选项',
  'pages.k8s.forms.pv.mountOptions.desc':
    '为 PV 添加挂载选项，例如 nfsvers=4.1 或 noatime。',
  'pages.k8s.forms.pv.mountOptions.delete': '删除挂载选项',
  'pages.k8s.forms.pv.mountOptions.placeholder': '请输入挂载选项',
  'pages.k8s.forms.pv.mountOptions.first': '请先填写已有挂载选项。',
  'pages.k8s.forms.pv.claimRef': '预绑定声明',
  'pages.k8s.forms.pv.claimRef.desc':
    '预绑定到指定 PVC，通常只有确需静态绑定时才填写。',
  'pages.k8s.forms.pv.claimRef.namespace.placeholder': '请输入 PVC 命名空间',
  'pages.k8s.forms.pv.claimRef.name': '声明名称',
  'pages.k8s.forms.pv.claimRef.name.placeholder': '请输入 PVC 名称',
  'pages.k8s.forms.pv.claimRef.namespace.required':
    '预绑定声明需要填写命名空间',
  'pages.k8s.forms.pv.claimRef.name.required': '预绑定声明需要填写声明名称',
  'pages.k8s.forms.pv.metadata.desc': '为持久卷添加标签和注解。',
  'pages.k8s.forms.pvc.title': '创建持久卷声明',
  'pages.k8s.forms.pvc.mode': '创建方式',
  'pages.k8s.forms.pvc.mode.required': '请选择创建方式',
  'pages.k8s.forms.pvc.mode.storageClass': '通过存储类创建',
  'pages.k8s.forms.pvc.mode.storageClass.desc': '选择已有的存储类来创建卷。',
  'pages.k8s.forms.pvc.mode.persistentVolume': '绑定已有持久卷创建',
  'pages.k8s.forms.pvc.mode.persistentVolume.desc':
    '选择已有的持久卷来创建卷。',
  'pages.k8s.forms.pvc.storageClass.default': '{name}（默认）',
  'pages.k8s.forms.pvc.storageClass.extra':
    '选择一个存储类来创建特定种类的卷。',
  'pages.k8s.forms.pvc.storageClass.required': '请选择存储类',
  'pages.k8s.forms.pvc.storageClass.notFound': '未发现可用存储类',
  'pages.k8s.forms.pvc.storageClass.placeholder': '请选择或输入存储类',
  'pages.k8s.forms.pvc.volume.extra':
    '选择或输入需要绑定的持久卷名称（仅列出尚未被声明绑定的持久卷）。',
  'pages.k8s.forms.pvc.volume.notFound': '未发现可绑定的持久卷',
  'pages.k8s.forms.pvc.volumeStorageClass': '持久卷的存储类',
  'pages.k8s.forms.pvc.volumeStorageClass.extra':
    '须与持久卷的存储类一致；持久卷未设置存储类时留空。',
  'pages.k8s.forms.pvc.volumeStorageClass.placeholder':
    '留空表示持久卷没有存储类',
  'pages.k8s.forms.pvc.accessModes.extra.bind':
    '须包含在持久卷支持的访问模式之内。',
  'pages.k8s.forms.pvc.accessModes.extra.storageClass':
    '选择存储类支持的一种或多种访问模式。',
  'pages.k8s.forms.pvc.volumeMode': '卷模式',
  'pages.k8s.forms.pvc.volumeMode.extra':
    'Filesystem 以目录形式挂载；Block 以裸块设备形式提供给容器。',
  'pages.k8s.forms.pvc.capacity': '卷容量',
  'pages.k8s.forms.pvc.capacity.extra.bind':
    '申请容量不能超过所绑定持久卷的容量。',
  'pages.k8s.forms.pvc.capacity.required': '请输入卷容量',
  'pages.k8s.forms.pvc.capacity.positive': '卷容量必须大于 0',
  'pages.k8s.forms.pvc.capacity.unit': '容量单位',
  'pages.k8s.forms.pvc.metadata.desc': '为卷添加元数据。',
  'pages.k8s.forms.storageclass.title': '创建存储类',
  'pages.k8s.forms.storageclass.step.settings': '存储类设置',
  'pages.k8s.forms.storageclass.listSeparator': '、',
  'pages.k8s.forms.storageclass.isDefault': '设为默认存储类',
  'pages.k8s.forms.storageclass.isDefault.required': '请选择是否设为默认存储类',
  'pages.k8s.forms.storageclass.isDefault.extra':
    '未指定存储类的持久卷声明会使用默认存储类。',
  'pages.k8s.forms.storageclass.isDefault.existing':
    '集群已有默认存储类 {names}；同时存在多个默认存储类时，未指定存储类的声明会使用最新创建的那个。',
  'pages.k8s.forms.storageclass.provisioner': '供应者',
  'pages.k8s.forms.storageclass.provisioner.extra':
    '填写 CSI 驱动或卷插件的名称，例如 ebs.csi.aws.com。',
  'pages.k8s.forms.storageclass.provisioner.required': '请输入供应者',
  'pages.k8s.forms.storageclass.reclaimPolicy': '回收机制',
  'pages.k8s.forms.storageclass.reclaimPolicy.required': '请选择回收机制',
  'pages.k8s.forms.storageclass.bindingMode': '卷绑定模式',
  'pages.k8s.forms.storageclass.bindingMode.required': '请选择卷绑定模式',
  'pages.k8s.forms.storageclass.bindingMode.extra':
    '延迟绑定会等到有容器组使用卷时才创建并绑定持久卷。',
  'pages.k8s.forms.storageclass.bindingMode.immediate': '立即绑定',
  'pages.k8s.forms.storageclass.bindingMode.waitForFirstConsumer': '延迟绑定',
  'pages.k8s.forms.storageclass.expansion': '卷扩展',
  'pages.k8s.forms.storageclass.expansion.extra':
    '选择存储类是否允许创建后扩展卷容量。',
  'pages.k8s.forms.storageclass.expansion.required': '请选择是否允许卷扩展',
  'pages.k8s.forms.storageclass.parameters': '参数',
  'pages.k8s.forms.storageclass.parameters.extra':
    '按供应者（CSI 驱动）的要求填写，参数会原样传给供应者。',
  'pages.k8s.forms.storageclass.parameters.delete': '删除参数',
  'pages.k8s.forms.storageclass.parameters.keyFirst': '请先填写已有参数的键。',
  'pages.k8s.forms.storageclass.parameters.duplicate': '参数键不能重复',
  'pages.k8s.forms.storageclass.mountOptions': '挂载选项',
  'pages.k8s.forms.storageclass.mountOptions.extra':
    '由该存储类动态创建的持久卷会带上这些挂载选项，例如 noatime 或 nfsvers=4.1。',
  'pages.k8s.forms.storageclass.mountOptions.delete': '删除挂载选项',
  'pages.k8s.forms.storageclass.mountOptions.placeholder': '请输入挂载选项',
  'pages.k8s.forms.storageclass.mountOptions.first': '请先填写已有挂载选项。',
  'pages.k8s.forms.storageclass.yaml.provisionerRequired':
    'YAML 必须包含 provisioner',
  'pages.k8s.forms.edit.pvc.clone.title': '克隆持久卷声明',
  'pages.k8s.forms.edit.pvc.clone.name.pattern':
    '名称只能包含小写字母、数字和中划线',
  'pages.k8s.forms.edit.pvc.clone.name.sameAsSource':
    '名称不能与当前持久卷声明相同',
  'pages.k8s.forms.edit.pvc.clone.help':
    '克隆会基于当前 PVC（容量 {capacity}）创建新的持久卷声明，访问模式、卷模式和存储类保持一致。',
  'pages.k8s.forms.edit.pvc.expand.title': '扩容持久卷声明',
  'pages.k8s.forms.edit.pvc.expand.denied':
    '存储类 {name} 未开启「允许卷扩容」，无法扩容。请先在存储类上开启后再试。',
  'pages.k8s.forms.edit.pvc.expand.noStorageClass':
    '该持久卷声明没有指定存储类，无法扩容。',
  'pages.k8s.forms.edit.pvc.expand.unknown':
    '无法读取存储类 {name}，不能确认它是否允许卷扩容；不允许时提交会被集群拒绝。',
  'pages.k8s.forms.edit.pvc.expand.help':
    '当前容量 {capacity}。仅支持增大容量，且要求所用存储类允许卷扩容。',
  'pages.k8s.forms.edit.pvc.size.belowCurrent':
    '容量不能小于当前容量 {current}',
  'pages.k8s.forms.edit.storageclass.default.unset.title': '取消默认存储类',
  'pages.k8s.forms.edit.storageclass.default.set.title': '设为默认存储类',
  'pages.k8s.forms.edit.storageclass.default.others':
    '已有默认存储类：{names}。同时存在多个默认存储类时，未指定存储类的持久卷声明将使用最新创建的那个，建议先取消原有的默认存储类。',
  'pages.k8s.forms.edit.storageclass.default.unset.confirm':
    '确定取消存储类 {name} 的默认设置吗？',
  'pages.k8s.forms.edit.storageclass.default.unset.hint':
    '取消后，未指定存储类的持久卷声明将不再使用它；已创建的持久卷声明不受影响。',
  'pages.k8s.forms.edit.storageclass.default.set.confirm':
    '确定将存储类 {name} 设为默认存储类吗？',
  'pages.k8s.forms.edit.storageclass.default.set.hint':
    '设置后，未指定存储类的持久卷声明将使用它；已创建的持久卷声明不受影响。',
  'pages.k8s.forms.edit.storageclass.volumeOps.title': '设置卷操作',
  'pages.k8s.forms.edit.storageclass.volumeOps.allowExpansion': '允许卷扩容',
  'pages.k8s.forms.edit.storageclass.volumeOps.help':
    '开启后，使用该存储类的持久卷声明可以扩容（还需存储插件支持）；关闭只影响之后的扩容请求。',
  'pages.k8s.forms.ingress.title': '创建应用路由',
  'pages.k8s.forms.ingress.nameNamespaceRequired': '请填写名称和命名空间',
  'pages.k8s.forms.ingress.rules': '路由规则',
  'pages.k8s.forms.ingress.rules.required': '请添加至少一个路由规则',
  'pages.k8s.forms.ingress.rewriteTarget': '重写路径',
  'pages.k8s.forms.ingress.rewriteTarget.required': '请输入重写路径',
  'pages.k8s.forms.ingress.metadata.description': '为应用路由添加元数据。',
  'pages.k8s.forms.ingress.host': '域名',
  'pages.k8s.forms.ingress.host.maxLength': '域名最长 253 个字符',
  'pages.k8s.forms.ingress.host.pattern':
    '域名只能包含小写字母、数字、连字符（-）和点（.），可以 *. 开头',
  'pages.k8s.forms.ingress.host.requiredForHttps': 'HTTPS 路由需要填写域名',
  'pages.k8s.forms.ingress.host.tooltip': '留空表示匹配所有域名。',
  'pages.k8s.forms.ingress.protocol': '协议',
  'pages.k8s.forms.ingress.path': '路径',
  'pages.k8s.forms.ingress.rewrite.example.all': '匹配所有路径',
  'pages.k8s.forms.ingress.rewrite.example.apiPrefix': '匹配 /api 开头',
  'pages.k8s.forms.ingress.rewrite.example.htmlSuffix': '匹配 /html 结尾',
  'pages.k8s.forms.ingress.rewrite.example.userId': '匹配 /user/:id',
  'pages.k8s.forms.ingress.rewrite.example.oldToNew': '匹配 /old 为 /new',
  'pages.k8s.forms.ingress.rewrite.tooltip.intro':
    '用于重写客户端请求的路径，支持静态路径（如 /new-path）、动态路径（如 /$1、/$2 等）、组合路径（如 /v1/$1）和正则表达式',
  'pages.k8s.forms.ingress.rewrite.tooltip.usage': '用途示例',
  'pages.k8s.forms.ingress.rewrite.tooltip.regex': '正则表达式',
  'pages.k8s.forms.ingress.rewrite.tooltip.note':
    '注：正则表达式需要与 path 字段的正则表达式匹配',
  'pages.k8s.forms.ingress.notice.title': 'Kubernetes 1.35+ 路由建议',
  'pages.k8s.forms.ingress.notice.gatewayApi':
    'Ingress 资源仍可使用；新建复杂流量治理能力时建议评估 Gateway API。',
  'pages.k8s.forms.ingress.notice.tls':
    'HTTPS 路由建议显式指定 TLS Secret，后端端口支持端口号或命名端口。',
  'pages.k8s.forms.ingress.ingressClass.tooltip':
    '指定处理该 Ingress 的控制器类。',
  'pages.k8s.forms.ingress.ingressClass.placeholder':
    '例如 nginx、alb、traefik',
  'pages.k8s.forms.ingress.tlsSecret.tooltip':
    'HTTPS 路由使用的 TLS Secret，需包含 tls.crt 与 tls.key。',
  'pages.k8s.forms.ingress.tlsSecret.placeholder': '例如 example-com-tls',
  'pages.k8s.forms.ingress.summary.separator': '、',
  'pages.k8s.forms.ingress.customBackend': '自定义后端',
  'pages.k8s.forms.ingress.resourceBackend': '资源后端：{kind}/{name}',
  'pages.k8s.forms.ingress.allHosts': '所有域名',
  'pages.k8s.forms.ingress.summary.protocol': '协议：{protocol}',
  'pages.k8s.forms.ingress.summary.paths': '路径：{paths}',
  'pages.k8s.forms.ingress.summary.services': '服务：{services}',
  'pages.k8s.forms.ingress.summary.count': '数量：{count}',
  'pages.k8s.forms.ingress.rule.add': '添加路由规则',
  'pages.k8s.forms.ingress.rule.edit': '编辑路由规则',
  'pages.k8s.forms.ingress.rule.delete': '删除路由规则',
  'pages.k8s.forms.ingress.rule.addDescription':
    '添加一个路由规则将域名路径映射至服务。',
  'pages.k8s.forms.ingress.rule.incomplete': '请完善路由规则配置',
  'pages.k8s.forms.ingress.rewrite': '路径重写',
  'pages.k8s.forms.ingress.rewrite.description':
    '通过正则表达式去配置应用在当前路由规则的重写路径',
  'pages.k8s.forms.ingress.port.notFound': '输入端口号或端口名称',
  'pages.k8s.forms.ingress.port.required': '请选择端口',
  'pages.k8s.forms.ingress.paths.required': '请添加至少一条路径',
  'pages.k8s.forms.ingress.path.required': '请输入路径',
  'pages.k8s.forms.ingress.path.leadingSlash': '路径必须以 / 开头',
  'pages.k8s.forms.ingress.path.delete': '删除路径',
  'pages.k8s.forms.ingress.pathType': '匹配方式',
  'pages.k8s.forms.ingress.pathType.required': '请选择匹配方式',
  'pages.k8s.forms.ingress.service.required': '请选择服务',
  'pages.k8s.forms.ingressclass.title': '创建 Ingress 类',
  'pages.k8s.forms.ingressclass.parameters': '参数引用',
  'pages.k8s.forms.ingressclass.parameters.extra':
    '参数引用用于关联控制器需要的配置资源；未启用时不会输出 spec.parameters。',
  'pages.k8s.forms.ingressclass.parameters.required': '请选择是否启用参数引用',
  'pages.k8s.forms.ingressclass.parameters.notEnabled': '不启用',
  'pages.k8s.forms.ingressclass.parameters.kindRequired':
    '参数引用必须填写类型',
  'pages.k8s.forms.ingressclass.parameters.nameRequired':
    '参数引用必须填写名称',
  'pages.k8s.forms.ingressclass.parameters.namespaceRequired':
    '命名空间级参数引用必须填写命名空间',
  'pages.k8s.forms.ingressclass.labelKeyDuplicate': '标签键不能重复',
  'pages.k8s.forms.ingressclass.annotationKeyDuplicate': '注解键不能重复',
  'pages.k8s.forms.ingressclass.controller': '控制器',
  'pages.k8s.forms.ingressclass.controller.required': '请输入控制器',
  'pages.k8s.forms.ingressclass.controller.maxLength': '控制器最长 250 个字符',
  'pages.k8s.forms.ingressclass.controller.extra':
    '通常为域名路径格式，例如 k8s.io/ingress-nginx。',
  'pages.k8s.forms.ingressclass.isDefault': '默认 Ingress 类',
  'pages.k8s.forms.ingressclass.isDefault.extra':
    '设置后会输出 ingressclass.kubernetes.io/is-default-class 注解。',
  'pages.k8s.forms.ingressclass.isDefault.required': '请选择是否作为默认类',
  'pages.k8s.forms.ingressclass.metadata.description':
    '为 Ingress 类资源添加标签和注解。',
  'pages.k8s.forms.ingressclass.scope': '作用域',
  'pages.k8s.forms.ingressclass.scope.cluster': '集群级',
  'pages.k8s.forms.ingressclass.scope.namespace': '命名空间级',
  'pages.k8s.forms.ingressclass.scope.required': '请选择参数作用域',
  'pages.k8s.forms.ingressclass.scope.placeholder': '请选择作用域',
  'pages.k8s.forms.ingressclass.apiGroup': 'API 组',
  'pages.k8s.forms.ingressclass.apiGroup.extra':
    '例如 k8s.example.com；核心 API 组可以留空。',
  'pages.k8s.forms.ingressclass.apiGroup.placeholder': '请输入 API 组',
  'pages.k8s.forms.ingressclass.parameterKind.required': '请输入参数资源类型',
  'pages.k8s.forms.ingressclass.parameterName.required': '请输入参数资源名称',
  'pages.k8s.forms.ingressclass.parameterNamespace.required':
    '请输入参数命名空间',
  'pages.k8s.forms.ingressclass.yaml.noNamespace':
    'Ingress 类是集群级资源，YAML 不应包含 metadata.namespace',
  'pages.k8s.forms.ingressclass.yaml.controllerRequired':
    'YAML 必须包含 spec.controller',
  'pages.k8s.forms.ingressclass.yaml.parametersKindName':
    'YAML spec.parameters 必须包含 kind 和 name',
  'pages.k8s.forms.ingressclass.yaml.parametersScope':
    'YAML spec.parameters.scope 必须为 Cluster 或 Namespace',
  'pages.k8s.forms.ingressclass.yaml.parametersNamespaceRequired':
    '命名空间级参数引用必须包含 namespace',
  'pages.k8s.forms.ingressclass.yaml.parametersNamespaceOnlyNamespaced':
    '只有 Namespace 作用域的参数引用可以包含 namespace',
  'pages.k8s.forms.networkpolicy.title': '创建网络策略',
  'pages.k8s.forms.networkpolicy.denyAll': '全部拒绝',
  'pages.k8s.forms.networkpolicy.ingress': '入站规则',
  'pages.k8s.forms.networkpolicy.egress': '出站规则',
  'pages.k8s.forms.networkpolicy.source': '来源',
  'pages.k8s.forms.networkpolicy.destination': '目标',
  'pages.k8s.forms.networkpolicy.metadata.description':
    '为 NetworkPolicy 资源添加标签和注解。',
  'pages.k8s.forms.networkpolicy.policyTypes': '策略类型',
  'pages.k8s.forms.networkpolicy.policyTypes.required':
    '请至少选择一种策略类型',
  'pages.k8s.forms.networkpolicy.policyTypes.ingress': '入站流量',
  'pages.k8s.forms.networkpolicy.policyTypes.egress': '出站流量',
  'pages.k8s.forms.networkpolicy.policyTypes.description':
    '选择网络策略生效的流量方向。未选择的方向不会输出对应规则。',
  'pages.k8s.forms.networkpolicy.policyTypes.tooltip':
    '对应 spec.policyTypes。',
  'pages.k8s.forms.networkpolicy.podSelector.description':
    '为空时会匹配当前命名空间内的所有 Pod。',
  'pages.k8s.forms.networkpolicy.podSelector.tooltip':
    '对应 spec.podSelector，可使用 matchLabels 与 matchExpressions。',
  'pages.k8s.forms.networkpolicy.podSelector.emptyHint':
    '未填写任何匹配条件：将输出空的 podSelector，策略作用于该命名空间内的所有 Pod。',
  'pages.k8s.forms.networkpolicy.selector.expressionKeyFirst':
    '请先填写已有表达式的键。',
  'pages.k8s.forms.networkpolicy.selector.expressionKeyRequired':
    '{label}的表达式必须填写键',
  'pages.k8s.forms.networkpolicy.selector.expressionValuesRequired':
    '{label}的 {operator} 表达式必须至少填写一个值',
  'pages.k8s.forms.networkpolicy.matchLabels': '匹配标签',
  'pages.k8s.forms.networkpolicy.matchLabels.description':
    '通过 key/value 精确匹配 Kubernetes 标签。',
  'pages.k8s.forms.networkpolicy.matchLabels.delete': '删除匹配标签',
  'pages.k8s.forms.networkpolicy.matchExpressions': '匹配表达式',
  'pages.k8s.forms.networkpolicy.matchExpressions.description':
    '支持 In、NotIn、Exists、DoesNotExist 条件表达式。',
  'pages.k8s.forms.networkpolicy.matchExpressions.valuesPlaceholder':
    '输入值后回车',
  'pages.k8s.forms.networkpolicy.matchExpressions.noValues': '无需填写值',
  'pages.k8s.forms.networkpolicy.matchExpressions.delete': '删除表达式',
  'pages.k8s.forms.networkpolicy.namespaceSelector': '命名空间选择器',
  'pages.k8s.forms.networkpolicy.peerType.podAndNamespace': 'Pod + 命名空间',
  'pages.k8s.forms.networkpolicy.peerType.ipBlock': 'IP 网段',
  'pages.k8s.forms.networkpolicy.ipBlock.cidrPlaceholder':
    'CIDR，如 10.0.0.0/24',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptPlaceholder':
    '排除 CIDR，输入后回车',
  'pages.k8s.forms.networkpolicy.ipBlock.cidrInvalid':
    'CIDR 格式不正确，例如 10.0.0.0/24 或 fd00::/64',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptInvalid':
    '排除网段 {item} 不是合法的 CIDR',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptNotSubset':
    '排除网段 {item} 必须是 {cidr} 的真子集',
  'pages.k8s.forms.networkpolicy.port.range': '端口号必须在 1-65535 之间',
  'pages.k8s.forms.networkpolicy.port.namePattern':
    '端口名称最长 15 个字符，只能包含小写字母、数字和连字符（-），且至少包含一个字母',
  'pages.k8s.forms.networkpolicy.port.placeholder': '端口号或端口名称',
  'pages.k8s.forms.networkpolicy.port.add': '添加端口',
  'pages.k8s.forms.networkpolicy.endPort': '结束端口',
  'pages.k8s.forms.networkpolicy.endPort.portMustBeNumber':
    '设置结束端口时，端口必须填写数字',
  'pages.k8s.forms.networkpolicy.endPort.range': '结束端口必须在 1-65535 之间',
  'pages.k8s.forms.networkpolicy.endPort.lessThanPort':
    '结束端口不能小于起始端口',
  'pages.k8s.forms.networkpolicy.endPort.hint':
    '结束端口用于端口范围：需要起始端口为数字，且不小于起始端口。',
  'pages.k8s.forms.networkpolicy.peer.cidrRequired':
    '{peer} {index} 的 IP 网段必须填写 CIDR',
  'pages.k8s.forms.networkpolicy.peer.cidrInvalid':
    '{peer} {index} 的 CIDR {cidr} 格式不正确',
  'pages.k8s.forms.networkpolicy.peer.prefix': '{peer} {index} 的{message}',
  'pages.k8s.forms.networkpolicy.peer.podSelectorOf':
    '{peer} {index} 的 Pod 选择器',
  'pages.k8s.forms.networkpolicy.peer.namespaceSelectorOf':
    '{peer} {index} 的命名空间选择器',
  'pages.k8s.forms.networkpolicy.rule.prefix': '{rule} {index}：{message}',
  'pages.k8s.forms.networkpolicy.summary.peers': '{label}：{text}',
  'pages.k8s.forms.networkpolicy.summary.ports': '端口：{text}',
  'pages.k8s.forms.networkpolicy.summary.portCount': '{count} 个端口',
  'pages.k8s.forms.networkpolicy.summary.allPorts': '全部端口',
  'pages.k8s.forms.networkpolicy.ingress.add': '添加入站规则',
  'pages.k8s.forms.networkpolicy.ingress.addDescription':
    '配置允许进入目标 Pod 的来源和端口。',
  'pages.k8s.forms.networkpolicy.ingress.description':
    '允许符合规则的来源访问目标 Pod',
  'pages.k8s.forms.networkpolicy.ingress.delete': '删除入站规则',
  'pages.k8s.forms.networkpolicy.ingress.addPeer': '添加来源',
  'pages.k8s.forms.networkpolicy.ingress.deletePeer': '删除来源',
  'pages.k8s.forms.networkpolicy.ingress.peerCount': '{count} 个来源',
  'pages.k8s.forms.networkpolicy.ingress.allPeers': '全部来源',
  'pages.k8s.forms.networkpolicy.ingress.denyAll':
    '未添加入站规则：将输出 ingress: []，拒绝所选 Pod 的全部入站流量。',
  'pages.k8s.forms.networkpolicy.ingress.disabled':
    '策略类型未选择入站流量，创建时不会输出 ingress 规则。',
  'pages.k8s.forms.networkpolicy.ingress.tooltip':
    '对应 spec.ingress。未添加规则时会输出空数组，表示拒绝所有入站流量。',
  'pages.k8s.forms.networkpolicy.egress.add': '添加出站规则',
  'pages.k8s.forms.networkpolicy.egress.addDescription':
    '配置目标 Pod 可访问的目的端和端口。',
  'pages.k8s.forms.networkpolicy.egress.description':
    '允许目标 Pod 访问符合规则的目的端',
  'pages.k8s.forms.networkpolicy.egress.delete': '删除出站规则',
  'pages.k8s.forms.networkpolicy.egress.addPeer': '添加目标',
  'pages.k8s.forms.networkpolicy.egress.deletePeer': '删除目标',
  'pages.k8s.forms.networkpolicy.egress.peerCount': '{count} 个目标',
  'pages.k8s.forms.networkpolicy.egress.allPeers': '全部目标',
  'pages.k8s.forms.networkpolicy.egress.denyAll':
    '未添加出站规则：将输出 egress: []，拒绝所选 Pod 的全部出站流量。',
  'pages.k8s.forms.networkpolicy.egress.disabled':
    '策略类型未选择出站流量，创建时不会输出 egress 规则。',
  'pages.k8s.forms.networkpolicy.egress.tooltip':
    '对应 spec.egress。未添加规则时会输出空数组，表示拒绝所有出站流量。',
  'pages.k8s.forms.secret.binaryValue': '二进制数据',
  'pages.k8s.forms.secret.type.opaque': '默认',
  'pages.k8s.forms.secret.type.tls': 'TLS 信息',
  'pages.k8s.forms.secret.type.dockerconfigjson': '镜像服务信息',
  'pages.k8s.forms.secret.type.basicAuth': '用户名和密码',
  'pages.k8s.forms.secret.data.atLeastOne': '请添加至少一条数据',
  'pages.k8s.forms.secret.metadata.keyRequired': '请填写{title}的键',
  'pages.k8s.forms.secret.metadata.keyInvalid':
    '{title}的键「{keyName}」不合法',
  'pages.k8s.forms.secret.metadata.keyDuplicate': '{title}的键不能重复',
  'pages.k8s.forms.secret.certificate': '证书',
  'pages.k8s.forms.secret.certificate.required': '请输入证书',
  'pages.k8s.forms.secret.privateKey': '私钥',
  'pages.k8s.forms.secret.privateKey.required': '请输入私钥',
  'pages.k8s.forms.secret.registryAddress': '镜像服务地址',
  'pages.k8s.forms.secret.registryAddress.required': '请输入镜像服务地址',
  'pages.k8s.forms.secret.registryAddress.extra':
    '设置镜像服务地址，例如 docker.io。',
  'pages.k8s.forms.secret.registryAddress.placeholder': '例如 docker.io',
  'pages.k8s.forms.secret.email': '邮箱',
  'pages.k8s.forms.secret.email.placeholder': '请输入邮箱',
  'pages.k8s.forms.secret.registry.incomplete':
    '请设置镜像服务地址、用户名和密码。',
  'pages.k8s.forms.secret.dataSettings': '数据设置',
  'pages.k8s.forms.secret.createTitle': '创建保密字典',
  'pages.k8s.forms.secret.metadata.description':
    '为保密字典资源添加标签和注解。',
  'pages.k8s.forms.secret.dataEditor.addDescription': '添加键值对数据。',
  'pages.k8s.forms.secret.dataEditor.keyDuplicate': '键不能重复',
  'pages.k8s.forms.secret.dataEditor.systemKey': '{keyName} 为系统生成字段',
  'pages.k8s.forms.configmap.createTitle': '创建配置字典',
  'pages.k8s.forms.configmap.metadata.description':
    '为配置字典资源添加标签和注解。',
  'pages.k8s.forms.configmap.data.keyRequired': '请填写数据键',
  'pages.k8s.forms.configmap.data.keyUsedByBinary':
    '键 {keyName} 已被二进制数据占用',
  'pages.k8s.forms.configmap.yaml.dataNotObject': 'YAML data 必须为键值对象',
  'pages.k8s.forms.configmap.yaml.dataValueNotString':
    'YAML data 的值必须为字符串',
  'pages.k8s.forms.edit.secret.hiddenPlaceholder': '已隐藏，输入新内容以替换',
  'pages.k8s.forms.edit.secret.keepHint': '留空则保持原值。',
  'pages.k8s.forms.edit.secret.docker.hiddenCanReveal':
    '镜像服务信息已隐藏。点击「查看明文」后可编辑镜像服务地址、用户名和密码；也可以在下方整体替换 .dockerconfigjson 的内容。',
  'pages.k8s.forms.edit.secret.docker.hiddenNoPermission':
    '镜像服务信息已隐藏，当前账号没有查看明文的权限，无法编辑镜像服务地址、用户名和密码。可以在下方整体替换 .dockerconfigjson 的内容，或只修改标签与注解。',
  'pages.k8s.forms.edit.secret.docker.unparsed':
    '无法从 .dockerconfigjson 解析出镜像服务信息，只能在下方整体替换它的内容。',
  'pages.k8s.forms.edit.secret.docker.replaced':
    '已整体替换 .dockerconfigjson，镜像服务信息以替换的内容为准；撤销替换后可恢复按表单编辑。',
  'pages.k8s.forms.edit.secret.mask.notAllowed': '不能是掩码 {mask}',
  'pages.k8s.forms.edit.secret.mask.valueNotAllowed': '值不能是掩码 {mask}',
  'pages.k8s.forms.edit.secret.mask.keyValueNotAllowed':
    '键 {keyName} 的值不能是掩码 {mask}',
  'pages.k8s.forms.edit.secret.mask.fieldNotAllowed':
    '{title}不能是掩码 {mask}',
  'pages.k8s.forms.edit.secret.data.renameHidden':
    '键 {sourceKey} 的值已隐藏，改名前请先输入新值',
  'pages.k8s.forms.edit.secret.typeImmutable': '类型创建后不可修改。',
  'pages.k8s.forms.edit.secret.otherData': '其他数据',
  'pages.k8s.forms.edit.secret.revealed':
    '已显示明文。未修改的数据保存时保持原值。',
  'pages.k8s.forms.edit.secret.hiddenNoPermission':
    '已有数据的值已隐藏，当前账号没有查看明文的权限；可以直接输入新值替换。',
  'pages.k8s.forms.edit.secret.reveal': '查看明文',
  'pages.k8s.forms.edit.secret.hiddenHint':
    '已有数据的值已隐藏。查看明文会记入操作审计；也可以直接输入新值替换。',
  'pages.k8s.forms.edit.secret.immutable':
    '该保密字典已设为不可变（immutable），数据无法修改，仅可编辑标签与注解。',
  'pages.k8s.forms.edit.secret.tag.new': '新增',
  'pages.k8s.forms.edit.secret.tag.modified': '已修改',
  'pages.k8s.forms.edit.secret.undo': '撤销修改',
  'pages.k8s.forms.edit.secret.replaceData': '替换数据',
  'pages.k8s.forms.edit.secret.replaceNotice':
    '当前值已隐藏。保存后将以下方输入的内容替换原值；不想替换请点取消。',
  'pages.k8s.forms.edit.secret.dataEditor.fillAbove':
    '{keyName} 请在上方的表单项里填写',
  'pages.k8s.forms.edit.configmap.immutable':
    '该配置字典已设为不可变（immutable），数据无法修改，仅可编辑标签与注解。',
  'pages.k8s.forms.edit.configmap.binaryKeysNotice':
    '二进制数据（{keys}）不在此处编辑，保存时原样保留。',
  'pages.k8s.forms.edit.service.accessMode.description':
    '设置从集群外访问服务的方式。',
  'pages.k8s.forms.edit.service.accessMode.none': '无',
  'pages.k8s.forms.edit.service.lbClass.description':
    '指定由哪类负载均衡器实现接管该 Service。',
  'pages.k8s.forms.edit.service.lbClass.placeholder':
    '例如 service.k8s.aws/nlb',
  'pages.k8s.forms.edit.service.nodePortAllocation': 'NodePort 分配',
  'pages.k8s.forms.edit.service.nodePortAllocation.description':
    '控制 LoadBalancer 是否自动分配 NodePort。',
  'pages.k8s.forms.edit.service.nodePortAllocation.checkbox':
    '为 LoadBalancer 服务自动分配 NodePort',
  'pages.k8s.forms.edit.service.externalTrafficPolicy': '外部流量策略',
  'pages.k8s.forms.edit.service.externalTrafficPolicy.description':
    'Local 可保留客户端源 IP，Cluster 会在集群范围内转发。',
  'pages.k8s.forms.edit.service.externalTrafficPolicy.placeholder':
    '默认由集群决定',
  'pages.k8s.forms.edit.service.annotations.description':
    '通过注解补充负载均衡器相关配置。',
  'pages.k8s.forms.edit.service.externalAccessTitle': '编辑外部访问',
  'pages.k8s.forms.edit.service.settingsTitle': '编辑服务设置',
  'pages.k8s.forms.edit.ingress.annotationsTitle': '编辑注解',
  'pages.k8s.forms.edit.ingress.annotations.description':
    '为应用路由配置注解信息。',
  'pages.k8s.forms.edit.ingress.annotations.keyRequired': '注解 Key 不能为空',
  'pages.k8s.forms.edit.ingress.annotations.keyDuplicate': '注解 Key 不能重复',
  'pages.k8s.forms.edit.ingress.rulesTitle': '编辑路由规则',
  'pages.k8s.forms.edit.workload.updateStrategy.description':
    '配置工作负载更新容器组副本时采用的策略。',
  'pages.k8s.forms.edit.workload.strategyType': '策略类型',
  'pages.k8s.forms.edit.workload.containers.description':
    '维护容器镜像、端口、资源和高级配置。',
  'pages.k8s.forms.edit.workload.storage.description':
    '为容器组挂载持久卷、临时卷、配置字典或保密字典。',
  'pages.k8s.forms.edit.workload.scheduling': '容器组调度规则',
  'pages.k8s.forms.edit.workload.scheduling.description':
    '设置容器组副本调度到节点的规则。',
  'pages.k8s.forms.edit.workload.ruleType': '规则类型',
  'pages.k8s.forms.edit.workload.termination': '容器组优雅终止',
  'pages.k8s.forms.edit.workload.termination.description':
    '设置容器终止前等待的时间，超时后容器将强制终止。',
};
