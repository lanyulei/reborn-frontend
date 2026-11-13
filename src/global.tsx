import '../tailwind.css';

// 表格单元格内容被截断（见 global.less 的单行省略）时，悬停用原生 title 显示完整内容；
// 列自带 ellipsis 提示（antd Tooltip）的单元格自身不溢出，不会重复提示
document.addEventListener('mouseover', (e) => {
  const cell = (e.target as Element).closest?.<HTMLElement>(
    '.ant-table-tbody > tr:not(.ant-table-expanded-row) > td.ant-table-cell',
  );
  if (!cell) return;
  if (cell.scrollWidth > cell.clientWidth) {
    cell.dataset.overflowTitle = '1';
    cell.title = cell.textContent;
  } else if (cell.dataset.overflowTitle) {
    delete cell.dataset.overflowTitle;
    cell.removeAttribute('title');
  }
});
