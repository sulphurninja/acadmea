"use client";
import React from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type BarChartProps = {
  data: any[];
};

export function BarChart({ data }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Get all possible data keys excluding 'name'
  const dataKeys = Object.keys(data[0]).filter(key => key !== 'name');
  const colors = ['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#a855f7'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickMargin={10}
          axisLine={{ stroke: '#888', strokeWidth: 1 }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value}%`}
          axisLine={{ stroke: '#888', strokeWidth: 1 }}
          domain={[0, 100]}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, '']}
          contentStyle={{
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: 'none'
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ paddingTop: '10px' }}
        />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
