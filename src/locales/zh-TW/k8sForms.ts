/** 容器平台 · 資源建立 / 編輯表單（工作負載、設定、網路、儲存、RBAC 等精靈的文案） */
export default {
  'pages.k8s.forms.common.set': '已設定',
  'pages.k8s.forms.common.unset': '未設定',
  'pages.k8s.forms.common.name': '名稱',
  'pages.k8s.forms.common.name.required': '請輸入名稱',
  'pages.k8s.forms.common.name.maxLength': '名稱最長 63 個字元',
  'pages.k8s.forms.common.name.maxLength253': '名稱最長 253 個字元',
  'pages.k8s.forms.common.name.pattern':
    '名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.common.name.dnsLabel':
    '名稱只能包含小寫字母、數字和連字號（-），必須以小寫字母或數字開頭和結尾，最長 63 個字元',
  'pages.k8s.forms.common.namespace': '命名空間',
  'pages.k8s.forms.common.namespace.required': '請選擇命名空間',
  'pages.k8s.forms.common.namespace.placeholder': '選擇將要建立資源的命名空間',
  'pages.k8s.forms.common.labels': '標籤',
  'pages.k8s.forms.common.annotations': '註解',
  'pages.k8s.forms.common.metadata': '中繼資料',
  'pages.k8s.forms.common.addMetadata': '新增中繼資料',
  'pages.k8s.forms.common.advanced': '進階設定',
  'pages.k8s.forms.common.current': '目前',
  'pages.k8s.forms.common.yes': '是',
  'pages.k8s.forms.common.no': '否',
  'pages.k8s.forms.common.type': '類型',
  'pages.k8s.forms.common.type.required': '請選擇類型',
  'pages.k8s.forms.common.select': '請選擇',
  'pages.k8s.forms.common.labelKey': '標籤鍵',
  'pages.k8s.forms.common.labelValue': '標籤值',
  'pages.k8s.forms.common.key.required': '請輸入鍵',
  'pages.k8s.forms.common.key.maxLength': '鍵最長 253 個字元',
  'pages.k8s.forms.common.key.pattern':
    '鍵只能包含字母、數字、點（.）、底線（_）和連字號（-）',
  'pages.k8s.forms.common.deleteLabel': '刪除標籤',
  'pages.k8s.forms.common.deleteAnnotation': '刪除註解',
  'pages.k8s.forms.common.labelKeyFirst': '請先填寫已有標籤的鍵。',
  'pages.k8s.forms.common.annotationKeyFirst': '請先填寫已有註解的鍵。',
  'pages.k8s.forms.common.username': '使用者名稱',
  'pages.k8s.forms.common.username.required': '請輸入使用者名稱',
  'pages.k8s.forms.common.password': '密碼',
  'pages.k8s.forms.common.password.required': '請輸入密碼',
  'pages.k8s.forms.common.accessMode': '存取模式',
  'pages.k8s.forms.common.accessMode.required': '請選擇存取模式',
  'pages.k8s.forms.common.data': '資料',
  'pages.k8s.forms.common.editData': '編輯資料',
  'pages.k8s.forms.common.addData': '新增資料',
  'pages.k8s.forms.common.deleteData': '刪除資料',
  'pages.k8s.forms.common.dataKeyDuplicate': '資料鍵不能重複',
  'pages.k8s.forms.common.storage': '儲存設定',
  'pages.k8s.forms.common.capacity': '容量',
  'pages.k8s.forms.common.capacity.required': '請輸入容量',
  'pages.k8s.forms.common.volumeName.required': '請輸入磁碟區名稱',
  'pages.k8s.forms.common.volumeMode.required': '請選擇磁碟區模式',
  'pages.k8s.forms.common.storageClass': '儲存類別',
  'pages.k8s.forms.common.empty': '空',
  'pages.k8s.forms.common.hidden': '已隱藏',
  'pages.k8s.forms.common.port.required': '請輸入連接埠',
  'pages.k8s.forms.common.port.range': '連接埠範圍為 1-65535',
  'pages.k8s.forms.common.deletePort': '刪除連接埠',
  'pages.k8s.forms.common.protocol.required': '請選擇通訊協定',
  'pages.k8s.forms.common.command': '命令',
  'pages.k8s.forms.common.container': '容器',
  'pages.k8s.forms.common.user': '使用者',
  'pages.k8s.forms.common.podSelector': 'Pod 選擇器',
  'pages.k8s.forms.common.noResources': '未發現可用資源',
  'pages.k8s.forms.common.editSettings': '編輯設定',
  'pages.k8s.forms.common.yaml.nameNamespaceRequired':
    'YAML 必須包含 metadata.name 和 metadata.namespace',
  'pages.k8s.forms.common.yaml.nameRequired': 'YAML 必須包含 metadata.name',
  'pages.k8s.forms.common.yaml.invalidObject':
    'YAML 格式不正確，內容必須是有效的資源物件',
  'pages.k8s.forms.common.yaml.invalid':
    'YAML 格式不正確或不是有效的資源物件，請檢查後重試',
  'pages.k8s.forms.common.yaml.kindMismatch': 'YAML kind 必須為 {kind}',
  'pages.k8s.forms.common.yaml.apiVersionMismatch':
    'YAML apiVersion 必須為 {apiVersion}',
  'pages.k8s.forms.workload.container.delete': '刪除容器',
  'pages.k8s.forms.workload.container.delete.content':
    '確定刪除容器「{name}」嗎？該容器的設定和儲存掛載設定將一併移除。',
  'pages.k8s.forms.workload.container.delete.aria': '刪除 {name}',
  'pages.k8s.forms.workload.container.new': '新容器',
  'pages.k8s.forms.workload.container.add': '新增容器',
  'pages.k8s.forms.workload.container.add.description':
    '自訂容器的設定以建立容器',
  'pages.k8s.forms.workload.container.edit': '編輯容器設定',
  'pages.k8s.forms.workload.container.edit.aria': '編輯 {name} 設定',
  'pages.k8s.forms.workload.container.keepOne': '至少保留一個容器',
  'pages.k8s.forms.workload.container.image.line': '映像檔：{image}',
  'pages.k8s.forms.workload.container.image.unset': '未填寫',
  'pages.k8s.forms.workload.container.noLimit': '無上限',
  'pages.k8s.forms.workload.container.noResourceLimit': '無資源上限',
  'pages.k8s.forms.workload.container.replicas': '容器組副本數量',
  'pages.k8s.forms.workload.container.replicas.decrease': '減少容器組副本數量',
  'pages.k8s.forms.workload.container.replicas.increase': '增加容器組副本數量',
  'pages.k8s.forms.workload.container.replicas.required': '請輸入副本數',
  'pages.k8s.forms.workload.container.command.required': '請輸入命令',
  'pages.k8s.forms.workload.container.command.placeholder': '例如 /bin/sh',
  'pages.k8s.forms.workload.container.arg.delete': '刪除參數',
  'pages.k8s.forms.workload.container.args': '參數',
  'pages.k8s.forms.workload.container.args.add': '新增參數',
  'pages.k8s.forms.workload.container.args.placeholder': '請輸入參數',
  'pages.k8s.forms.workload.container.args.help':
    '容器啟動命令的參數。每項填寫一個參數，參數內容原樣傳遞（可以包含逗號和空格）。',
  'pages.k8s.forms.workload.container.settings': '容器設定',
  'pages.k8s.forms.workload.container.settings.description':
    '設定容器的映像檔、名稱、類型和運算資源',
  'pages.k8s.forms.workload.container.image.tooltip':
    '如需使用私有映像檔服務，您需要先建立映像檔服務保密字典',
  'pages.k8s.forms.workload.container.image.required': '請輸入容器映像檔',
  'pages.k8s.forms.workload.container.image.placeholder':
    '映像檔名稱或路徑，例如 nginx:latest',
  'pages.k8s.forms.workload.container.name': '容器名稱',
  'pages.k8s.forms.workload.container.name.required': '請輸入容器名稱',
  'pages.k8s.forms.workload.container.name.maxLength': '容器名稱最長 63 個字元',
  'pages.k8s.forms.workload.container.name.pattern':
    '容器名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.workload.container.name.duplicate': '容器名稱已存在',
  'pages.k8s.forms.workload.container.name.placeholder':
    '例如 container-ab12cd34',
  'pages.k8s.forms.workload.container.type': '容器類型',
  'pages.k8s.forms.workload.container.type.worker': '工作容器',
  'pages.k8s.forms.workload.container.type.required': '請選擇容器類型',
  'pages.k8s.forms.workload.container.ports': '連接埠設定',
  'pages.k8s.forms.workload.container.ports.description':
    '設定用於存取容器的連接埠。',
  'pages.k8s.forms.workload.container.ports.protocolHint':
    'HTTP/HTTPS 會在提交時按 TCP 容器連接埠通訊協定產生。',
  'pages.k8s.forms.workload.container.ports.name.maxLength':
    '連接埠名稱最長 15 個字元',
  'pages.k8s.forms.workload.container.ports.name.pattern':
    '連接埠名稱只能包含小寫字母、數字和連字號（-）',
  'pages.k8s.forms.workload.container.ports.name.placeholder': '例如 http-0',
  'pages.k8s.forms.workload.container.ports.containerPort': '容器連接埠',
  'pages.k8s.forms.workload.container.ports.containerPort.required':
    '請輸入容器連接埠',
  'pages.k8s.forms.workload.container.ports.add': '新增連接埠',
  'pages.k8s.forms.workload.container.required': '必填',
  'pages.k8s.forms.workload.container.protocol': '通訊協定',
  'pages.k8s.forms.workload.container.path': '路徑',
  'pages.k8s.forms.workload.container.path.required': '請輸入路徑',
  'pages.k8s.forms.workload.container.http.scheme.aria': '請求通訊協定',
  'pages.k8s.forms.workload.container.http.path.aria': '請求路徑',
  'pages.k8s.forms.workload.container.http.port.aria': '請求連接埠',
  'pages.k8s.forms.workload.container.resources.cpuRequest': 'CPU 預留',
  'pages.k8s.forms.workload.container.resources.cpuRequest.exceedsLimit':
    'CPU 預留不能大於 CPU 限制',
  'pages.k8s.forms.workload.container.resources.cpuLimit': 'CPU 限制',
  'pages.k8s.forms.workload.container.resources.memoryRequest': '記憶體預留',
  'pages.k8s.forms.workload.container.resources.memoryRequest.exceedsLimit':
    '記憶體預留不能大於記憶體限制',
  'pages.k8s.forms.workload.container.resources.memoryLimit': '記憶體限制',
  'pages.k8s.forms.workload.container.resources.noRequest': '無預留',
  'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent':
    '優先使用本機映像檔',
  'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent.description':
    '如果本機存在所需的映像檔，則優先使用本機映像檔。',
  'pages.k8s.forms.workload.container.pullPolicy.always': '每次都拉取映像檔',
  'pages.k8s.forms.workload.container.pullPolicy.always.description':
    '在容器組建立及更新時，每次都嘗試拉取新的映像檔。',
  'pages.k8s.forms.workload.container.pullPolicy.never': '僅使用本機映像檔',
  'pages.k8s.forms.workload.container.pullPolicy.never.description':
    '僅使用本機映像檔。如果本機不存在所需的映像檔，則會導致容器異常。',
  'pages.k8s.forms.workload.container.healthCheck': '健康檢查',
  'pages.k8s.forms.workload.container.healthCheck.description':
    '新增探針以定時檢查容器健康狀態。',
  'pages.k8s.forms.workload.container.lifecycle': '生命週期管理',
  'pages.k8s.forms.workload.container.lifecycle.description':
    '設定容器啟動後或終止前需要執行的動作，以進行環境檢查或正常終止。',
  'pages.k8s.forms.workload.container.lifecycle.postStart': '啟動後動作',
  'pages.k8s.forms.workload.container.lifecycle.postStart.description':
    '設定容器啟動後需要執行的動作。',
  'pages.k8s.forms.workload.container.lifecycle.preStop': '終止前動作',
  'pages.k8s.forms.workload.container.lifecycle.preStop.description':
    '設定容器終止前需要執行的動作。',
  'pages.k8s.forms.workload.container.lifecycle.command.help':
    '每項填寫命令的一個參數，例如 /bin/sh、-c、要執行的指令碼。',
  'pages.k8s.forms.workload.container.lifecycle.remove': '移除動作',
  'pages.k8s.forms.workload.container.lifecycle.add': '新增動作',
  'pages.k8s.forms.workload.container.handler.httpGet': 'HTTP 請求',
  'pages.k8s.forms.workload.container.handler.tcpSocket': 'TCP 連接埠',
  'pages.k8s.forms.workload.container.startupCommand.description':
    '自訂容器啟動時執行的命令。預設情況下，容器啟動時將執行映像檔的預設命令。',
  'pages.k8s.forms.workload.container.startupCommand.add': '新增命令',
  'pages.k8s.forms.workload.container.startupCommand.help':
    '容器的啟動命令。每項填寫一個參數，例如 /bin/sh、-c。',
  'pages.k8s.forms.workload.container.env.description': '為容器新增環境變數。',
  'pages.k8s.forms.workload.container.env.source.custom': '自訂',
  'pages.k8s.forms.workload.container.env.source.configMap': '來自配置字典',
  'pages.k8s.forms.workload.container.env.source.secret': '來自保密字典',
  'pages.k8s.forms.workload.container.env.source.required': '請選擇來源',
  'pages.k8s.forms.workload.container.env.resource': '資源',
  'pages.k8s.forms.workload.container.env.resource.required': '請選擇資源',
  'pages.k8s.forms.workload.container.env.resourceKey': '資源中的鍵',
  'pages.k8s.forms.workload.container.env.resourceKey.required':
    '請選擇資源中的鍵',
  'pages.k8s.forms.workload.container.env.key.pattern':
    '鍵只能包含字母、數字和底線，且不能以數字開頭',
  'pages.k8s.forms.workload.container.env.delete': '刪除環境變數',
  'pages.k8s.forms.workload.container.env.add': '新增環境變數',
  'pages.k8s.forms.workload.container.env.helper.prefix':
    '如果沒有配置字典或保密字典滿足需求，您可以',
  'pages.k8s.forms.workload.container.env.helper.createConfigMap':
    '建立配置字典',
  'pages.k8s.forms.workload.container.env.helper.or': '或',
  'pages.k8s.forms.workload.container.env.helper.createSecret': '建立保密字典',
  'pages.k8s.forms.workload.container.env.helper.suffix': '。',
  'pages.k8s.forms.workload.container.securityContext': '容器安全性內容',
  'pages.k8s.forms.workload.container.securityContext.description':
    '自訂容器的權限設定。',
  'pages.k8s.forms.workload.container.resizePolicy': 'Resize 策略',
  'pages.k8s.forms.workload.container.resizePolicy.description':
    '宣告 Kubernetes 1.35+ 就地調整 CPU 或記憶體時是否需要重新啟動容器。',
  'pages.k8s.forms.workload.container.resizePolicy.cpu': 'CPU 調整策略',
  'pages.k8s.forms.workload.container.resizePolicy.memory': '記憶體調整策略',
  'pages.k8s.forms.workload.container.resizePolicy.notRequired': '無需重新啟動',
  'pages.k8s.forms.workload.container.resizePolicy.restartContainer':
    '重新啟動容器',
  'pages.k8s.forms.workload.container.resizePolicy.placeholder':
    '預設無需重新啟動',
  'pages.k8s.forms.workload.container.resizePolicy.help':
    '當 Pod restartPolicy 為 Never 時，容器 resizePolicy 必須保持無需重新啟動。',
  'pages.k8s.forms.workload.container.syncTimezone': '同步主機時區',
  'pages.k8s.forms.workload.container.syncTimezone.description':
    '同步容器與主機的時區。',
  'pages.k8s.forms.workload.container.probe.liveness': '存活檢查',
  'pages.k8s.forms.workload.container.probe.liveness.description':
    '檢查容器是否存活。',
  'pages.k8s.forms.workload.container.probe.readiness': '就緒檢查',
  'pages.k8s.forms.workload.container.probe.readiness.description':
    '檢查容器是否可以處理請求。',
  'pages.k8s.forms.workload.container.probe.startup': '啟動檢查',
  'pages.k8s.forms.workload.container.probe.startup.description':
    '檢查容器是否啟動成功。',
  'pages.k8s.forms.workload.container.probe.initialDelay': '初始延遲（s）',
  'pages.k8s.forms.workload.container.probe.initialDelay.min':
    '初始延遲最小值為 0',
  'pages.k8s.forms.workload.container.probe.initialDelay.description':
    '容器啟動後探針啟動前的延遲時間。',
  'pages.k8s.forms.workload.container.probe.timeout': '逾時時間（s）',
  'pages.k8s.forms.workload.container.probe.timeout.min': '逾時時間最小值為 0',
  'pages.k8s.forms.workload.container.probe.timeout.description':
    '探針逾時時間。探針逾時後，檢查將被視為失敗。取值必須為整數，最小值為 0。',
  'pages.k8s.forms.workload.container.probe.period': '檢查間隔（s）',
  'pages.k8s.forms.workload.container.probe.period.min': '檢查間隔最小值為 1',
  'pages.k8s.forms.workload.container.probe.period.description':
    '執行檢查的時間間隔。取值必須為整數，最小值為 1。',
  'pages.k8s.forms.workload.container.probe.successThreshold': '成功閾值',
  'pages.k8s.forms.workload.container.probe.successThreshold.min':
    '成功閾值最小值為 1',
  'pages.k8s.forms.workload.container.probe.successThreshold.description':
    '檢查失敗後再次被視為成功所需的最小連續成功次數。最小值為 1。對於存活探針和啟動探針，此參數值必須為 1。',
  'pages.k8s.forms.workload.container.probe.failureThreshold': '失敗閾值',
  'pages.k8s.forms.workload.container.probe.failureThreshold.min':
    '失敗閾值最小值為 1',
  'pages.k8s.forms.workload.container.probe.failureThreshold.description':
    '檢查成功後再次被視為失敗所需的最小連續失敗次數。最小值為 1。',
  'pages.k8s.forms.workload.container.probe.timing.required': '請輸入{label}',
  'pages.k8s.forms.workload.container.probe.command.placeholder': '例如 cat',
  'pages.k8s.forms.workload.container.probe.command.help':
    '每項填寫命令的一個參數，例如 cat、/tmp/healthy。',
  'pages.k8s.forms.workload.container.probe.remove': '移除探針',
  'pages.k8s.forms.workload.container.probe.add': '新增探針',
  'pages.k8s.forms.workload.container.security.capability.delete':
    '刪除{label}權能',
  'pages.k8s.forms.workload.container.security.access': '存取控制',
  'pages.k8s.forms.workload.container.security.privileged.description':
    '以主機上的 root 使用者執行容器處理程序。',
  'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation':
    '允許特權提升',
  'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation.description':
    '允許容器處理程序取得比父處理程序更多的特權。當特權模式啟用時，此選項預設啟用。',
  'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem':
    '根目錄唯讀',
  'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem.description':
    '將容器檔案系統的根目錄設定為唯讀。',
  'pages.k8s.forms.workload.container.security.userGroup': '使用者和使用者群組',
  'pages.k8s.forms.workload.container.security.runAsNonRoot':
    '僅允許非 root 使用者執行',
  'pages.k8s.forms.workload.container.security.runAsNonRoot.description':
    '啟動容器之前檢查容器是否將以 root 使用者執行。如果容器將以 root 使用者執行則不啟動容器。',
  'pages.k8s.forms.workload.container.security.runAsUser.placeholder':
    '請輸入使用者 ID',
  'pages.k8s.forms.workload.container.security.runAsUser.help':
    '執行容器處理程序進入點的 UID。預設為映像檔中繼資料中指定的 UID。',
  'pages.k8s.forms.workload.container.security.group': '使用者群組',
  'pages.k8s.forms.workload.container.security.runAsGroup.placeholder':
    '請輸入使用者群組 ID',
  'pages.k8s.forms.workload.container.security.runAsGroup.help':
    '執行容器處理程序進入點的 GID。預設為容器執行階段的預設 GID。',
  'pages.k8s.forms.workload.container.security.seLinux': 'SELinux 內容',
  'pages.k8s.forms.workload.container.security.seLinux.level': '等級',
  'pages.k8s.forms.workload.container.security.seLinux.level.placeholder':
    '請輸入 SELinux 等級',
  'pages.k8s.forms.workload.container.security.seLinux.role.placeholder':
    '請輸入 SELinux 角色',
  'pages.k8s.forms.workload.container.security.seLinux.type.placeholder':
    '請輸入 SELinux 類型',
  'pages.k8s.forms.workload.container.security.seLinux.user.placeholder':
    '請輸入 SELinux 使用者',
  'pages.k8s.forms.workload.container.security.capabilities': '權能',
  'pages.k8s.forms.workload.container.security.capabilities.add.placeholder':
    '例如 NET_ADMIN',
  'pages.k8s.forms.workload.container.security.capabilities.drop.placeholder':
    '例如 ALL',
  'pages.k8s.forms.workload.container.security.seccomp': 'Seccomp 設定',
  'pages.k8s.forms.workload.container.security.seccomp.type': '設定類型',
  'pages.k8s.forms.workload.container.security.seccomp.type.placeholder':
    '請選擇 Seccomp 類型',
  'pages.k8s.forms.workload.container.security.seccomp.localhost':
    '本機設定檔路徑',
  'pages.k8s.forms.workload.container.security.seccomp.localhost.required':
    '請輸入本機設定檔路徑',
  'pages.k8s.forms.workload.container.security.seccomp.localhost.placeholder':
    '例如 profiles/audit.json',
  'pages.k8s.forms.workload.container.security.seccomp.help':
    'RuntimeDefault 使用容器執行階段的預設設定；Localhost 需要填寫節點上的設定檔路徑。',
  'pages.k8s.forms.workload.step.pod': '容器組設定',
  'pages.k8s.forms.workload.selectField': '請選擇{label}',
  'pages.k8s.forms.workload.listSeparator': '、',
  'pages.k8s.forms.workload.metadata.description': '為資源新增中繼資料',
  'pages.k8s.forms.workload.check.containersRequired':
    '請先新增容器並填寫容器名稱和映像檔',
  'pages.k8s.forms.workload.check.workerContainerRequired':
    '請至少新增一個工作容器',
  'pages.k8s.forms.workload.check.containerNameDuplicate': '容器名稱不能重複',
  'pages.k8s.forms.workload.check.nameNamespaceRequired':
    '請先填寫名稱和命名空間',
  'pages.k8s.forms.workload.yaml.invalid': 'YAML 格式不正確，請檢查後重試',
  'pages.k8s.forms.workload.yaml.invalidObject':
    'YAML 內容必須是有效的資源物件',
  'pages.k8s.forms.workload.termination.title': '容器組優雅終止',
  'pages.k8s.forms.workload.termination.enable': '啟用容器組優雅終止',
  'pages.k8s.forms.workload.termination.tip':
    '設定容器終止前等待的時間，逾時後容器將強制終止。',
  'pages.k8s.forms.workload.termination.description':
    '設定容器終止前的等待時間。',
  'pages.k8s.forms.workload.termination.config': '終止設定',
  'pages.k8s.forms.workload.termination.gracePeriod': '終止寬限時間 (s)',
  'pages.k8s.forms.workload.termination.gracePeriod.required':
    '請輸入終止寬限時間',
  'pages.k8s.forms.workload.podMetadata.tip': '為容器組副本新增中繼資料。',
  'pages.k8s.forms.workload.node.role.controlPlane': '控制平面節點',
  'pages.k8s.forms.workload.node.role.worker': '工作節點',
  'pages.k8s.forms.workload.node.status.unschedulable': '已禁止排程',
  'pages.k8s.forms.workload.node.assign': '指定節點',
  'pages.k8s.forms.workload.node.assign.description':
    '將容器副本分配給特定節點。',
  'pages.k8s.forms.workload.node.select': '選擇節點',
  'pages.k8s.forms.workload.node.select.description':
    '將容器組副本分配給特定的節點。您可以使用標籤選擇節點或手動指定節點',
  'pages.k8s.forms.workload.node.selector.add': '新增節點選擇器',
  'pages.k8s.forms.workload.node.selector.delete': '刪除節點選擇器',
  'pages.k8s.forms.workload.node.selector.keyFirst':
    '請先填寫已有節點選擇器的鍵。',
  'pages.k8s.forms.workload.scheduling.label': '容器組排程規則',
  'pages.k8s.forms.workload.scheduling.tip': '設定容器組副本排程到節點的規則',
  'pages.k8s.forms.workload.scheduling.default': '預設規則',
  'pages.k8s.forms.workload.scheduling.default.description':
    '按照預設的規則將容器組副本排程到節點。',
  'pages.k8s.forms.workload.scheduling.spread': '分散排程',
  'pages.k8s.forms.workload.scheduling.spread.description':
    '盡可能將容器組副本排程到不同的節點上。',
  'pages.k8s.forms.workload.scheduling.centralized': '集中排程',
  'pages.k8s.forms.workload.scheduling.centralized.description':
    '盡可能將容器組副本排程到同一節點上。',
  'pages.k8s.forms.workload.scheduling.custom': '自訂規則',
  'pages.k8s.forms.workload.scheduling.custom.description':
    '按照自訂的規則將容器組副本排程到節點。',
  'pages.k8s.forms.workload.scheduling.type.affinity': '與目標排程到一起',
  'pages.k8s.forms.workload.scheduling.type.antiAffinity': '遠離目標排程',
  'pages.k8s.forms.workload.scheduling.strategy.preferred': '盡可能符合',
  'pages.k8s.forms.workload.scheduling.strategy.required': '請選擇策略',
  'pages.k8s.forms.workload.scheduling.strategy.must': '必須符合',
  'pages.k8s.forms.workload.scheduling.target.required': '請選擇目標',
  'pages.k8s.forms.workload.scheduling.target.empty': '暫無目標',
  'pages.k8s.forms.workload.scheduling.clearRule': '清空自訂排程規則',
  'pages.k8s.forms.workload.podSecurity.title': '容器組安全性內容',
  'pages.k8s.forms.workload.podSecurity.enable': '啟用容器組安全性內容',
  'pages.k8s.forms.workload.podSecurity.tip':
    '如果容器組安全性內容和容器安全性內容中都設定了使用者、使用者群組和 SELinux 內容，容器安全性內容中的設定將覆寫容器組安全性內容中的設定。',
  'pages.k8s.forms.workload.podSecurity.description': '自訂容器組的權限設定。',
  'pages.k8s.forms.workload.podSecurity.userAndGroup': '使用者和使用者群組',
  'pages.k8s.forms.workload.podSecurity.runAsNonRoot':
    '僅允許非 root 使用者執行',
  'pages.k8s.forms.workload.podSecurity.runAsNonRoot.tip':
    '啟動容器之前檢查容器是否將以 root 使用者執行。如果容器將以 root 使用者執行則不啟動容器',
  'pages.k8s.forms.workload.podSecurity.runAsUser.tip':
    '執行容器處理程序進入點的 UID。預設為映像檔中繼資料中指定的 UID',
  'pages.k8s.forms.workload.podSecurity.runAsUser.placeholder':
    '請輸入使用者 ID',
  'pages.k8s.forms.workload.podSecurity.runAsGroup': '使用者群組',
  'pages.k8s.forms.workload.podSecurity.runAsGroup.tip':
    '執行容器處理程序進入點的 GID。預設為容器執行時期的預設 GID',
  'pages.k8s.forms.workload.podSecurity.runAsGroup.placeholder':
    '請輸入使用者群組 ID',
  'pages.k8s.forms.workload.podSecurity.fsGroup': '檔案系統群組',
  'pages.k8s.forms.workload.podSecurity.fsGroup.tip':
    '掛載磁碟區時使用的 FSGroup。',
  'pages.k8s.forms.workload.podSecurity.fsGroup.placeholder':
    '請輸入檔案系統群組 ID',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy':
    '附加群組原則',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.tip':
    'Kubernetes 1.35 GA。Strict 僅附加明確宣告的群組，避免映像檔 /etc/group 隱含群組影響磁碟區權限。',
  'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.placeholder':
    '預設 Merge',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups': '附加使用者群組',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups.tip':
    '多個 GID 可使用半形逗號或換行分隔。',
  'pages.k8s.forms.workload.podSecurity.supplementalGroups.placeholder':
    '例如 3000,4000',
  'pages.k8s.forms.workload.podSecurity.seLinux': 'SELinux 內容',
  'pages.k8s.forms.workload.podSecurity.seLinux.level': '等級',
  'pages.k8s.forms.workload.podSecurity.seLinux.level.placeholder':
    '請輸入 SELinux 等級',
  'pages.k8s.forms.workload.podSecurity.seLinux.role.placeholder':
    '請輸入 SELinux 角色',
  'pages.k8s.forms.workload.podSecurity.seLinux.type.placeholder':
    '請輸入 SELinux 類型',
  'pages.k8s.forms.workload.podSecurity.seLinux.user.placeholder':
    '請輸入 SELinux 使用者',
  'pages.k8s.forms.workload.updateStrategy.tip':
    '設定工作負載更新容器組副本時採用的策略',
  'pages.k8s.forms.workload.updateStrategy.rolling': '滾動更新（建議）',
  'pages.k8s.forms.workload.updateStrategy.rolling.description':
    '用新容器組副本逐步取代舊容器組副本。升級過程中業務流量會負載平衡到新舊容器組副本上，業務不會中斷。',
  'pages.k8s.forms.workload.updateStrategy.recreate': '同時更新',
  'pages.k8s.forms.workload.updateStrategy.recreate.description':
    '刪除全部舊容器組副本再建立新容器組副本。升級過程中業務會中斷。',
  'pages.k8s.forms.workload.updateStrategy.onDelete': '刪除容器組時更新',
  'pages.k8s.forms.workload.updateStrategy.onDelete.description':
    '需要手動刪除容器組副本才可對其進行更新。',
  'pages.k8s.forms.workload.updateStrategy.rollingSettings': '滾動更新設定',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable':
    '最大不可用容器組數量',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable.extra':
    '更新過程中允許的不可用容器組副本的最大數量或百分比。',
  'pages.k8s.forms.workload.updateStrategy.maxUnavailable.required':
    '請輸入最大不可用容器組數量',
  'pages.k8s.forms.workload.updateStrategy.intOrPercent':
    '請輸入整數或百分比，例如 1 或 25%',
  'pages.k8s.forms.workload.updateStrategy.maxSurge': '最大多餘容器組數量',
  'pages.k8s.forms.workload.updateStrategy.maxSurge.tip':
    '更新過程中允許的多餘容器組副本的最大數量或百分比',
  'pages.k8s.forms.workload.updateStrategy.maxSurge.required':
    '請輸入最大多餘容器組數量',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds':
    '容器組就緒最短執行時長（s）',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds.extra':
    '容器組副本被視為就緒所需要的最短穩定執行時長。',
  'pages.k8s.forms.workload.updateStrategy.minReadySeconds.required':
    '請輸入容器組就緒最短執行時長',
  'pages.k8s.forms.workload.updateStrategy.partition': '容器組副本分組序號',
  'pages.k8s.forms.workload.updateStrategy.partition.extra':
    '設定一個分組序號以將容器組副本分成兩組。更新有狀態副本集時，只有序號大於或等於分組序號的容器組副本會被更新。',
  'pages.k8s.forms.workload.updateStrategy.partition.required':
    '請輸入容器組副本分組序號',
  'pages.k8s.forms.workload.storage.type.emptyDir': '暫存磁碟區',
  'pages.k8s.forms.workload.storage.type.hostPath': 'HostPath 磁碟區',
  'pages.k8s.forms.workload.storage.mountMode.readWrite': '讀寫',
  'pages.k8s.forms.workload.storage.mountMode.none': '不掛載',
  'pages.k8s.forms.workload.storage.mountMode.placeholder': '請選擇掛載方式',
  'pages.k8s.forms.workload.storage.defaultStorageClass': '預設儲存類別',
  'pages.k8s.forms.workload.storage.subPath.invalid':
    '請輸入絕對路徑或相對路徑，且不能包含 ..',
  'pages.k8s.forms.workload.storage.mountPath.required': '請輸入掛載路徑',
  'pages.k8s.forms.workload.storage.absolutePath': '請輸入以 / 開頭的絕對路徑',
  'pages.k8s.forms.workload.storage.mountPath.incomplete': '請完善掛載路徑設定',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate.add.description':
    '新增持久磁碟區宣告範本，為有狀態副本集的每個容器組掛載一個持久磁碟區',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate.add':
    '新增持久磁碟區宣告範本',
  'pages.k8s.forms.workload.storage.volumeClaimTemplate': '持久磁碟區宣告範本',
  'pages.k8s.forms.workload.storage.volume.mount.description':
    '為容器掛載持久磁碟區、暫存磁碟區或 HostPath 磁碟區',
  'pages.k8s.forms.workload.storage.volume.mount': '掛載磁碟區',
  'pages.k8s.forms.workload.storage.config.mount.description':
    '為容器掛載 ConfigMap 或 Secret',
  'pages.k8s.forms.workload.storage.config.mount': '掛載 ConfigMap 或 Secret',
  'pages.k8s.forms.workload.storage.pvc.required': '請選擇持久磁碟區宣告',
  'pages.k8s.forms.workload.storage.pvc.description':
    '將根據持久磁碟區宣告建立的持久磁碟區掛載到容器',
  'pages.k8s.forms.workload.storage.pvc.select': '選擇持久磁碟區宣告',
  'pages.k8s.forms.workload.storage.configResource.required': '請選擇{label}。',
  'pages.k8s.forms.workload.storage.configResource.description':
    '將{label}掛載到容器。',
  'pages.k8s.forms.workload.storage.configResource.select': '選擇{label}',
  'pages.k8s.forms.workload.storage.hostPath.info':
    '使用 HostPath 磁碟區將主機檔案系統中的檔案或目錄掛載到容器中。',
  'pages.k8s.forms.workload.storage.volumeName': '磁碟區名稱',
  'pages.k8s.forms.workload.storage.volumeName.maxLength':
    '磁碟區名稱最長 63 個字元',
  'pages.k8s.forms.workload.storage.volumeName.pattern':
    '磁碟區名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.workload.storage.hostPath': '主機路徑',
  'pages.k8s.forms.workload.storage.hostPath.required': '請輸入主機路徑',
  'pages.k8s.forms.workload.storage.sizeLimit': '容量上限',
  'pages.k8s.forms.workload.storage.sizeLimit.required': '請輸入容量上限',
  'pages.k8s.forms.workload.storage.sizeLimit.tip':
    '設定目前儲存磁碟區的容量上限，預設值為 200Mi，最大值不能超過 2Gi',
  'pages.k8s.forms.workload.storage.quantity.invalid':
    '請輸入合法的容量，例如 200Mi 或 2Gi',
  'pages.k8s.forms.workload.storage.quantity.placeholder': '例如 200Mi 或 2Gi',
  'pages.k8s.forms.workload.storage.pvcPrefix': 'PVC 名稱前置詞',
  'pages.k8s.forms.workload.storage.pvcPrefix.tip':
    '持久磁碟區宣告名稱的前置詞。前置詞只能包含小寫字母、數字和連字號（-），必須以小寫字母或數字開頭和結尾，最長 253 個字元',
  'pages.k8s.forms.workload.storage.pvcPrefix.required':
    '請輸入 PVC 名稱前置詞',
  'pages.k8s.forms.workload.storage.pvcPrefix.maxLength':
    'PVC 名稱前置詞最長 253 個字元',
  'pages.k8s.forms.workload.storage.pvcPrefix.pattern':
    'PVC 名稱前置詞只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.workload.storage.storageClass.tip':
    '選擇一個儲存類別來建立特定種類的磁碟區',
  'pages.k8s.forms.workload.storage.storageClass.required': '請選擇儲存類別',
  'pages.k8s.forms.workload.storage.storageClass.empty': '未發現可用儲存類別',
  'pages.k8s.forms.workload.storage.accessMode.tip':
    '選擇儲存類別支援的一種或多種存取模式',
  'pages.k8s.forms.workload.storage.volumeCapacity': '磁碟區容量',
  'pages.k8s.forms.workload.storage.volumeCapacity.required':
    '請輸入磁碟區容量',
  'pages.k8s.forms.workload.storage.subPath.title': '指定子路徑',
  'pages.k8s.forms.workload.storage.subPath.description':
    '指定需要掛載到容器的磁碟區子路徑。',
  'pages.k8s.forms.workload.storage.subPath': '子路徑',
  'pages.k8s.forms.workload.storage.containersFirst': '請先新增容器',
  'pages.k8s.forms.workload.storage.mountPath': '掛載路徑',
  'pages.k8s.forms.workload.storage.key.required': '請選擇鍵',
  'pages.k8s.forms.workload.storage.path.required': '請輸入路徑',
  'pages.k8s.forms.workload.storage.relativePath.required': '請使用相對路徑。',
  'pages.k8s.forms.workload.storage.relativePath': '相對路徑',
  'pages.k8s.forms.workload.storage.keyPath.delete': '刪除鍵對應',
  'pages.k8s.forms.workload.storage.specificKeys': '選擇特定鍵',
  'pages.k8s.forms.workload.storage.specificKeys.description':
    '選擇需要掛載到容器的特定鍵',
  'pages.k8s.forms.workload.storage.volumeType': '磁碟區類型',
  'pages.k8s.forms.workload.storage.volumeTypeOf': '磁碟區類型：{type}',
  'pages.k8s.forms.workload.storage.mount.readWrite': '（讀寫）',
  'pages.k8s.forms.workload.storage.mount.subPath': '· 子路徑：{subPath}',
  'pages.k8s.forms.workload.storage.delete': '刪除儲存設定',
  'pages.k8s.forms.workload.storage.edit': '編輯儲存設定',
  'pages.k8s.forms.job.title': '建立任務',
  'pages.k8s.forms.job.step.strategy': '策略設定',
  'pages.k8s.forms.job.restartPolicy': '重新啟動策略',
  'pages.k8s.forms.job.restartPolicy.required': '請選擇重新啟動策略',
  'pages.k8s.forms.job.restartPolicy.never': '重新建立容器組',
  'pages.k8s.forms.job.restartPolicy.onFailure': '重新啟動容器',
  'pages.k8s.forms.job.backoffLimit': '最大重試次數',
  'pages.k8s.forms.job.backoffLimit.extra':
    '將任務標記為失敗前的最大重試次數。預設值為 6。',
  'pages.k8s.forms.job.backoffLimit.placeholder': '請輸入最大重試次數',
  'pages.k8s.forms.job.completions': '容器組完成數量',
  'pages.k8s.forms.job.completions.extra':
    '將任務標記為完成所需成功執行的容器組數量。',
  'pages.k8s.forms.job.completions.placeholder': '請輸入容器組完成數量',
  'pages.k8s.forms.job.parallelism': '平行容器組數量',
  'pages.k8s.forms.job.parallelism.extra': '平行執行的容器組數量。',
  'pages.k8s.forms.job.parallelism.placeholder': '請輸入平行容器組數量',
  'pages.k8s.forms.job.activeDeadlineSeconds': '最大執行時間（s）',
  'pages.k8s.forms.job.activeDeadlineSeconds.extra':
    '任務的最大執行時間。任務達到最大執行時間時將被結束。',
  'pages.k8s.forms.job.activeDeadlineSeconds.placeholder': '請輸入最大執行時間',
  'pages.k8s.forms.cronjob.title': '建立定時任務',
  'pages.k8s.forms.cronjob.project': '專案',
  'pages.k8s.forms.cronjob.project.tip':
    '專案用於對資源進行分組管理和控制不同使用者的資源管理權限',
  'pages.k8s.forms.cronjob.schedule': '定時排程',
  'pages.k8s.forms.cronjob.schedule.tip':
    '為定時任務設定定時排程。Kubernetes 會按 CronJob 的時區設定解析該排程',
  'pages.k8s.forms.cronjob.schedule.required': '請選擇或輸入定時排程',
  'pages.k8s.forms.cronjob.schedule.invalid':
    '請輸入合法的 cron 運算式，例如 */5 * * * * 或 @hourly',
  'pages.k8s.forms.cronjob.schedule.placeholder':
    '請選擇或輸入 cron 運算式，例如 */5 * * * *',
  'pages.k8s.forms.cronjob.schedule.quickPick': '{label}（{value}）',
  'pages.k8s.forms.cronjob.schedule.everyMinute': '每分鐘',
  'pages.k8s.forms.cronjob.schedule.every5Minutes': '每 5 分鐘',
  'pages.k8s.forms.cronjob.schedule.hourly': '每小時',
  'pages.k8s.forms.cronjob.schedule.daily': '每天',
  'pages.k8s.forms.cronjob.schedule.weekly': '每週',
  'pages.k8s.forms.cronjob.startingDeadline': '最大啟動延後時間（s）',
  'pages.k8s.forms.cronjob.startingDeadline.tip':
    '由於某種原因未能按排程啟動任務時，任務啟動的最大延遲時間',
  'pages.k8s.forms.cronjob.startingDeadline.placeholder':
    '請輸入最大啟動延後時間',
  'pages.k8s.forms.cronjob.successfulHistory': '成功任務保留數量',
  'pages.k8s.forms.cronjob.successfulHistory.tip':
    '允許保留的成功任務的個數。預設值為 3',
  'pages.k8s.forms.cronjob.successfulHistory.placeholder':
    '請輸入成功任務保留數量',
  'pages.k8s.forms.cronjob.failedHistory': '失敗任務保留數量',
  'pages.k8s.forms.cronjob.failedHistory.tip':
    '允許保留的失敗任務的個數。預設值為 1',
  'pages.k8s.forms.cronjob.failedHistory.placeholder': '請輸入失敗任務保留數量',
  'pages.k8s.forms.cronjob.concurrency.tip':
    '定時任務建立的多個任務發生重疊時，系統採取的策略',
  'pages.k8s.forms.cronjob.concurrency.required': '請選擇並行策略',
  'pages.k8s.forms.cronjob.concurrency.allow': '允許並行執行',
  'pages.k8s.forms.cronjob.concurrency.forbid': '跳過新任務',
  'pages.k8s.forms.cronjob.concurrency.replace': '取代舊任務',
  'pages.k8s.forms.cronjob.timeZone': '時區',
  'pages.k8s.forms.cronjob.timeZone.tip':
    '對應 Kubernetes CronJob 的 spec.timeZone。不填寫時由叢集控制器使用預設時區',
  'pages.k8s.forms.cronjob.timeZone.placeholder': '例如 Asia/Shanghai',
  'pages.k8s.forms.shared.input.placeholder': '請輸入',
  'pages.k8s.forms.shared.prevStep': '上一步',
  'pages.k8s.forms.shared.nextStep': '下一步',
  'pages.k8s.forms.shared.toggleYamlMode': '切換 YAML 編輯模式',
  'pages.k8s.forms.shared.metadata.description': '為資源新增標籤與註解（可選）',
  'pages.k8s.forms.editRegistry.serviceSettings': '編輯服務設定',
  'pages.k8s.forms.editRegistry.serviceExternalAccess': '編輯外部存取',
  'pages.k8s.forms.editRegistry.ingressRules': '編輯路由規則',
  'pages.k8s.forms.editRegistry.ingressAnnotations': '編輯註解',
  'pages.k8s.forms.editRegistry.pvcExpand': '擴充容量',
  'pages.k8s.forms.editRegistry.pvcClone': '複製',
  'pages.k8s.forms.editRegistry.storageClassDefault': '設為預設 / 取消預設',
  'pages.k8s.forms.editRegistry.storageClassExpansion': '允許磁碟區擴充',
  'pages.k8s.forms.serviceaccount.title': '建立服務帳戶',
  'pages.k8s.forms.serviceaccount.name.length':
    '名稱長度需在 1 到 63 個字元之間',
  'pages.k8s.forms.serviceaccount.name.pattern':
    '名稱僅支援小寫字母、數字和連字號，且不能以連字號開頭或結尾',
  'pages.k8s.forms.serviceaccount.metadata.keyRequired': '請填寫{title}的鍵',
  'pages.k8s.forms.serviceaccount.metadata.keyDuplicate': '{title}的鍵不能重複',
  'pages.k8s.forms.serviceaccount.imagePullSecrets': '映像檔拉取密鑰',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.extra':
    'Pod 使用該服務帳戶時，預設用這些 Secret 拉取映像檔。可直接輸入名稱。',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.placeholder':
    '請選擇或輸入 Secret 名稱',
  'pages.k8s.forms.serviceaccount.imagePullSecrets.invalid':
    '映像檔拉取密鑰名稱不合法：{name}',
  'pages.k8s.forms.hpa.title': '建立水平自動擴縮',
  'pages.k8s.forms.hpa.step.target': '擴縮目標',
  'pages.k8s.forms.hpa.step.metrics': '擴縮指標',
  'pages.k8s.forms.hpa.step.behavior': '行為策略',
  'pages.k8s.forms.hpa.metadata.description': '為水平自動擴縮資源新增中繼資料',
  'pages.k8s.forms.hpa.error.metricLabel': '指標 {index}',
  'pages.k8s.forms.hpa.error.resourceName': '{label}：請選擇資源名稱',
  'pages.k8s.forms.hpa.error.container': '{label}：請輸入容器名稱',
  'pages.k8s.forms.hpa.error.metricName': '{label}：請輸入指標名稱',
  'pages.k8s.forms.hpa.error.describedObject':
    '{label}：請完整填寫物件 API 版本、類型和名稱',
  'pages.k8s.forms.hpa.error.averageUtilization': '{label}：請輸入平均使用率',
  'pages.k8s.forms.hpa.error.averageValue': '{label}：請輸入平均目標值',
  'pages.k8s.forms.hpa.error.value': '{label}：請輸入目標值',
  'pages.k8s.forms.hpa.error.nameNamespace': '請填寫名稱和命名空間',
  'pages.k8s.forms.hpa.error.target': '請完整填寫擴縮目標',
  'pages.k8s.forms.hpa.error.policiesRequired':
    '{label}：請至少新增一條擴縮策略',
  'pages.k8s.forms.hpa.errorSeparator': '，',
  'pages.k8s.forms.hpa.target.pick': '選擇工作負載',
  'pages.k8s.forms.hpa.target.pick.description':
    '從目前命名空間選擇由 HPA 管理副本數的工作負載。',
  'pages.k8s.forms.hpa.target.repick': '重新選擇',
  'pages.k8s.forms.hpa.target.namespaceFirst': '請先選擇命名空間',
  'pages.k8s.forms.hpa.target.description':
    '可從目前命名空間選擇工作負載自動填入，也可以直接填寫其他實作 scale 子資源的物件。',
  'pages.k8s.forms.hpa.target.workload': '目標工作負載',
  'pages.k8s.forms.hpa.target.hint':
    '選擇同命名空間下可被 HPA 引用的工作負載，名稱會寫入 scaleTargetRef。',
  'pages.k8s.forms.hpa.targetType': '目標類型',
  'pages.k8s.forms.hpa.targetType.required': '請選擇目標類型',
  'pages.k8s.forms.hpa.targetName': '目標名稱',
  'pages.k8s.forms.hpa.targetName.required': '請輸入目標名稱',
  'pages.k8s.forms.hpa.targetApiVersion': '目標 API 版本',
  'pages.k8s.forms.hpa.targetApiVersion.required': '請輸入目標 API 版本',
  'pages.k8s.forms.hpa.targetApiVersion.tooltip':
    '選擇工作負載時會自動帶出，引用其他實作 scale 子資源的物件時可手動調整。',
  'pages.k8s.forms.hpa.apiVersion.placeholder': '如 apps/v1',
  'pages.k8s.forms.hpa.metricType': '指標類型',
  'pages.k8s.forms.hpa.metricType.required': '請選擇指標類型',
  'pages.k8s.forms.hpa.metricType.Resource': '資源指標',
  'pages.k8s.forms.hpa.metricType.ContainerResource': '容器資源指標',
  'pages.k8s.forms.hpa.metricType.Pods': 'Pod 指標',
  'pages.k8s.forms.hpa.metricType.Object': '物件指標',
  'pages.k8s.forms.hpa.metricType.External': '外部指標',
  'pages.k8s.forms.hpa.metricType.Resource.description':
    '依 Pod 的 CPU 或記憶體資源使用情況觸發擴縮。',
  'pages.k8s.forms.hpa.metricType.ContainerResource.description':
    '依指定容器的 CPU 或記憶體資源使用情況觸發擴縮。',
  'pages.k8s.forms.hpa.metricType.Pods.description':
    '依每個 Pod 回報的自訂指標平均值觸發擴縮。',
  'pages.k8s.forms.hpa.metricType.Object.description':
    '依指定 Kubernetes 物件上的指標觸發擴縮。',
  'pages.k8s.forms.hpa.metricType.External.description':
    '依叢集外部系統提供的指標觸發擴縮。',
  'pages.k8s.forms.hpa.metric': '指標',
  'pages.k8s.forms.hpa.metric.title': '指標 {index} · {type}',
  'pages.k8s.forms.hpa.metric.description.empty': '選擇指標來源後設定目標值。',
  'pages.k8s.forms.hpa.metric.delete': '刪除擴縮指標',
  'pages.k8s.forms.hpa.metric.add': '新增指標',
  'pages.k8s.forms.hpa.metrics.description':
    '至少設定一條指標。不同來源會輸出到 resource、containerResource、pods、object 或 external 欄位。',
  'pages.k8s.forms.hpa.metrics.required': '請至少新增一條擴縮指標',
  'pages.k8s.forms.hpa.containerName': '容器名稱',
  'pages.k8s.forms.hpa.containerName.required': '請輸入容器名稱',
  'pages.k8s.forms.hpa.containerName.placeholder': '如 nginx',
  'pages.k8s.forms.hpa.resourceName': '資源名稱',
  'pages.k8s.forms.hpa.resourceName.required': '請選擇資源名稱',
  'pages.k8s.forms.hpa.metricName': '指標名稱',
  'pages.k8s.forms.hpa.metricName.required': '請輸入指標名稱',
  'pages.k8s.forms.hpa.metricName.placeholder': '如 requests_per_second',
  'pages.k8s.forms.hpa.objectApiVersion': '物件 API 版本',
  'pages.k8s.forms.hpa.objectApiVersion.required': '請輸入物件 API 版本',
  'pages.k8s.forms.hpa.objectKind.required': '請輸入物件類型',
  'pages.k8s.forms.hpa.objectKind.placeholder': '如 Deployment',
  'pages.k8s.forms.hpa.objectName.required': '請輸入物件名稱',
  'pages.k8s.forms.hpa.targetType.Utilization': '平均使用率',
  'pages.k8s.forms.hpa.targetType.AverageValue': '平均值',
  'pages.k8s.forms.hpa.targetType.Value': '總量值',
  'pages.k8s.forms.hpa.targetValue.required': '請輸入目標值',
  'pages.k8s.forms.hpa.averageUtilization.required': '請輸入平均使用率',
  'pages.k8s.forms.hpa.averageUtilization.range': '平均使用率範圍為 1-100',
  'pages.k8s.forms.hpa.averageValue': '平均目標值',
  'pages.k8s.forms.hpa.averageValue.placeholder': '如 500m / 512Mi / 100',
  'pages.k8s.forms.hpa.value': '目標值',
  'pages.k8s.forms.hpa.value.placeholder': '如 100',
  'pages.k8s.forms.hpa.selector': '指標選擇器',
  'pages.k8s.forms.hpa.selector.description':
    '選填，留空表示不限制指標標籤；輸出到 metric.selector。',
  'pages.k8s.forms.hpa.selector.addLabel': '新增標籤',
  'pages.k8s.forms.hpa.selector.deleteLabel': '刪除指標標籤',
  'pages.k8s.forms.hpa.selector.expressionKey': '運算式鍵',
  'pages.k8s.forms.hpa.selector.expressionKey.required': '請輸入運算式鍵',
  'pages.k8s.forms.hpa.selector.operator': '運算子',
  'pages.k8s.forms.hpa.selector.operator.required': '請選擇運算子',
  'pages.k8s.forms.hpa.selector.values.required': '請輸入比對值',
  'pages.k8s.forms.hpa.selector.values.placeholder': '多個值以逗號或換行分隔',
  'pages.k8s.forms.hpa.selector.deleteExpression': '刪除指標運算式',
  'pages.k8s.forms.hpa.selector.addExpression': '新增運算式',
  'pages.k8s.forms.hpa.replicas': '副本範圍',
  'pages.k8s.forms.hpa.replicas.description': '設定 HPA 可調整的副本數上下限。',
  'pages.k8s.forms.hpa.replicas.tooltip':
    'maxReplicas 為必填欄位，minReplicas 留空時 Kubernetes 預設視為 1。',
  'pages.k8s.forms.hpa.minReplicas': '最小副本數',
  'pages.k8s.forms.hpa.minReplicas.min': '最小副本數不能小於 1',
  'pages.k8s.forms.hpa.minReplicas.aboveMax': '最小副本數不能大於最大副本數',
  'pages.k8s.forms.hpa.minReplicas.placeholder': '請輸入最小副本數',
  'pages.k8s.forms.hpa.maxReplicas': '最大副本數',
  'pages.k8s.forms.hpa.maxReplicas.required': '請輸入最大副本數',
  'pages.k8s.forms.hpa.maxReplicas.min': '最大副本數不能小於 1',
  'pages.k8s.forms.hpa.maxReplicas.belowMin': '最大副本數不能小於最小副本數',
  'pages.k8s.forms.hpa.behavior': '擴縮行為',
  'pages.k8s.forms.hpa.behavior.params': '擴縮參數',
  'pages.k8s.forms.hpa.behavior.selectPolicy': '策略選擇',
  'pages.k8s.forms.hpa.behavior.stabilizationWindow': '穩定視窗',
  'pages.k8s.forms.hpa.behavior.stabilizationWindow.range':
    '穩定視窗範圍為 0-3600 秒',
  'pages.k8s.forms.hpa.behavior.seconds': '秒',
  'pages.k8s.forms.hpa.behavior.tolerance': '容忍閾值',
  'pages.k8s.forms.hpa.behavior.tolerance.tooltip':
    '寫入 behavior.scaleUp/scaleDown.tolerance，可填寫如 0.1。',
  'pages.k8s.forms.hpa.behavior.tolerance.placeholder': '選填，如 0.1',
  'pages.k8s.forms.hpa.behavior.policies': '擴縮策略',
  'pages.k8s.forms.hpa.scaleUp': '擴容策略',
  'pages.k8s.forms.hpa.scaleUp.description':
    '控制副本數上升時的選擇策略、穩定視窗和變化速率。',
  'pages.k8s.forms.hpa.scaleDown': '縮容策略',
  'pages.k8s.forms.hpa.scaleDown.description':
    '控制副本數下降時的選擇策略、穩定視窗和變化速率。',
  'pages.k8s.forms.hpa.policy.percent': '百分比',
  'pages.k8s.forms.hpa.policy.type': '策略類型',
  'pages.k8s.forms.hpa.policy.type.required': '請選擇策略類型',
  'pages.k8s.forms.hpa.policy.value': '策略值',
  'pages.k8s.forms.hpa.policy.value.required': '請輸入策略值',
  'pages.k8s.forms.hpa.policy.value.min': '策略值不能小於 1',
  'pages.k8s.forms.hpa.policy.period': '週期秒數',
  'pages.k8s.forms.hpa.policy.period.required': '請輸入週期秒數',
  'pages.k8s.forms.hpa.policy.period.range': '週期範圍為 1-1800 秒',
  'pages.k8s.forms.hpa.policy.required': '請至少新增一條擴縮策略',
  'pages.k8s.forms.hpa.policy.delete': '刪除擴縮策略',
  'pages.k8s.forms.hpa.policy.add': '新增策略',
  'pages.k8s.forms.binding.title': '建立 {kind}',
  'pages.k8s.forms.binding.roleRef': '參考角色',
  'pages.k8s.forms.binding.subjects': '授權主體',
  'pages.k8s.forms.binding.name.tooltip':
    '名稱只能包含小寫字母、數字、連接號（-）和點（.）',
  'pages.k8s.forms.binding.name.pattern':
    '名稱只能包含小寫字母、數字、連接號（-）和點（.），且不能以連接號或點開頭或結尾',
  'pages.k8s.forms.binding.namespace.notNeeded':
    'ClusterRoleBinding 不需要命名空間',
  'pages.k8s.forms.binding.namespaceFirst': '請先選擇命名空間',
  'pages.k8s.forms.binding.roleKind': '參考角色類型',
  'pages.k8s.forms.binding.roleKind.required': '請選擇參考角色類型',
  'pages.k8s.forms.binding.roleKind.clusterOnly':
    'ClusterRoleBinding 只能繫結 ClusterRole',
  'pages.k8s.forms.binding.roleKind.hint':
    'RoleBinding 可繫結同命名空間的 Role 或全叢集的 ClusterRole',
  'pages.k8s.forms.binding.roleName.extra':
    '建立後參考的角色不可修改；可以參考尚未建立的角色。',
  'pages.k8s.forms.binding.roleName.required': '請選擇參考角色',
  'pages.k8s.forms.binding.roleName.empty': '暫無可選角色',
  'pages.k8s.forms.binding.roleName.placeholder.role':
    '請選擇同命名空間的 Role',
  'pages.k8s.forms.binding.roleName.placeholder.clusterRole':
    '請選擇 ClusterRole',
  'pages.k8s.forms.binding.subject.placeholder.serviceAccount':
    '請選擇或輸入 ServiceAccount',
  'pages.k8s.forms.binding.subject.placeholder.user':
    '使用者名稱，例如 reborn:<使用者ID>',
  'pages.k8s.forms.binding.subject.placeholder.group':
    '群組名稱，例如 reborn:role:<角色ID>',
  'pages.k8s.forms.binding.subject.name.required': '請填寫主體名稱',
  'pages.k8s.forms.binding.subject.name.maxLength': '主體名稱最長 253 個字元',
  'pages.k8s.forms.binding.subject.empty': '暫無可選主體',
  'pages.k8s.forms.binding.subject.namespace.notNeeded':
    'User/Group 不需要命名空間',
  'pages.k8s.forms.binding.subject.hint.intro':
    'User 與 Group 的名稱直接填寫。本平台存取叢集時會模擬為使用者',
  'pages.k8s.forms.binding.subject.hint.userPattern': 'reborn:<使用者ID>',
  'pages.k8s.forms.binding.subject.hint.roleGroup': '、角色群組',
  'pages.k8s.forms.binding.subject.hint.rolePattern': 'reborn:role:<角色ID>',
  'pages.k8s.forms.binding.subject.hint.outro':
    '，授權給平台使用者或角色時請依此格式填寫。',
  'pages.k8s.forms.binding.subject.kind.placeholder': '主體類型',
  'pages.k8s.forms.binding.subject.delete': '刪除授權主體',
  'pages.k8s.forms.binding.subject.add': '新增授權主體',
  'pages.k8s.forms.binding.metadata.description':
    '為繫結資源新增標籤和註解，便於篩選、識別和自動化管理',
  'pages.k8s.forms.binding.annotationKey': '註解鍵',
  'pages.k8s.forms.binding.annotationValue': '註解值',
  'pages.k8s.forms.binding.subjects.required': '請至少新增一個授權主體',
  'pages.k8s.forms.binding.subjects.kindRequired':
    '授權主體 {index} 需要選擇類型',
  'pages.k8s.forms.binding.subjects.nameRequired':
    '授權主體 {index} 需要填寫名稱',
  'pages.k8s.forms.binding.subjects.namespaceRequired':
    '授權主體 {index} 需要選擇命名空間',
  'pages.k8s.forms.binding.yaml.kind':
    'YAML kind 必須為 RoleBinding 或 ClusterRoleBinding',
  'pages.k8s.forms.binding.yaml.namespaceRequired':
    'RoleBinding YAML 必須包含 metadata.namespace',
  'pages.k8s.forms.binding.yaml.namespaceForbidden':
    'ClusterRoleBinding YAML 不應包含 metadata.namespace',
  'pages.k8s.forms.binding.yaml.roleRefRequired':
    'YAML 必須包含 roleRef.kind、roleRef.name 和 roleRef.apiGroup',
  'pages.k8s.forms.binding.yaml.roleRefApiGroup':
    'YAML roleRef.apiGroup 必須為 {apiGroup}',
  'pages.k8s.forms.binding.yaml.clusterRoleOnly':
    'ClusterRoleBinding 只能參考 ClusterRole',
  'pages.k8s.forms.binding.yaml.roleKind':
    'RoleBinding 只能參考 Role 或 ClusterRole',
  'pages.k8s.forms.binding.yaml.subjectsRequired':
    'YAML 必須至少包含一個 subjects 項目',
  'pages.k8s.forms.binding.yaml.subjectInvalid':
    'YAML subjects[{index}] 需要包含 kind 和 name，ServiceAccount 還需要 namespace',
  'pages.k8s.forms.role.title': '建立 {kind}',
  'pages.k8s.forms.role.rules': '權限規則',
  'pages.k8s.forms.role.name.tooltip':
    '名稱只能包含小寫字母、數字、連接號（-）和點（.）',
  'pages.k8s.forms.role.name.pattern':
    '名稱只能包含小寫字母、數字、連接號（-）和點（.），且不能以連接號或點開頭或結尾',
  'pages.k8s.forms.role.namespace.notNeeded': 'ClusterRole 不需要命名空間',
  'pages.k8s.forms.role.selector.operator': '運算子',
  'pages.k8s.forms.role.selector.deleteExpression': '刪除比對運算式',
  'pages.k8s.forms.role.selector.addExpression': '新增比對運算式',
  'pages.k8s.forms.role.aggregation': '彙總規則',
  'pages.k8s.forms.role.aggregation.enable': '彙總 ClusterRole',
  'pages.k8s.forms.role.aggregation.description':
    '依標籤選擇器彙總其他 ClusterRole 的權限規則，適合組合多個細粒度角色',
  'pages.k8s.forms.role.aggregation.labels': '彙總標籤選擇器',
  'pages.k8s.forms.role.aggregation.deleteLabel': '刪除比對標籤',
  'pages.k8s.forms.role.aggregation.labelKeyFirst':
    '請先填寫已有比對標籤的鍵。',
  'pages.k8s.forms.role.aggregation.expressions': '彙總比對運算式',
  'pages.k8s.forms.role.aggregation.selectorRequired':
    '請為彙總規則至少設定一個標籤選擇器',
  'pages.k8s.forms.role.aggregation.expressionInvalid':
    '彙總比對運算式 {index} 需要選擇運算子，In/NotIn 需要填寫標籤值',
  'pages.k8s.forms.role.metadata.description':
    '為角色資源新增標籤和註解，便於篩選、識別和自動化管理',
  'pages.k8s.forms.role.annotationKey': '註解鍵',
  'pages.k8s.forms.role.annotationValue': '註解值',
  'pages.k8s.forms.role.rule.mode.resource': '資源權限',
  'pages.k8s.forms.role.rule.mode.nonResource': '非資源 URL（僅 ClusterRole）',
  'pages.k8s.forms.role.rule.title': '權限規則 {index}',
  'pages.k8s.forms.role.rule.description':
    '設定 API 群組、資源範圍和允許執行的動作',
  'pages.k8s.forms.role.rule.delete': '刪除權限規則',
  'pages.k8s.forms.role.rule.mode': '規則類型',
  'pages.k8s.forms.role.rule.mode.required': '請選擇規則類型',
  'pages.k8s.forms.role.rule.nonResource.unsupported':
    '非資源 URL 權限僅適用於 ClusterRole，請改為資源權限或刪除這條規則。',
  'pages.k8s.forms.role.rule.nonResourceURLs': '非資源 URL',
  'pages.k8s.forms.role.rule.nonResourceURLs.required': '請輸入非資源 URL',
  'pages.k8s.forms.role.rule.nonResourceURLs.placeholder': '/healthz 或 /api/*',
  'pages.k8s.forms.role.rule.verbs': '動作',
  'pages.k8s.forms.role.rule.verbs.required': '請選擇動作',
  'pages.k8s.forms.role.rule.apiGroups': 'API 群組',
  'pages.k8s.forms.role.rule.apiGroups.required': '請選擇 API 群組',
  'pages.k8s.forms.role.rule.apiGroups.placeholder': 'core、apps 或 *',
  'pages.k8s.forms.role.rule.resources': '資源',
  'pages.k8s.forms.role.rule.resources.required': '請選擇資源',
  'pages.k8s.forms.role.rule.resources.placeholder': 'pods、deployments 或 *',
  'pages.k8s.forms.role.rule.resourceNames': '資源名稱限制',
  'pages.k8s.forms.role.rule.resourceNames.tooltip':
    '留空表示比對該資源類型下的所有物件',
  'pages.k8s.forms.role.rule.add': '新增權限規則',
  'pages.k8s.forms.role.rule.add.description':
    '設定新的 API 存取範圍和允許動作',
  'pages.k8s.forms.role.rules.required': '請至少新增一條權限規則',
  'pages.k8s.forms.role.rules.verbsRequired': '權限規則 {index} 需要選擇動作',
  'pages.k8s.forms.role.rules.nonResourceClusterOnly':
    '非資源 URL 權限僅適用於 ClusterRole',
  'pages.k8s.forms.role.rules.nonResourceURLsRequired':
    '權限規則 {index} 需要填寫非資源 URL',
  'pages.k8s.forms.role.rules.apiGroupsRequired':
    '權限規則 {index} 需要選擇 API 群組',
  'pages.k8s.forms.role.rules.resourcesRequired':
    '權限規則 {index} 需要選擇資源',
  'pages.k8s.forms.role.yaml.kind': 'YAML kind 必須為 Role 或 ClusterRole',
  'pages.k8s.forms.role.yaml.namespaceRequired':
    'Role YAML 必須包含 metadata.namespace',
  'pages.k8s.forms.role.yaml.namespaceForbidden':
    'ClusterRole YAML 不應包含 metadata.namespace',
  'pages.k8s.forms.role.yaml.rulesRequired': 'YAML 必須至少包含一條 rules',
  'pages.k8s.forms.role.yaml.ruleInvalid':
    'YAML rules[{index}] 需要包含 verbs；資源權限需要 apiGroups 和 resources；resources 與 nonResourceURLs 不能同時設定或同時不設定（nonResourceURLs 僅適用於 ClusterRole）',
  'pages.k8s.forms.role.risk.level.critical': '嚴重',
  'pages.k8s.forms.role.risk.level.high': '高風險',
  'pages.k8s.forms.role.risk.level.medium': '中風險',
  'pages.k8s.forms.role.risk.level.none': '無',
  'pages.k8s.forms.role.risk.reason.all':
    '擁有所有 API 群組、所有資源和所有動作的權限',
  'pages.k8s.forms.role.risk.reason.writeSecret': '可寫入 Secret',
  'pages.k8s.forms.role.risk.reason.readSecret': '可讀取 Secret',
  'pages.k8s.forms.role.risk.reason.writeRbac': '可修改 RBAC 授權資源',
  'pages.k8s.forms.role.risk.reason.podAccess': '可進入或轉送 Pod 執行環境',
  'pages.k8s.forms.role.risk.reason.impersonate': '可模擬其他主體身分',
  'pages.k8s.forms.role.risk.reason.wildcard': '存在萬用字元權限',
  'pages.k8s.forms.role.risk.reason.clusterAdmin': '繫結 cluster-admin',
  'pages.k8s.forms.role.risk.reason.broadGroup': '授權給廣泛的系統群組 {name}',
  'pages.k8s.forms.endpointslice.title': '建立端點切片',
  'pages.k8s.forms.endpointslice.step.endpoints': '端點設定',
  'pages.k8s.forms.endpointslice.step.ports': '連接埠設定',
  'pages.k8s.forms.endpointslice.status.endpointCount': '{count} 個端點',
  'pages.k8s.forms.endpointslice.status.portCount': '{count} 個連接埠',
  'pages.k8s.forms.endpointslice.status.metadataCount': '{count} 項中繼資料',
  'pages.k8s.forms.endpointslice.namespace.tooltip':
    '端點切片是命名空間層級的資源。',
  'pages.k8s.forms.endpointslice.serviceName': '關聯服務',
  'pages.k8s.forms.endpointslice.serviceName.tooltip':
    '將自動輸出 metadata.labels.kubernetes.io/service-name。可從所選命名空間的服務中選擇，也可直接輸入。',
  'pages.k8s.forms.endpointslice.serviceName.required': '請選擇或輸入關聯服務',
  'pages.k8s.forms.endpointslice.serviceName.maxLength':
    '服務名稱最長 63 個字元',
  'pages.k8s.forms.endpointslice.serviceName.pattern':
    '服務名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.endpointslice.serviceName.placeholder':
    '請選擇或輸入服務名稱',
  'pages.k8s.forms.endpointslice.addressType': '位址類型',
  'pages.k8s.forms.endpointslice.addressType.tooltip':
    '必須與端點位址格式一致。',
  'pages.k8s.forms.endpointslice.addressType.required': '請選擇位址類型',
  'pages.k8s.forms.endpointslice.validation.endpoints.required':
    '請至少新增一個端點',
  'pages.k8s.forms.endpointslice.validation.endpoint.addressRequired':
    '端點 {index} 至少需要填寫一個位址',
  'pages.k8s.forms.endpointslice.validation.endpoint.addressMismatch':
    '端點 {index} 的位址 {address} 與位址類型 {addressType} 不符',
  'pages.k8s.forms.endpointslice.validation.port.nameDuplicate':
    '連接埠 {index} 的名稱不能重複',
  'pages.k8s.forms.endpointslice.validation.port.range':
    '連接埠 {index} 的埠號必須在 1-65535 之間',
  'pages.k8s.forms.endpointslice.validation.name.invalid':
    '名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾，最長 63 個字元',
  'pages.k8s.forms.endpointslice.validation.serviceName.invalid':
    '服務名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾，最長 63 個字元',
  'pages.k8s.forms.endpointslice.yaml.endpoint.notObject':
    'YAML endpoints[{index}] 必須為物件',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotArray':
    'YAML endpoints[{index}].addresses 必須為字串陣列',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotStrings':
    'YAML endpoints[{index}].addresses 必須全部為非空字串',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressesEmpty':
    'YAML endpoints[{index}].addresses 必須至少包含一個字串位址',
  'pages.k8s.forms.endpointslice.yaml.endpoint.addressMismatch':
    'YAML endpoints[{index}] 的位址 {address} 與位址類型 {addressType} 不符',
  'pages.k8s.forms.endpointslice.yaml.ports.notArray': 'YAML ports 必須為陣列',
  'pages.k8s.forms.endpointslice.yaml.port.notObject':
    'YAML ports[{index}] 必須為物件',
  'pages.k8s.forms.endpointslice.yaml.port.protocolInvalid':
    'YAML ports[{index}].protocol 必須為 SCTP、TCP 或 UDP',
  'pages.k8s.forms.endpointslice.yaml.port.portInvalid':
    'YAML ports[{index}].port 必須為 1-65535 的整數',
  'pages.k8s.forms.endpointslice.yaml.port.nameNotString':
    'YAML ports[{index}].name 必須為字串',
  'pages.k8s.forms.endpointslice.yaml.port.nameInvalid':
    'YAML ports[{index}].name 只能包含小寫字母、數字和連字號（-），最長 15 個字元',
  'pages.k8s.forms.endpointslice.yaml.port.nameDuplicate':
    'YAML ports[{index}].name 不能重複',
  'pages.k8s.forms.endpointslice.yaml.port.appProtocolNotString':
    'YAML ports[{index}].appProtocol 必須為字串',
  'pages.k8s.forms.endpointslice.yaml.serviceLabelRequired':
    'YAML 必須包含 metadata.labels.{label}',
  'pages.k8s.forms.endpointslice.yaml.addressTypeInvalid':
    'YAML addressType 必須為 FQDN、IPv4 或 IPv6',
  'pages.k8s.forms.endpointslice.yaml.endpointsRequired':
    'YAML endpoints 必須至少包含一個端點',
  'pages.k8s.forms.endpointslice.example': '例如 {value}',
  'pages.k8s.forms.endpointslice.condition.unset': '不輸出',
  'pages.k8s.forms.endpointslice.endpoints': '端點',
  'pages.k8s.forms.endpointslice.endpoints.description':
    '至少填寫一個端點位址，格式需符合位址類型。',
  'pages.k8s.forms.endpointslice.endpoints.addressRequired':
    '請至少新增一個端點位址',
  'pages.k8s.forms.endpointslice.endpoint.title': '端點 {index}',
  'pages.k8s.forms.endpointslice.endpoint.delete': '刪除端點',
  'pages.k8s.forms.endpointslice.endpoint.addresses': '位址設定',
  'pages.k8s.forms.endpointslice.endpoint.addresses.extra':
    '格式需符合 IPv4、IPv6 或 FQDN。',
  'pages.k8s.forms.endpointslice.endpoint.addresses.add': '新增位址',
  'pages.k8s.forms.endpointslice.endpoint.addresses.delete': '刪除位址',
  'pages.k8s.forms.endpointslice.endpoint.addresses.fillFirst':
    '請先填寫已有位址',
  'pages.k8s.forms.endpointslice.endpoint.location': '位置資訊',
  'pages.k8s.forms.endpointslice.endpoint.hostname': '主機名稱',
  'pages.k8s.forms.endpointslice.endpoint.hostname.maxLength':
    '主機名稱最長 63 個字元',
  'pages.k8s.forms.endpointslice.endpoint.nodeName': '節點名稱',
  'pages.k8s.forms.endpointslice.endpoint.nodeName.maxLength':
    '節點名稱最長 253 個字元',
  'pages.k8s.forms.endpointslice.endpoint.zone': '可用區域',
  'pages.k8s.forms.endpointslice.endpoint.zone.maxLength':
    '可用區域最長 63 個字元',
  'pages.k8s.forms.endpointslice.endpoint.advanced': '進階端點欄位',
  'pages.k8s.forms.endpointslice.endpoint.advanced.description':
    '條件、目標參照、流量提示。',
  'pages.k8s.forms.endpointslice.endpoint.conditions': '端點條件',
  'pages.k8s.forms.endpointslice.endpoint.targetRef': '目標參照',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion': 'API 版本',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion.maxLength':
    'API 版本最長 100 個字元',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.kind.maxLength':
    '類型最長 63 個字元',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.namespace.maxLength':
    '命名空間最長 63 個字元',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath': '欄位路徑',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath.maxLength':
    '欄位路徑最長 250 個字元',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion':
    '資源版本',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion.maxLength':
    '資源版本最長 100 個字元',
  'pages.k8s.forms.endpointslice.endpoint.targetRef.uid.maxLength':
    'UID 最長 100 個字元',
  'pages.k8s.forms.endpointslice.endpoint.hints': '流量提示',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes': '節點提示',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.add': '新增節點',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.delete': '刪除節點',
  'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.fillFirst':
    '請先填寫已有節點名稱',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones': '可用區域提示',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.add': '新增可用區域',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.delete':
    '刪除可用區域',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.placeholder':
    '可用區域名稱',
  'pages.k8s.forms.endpointslice.endpoint.hints.forZones.fillFirst':
    '請先填寫已有可用區域名稱',
  'pages.k8s.forms.endpointslice.endpoint.add': '新增端點',
  'pages.k8s.forms.endpointslice.port.min': '埠號不能小於 1',
  'pages.k8s.forms.endpointslice.port.max': '埠號不能大於 65535',
  'pages.k8s.forms.endpointslice.ports.description':
    '連接埠為選填；填寫後會輸出 ports 陣列，連接埠名稱應在目前端點切片內保持唯一。',
  'pages.k8s.forms.endpointslice.port.name.maxLength':
    '連接埠名稱最長 15 個字元',
  'pages.k8s.forms.endpointslice.port.name.pattern':
    '連接埠名稱只能包含小寫字母、數字和連字號（-）',
  'pages.k8s.forms.endpointslice.port.protocol': '通訊協定',
  'pages.k8s.forms.endpointslice.port.appProtocol': '應用程式通訊協定',
  'pages.k8s.forms.endpointslice.port.appProtocol.tooltip':
    '例如 http、kubernetes.io/h2c 或自訂前綴的通訊協定。',
  'pages.k8s.forms.endpointslice.port.appProtocol.maxLength':
    '應用程式通訊協定最長 250 個字元',
  'pages.k8s.forms.endpointslice.port.add': '新增連接埠',
  'pages.k8s.forms.endpointslice.metadata.description':
    '為端點切片資源新增自訂標籤和註解。',
  'pages.k8s.forms.service.title': '建立服務',
  'pages.k8s.forms.service.step.settings': '服務設定',
  'pages.k8s.forms.service.namespace.invalid': '命名空間名稱不合法',
  'pages.k8s.forms.service.validation.ports.required': '請至少新增一個連接埠',
  'pages.k8s.forms.service.validation.port.label': '連接埠 {index}',
  'pages.k8s.forms.service.validation.port.servicePortRequired':
    '{label}：請輸入服務連接埠',
  'pages.k8s.forms.service.validation.port.servicePortRange':
    '{label}：服務連接埠範圍為 1-65535',
  'pages.k8s.forms.service.validation.port.containerPortRange':
    '{label}：容器連接埠範圍為 1-65535',
  'pages.k8s.forms.service.validation.port.nameRequiredMultiple':
    '{label}：有多個連接埠時必須填寫連接埠名稱',
  'pages.k8s.forms.service.validation.port.nameMaxLength':
    '{label}：連接埠名稱最長 {max} 個字元',
  'pages.k8s.forms.service.validation.port.namePattern':
    '{label}：連接埠名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.service.validation.port.nameDuplicate':
    '{label}：連接埠名稱 {name} 重複',
  'pages.k8s.forms.service.validation.port.servicePortDuplicate':
    '{label}：服務連接埠 {key} 重複',
  'pages.k8s.forms.service.validation.port.nodePortRange':
    '{label}：節點連接埠範圍為 {min}-{max}',
  'pages.k8s.forms.service.validation.port.nodePortDuplicate':
    '{label}：節點連接埠 {key} 重複',
  'pages.k8s.forms.service.validation.nameNamespaceRequired':
    '請填寫名稱和命名空間',
  'pages.k8s.forms.service.validation.selectorRequired':
    '請至少新增一個工作負載選擇器',
  'pages.k8s.forms.service.validation.headlessExternalAccess':
    '內部網域名稱模式不支援同時開啟外部存取',
  'pages.k8s.forms.service.example': '例如 {value}',
  'pages.k8s.forms.service.required': '必填',
  'pages.k8s.forms.service.accessMode.clusterIP': '虛擬 IP 位址',
  'pages.k8s.forms.service.accessMode.clusterIP.description':
    '為服務配置虛擬 IP 位址，可透過虛擬 IP 位址在叢集內部存取服務。',
  'pages.k8s.forms.service.accessMode.headless': '內部網域名稱',
  'pages.k8s.forms.service.accessMode.headless.description':
    '不為服務配置 IP 位址，可透過叢集的 DNS 機制在叢集內部存取服務。',
  'pages.k8s.forms.service.port.protocol': '通訊協定',
  'pages.k8s.forms.service.port.protocol.tooltip':
    'HTTP/HTTPS 等通訊協定會在提交時寫入 appProtocol，Kubernetes 連接埠通訊協定依 TCP/UDP/SCTP 產生。',
  'pages.k8s.forms.service.port.name.maxLength': '連接埠名稱最長 {max} 個字元',
  'pages.k8s.forms.service.port.name.pattern':
    '連接埠名稱只能包含小寫字母、數字和連字號（-），且不能以連字號開頭或結尾',
  'pages.k8s.forms.service.port.containerPort': '容器連接埠',
  'pages.k8s.forms.service.port.servicePort': '服務連接埠',
  'pages.k8s.forms.service.port.servicePort.required': '請輸入服務連接埠',
  'pages.k8s.forms.service.port.add': '新增連接埠',
  'pages.k8s.forms.service.internalAccess': '內部存取模式',
  'pages.k8s.forms.service.internalAccess.tooltip':
    '選擇服務在叢集內部被存取時使用的位址形式',
  'pages.k8s.forms.service.workloadSelector': '工作負載選擇',
  'pages.k8s.forms.service.workloadSelector.tooltip':
    '透過標籤選擇一組工作負載，服務流量會轉送到相符的 Pod',
  'pages.k8s.forms.service.workloadSelector.add': '新增選擇器',
  'pages.k8s.forms.service.workloadSelector.delete': '刪除工作負載選擇器',
  'pages.k8s.forms.service.workloadSelector.pick': '指定工作負載',
  'pages.k8s.forms.service.workloadSelector.keyFirst':
    '請先填寫已有工作負載選擇器的鍵。',
  'pages.k8s.forms.service.workloadSelector.noMatch':
    '沒有工作負載符合目前的選擇器。',
  'pages.k8s.forms.service.workloadSelector.noLabels':
    '未讀取到該工作負載的標籤，請手動填寫選擇器。',
  'pages.k8s.forms.service.workloadSelector.hint':
    '使用工作負載的標籤作為選擇器。',
  'pages.k8s.forms.service.ports.tooltip':
    '設定服務連接埠與目標容器連接埠，連接埠通訊協定會一併寫入服務清單',
  'pages.k8s.forms.service.nodePort': '節點連接埠',
  'pages.k8s.forms.service.nodePort.range': '節點連接埠範圍為 {min}-{max}',
  'pages.k8s.forms.service.nodePort.duplicate': '節點連接埠 {value} 重複',
  'pages.k8s.forms.service.nodePort.ariaLabel':
    '服務連接埠 {port} 的節點連接埠',
  'pages.k8s.forms.service.nodePort.auto': '自動配置',
  'pages.k8s.forms.service.nodePort.extra':
    '選填。取值範圍為 {min} 到 {max}，留空時由叢集自動配置。',
  'pages.k8s.forms.service.externalAccess': '外部存取',
  'pages.k8s.forms.service.externalAccess.description':
    '設定從叢集外部存取服務的方式。',
  'pages.k8s.forms.service.externalTrafficPolicy': '外部流量原則',
  'pages.k8s.forms.service.externalTrafficPolicy.extra':
    'Local 可保留用戶端來源 IP，Cluster 會在叢集範圍內轉送。',
  'pages.k8s.forms.service.placeholder.clusterDefault': '預設由叢集決定',
  'pages.k8s.forms.service.loadBalancerClass.extra':
    '指定由哪一類負載平衡器實作接管此 Service。',
  'pages.k8s.forms.service.allocateNodePorts': '配置 NodePort',
  'pages.k8s.forms.service.allocateNodePorts.checkbox':
    '為 LoadBalancer 服務自動配置 NodePort',
  'pages.k8s.forms.service.networking': '網路原則',
  'pages.k8s.forms.service.networking.notice':
    'Kubernetes 1.35+ Service 網路功能',
  'pages.k8s.forms.service.networking.notice.dualStack':
    '雙堆疊叢集建議明確設定 IP Family Policy 與 IP Families。',
  'pages.k8s.forms.service.networking.notice.trafficDistribution':
    'trafficDistribution 會透過 EndpointSlice 影響就近轉送偏好。',
  'pages.k8s.forms.service.ipFamilies.placeholder': '請選擇 IP 協定家族',
  'pages.k8s.forms.service.internalTrafficPolicy': '內部流量原則',
  'pages.k8s.forms.service.internalTrafficPolicy.extra':
    'Local 僅轉送到節點本機端點，Cluster 在叢集範圍內轉送。',
  'pages.k8s.forms.service.placeholder.defaultCluster': '預設 Cluster',
  'pages.k8s.forms.service.trafficDistribution': '流量分佈',
  'pages.k8s.forms.service.trafficDistribution.extra':
    '在支援的叢集中用於表達就近或同節點轉送偏好。',
  'pages.k8s.forms.service.placeholder.unspecified': '預設不指定',
  'pages.k8s.forms.service.sessionAffinity': '工作階段保持',
  'pages.k8s.forms.service.sessionAffinity.description':
    '設定系統在指定時間內將同一工作階段中來自同一用戶端的請求全部轉送給同一個 Pod。',
  'pages.k8s.forms.service.sessionAffinity.timeout':
    '最長工作階段保持時間（s）',
  'pages.k8s.forms.service.sessionAffinity.timeout.required':
    '請輸入最長工作階段保持時間',
  'pages.k8s.forms.service.sessionAffinity.timeout.range':
    '取值範圍為 1 到 86400',
  'pages.k8s.forms.service.sessionAffinity.timeout.extra':
    '設定最長工作階段保持時間。取值範圍為 1 到 86400，預設值 10800。',
  'pages.k8s.forms.service.metadata.description': '為服務新增中繼資料。',
  'pages.k8s.forms.pv.title': '建立持久磁碟區',
  'pages.k8s.forms.pv.volumeSource': '磁碟區來源',
  'pages.k8s.forms.pv.volumeSource.required': '請選擇磁碟區來源',
  'pages.k8s.forms.pv.source.hostPath.desc':
    '使用節點本機路徑，適合開發或單節點情境。',
  'pages.k8s.forms.pv.source.local.desc':
    '使用節點本機磁碟，需設定節點親和性。',
  'pages.k8s.forms.pv.source.nfs.desc': '使用 NFS 伺服器匯出的目錄。',
  'pages.k8s.forms.pv.source.csi.desc': '使用 CSI 驅動程式提供的磁碟區。',
  'pages.k8s.forms.pv.hostPathType.unspecified': '不指定',
  'pages.k8s.forms.pv.nfs.server': '伺服器',
  'pages.k8s.forms.pv.nfs.server.required': '請輸入 NFS 伺服器',
  'pages.k8s.forms.pv.nfs.server.placeholder': '例如 10.0.0.10',
  'pages.k8s.forms.pv.nfs.path': '匯出路徑',
  'pages.k8s.forms.pv.nfs.path.required': '請輸入 NFS 匯出路徑',
  'pages.k8s.forms.pv.nfs.path.placeholder': '例如 /exports/data',
  'pages.k8s.forms.pv.csi.driver': '驅動程式',
  'pages.k8s.forms.pv.csi.driver.required': '請輸入 CSI 驅動程式',
  'pages.k8s.forms.pv.csi.driver.placeholder': '例如 ebs.csi.aws.com',
  'pages.k8s.forms.pv.csi.volumeHandle': '磁碟區代碼',
  'pages.k8s.forms.pv.csi.volumeHandle.required': '請輸入磁碟區代碼',
  'pages.k8s.forms.pv.csi.volumeHandle.placeholder': '請輸入 volumeHandle',
  'pages.k8s.forms.pv.fsType': '檔案系統',
  'pages.k8s.forms.pv.fsType.placeholder': '例如 ext4',
  'pages.k8s.forms.pv.csi.volumeAttributes': '磁碟區屬性',
  'pages.k8s.forms.pv.csi.volumeAttributes.extra':
    '依 CSI 驅動程式要求填寫 volumeAttributes。',
  'pages.k8s.forms.pv.csi.volumeAttributes.delete': '刪除磁碟區屬性',
  'pages.k8s.forms.pv.csi.volumeAttributes.keyFirst': '請先填寫已有屬性的鍵。',
  'pages.k8s.forms.pv.local.path': '本機路徑',
  'pages.k8s.forms.pv.local.path.required': '請輸入本機路徑',
  'pages.k8s.forms.pv.local.path.placeholder': '例如 /mnt/disks/ssd1',
  'pages.k8s.forms.pv.nodeAffinity': '節點親和性',
  'pages.k8s.forms.pv.nodeAffinity.desc':
    'Local 持久磁碟區必須限制在實際擁有該磁碟的節點。',
  'pages.k8s.forms.pv.nodeAffinity.key.required': '請輸入標籤鍵',
  'pages.k8s.forms.pv.nodeAffinity.key.placeholder':
    '例如 kubernetes.io/hostname',
  'pages.k8s.forms.pv.nodeAffinity.operator': '運算子',
  'pages.k8s.forms.pv.nodeAffinity.operator.required': '請選擇運算子',
  'pages.k8s.forms.pv.nodeAffinity.selectNode': '從叢集節點中選擇',
  'pages.k8s.forms.pv.nodeAffinity.selectNode.extra':
    '選擇節點會把節點名稱加入下方比對值（標籤鍵為 kubernetes.io/hostname 時適用）。',
  'pages.k8s.forms.pv.nodeAffinity.selectNode.placeholder': '請選擇節點',
  'pages.k8s.forms.pv.nodeAffinity.values': '比對值',
  'pages.k8s.forms.pv.nodeAffinity.values.extra':
    'In/NotIn 可填寫多個值；Gt/Lt 僅支援一個數字值。',
  'pages.k8s.forms.pv.nodeAffinity.values.delete': '刪除比對值',
  'pages.k8s.forms.pv.nodeAffinity.values.placeholder': '請輸入比對值',
  'pages.k8s.forms.pv.nodeAffinity.values.first': '請先填寫已有比對值。',
  'pages.k8s.forms.pv.nodeAffinity.values.required': '請填寫節點親和性比對值',
  'pages.k8s.forms.pv.nodeAffinity.values.single':
    'Gt/Lt 運算子只能填寫一個節點親和性比對值',
  'pages.k8s.forms.pv.nodeAffinity.values.numeric':
    'Gt/Lt 運算子的比對值必須是數字',
  'pages.k8s.forms.pv.hostPath': '主機路徑',
  'pages.k8s.forms.pv.hostPath.extra':
    'HostPath 適合開發或單節點情境，正式環境建議優先使用 CSI/NFS/Local。',
  'pages.k8s.forms.pv.hostPath.required': '請輸入主機路徑',
  'pages.k8s.forms.pv.hostPath.placeholder': '例如 /tmp/example-pv',
  'pages.k8s.forms.pv.hostPathType': '路徑類型',
  'pages.k8s.forms.pv.capacity.extra': '定義持久磁碟區對外宣告的儲存容量。',
  'pages.k8s.forms.pv.capacity.positive': '容量必須大於 0',
  'pages.k8s.forms.pv.capacity.unit': '容量單位',
  'pages.k8s.forms.pv.accessModes.extra':
    '選擇一個或多個存取模式，需與後端磁碟區能力一致。',
  'pages.k8s.forms.pv.reclaimPolicy': '回收策略',
  'pages.k8s.forms.pv.reclaimPolicy.extra':
    '刪除 PVC 後，持久磁碟區應如何處理。',
  'pages.k8s.forms.pv.reclaimPolicy.required': '請選擇回收策略',
  'pages.k8s.forms.pv.volumeMode': '磁碟區模式',
  'pages.k8s.forms.pv.storageClass.extra': '留空表示不指定儲存類別。',
  'pages.k8s.forms.pv.storageClass.placeholder': '請輸入儲存類別名稱',
  'pages.k8s.forms.pv.mountOptions': '掛載選項',
  'pages.k8s.forms.pv.mountOptions.desc':
    '為 PV 新增掛載選項，例如 nfsvers=4.1 或 noatime。',
  'pages.k8s.forms.pv.mountOptions.delete': '刪除掛載選項',
  'pages.k8s.forms.pv.mountOptions.placeholder': '請輸入掛載選項',
  'pages.k8s.forms.pv.mountOptions.first': '請先填寫已有掛載選項。',
  'pages.k8s.forms.pv.claimRef': '預先繫結宣告',
  'pages.k8s.forms.pv.claimRef.desc':
    '預先繫結到指定 PVC，通常只有確實需要靜態繫結時才填寫。',
  'pages.k8s.forms.pv.claimRef.namespace.placeholder': '請輸入 PVC 命名空間',
  'pages.k8s.forms.pv.claimRef.name': '宣告名稱',
  'pages.k8s.forms.pv.claimRef.name.placeholder': '請輸入 PVC 名稱',
  'pages.k8s.forms.pv.claimRef.namespace.required':
    '預先繫結宣告需要填寫命名空間',
  'pages.k8s.forms.pv.claimRef.name.required': '預先繫結宣告需要填寫宣告名稱',
  'pages.k8s.forms.pv.metadata.desc': '為持久磁碟區新增標籤和註解。',
  'pages.k8s.forms.pvc.title': '建立持久磁碟區宣告',
  'pages.k8s.forms.pvc.mode': '建立方式',
  'pages.k8s.forms.pvc.mode.required': '請選擇建立方式',
  'pages.k8s.forms.pvc.mode.storageClass': '透過儲存類別建立',
  'pages.k8s.forms.pvc.mode.storageClass.desc':
    '選擇既有的儲存類別來建立磁碟區。',
  'pages.k8s.forms.pvc.mode.persistentVolume': '繫結既有持久磁碟區建立',
  'pages.k8s.forms.pvc.mode.persistentVolume.desc':
    '選擇既有的持久磁碟區來建立磁碟區。',
  'pages.k8s.forms.pvc.storageClass.default': '{name}（預設）',
  'pages.k8s.forms.pvc.storageClass.extra':
    '選擇一個儲存類別來建立特定種類的磁碟區。',
  'pages.k8s.forms.pvc.storageClass.required': '請選擇儲存類別',
  'pages.k8s.forms.pvc.storageClass.notFound': '未發現可用儲存類別',
  'pages.k8s.forms.pvc.storageClass.placeholder': '請選擇或輸入儲存類別',
  'pages.k8s.forms.pvc.volume.extra':
    '選擇或輸入要繫結的持久磁碟區名稱（僅列出尚未被宣告繫結的持久磁碟區）。',
  'pages.k8s.forms.pvc.volume.notFound': '未發現可繫結的持久磁碟區',
  'pages.k8s.forms.pvc.volumeStorageClass': '持久磁碟區的儲存類別',
  'pages.k8s.forms.pvc.volumeStorageClass.extra':
    '須與持久磁碟區的儲存類別一致；持久磁碟區未設定儲存類別時留空。',
  'pages.k8s.forms.pvc.volumeStorageClass.placeholder':
    '留空表示持久磁碟區沒有儲存類別',
  'pages.k8s.forms.pvc.accessModes.extra.bind':
    '須包含在持久磁碟區支援的存取模式之內。',
  'pages.k8s.forms.pvc.accessModes.extra.storageClass':
    '選擇儲存類別支援的一種或多種存取模式。',
  'pages.k8s.forms.pvc.volumeMode': '磁碟區模式',
  'pages.k8s.forms.pvc.volumeMode.extra':
    'Filesystem 以目錄形式掛載；Block 以原始區塊裝置形式提供給容器。',
  'pages.k8s.forms.pvc.capacity': '磁碟區容量',
  'pages.k8s.forms.pvc.capacity.extra.bind':
    '申請容量不能超過所繫結持久磁碟區的容量。',
  'pages.k8s.forms.pvc.capacity.required': '請輸入磁碟區容量',
  'pages.k8s.forms.pvc.capacity.positive': '磁碟區容量必須大於 0',
  'pages.k8s.forms.pvc.capacity.unit': '容量單位',
  'pages.k8s.forms.pvc.metadata.desc': '為磁碟區新增中繼資料。',
  'pages.k8s.forms.storageclass.title': '建立儲存類別',
  'pages.k8s.forms.storageclass.step.settings': '儲存類別設定',
  'pages.k8s.forms.storageclass.listSeparator': '、',
  'pages.k8s.forms.storageclass.isDefault': '設為預設儲存類別',
  'pages.k8s.forms.storageclass.isDefault.required':
    '請選擇是否設為預設儲存類別',
  'pages.k8s.forms.storageclass.isDefault.extra':
    '未指定儲存類別的持久磁碟區宣告會使用預設儲存類別。',
  'pages.k8s.forms.storageclass.isDefault.existing':
    '叢集已有預設儲存類別 {names}；同時存在多個預設儲存類別時，未指定儲存類別的宣告會使用最新建立的那個。',
  'pages.k8s.forms.storageclass.provisioner': '供應者',
  'pages.k8s.forms.storageclass.provisioner.extra':
    '填寫 CSI 驅動程式或磁碟區外掛程式的名稱，例如 ebs.csi.aws.com。',
  'pages.k8s.forms.storageclass.provisioner.required': '請輸入供應者',
  'pages.k8s.forms.storageclass.reclaimPolicy': '回收機制',
  'pages.k8s.forms.storageclass.reclaimPolicy.required': '請選擇回收機制',
  'pages.k8s.forms.storageclass.bindingMode': '磁碟區繫結模式',
  'pages.k8s.forms.storageclass.bindingMode.required': '請選擇磁碟區繫結模式',
  'pages.k8s.forms.storageclass.bindingMode.extra':
    '延遲繫結會等到有 Pod 使用磁碟區時才建立並繫結持久磁碟區。',
  'pages.k8s.forms.storageclass.bindingMode.immediate': '立即繫結',
  'pages.k8s.forms.storageclass.bindingMode.waitForFirstConsumer': '延遲繫結',
  'pages.k8s.forms.storageclass.expansion': '磁碟區擴充',
  'pages.k8s.forms.storageclass.expansion.extra':
    '選擇儲存類別是否允許建立後擴充磁碟區容量。',
  'pages.k8s.forms.storageclass.expansion.required': '請選擇是否允許磁碟區擴充',
  'pages.k8s.forms.storageclass.parameters': '參數',
  'pages.k8s.forms.storageclass.parameters.extra':
    '依供應者（CSI 驅動程式）的要求填寫，參數會原樣傳給供應者。',
  'pages.k8s.forms.storageclass.parameters.delete': '刪除參數',
  'pages.k8s.forms.storageclass.parameters.keyFirst': '請先填寫已有參數的鍵。',
  'pages.k8s.forms.storageclass.parameters.duplicate': '參數鍵不能重複',
  'pages.k8s.forms.storageclass.mountOptions': '掛載選項',
  'pages.k8s.forms.storageclass.mountOptions.extra':
    '由該儲存類別動態建立的持久磁碟區會帶上這些掛載選項，例如 noatime 或 nfsvers=4.1。',
  'pages.k8s.forms.storageclass.mountOptions.delete': '刪除掛載選項',
  'pages.k8s.forms.storageclass.mountOptions.placeholder': '請輸入掛載選項',
  'pages.k8s.forms.storageclass.mountOptions.first': '請先填寫已有掛載選項。',
  'pages.k8s.forms.storageclass.yaml.provisionerRequired':
    'YAML 必須包含 provisioner',
  'pages.k8s.forms.edit.pvc.clone.title': '複製持久磁碟區宣告',
  'pages.k8s.forms.edit.pvc.clone.name.pattern':
    '名稱只能包含小寫字母、數字和連字號',
  'pages.k8s.forms.edit.pvc.clone.name.sameAsSource':
    '名稱不能與目前持久磁碟區宣告相同',
  'pages.k8s.forms.edit.pvc.clone.help':
    '複製會以目前 PVC（容量 {capacity}）為基礎建立新的持久磁碟區宣告，存取模式、磁碟區模式和儲存類別保持一致。',
  'pages.k8s.forms.edit.pvc.expand.title': '擴充持久磁碟區宣告',
  'pages.k8s.forms.edit.pvc.expand.denied':
    '儲存類別 {name} 未開啟「允許磁碟區擴充」，無法擴充。請先在儲存類別上開啟後再試。',
  'pages.k8s.forms.edit.pvc.expand.noStorageClass':
    '該持久磁碟區宣告沒有指定儲存類別，無法擴充。',
  'pages.k8s.forms.edit.pvc.expand.unknown':
    '無法讀取儲存類別 {name}，不能確認它是否允許磁碟區擴充；不允許時提交會被叢集拒絕。',
  'pages.k8s.forms.edit.pvc.expand.help':
    '目前容量 {capacity}。僅支援增大容量，且要求所用儲存類別允許磁碟區擴充。',
  'pages.k8s.forms.edit.pvc.size.belowCurrent':
    '容量不能小於目前容量 {current}',
  'pages.k8s.forms.edit.storageclass.default.unset.title': '取消預設儲存類別',
  'pages.k8s.forms.edit.storageclass.default.set.title': '設為預設儲存類別',
  'pages.k8s.forms.edit.storageclass.default.others':
    '已有預設儲存類別：{names}。同時存在多個預設儲存類別時，未指定儲存類別的持久磁碟區宣告將使用最新建立的那個，建議先取消原有的預設儲存類別。',
  'pages.k8s.forms.edit.storageclass.default.unset.confirm':
    '確定取消儲存類別 {name} 的預設設定嗎？',
  'pages.k8s.forms.edit.storageclass.default.unset.hint':
    '取消後，未指定儲存類別的持久磁碟區宣告將不再使用它；已建立的持久磁碟區宣告不受影響。',
  'pages.k8s.forms.edit.storageclass.default.set.confirm':
    '確定將儲存類別 {name} 設為預設儲存類別嗎？',
  'pages.k8s.forms.edit.storageclass.default.set.hint':
    '設定後，未指定儲存類別的持久磁碟區宣告將使用它；已建立的持久磁碟區宣告不受影響。',
  'pages.k8s.forms.edit.storageclass.volumeOps.title': '設定磁碟區操作',
  'pages.k8s.forms.edit.storageclass.volumeOps.allowExpansion':
    '允許磁碟區擴充',
  'pages.k8s.forms.edit.storageclass.volumeOps.help':
    '開啟後，使用該儲存類別的持久磁碟區宣告可以擴充（還需儲存外掛程式支援）；關閉只影響之後的擴充請求。',
  'pages.k8s.forms.ingress.title': '建立應用路由',
  'pages.k8s.forms.ingress.nameNamespaceRequired': '請填寫名稱和命名空間',
  'pages.k8s.forms.ingress.rules': '路由規則',
  'pages.k8s.forms.ingress.rules.required': '請新增至少一個路由規則',
  'pages.k8s.forms.ingress.rewriteTarget': '重寫路徑',
  'pages.k8s.forms.ingress.rewriteTarget.required': '請輸入重寫路徑',
  'pages.k8s.forms.ingress.metadata.description': '為應用路由新增中繼資料。',
  'pages.k8s.forms.ingress.host': '網域名稱',
  'pages.k8s.forms.ingress.host.maxLength': '網域名稱最長 253 個字元',
  'pages.k8s.forms.ingress.host.pattern':
    '網域名稱只能包含小寫字母、數字、連字號（-）和點（.），可以 *. 開頭',
  'pages.k8s.forms.ingress.host.requiredForHttps': 'HTTPS 路由需要填寫網域名稱',
  'pages.k8s.forms.ingress.host.tooltip': '留空表示符合所有網域名稱。',
  'pages.k8s.forms.ingress.protocol': '通訊協定',
  'pages.k8s.forms.ingress.path': '路徑',
  'pages.k8s.forms.ingress.rewrite.example.all': '符合所有路徑',
  'pages.k8s.forms.ingress.rewrite.example.apiPrefix': '符合 /api 開頭',
  'pages.k8s.forms.ingress.rewrite.example.htmlSuffix': '符合 .html 結尾',
  'pages.k8s.forms.ingress.rewrite.example.userId': '符合 /user/:id',
  'pages.k8s.forms.ingress.rewrite.example.oldToNew': '將 /old 改寫為 /new',
  'pages.k8s.forms.ingress.rewrite.tooltip.intro':
    '用於重寫用戶端請求的路徑，支援靜態路徑（如 /new-path）、動態路徑（如 /$1、/$2 等）、組合路徑（如 /v1/$1）和正規表示式',
  'pages.k8s.forms.ingress.rewrite.tooltip.usage': '用途範例',
  'pages.k8s.forms.ingress.rewrite.tooltip.regex': '正規表示式',
  'pages.k8s.forms.ingress.rewrite.tooltip.note':
    '注意：正規表示式需要與 path 欄位的正規表示式相符',
  'pages.k8s.forms.ingress.notice.title': 'Kubernetes 1.35+ 路由建議',
  'pages.k8s.forms.ingress.notice.gatewayApi':
    'Ingress 資源仍可使用；新建複雜流量治理能力時建議評估 Gateway API。',
  'pages.k8s.forms.ingress.notice.tls':
    'HTTPS 路由建議明確指定 TLS Secret，後端連接埠支援連接埠號或具名連接埠。',
  'pages.k8s.forms.ingress.ingressClass.tooltip':
    '指定處理該 Ingress 的控制器類別。',
  'pages.k8s.forms.ingress.ingressClass.placeholder':
    '例如 nginx、alb、traefik',
  'pages.k8s.forms.ingress.tlsSecret.tooltip':
    'HTTPS 路由使用的 TLS Secret，需包含 tls.crt 與 tls.key。',
  'pages.k8s.forms.ingress.tlsSecret.placeholder': '例如 example-com-tls',
  'pages.k8s.forms.ingress.summary.separator': '、',
  'pages.k8s.forms.ingress.customBackend': '自訂後端',
  'pages.k8s.forms.ingress.resourceBackend': '資源後端：{kind}/{name}',
  'pages.k8s.forms.ingress.allHosts': '所有網域名稱',
  'pages.k8s.forms.ingress.summary.protocol': '通訊協定：{protocol}',
  'pages.k8s.forms.ingress.summary.paths': '路徑：{paths}',
  'pages.k8s.forms.ingress.summary.services': '服務：{services}',
  'pages.k8s.forms.ingress.summary.count': '數量：{count}',
  'pages.k8s.forms.ingress.rule.add': '新增路由規則',
  'pages.k8s.forms.ingress.rule.edit': '編輯路由規則',
  'pages.k8s.forms.ingress.rule.delete': '刪除路由規則',
  'pages.k8s.forms.ingress.rule.addDescription':
    '新增一個路由規則，將網域名稱路徑對應至服務。',
  'pages.k8s.forms.ingress.rule.incomplete': '請完善路由規則設定',
  'pages.k8s.forms.ingress.rewrite': '路徑重寫',
  'pages.k8s.forms.ingress.rewrite.description':
    '透過正規表示式設定套用於目前路由規則的重寫路徑',
  'pages.k8s.forms.ingress.port.notFound': '輸入連接埠號或連接埠名稱',
  'pages.k8s.forms.ingress.port.required': '請選擇連接埠',
  'pages.k8s.forms.ingress.paths.required': '請新增至少一條路徑',
  'pages.k8s.forms.ingress.path.required': '請輸入路徑',
  'pages.k8s.forms.ingress.path.leadingSlash': '路徑必須以 / 開頭',
  'pages.k8s.forms.ingress.path.delete': '刪除路徑',
  'pages.k8s.forms.ingress.pathType': '比對方式',
  'pages.k8s.forms.ingress.pathType.required': '請選擇比對方式',
  'pages.k8s.forms.ingress.service.required': '請選擇服務',
  'pages.k8s.forms.ingressclass.title': '建立 Ingress 類別',
  'pages.k8s.forms.ingressclass.parameters': '參數參照',
  'pages.k8s.forms.ingressclass.parameters.extra':
    '參數參照用於關聯控制器需要的設定資源；未啟用時不會輸出 spec.parameters。',
  'pages.k8s.forms.ingressclass.parameters.required': '請選擇是否啟用參數參照',
  'pages.k8s.forms.ingressclass.parameters.notEnabled': '不啟用',
  'pages.k8s.forms.ingressclass.parameters.kindRequired':
    '參數參照必須填寫類型',
  'pages.k8s.forms.ingressclass.parameters.nameRequired':
    '參數參照必須填寫名稱',
  'pages.k8s.forms.ingressclass.parameters.namespaceRequired':
    '命名空間層級的參數參照必須填寫命名空間',
  'pages.k8s.forms.ingressclass.labelKeyDuplicate': '標籤鍵不能重複',
  'pages.k8s.forms.ingressclass.annotationKeyDuplicate': '註解鍵不能重複',
  'pages.k8s.forms.ingressclass.controller': '控制器',
  'pages.k8s.forms.ingressclass.controller.required': '請輸入控制器',
  'pages.k8s.forms.ingressclass.controller.maxLength': '控制器最長 250 個字元',
  'pages.k8s.forms.ingressclass.controller.extra':
    '通常為網域名稱路徑格式，例如 k8s.io/ingress-nginx。',
  'pages.k8s.forms.ingressclass.isDefault': '預設 Ingress 類別',
  'pages.k8s.forms.ingressclass.isDefault.extra':
    '設定後會輸出 ingressclass.kubernetes.io/is-default-class 註解。',
  'pages.k8s.forms.ingressclass.isDefault.required': '請選擇是否作為預設類別',
  'pages.k8s.forms.ingressclass.metadata.description':
    '為 Ingress 類別資源新增標籤和註解。',
  'pages.k8s.forms.ingressclass.scope': '作用範圍',
  'pages.k8s.forms.ingressclass.scope.cluster': '叢集層級',
  'pages.k8s.forms.ingressclass.scope.namespace': '命名空間層級',
  'pages.k8s.forms.ingressclass.scope.required': '請選擇參數作用範圍',
  'pages.k8s.forms.ingressclass.scope.placeholder': '請選擇作用範圍',
  'pages.k8s.forms.ingressclass.apiGroup': 'API 群組',
  'pages.k8s.forms.ingressclass.apiGroup.extra':
    '例如 k8s.example.com；核心 API 群組可以留空。',
  'pages.k8s.forms.ingressclass.apiGroup.placeholder': '請輸入 API 群組',
  'pages.k8s.forms.ingressclass.parameterKind.required': '請輸入參數資源類型',
  'pages.k8s.forms.ingressclass.parameterName.required': '請輸入參數資源名稱',
  'pages.k8s.forms.ingressclass.parameterNamespace.required':
    '請輸入參數命名空間',
  'pages.k8s.forms.ingressclass.yaml.noNamespace':
    'Ingress 類別是叢集層級資源，YAML 不應包含 metadata.namespace',
  'pages.k8s.forms.ingressclass.yaml.controllerRequired':
    'YAML 必須包含 spec.controller',
  'pages.k8s.forms.ingressclass.yaml.parametersKindName':
    'YAML spec.parameters 必須包含 kind 和 name',
  'pages.k8s.forms.ingressclass.yaml.parametersScope':
    'YAML spec.parameters.scope 必須為 Cluster 或 Namespace',
  'pages.k8s.forms.ingressclass.yaml.parametersNamespaceRequired':
    '命名空間層級的參數參照必須包含 namespace',
  'pages.k8s.forms.ingressclass.yaml.parametersNamespaceOnlyNamespaced':
    '只有 Namespace 作用範圍的參數參照可以包含 namespace',
  'pages.k8s.forms.networkpolicy.title': '建立網路原則',
  'pages.k8s.forms.networkpolicy.denyAll': '全部拒絕',
  'pages.k8s.forms.networkpolicy.ingress': '入站規則',
  'pages.k8s.forms.networkpolicy.egress': '出站規則',
  'pages.k8s.forms.networkpolicy.source': '來源',
  'pages.k8s.forms.networkpolicy.destination': '目的地',
  'pages.k8s.forms.networkpolicy.metadata.description':
    '為 NetworkPolicy 資源新增標籤和註解。',
  'pages.k8s.forms.networkpolicy.policyTypes': '原則類型',
  'pages.k8s.forms.networkpolicy.policyTypes.required':
    '請至少選擇一種原則類型',
  'pages.k8s.forms.networkpolicy.policyTypes.ingress': '入站流量',
  'pages.k8s.forms.networkpolicy.policyTypes.egress': '出站流量',
  'pages.k8s.forms.networkpolicy.policyTypes.description':
    '選擇網路原則生效的流量方向。未選擇的方向不會輸出對應規則。',
  'pages.k8s.forms.networkpolicy.policyTypes.tooltip':
    '對應 spec.policyTypes。',
  'pages.k8s.forms.networkpolicy.podSelector.description':
    '為空時會符合目前命名空間內的所有 Pod。',
  'pages.k8s.forms.networkpolicy.podSelector.tooltip':
    '對應 spec.podSelector，可使用 matchLabels 與 matchExpressions。',
  'pages.k8s.forms.networkpolicy.podSelector.emptyHint':
    '未填寫任何比對條件：將輸出空的 podSelector，原則作用於該命名空間內的所有 Pod。',
  'pages.k8s.forms.networkpolicy.selector.expressionKeyFirst':
    '請先填寫已有表達式的鍵。',
  'pages.k8s.forms.networkpolicy.selector.expressionKeyRequired':
    '{label}的表達式必須填寫鍵',
  'pages.k8s.forms.networkpolicy.selector.expressionValuesRequired':
    '{label}的 {operator} 表達式必須至少填寫一個值',
  'pages.k8s.forms.networkpolicy.matchLabels': '比對標籤',
  'pages.k8s.forms.networkpolicy.matchLabels.description':
    '透過 key/value 精確比對 Kubernetes 標籤。',
  'pages.k8s.forms.networkpolicy.matchLabels.delete': '刪除比對標籤',
  'pages.k8s.forms.networkpolicy.matchExpressions': '比對表達式',
  'pages.k8s.forms.networkpolicy.matchExpressions.description':
    '支援 In、NotIn、Exists、DoesNotExist 條件表達式。',
  'pages.k8s.forms.networkpolicy.matchExpressions.valuesPlaceholder':
    '輸入值後按 Enter',
  'pages.k8s.forms.networkpolicy.matchExpressions.noValues': '無需填寫值',
  'pages.k8s.forms.networkpolicy.matchExpressions.delete': '刪除表達式',
  'pages.k8s.forms.networkpolicy.namespaceSelector': '命名空間選擇器',
  'pages.k8s.forms.networkpolicy.peerType.podAndNamespace': 'Pod + 命名空間',
  'pages.k8s.forms.networkpolicy.peerType.ipBlock': 'IP 網段',
  'pages.k8s.forms.networkpolicy.ipBlock.cidrPlaceholder':
    'CIDR，如 10.0.0.0/24',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptPlaceholder':
    '排除 CIDR，輸入後按 Enter',
  'pages.k8s.forms.networkpolicy.ipBlock.cidrInvalid':
    'CIDR 格式不正確，例如 10.0.0.0/24 或 fd00::/64',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptInvalid':
    '排除網段 {item} 不是合法的 CIDR',
  'pages.k8s.forms.networkpolicy.ipBlock.exceptNotSubset':
    '排除網段 {item} 必須是 {cidr} 的真子集',
  'pages.k8s.forms.networkpolicy.port.range': '連接埠號必須在 1-65535 之間',
  'pages.k8s.forms.networkpolicy.port.namePattern':
    '連接埠名稱最長 15 個字元，只能包含小寫字母、數字和連字號（-），且至少包含一個字母',
  'pages.k8s.forms.networkpolicy.port.placeholder': '連接埠號或連接埠名稱',
  'pages.k8s.forms.networkpolicy.port.add': '新增連接埠',
  'pages.k8s.forms.networkpolicy.endPort': '結束連接埠',
  'pages.k8s.forms.networkpolicy.endPort.portMustBeNumber':
    '設定結束連接埠時，連接埠必須填寫數字',
  'pages.k8s.forms.networkpolicy.endPort.range':
    '結束連接埠必須在 1-65535 之間',
  'pages.k8s.forms.networkpolicy.endPort.lessThanPort':
    '結束連接埠不能小於起始連接埠',
  'pages.k8s.forms.networkpolicy.endPort.hint':
    '結束連接埠用於連接埠範圍：需要起始連接埠為數字，且不小於起始連接埠。',
  'pages.k8s.forms.networkpolicy.peer.cidrRequired':
    '{peer} {index} 的 IP 網段必須填寫 CIDR',
  'pages.k8s.forms.networkpolicy.peer.cidrInvalid':
    '{peer} {index} 的 CIDR {cidr} 格式不正確',
  'pages.k8s.forms.networkpolicy.peer.prefix': '{peer} {index} 的{message}',
  'pages.k8s.forms.networkpolicy.peer.podSelectorOf':
    '{peer} {index} 的 Pod 選擇器',
  'pages.k8s.forms.networkpolicy.peer.namespaceSelectorOf':
    '{peer} {index} 的命名空間選擇器',
  'pages.k8s.forms.networkpolicy.rule.prefix': '{rule} {index}：{message}',
  'pages.k8s.forms.networkpolicy.summary.peers': '{label}：{text}',
  'pages.k8s.forms.networkpolicy.summary.ports': '連接埠：{text}',
  'pages.k8s.forms.networkpolicy.summary.portCount': '{count} 個連接埠',
  'pages.k8s.forms.networkpolicy.summary.allPorts': '全部連接埠',
  'pages.k8s.forms.networkpolicy.ingress.add': '新增入站規則',
  'pages.k8s.forms.networkpolicy.ingress.addDescription':
    '設定允許進入目標 Pod 的來源和連接埠。',
  'pages.k8s.forms.networkpolicy.ingress.description':
    '允許符合規則的來源存取目標 Pod',
  'pages.k8s.forms.networkpolicy.ingress.delete': '刪除入站規則',
  'pages.k8s.forms.networkpolicy.ingress.addPeer': '新增來源',
  'pages.k8s.forms.networkpolicy.ingress.deletePeer': '刪除來源',
  'pages.k8s.forms.networkpolicy.ingress.peerCount': '{count} 個來源',
  'pages.k8s.forms.networkpolicy.ingress.allPeers': '全部來源',
  'pages.k8s.forms.networkpolicy.ingress.denyAll':
    '未新增入站規則：將輸出 ingress: []，拒絕所選 Pod 的全部入站流量。',
  'pages.k8s.forms.networkpolicy.ingress.disabled':
    '原則類型未選擇入站流量，建立時不會輸出 ingress 規則。',
  'pages.k8s.forms.networkpolicy.ingress.tooltip':
    '對應 spec.ingress。未新增規則時會輸出空陣列，表示拒絕所有入站流量。',
  'pages.k8s.forms.networkpolicy.egress.add': '新增出站規則',
  'pages.k8s.forms.networkpolicy.egress.addDescription':
    '設定目標 Pod 可存取的目的地和連接埠。',
  'pages.k8s.forms.networkpolicy.egress.description':
    '允許目標 Pod 存取符合規則的目的地',
  'pages.k8s.forms.networkpolicy.egress.delete': '刪除出站規則',
  'pages.k8s.forms.networkpolicy.egress.addPeer': '新增目的地',
  'pages.k8s.forms.networkpolicy.egress.deletePeer': '刪除目的地',
  'pages.k8s.forms.networkpolicy.egress.peerCount': '{count} 個目的地',
  'pages.k8s.forms.networkpolicy.egress.allPeers': '全部目的地',
  'pages.k8s.forms.networkpolicy.egress.denyAll':
    '未新增出站規則：將輸出 egress: []，拒絕所選 Pod 的全部出站流量。',
  'pages.k8s.forms.networkpolicy.egress.disabled':
    '原則類型未選擇出站流量，建立時不會輸出 egress 規則。',
  'pages.k8s.forms.networkpolicy.egress.tooltip':
    '對應 spec.egress。未新增規則時會輸出空陣列，表示拒絕所有出站流量。',
  'pages.k8s.forms.secret.binaryValue': '二進位資料',
  'pages.k8s.forms.secret.type.opaque': '預設',
  'pages.k8s.forms.secret.type.tls': 'TLS 資訊',
  'pages.k8s.forms.secret.type.dockerconfigjson': '映像檔登錄資訊',
  'pages.k8s.forms.secret.type.basicAuth': '使用者名稱和密碼',
  'pages.k8s.forms.secret.data.atLeastOne': '請至少新增一筆資料',
  'pages.k8s.forms.secret.metadata.keyRequired': '請填寫{title}的鍵',
  'pages.k8s.forms.secret.metadata.keyInvalid':
    '{title}的鍵「{keyName}」不合法',
  'pages.k8s.forms.secret.metadata.keyDuplicate': '{title}的鍵不能重複',
  'pages.k8s.forms.secret.certificate': '憑證',
  'pages.k8s.forms.secret.certificate.required': '請輸入憑證',
  'pages.k8s.forms.secret.privateKey': '私密金鑰',
  'pages.k8s.forms.secret.privateKey.required': '請輸入私密金鑰',
  'pages.k8s.forms.secret.registryAddress': '映像檔登錄位址',
  'pages.k8s.forms.secret.registryAddress.required': '請輸入映像檔登錄位址',
  'pages.k8s.forms.secret.registryAddress.extra':
    '設定映像檔登錄位址，例如 docker.io。',
  'pages.k8s.forms.secret.registryAddress.placeholder': '例如 docker.io',
  'pages.k8s.forms.secret.email': '電子郵件',
  'pages.k8s.forms.secret.email.placeholder': '請輸入電子郵件',
  'pages.k8s.forms.secret.registry.incomplete':
    '請設定映像檔登錄位址、使用者名稱和密碼。',
  'pages.k8s.forms.secret.dataSettings': '資料設定',
  'pages.k8s.forms.secret.createTitle': '建立保密字典',
  'pages.k8s.forms.secret.metadata.description':
    '為保密字典資源新增標籤和註解。',
  'pages.k8s.forms.secret.dataEditor.addDescription': '新增鍵值對資料。',
  'pages.k8s.forms.secret.dataEditor.keyDuplicate': '鍵不能重複',
  'pages.k8s.forms.secret.dataEditor.systemKey': '{keyName} 為系統產生的欄位',
  'pages.k8s.forms.configmap.createTitle': '建立配置字典',
  'pages.k8s.forms.configmap.metadata.description':
    '為配置字典資源新增標籤和註解。',
  'pages.k8s.forms.configmap.data.keyRequired': '請填寫資料鍵',
  'pages.k8s.forms.configmap.data.keyUsedByBinary':
    '鍵 {keyName} 已被二進位資料佔用',
  'pages.k8s.forms.configmap.yaml.dataNotObject': 'YAML data 必須為鍵值物件',
  'pages.k8s.forms.configmap.yaml.dataValueNotString':
    'YAML data 的值必須為字串',
  'pages.k8s.forms.edit.secret.hiddenPlaceholder': '已隱藏，輸入新內容以取代',
  'pages.k8s.forms.edit.secret.keepHint': '留空則保持原值。',
  'pages.k8s.forms.edit.secret.docker.hiddenCanReveal':
    '映像檔登錄資訊已隱藏。點選「檢視明文」後可編輯映像檔登錄位址、使用者名稱和密碼；也可以在下方整體取代 .dockerconfigjson 的內容。',
  'pages.k8s.forms.edit.secret.docker.hiddenNoPermission':
    '映像檔登錄資訊已隱藏，目前帳號沒有檢視明文的權限，無法編輯映像檔登錄位址、使用者名稱和密碼。可以在下方整體取代 .dockerconfigjson 的內容，或只修改標籤與註解。',
  'pages.k8s.forms.edit.secret.docker.unparsed':
    '無法從 .dockerconfigjson 解析出映像檔登錄資訊，只能在下方整體取代它的內容。',
  'pages.k8s.forms.edit.secret.docker.replaced':
    '已整體取代 .dockerconfigjson，映像檔登錄資訊以取代的內容為準；復原取代後可恢復以表單編輯。',
  'pages.k8s.forms.edit.secret.mask.notAllowed': '不能是遮罩值 {mask}',
  'pages.k8s.forms.edit.secret.mask.valueNotAllowed': '值不能是遮罩值 {mask}',
  'pages.k8s.forms.edit.secret.mask.keyValueNotAllowed':
    '鍵 {keyName} 的值不能是遮罩值 {mask}',
  'pages.k8s.forms.edit.secret.mask.fieldNotAllowed':
    '{title}不能是遮罩值 {mask}',
  'pages.k8s.forms.edit.secret.data.renameHidden':
    '鍵 {sourceKey} 的值已隱藏，重新命名前請先輸入新值',
  'pages.k8s.forms.edit.secret.typeImmutable': '類型建立後不可修改。',
  'pages.k8s.forms.edit.secret.otherData': '其他資料',
  'pages.k8s.forms.edit.secret.revealed':
    '已顯示明文。未修改的資料儲存時保持原值。',
  'pages.k8s.forms.edit.secret.hiddenNoPermission':
    '既有資料的值已隱藏，目前帳號沒有檢視明文的權限；可以直接輸入新值取代。',
  'pages.k8s.forms.edit.secret.reveal': '檢視明文',
  'pages.k8s.forms.edit.secret.hiddenHint':
    '既有資料的值已隱藏。檢視明文會記入操作稽核；也可以直接輸入新值取代。',
  'pages.k8s.forms.edit.secret.immutable':
    '該保密字典已設為不可變（immutable），資料無法修改，僅可編輯標籤與註解。',
  'pages.k8s.forms.edit.secret.tag.new': '新增',
  'pages.k8s.forms.edit.secret.tag.modified': '已修改',
  'pages.k8s.forms.edit.secret.undo': '復原修改',
  'pages.k8s.forms.edit.secret.replaceData': '取代資料',
  'pages.k8s.forms.edit.secret.replaceNotice':
    '目前的值已隱藏。儲存後將以下方輸入的內容取代原值；不想取代請按取消。',
  'pages.k8s.forms.edit.secret.dataEditor.fillAbove':
    '{keyName} 請在上方的表單欄位填寫',
  'pages.k8s.forms.edit.configmap.immutable':
    '該配置字典已設為不可變（immutable），資料無法修改，僅可編輯標籤與註解。',
  'pages.k8s.forms.edit.configmap.binaryKeysNotice':
    '二進位資料（{keys}）不在此處編輯，儲存時原樣保留。',
  'pages.k8s.forms.edit.service.accessMode.description':
    '設定從叢集外存取服務的方式。',
  'pages.k8s.forms.edit.service.accessMode.none': '無',
  'pages.k8s.forms.edit.service.lbClass.description':
    '指定由哪類負載平衡器實作接管該 Service。',
  'pages.k8s.forms.edit.service.lbClass.placeholder':
    '例如 service.k8s.aws/nlb',
  'pages.k8s.forms.edit.service.nodePortAllocation': 'NodePort 配置',
  'pages.k8s.forms.edit.service.nodePortAllocation.description':
    '控制 LoadBalancer 是否自動配置 NodePort。',
  'pages.k8s.forms.edit.service.nodePortAllocation.checkbox':
    '為 LoadBalancer 服務自動配置 NodePort',
  'pages.k8s.forms.edit.service.externalTrafficPolicy': '外部流量策略',
  'pages.k8s.forms.edit.service.externalTrafficPolicy.description':
    'Local 可保留用戶端來源 IP，Cluster 會在叢集範圍內轉送。',
  'pages.k8s.forms.edit.service.externalTrafficPolicy.placeholder':
    '預設由叢集決定',
  'pages.k8s.forms.edit.service.annotations.description':
    '透過註解補充負載平衡器相關設定。',
  'pages.k8s.forms.edit.service.externalAccessTitle': '編輯外部存取',
  'pages.k8s.forms.edit.service.settingsTitle': '編輯服務設定',
  'pages.k8s.forms.edit.ingress.annotationsTitle': '編輯註解',
  'pages.k8s.forms.edit.ingress.annotations.description':
    '為應用路由設定註解。',
  'pages.k8s.forms.edit.ingress.annotations.keyRequired': '註解 Key 不能為空',
  'pages.k8s.forms.edit.ingress.annotations.keyDuplicate': '註解 Key 不能重複',
  'pages.k8s.forms.edit.ingress.rulesTitle': '編輯路由規則',
  'pages.k8s.forms.edit.workload.updateStrategy.description':
    '設定工作負載更新容器組副本時採用的策略。',
  'pages.k8s.forms.edit.workload.strategyType': '策略類型',
  'pages.k8s.forms.edit.workload.containers.description':
    '維護容器映像檔、連接埠、資源和進階設定。',
  'pages.k8s.forms.edit.workload.storage.description':
    '為容器組掛載持久磁碟區、暫存磁碟區、配置字典或保密字典。',
  'pages.k8s.forms.edit.workload.scheduling': '容器組排程規則',
  'pages.k8s.forms.edit.workload.scheduling.description':
    '設定容器組副本排程到節點的規則。',
  'pages.k8s.forms.edit.workload.ruleType': '規則類型',
  'pages.k8s.forms.edit.workload.termination': '容器組優雅終止',
  'pages.k8s.forms.edit.workload.termination.description':
    '設定容器終止前等待的時間，逾時後容器將強制終止。',
};
