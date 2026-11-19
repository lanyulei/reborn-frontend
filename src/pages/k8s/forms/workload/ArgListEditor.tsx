import type { StringListEditorItem } from '../shared/StringListEditor';
import StringListEditor from '../shared/StringListEditor';
import { createId, toArgList } from './helpers';

type ArgListEditorProps = {
  addText?: string;
  placeholder?: string;
  value?: StringListEditorItem[];
  onChange?: (value: StringListEditorItem[]) => void;
};

const createArgItem = (): StringListEditorItem => ({
  id: createId(),
  value: '',
});

/** 必填校验：至少有一个非空参数 */
const validateArgListRequired = async (
  _: unknown,
  value?: StringListEditorItem[],
) => {
  if (toArgList(value).length === 0) {
    throw new Error('请输入命令');
  }
};

/**
 * 命令 / 参数编辑器：每一项就是 argv 里的一个参数，原样提交。
 * 不做逗号拆分——参数本身可以包含逗号、空格。
 */
const ArgListEditor = ({
  addText = '添加',
  placeholder,
  value,
  onChange,
}: ArgListEditorProps) => (
  <StringListEditor
    addText={addText}
    deleteAriaLabel="删除参数"
    minRows={1}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onCreateItem={createArgItem}
  />
);

export { validateArgListRequired };
export default ArgListEditor;
