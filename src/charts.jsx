import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { colorFor } from './constants.js';
import { inr, inrCompact } from './format.js';

// Isolated module so the recharts bundle is code-split away from the app shell.

export function TrendChart({ data }) {
  return (
    <div className="panel trend">
      <div className="panelHead">
        <div>
          <h3>Spending trend</h3>
          <p>Last 6 months</p>
        </div>
      </div>
      <div className="chart">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6d5dfc" stopOpacity="0.3" />
                <stop offset="1" stopColor="#6d5dfc" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ecebf2" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(x) => inrCompact(x)} width={52} />
            <Tooltip formatter={(v) => inr(v)} />
            <Area type="monotone" dataKey="total" name="Spent" stroke="#6d5dfc" strokeWidth={3} fill="url(#spendGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryDonut({ data, total }) {
  return (
    <div className="panel category">
      <h3>By category</h3>
      <p>Where your money goes</p>
      <div className="donut">
        {data.length ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="name" innerRadius={53} outerRadius={75} paddingAngle={3}>
                {data.map((x) => (
                  <Cell key={x.name} fill={colorFor(x.name)} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => inr(v)} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="emptyCircle">No data</div>
        )}
      </div>
      <div className="legend">
        {data.slice(0, 4).map((x) => (
          <div key={x.name}>
            <span style={{ background: colorFor(x.name) }} />
            {x.name}
            <b>{total ? Math.round((x.total / total) * 100) : 0}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
