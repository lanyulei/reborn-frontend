/**
 * 表单编辑抽屉的外壳：加载中 / 加载失败（可重试）/ 表单，底部「取消 / 保存」。
 * 保存时由调用方校验并生成改好的对象，这里交给 EditSubmit 预检、对比、提交。
 */
import { CloseOutlined } from '@ant-design/icons';
import type { DrawerProps, FormInstance } from 'antd';
import { Alert, Button, Drawer, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { EditFormProps, EditObjectState } from '../../shared/edit';
import { EditSubmit } from '../../shared/edit';
import { toYaml } from '../../shared/kube';
import type { PlainObject } from './mergePatch';
import { deepClone } from './mergePatch';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-body': {
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  error: {
    marginBottom: token.marginLG,
  },
  hidden: {
    display: 'none',
  },
}));

/**
 * 对象加载（或重新加载）后算出表单初值并写入表单。
 * 返回的初值是「打开时的表单值」，保存时与当前值比对出用户的改动。
 */
export const useEditFormValues = <Values extends object>(
  form: FormInstance<Values>,
  object: PlainObject | undefined,
  build: (object: PlainObject) => Values,
): Values | undefined => {
  const initial = useMemo(
    () => (object ? build(object) : undefined),
    [build, object],
  );

  useEffect(() => {
    if (initial) {
      form.resetFields();
      // 表单拿到的是副本：初值本身保持不变，留作比对
      form.setFieldsValue(
        deepClone(initial) as Parameters<typeof form.setFieldsValue>[0],
      );
    }
  }, [form, initial]);

  return initial;
};

type EditDrawerProps = EditFormProps & {
  children: ReactNode;
  state: EditObjectState;
  title: string;
  /** 抽屉宽度；缺省 max(1000px, 50vw) */
  size?: DrawerProps['size'];
  /** 校验并生成改好的对象；校验未通过返回 undefined（停在表单里） */
  onBuild: (object: PlainObject) => Promise<PlainObject | undefined>;
};

const EditDrawer = ({
  children,
  clusterId,
  state,
  target,
  title,
  size = 'max(1000px, 50vw)',
  onBuild,
  onClose,
  onDone,
}: EditDrawerProps) => {
  const { styles } = useStyles();
  const { object, resourceVersion, loading, error, reload } = state;
  const [yaml, setYaml] = useState<string>();
  const ready = Boolean(object) && !loading && !error;

  const handleSave = async () => {
    if (!object) {
      return;
    }
    const result = await onBuild(object);
    if (result) {
      setYaml(toYaml(result));
    }
  };

  return (
    <>
      <Drawer
        className={styles.drawer}
        closeIcon={<CloseOutlined />}
        destroyOnHidden
        footer={
          <div className={styles.footer}>
            <Button onClick={onClose}>取消</Button>
            <Button
              disabled={!ready}
              type="primary"
              onClick={() => void handleSave()}
            >
              保存
            </Button>
          </div>
        }
        keyboard={false}
        mask={{ closable: false }}
        open
        size={size}
        title={title}
        onClose={onClose}
      >
        <Spin spinning={loading}>
          {error && (
            <Alert
              action={
                <Button size="small" onClick={reload}>
                  重试
                </Button>
              }
              className={styles.error}
              showIcon
              title={error}
              type="error"
            />
          )}
          {/* 表单始终挂载（表单实例在加载完成前就已创建），取到对象前不展示 */}
          <div className={object && !error ? undefined : styles.hidden}>
            {children}
          </div>
        </Spin>
      </Drawer>
      {yaml !== undefined && (
        <EditSubmit
          clusterId={clusterId}
          resourceVersion={resourceVersion}
          target={target}
          title={title}
          yaml={yaml}
          onBack={() => setYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
          onReload={reload}
        />
      )}
    </>
  );
};

export default EditDrawer;
