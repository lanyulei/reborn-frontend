/** 创建向导的统一入参：由通用资源视图在点击「新建」时渲染 */
export interface CreateFormProps {
  clusterId: string;
  /** 当前作用域的命名空间；空 = 全部命名空间（向导里须自行选择） */
  namespace?: string;
  onClose: () => void;
  /** 有对象创建成功后调用（刷新列表） */
  onDone?: () => void;
}
