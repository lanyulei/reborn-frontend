/** 折线图纵轴的范围与刻度计算（纯函数，不依赖 React，便于单独验证）。 */

/** 纵轴刻度数上限（正常为 5-7 个；只在数值精度不足等异常情况下起作用） */
const MAX_TICKS = 12;

const niceStep = (x: number) => {
  const pow = 10 ** Math.floor(Math.log10(Math.max(x, 1e-12)));
  const f = x / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
};

/**
 * 纵轴范围与刻度（vLo ≤ vHi，均为有限数）。刻度按下标生成、个数有上限：数值极大而变化极小时
 * 步长小于浮点精度，「v += step」不再前进，按值累加的循环不会结束。步长或范围算不出有限值
 * （跨度溢出等）时退回数据本身的范围，只标两端。
 */
export const valueAxis = (vLo: number, vHi: number) => {
  const span = vHi - vLo;
  const step = niceStep((span > 0 ? span : Math.abs(vHi) || 1) / 4);
  // 乘回步长时可能差一个舍入误差而没盖住数据：两端再与数据取一次极值
  let yMin = Math.min(vLo, Math.floor(vLo / step) * step);
  let yMax = Math.max(vHi, yMin + step, Math.ceil(vHi / step) * step);
  let count = Math.round((yMax - yMin) / step);
  if (
    !(step > 0) ||
    !Number.isFinite(step) ||
    !Number.isFinite(yMin) ||
    !Number.isFinite(yMax) ||
    !Number.isFinite(count) ||
    !(yMax > yMin)
  ) {
    yMin = vLo;
    yMax = vHi;
    return { yMin, yMax, ticks: yMax > yMin ? [yMin, yMax] : [yMin] };
  }
  count = Math.min(Math.max(count, 1), MAX_TICKS);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    const v = i === count ? yMax : yMin + i * step;
    // 精度不足时相邻刻度会落在同一个数上：只留一个
    if (ticks.length === 0 || v > ticks[ticks.length - 1]) ticks.push(v);
  }
  return { yMin, yMax, ticks };
};
