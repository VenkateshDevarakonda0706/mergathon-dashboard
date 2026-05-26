"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DailyActivity } from "../types";

interface ActivityChartProps {
  data: DailyActivity[];
  title?: string;
}

export default function ActivityChart({ data, title = "Daily Event Activity" }: ActivityChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format dates for the X-axis (e.g., "May 15")
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (!isMounted) {
    return (
      <div 
        className="card chart-card" 
        style={{ 
          height: "350px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "var(--text-tertiary)",
          fontSize: "14px"
        }}
      >
        Loading Activity Chart...
      </div>
    );
  }

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--accent-blue)" }} />
            <span>PRs Opened</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--accent-emerald)" }} />
            <span>PRs Merged</span>
          </span>

        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrsOpened" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="colorPrsMerged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0.01} />
              </linearGradient>

            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="var(--text-tertiary)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-tertiary)" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-primary)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                boxShadow: "var(--shadow-md)"
              }}
              labelFormatter={(label) => `Date: ${formatDate(label as string)}`}
            />
            <Area
              type="monotone"
              dataKey="prsOpened"
              name="PRs Opened"
              stroke="var(--accent-blue)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrsOpened)"
            />
            <Area
              type="monotone"
              dataKey="prsMerged"
              name="PRs Merged"
              stroke="var(--accent-emerald)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrsMerged)"
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
