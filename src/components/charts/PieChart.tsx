"use client";
import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type PieChartProps = {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
};

export function PieChart({ data }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [value, '']}
          contentStyle={{
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: 'none'
          }}
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          wrapperStyle={{ paddingTop: '20px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
