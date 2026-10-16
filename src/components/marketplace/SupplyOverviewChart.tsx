"use client";

import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function monthlyCounts(
  dates: string[],
  year: number,
  monthCount: number
) {
  const counts = Array.from({ length: monthCount }, () => 0);
  for (const iso of dates) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) continue;
    const month = date.getMonth();
    if (month < monthCount) counts[month] += 1;
  }
  return counts;
}

export function SupplyOverviewChart({
  series: input,
  loading,
}: {
  series: { name: string; dates: string[] }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="m-0 py-16 text-center text-xs text-soko-muted">
        Loading this year…
      </p>
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const monthCount = now.getMonth() + 1;
  const categories = MONTHS.slice(0, monthCount);
  const series = input.map((item) => ({
    name: item.name,
    data: monthlyCounts(item.dates, year, monthCount),
  }));

  return (
    <Chart
      type="line"
      height={320}
      series={series}
      options={{
        chart: {
          toolbar: { show: false },
          fontFamily: "inherit",
          animations: { enabled: true },
          zoom: { enabled: false },
        },
        colors: ["#0d1b2a", "#ff9900"],
        stroke: { curve: "smooth", width: 3 },
        markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
        dataLabels: { enabled: false },
        xaxis: {
          categories,
          title: {
            text: String(year),
            style: { fontSize: "11px", color: "#6b7280", fontWeight: 600 },
          },
          labels: { style: { fontSize: "11px", colors: "#6b7280" } },
          axisBorder: { color: "#e2e6ea" },
          axisTicks: { color: "#e2e6ea" },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
          decimalsInFloat: 0,
          labels: {
            style: { fontSize: "11px", colors: "#6b7280" },
            formatter: (value) => Math.round(value).toLocaleString("en-RW"),
          },
        },
        legend: {
          position: "bottom",
          fontSize: "12px",
          labels: { colors: "#6b7280" },
          markers: { size: 6 },
        },
        grid: { borderColor: "#e2e6ea", strokeDashArray: 4 },
        tooltip: {
          y: {
            formatter: (value) => Number(value).toLocaleString("en-RW"),
          },
        },
      }}
    />
  );
}
