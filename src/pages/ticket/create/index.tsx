/**
 * 提交工单：按分类展示可提单的工单模板（分组卡片网格，卡片样式同 资源管理 / 模型管理），
 * 点一张模板即进入该模板的填写页（/ticket/create/:templateId）。
 */
import { SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Empty, Input, Space, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { IconBadge } from '@/components/IconPicker';
import { useCmdbStyles } from '@/pages/cmdb/components/styles';
import { listCatalog } from '@/services/ticket';
import type { TicketCategory } from '@/services/ticket/typings';
import { useT } from '@/utils/i18n';
import { TICKET_ICON } from '../components/meta';

const useStyles = createStyles(({ token, css }) => ({
  /** 搜索栏与下方分组的间距（叠在通用工具栏样式之后） */
  toolbar: css`
    margin-bottom: 16px;
  `,
  /** 分类分组：标题 + 卡片网格，不折叠 */
  group: css`
    margin-bottom: 20px;
  `,
  groupHead: css`
    margin-bottom: 10px;
  `,
  /** 模板说明：位置同模型卡片的编码行，但用正文字体 */
  desc: css`
    overflow: hidden;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const SubmitTicket: React.FC = () => {
  const t = useT();
  const { styles, cx } = useCmdbStyles();
  const { styles: own } = useStyles();
  const [catalog, setCatalog] = useState<TicketCategory[]>();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    listCatalog()
      .then((result) => setCatalog(result.items ?? []))
      // 失败提示由请求层统一弹出
      .catch(() => setCatalog([]));
  }, []);

  // 只展示有模板的分类；搜索时只留有命中的分类
  const groups = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return (catalog ?? [])
      .map((category) => ({
        category,
        templates: (category.templates ?? []).filter(
          (item) => !kw || item.name.toLowerCase().includes(kw),
        ),
      }))
      .filter((group) => group.templates.length > 0);
  }, [catalog, keyword]);

  return (
    <PageContainer title={false}>
      <div className={cx(styles.toolbar, own.toolbar)}>
        <Input
          allowClear
          style={{ width: 280 }}
          prefix={<SearchOutlined />}
          placeholder={t('pages.ticket.submit.search.placeholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {!catalog ? (
        <div style={{ padding: 96, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : groups.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t(
            keyword.trim()
              ? 'pages.ticket.submit.noMatch'
              : 'pages.ticket.create.empty',
          )}
          style={{ padding: 64 }}
        />
      ) : (
        groups.map(({ category, templates }) => (
          <section key={category.id} className={own.group}>
            <Space size={8} align="center" className={own.groupHead}>
              <span className={styles.groupTitle}>{category.name}</span>
              <span className={styles.groupCount}>( {templates.length} )</span>
            </Space>
            <div className={styles.cardGrid}>
              {templates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.modelCard}
                  onClick={() => history.push(`/ticket/create/${item.id}`)}
                >
                  <IconBadge icon={item.icon} fallback={TICKET_ICON} />
                  <span className={styles.modelCardBody}>
                    <span className={styles.modelCardName}>{item.name}</span>
                    <span className={own.desc}>
                      {item.description || t('pages.ticket.create.noDesc')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </PageContainer>
  );
};

export default SubmitTicket;
