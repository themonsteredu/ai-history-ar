import trendCsv from "../../../public/data/three-kingdoms/heritage-trend-starter.csv?raw";

export interface TrendPoint {
  year: number;
  value: number;
}

export const trendMeasureLabel = "디지털 이용 지수";

export const trendPoints: readonly TrendPoint[] = trendCsv
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const cells = line.split(",");
    return { year: Number(cells[0]), value: Number(cells[1]) };
  });

export const lastTrendPoint = trendPoints[trendPoints.length - 1];

export const averageTrendStep = Math.round(
  (lastTrendPoint.value - trendPoints[0].value) / (trendPoints.length - 1),
);
