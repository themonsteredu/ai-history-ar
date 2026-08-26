import type { ChartDatum } from "../content/three-kingdoms/heritageDataset";

const LABEL_WIDTH = 168;
const CHART_WIDTH = 640;
const ROW_HEIGHT = 30;
const BAR_HEIGHT = 16;
const TOP_PADDING = 8;
const BOTTOM_AXIS = 26;
const END_RADIUS = 4;

function tickStep(max: number) {
  if (max <= 10) return 2;
  if (max <= 25) return 5;
  return 10;
}

function barPath(x: number, y: number, width: number, height: number) {
  if (width <= END_RADIUS) return `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
  const r = END_RADIUS;
  return `M ${x} ${y} h ${width - r} a ${r} ${r} 0 0 1 ${r} ${r} v ${height - 2 * r} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(width - r)} Z`;
}

export function HeritageBarChart({ caption, data, title }: { caption: string; data: ChartDatum[]; title: string }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const step = tickStep(max);
  const axisMax = Math.ceil(max / step) * step;
  const plotWidth = CHART_WIDTH - LABEL_WIDTH - 40;
  const height = TOP_PADDING + data.length * ROW_HEIGHT + BOTTOM_AXIS;
  const ticks = [];
  for (let value = 0; value <= axisMax; value += step) ticks.push(value);

  return (
    <figure className="heritage-chart">
      <figcaption><strong>{title}</strong><span>{caption}</span></figcaption>
      <svg preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${title} 가로 막대 그래프`} viewBox={`0 0 ${CHART_WIDTH} ${height}`}>
        {ticks.map((value) => {
          const x = LABEL_WIDTH + (value / axisMax) * plotWidth;
          return (
            <g key={value}>
              <line className="heritage-chart__grid" x1={x} x2={x} y1={TOP_PADDING} y2={TOP_PADDING + data.length * ROW_HEIGHT} />
              <text className="heritage-chart__tick" textAnchor="middle" x={x} y={TOP_PADDING + data.length * ROW_HEIGHT + 16}>{value}</text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const y = TOP_PADDING + index * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
          const width = (item.value / axisMax) * plotWidth;
          return (
            <g className="heritage-chart__row" key={item.label}>
              <title>{`${item.label} · ${item.value}건`}</title>
              <text className="heritage-chart__label" textAnchor="end" x={LABEL_WIDTH - 10} y={y + BAR_HEIGHT - 4}>{item.label}</text>
              <path className="heritage-chart__bar" d={barPath(LABEL_WIDTH, y, width, BAR_HEIGHT)} />
              <text className="heritage-chart__value" x={LABEL_WIDTH + width + 6} y={y + BAR_HEIGHT - 4}>{item.value}</text>
            </g>
          );
        })}
        <line className="heritage-chart__axis" x1={LABEL_WIDTH} x2={LABEL_WIDTH} y1={TOP_PADDING} y2={TOP_PADDING + data.length * ROW_HEIGHT} />
      </svg>
    </figure>
  );
}
