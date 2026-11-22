import { type Translate, useT } from '@/utils/i18n';
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
const validateArgListRequired =
  (t: Translate) => async (_: unknown, value?: StringListEditorItem[]) => {
    if (toArgList(value).length === 0) {
      throw new Error(t('pages.k8s.forms.workload.container.command.required'));
    }
  };

/**
 * 命令 / 参数编辑器：每一项就是 argv 里的一个参数，原样提交。
 * 不做逗号拆分——参数本身可以包含逗号、空格。
 */
const ArgListEditor = ({
  addText,
  placeholder,
  value,
  onChange,
}: ArgListEditorProps) => {
  const t = useT();

  return (
    <StringListEditor
      addText={addText ?? t('pages.k8s.form.add')}
      deleteAriaLabel={t('pages.k8s.forms.workload.container.arg.delete')}
      minRows={1}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onCreateItem={createArgItem}
    />
  );
};

export { validateArgListRequired };
export default ArgListEditor;
