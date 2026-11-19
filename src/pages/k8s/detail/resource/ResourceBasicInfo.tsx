import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { ProDescriptions } from '@ant-design/pro-components';
import { createContext, useContext } from 'react';

/** 当前详情页的资源名称：基本信息的第一项（页面没有页头，名称在这里给出） */
export const ResourceNameContext = createContext<string | undefined>(undefined);

type ResourceBasicInfoProps<T extends Record<string, unknown>> = {
  className?: string;
  column?: number;
  columns: ProDescriptionsItemProps<T>[];
  dataSource: T;
};

const ResourceBasicInfo = <T extends Record<string, unknown>>({
  className,
  column = 2,
  columns,
  dataSource,
}: ResourceBasicInfoProps<T>) => {
  const name = useContext(ResourceNameContext);
  return (
    <ProDescriptions<T>
      className={className}
      style={{ flex: 1, minWidth: 420 }}
      column={column}
      columns={
        name
          ? [
              {
                title: '名称',
                key: '__name',
                copyable: true,
                renderText: () => name,
              },
              ...columns,
            ]
          : columns
      }
      dataSource={dataSource}
    />
  );
};

export type { ResourceBasicInfoProps };
export default ResourceBasicInfo;
