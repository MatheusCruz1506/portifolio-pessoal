import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";
import useThemeStore from "../../store/useThemeStore";
import type { Unit, UnitType } from "../../types/unit";

const TYPE_COLORS: Record<UnitType, string> = {
  Hospital: "#991b1b", // primary-dark
  "Centro Universitário": "#3b82f6", // blue
  Paróquia: "#8b5cf6", // purple
  "Casa de Repouso": "#10b981", // emerald
  Seminário: "#f59e0b", // amber
  Missão: "#ec4899", // pink
  Outro: "#4A5565", // gray
};

interface ChartDatum {
  name: UnitType;
  displayName: string;
  value: number;
  fill: string;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    name?: string;
    payload?: ChartDatum;
  }>;
  total: number;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  axisColor: string;
}

const CustomTooltip = ({
  active,
  payload,
  total,
  tooltipBg,
  tooltipBorder,
  tooltipText,
  axisColor,
}: TooltipContentProps): ReactNode => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const item = payload[0];
    const typeName = item.payload?.displayName || item.payload?.name || item.name;
    const typeValue = item.payload?.value || item.value || 0;
    const pct = total > 0 ? ((typeValue / total) * 100).toFixed(1) : 0;
    return (
      <div
        className="px-4 py-2.5 rounded-lg shadow-lg border"
        style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
      >
        <p className="font-semibold text-sm" style={{ color: tooltipText }}>
          {typeName}
        </p>
        <p className="text-sm" style={{ color: axisColor }}>
          {typeValue} {String(t(typeValue !== 1 ? "units.units" : "units.unit"))} ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

interface UnitTypeChartProps {
  units: Unit[];
}

export default function UnitTypeChart({ units }: UnitTypeChartProps) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const { theme } = useThemeStore();

  const isDark = theme === "dark";
  const axisColor = isDark ? "#9ca3af" : "#6b7280";
  const gridColor = isDark ? "#374151" : "#f0f0f0";
  const tooltipBg = isDark ? "#1e1e1e" : "#ffffff";
  const tooltipBorder = isDark ? "#374151" : "#f3f4f6";
  const tooltipText = isDark ? "#f3f4f6" : "#111111";

  const CHART_TYPES: Array<{ key: "pie" | "bar"; label: string }> = [
    { key: "pie", label: t("chart.pie") },
    { key: "bar", label: t("chart.bar") },
  ];

  const data: ChartDatum[] = Object.entries(
    units.reduce<Record<UnitType, number>>((acc, unit) => {
      const type = unit.type || "Outro";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<UnitType, number>),
  )
    .map(([name, value]) => ({
      name: name as UnitType,
      displayName: String(t(`types.${name}`, { defaultValue: name })),
      value,
      fill: TYPE_COLORS[name as UnitType] || TYPE_COLORS["Outro"],
    }))
    .sort((a, b) => b.value - a.value);

  const total = units.length;
  const isChartReady = chartSize.width > 0 && chartSize.height > 0;
  const hasData = data.length > 0;

  useLayoutEffect(() => {
    if (!chartContainer || !hasData) {
      setChartSize({ width: 0, height: 0 });
      return;
    }

    let frameId = 0;

    const updateChartSize = () => {
      const { width, height } = chartContainer.getBoundingClientRect();
      const nextWidth = Math.max(Math.round(width), 0);
      const nextHeight = Math.max(Math.round(height), 0);

      setChartSize((currentSize) => {
        if (
          currentSize.width === nextWidth &&
          currentSize.height === nextHeight
        ) {
          return currentSize;
        }

        return { width: nextWidth, height: nextHeight };
      });
    };

    const scheduleChartSizeUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateChartSize);
    };

    scheduleChartSizeUpdate();

    if (typeof ResizeObserver === "undefined") {
      return () => {
        cancelAnimationFrame(frameId);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleChartSizeUpdate();
    });

    resizeObserver.observe(chartContainer);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [chartContainer, hasData]);

  const renderPieLabel = ({
    name,
    percent,
  }: {
    name?: string;
    percent?: number;
  }) => {
    const safePercent = percent ?? 0;
    if (safePercent < 0.05) return null;
    const displayName =
      data.find((item) => item.name === name)?.displayName ?? name ?? "";
    return `${displayName} (${(safePercent * 100).toFixed(0)}%)`;
  };

  return (
    <div className="min-w-0 rounded-2xl border border-border-subtle bg-surface p-6 shadow-md">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">{t("dashboard.typeDistribution")}</h2>

        <div className="flex bg-hover-bg rounded-lg p-1 gap-0.5 border border-border-subtle">
          {CHART_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setChartType(type.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                chartType === type.key
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-text-secondary">
          {t("units.notFound")}
        </div>
      ) : (
        <div ref={setChartContainer} className="h-96 min-w-0">
          {isChartReady ? (
            <>
              {chartType === "pie" ? (
                <PieChart width={chartSize.width} height={chartSize.height}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="40%"
                    outerRadius={100}
                    innerRadius={45}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                    animationDuration={600}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        total={total}
                        tooltipBg={tooltipBg}
                        tooltipBorder={tooltipBorder}
                        tooltipText={tooltipText}
                        axisColor={axisColor}
                      />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-text-secondary">
                        {String(
                          t(`types.${value}`, { defaultValue: String(value) }),
                        )}
                      </span>
                    )}
                  />
                </PieChart>
              ) : (
                <BarChart
                  width={chartSize.width}
                  height={chartSize.height}
                  data={data}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fontSize: 12, fill: axisColor }}
                    axisLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    tick={{ fontSize: 14, fill: axisColor }}
                    axisLine={{ stroke: gridColor }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        total={total}
                        tooltipBg={tooltipBg}
                        tooltipBorder={tooltipBorder}
                        tooltipText={tooltipText}
                        axisColor={axisColor}
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              )}
            </>
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-hover-bg" />
          )}
        </div>
      )}
    </div>
  );
}
