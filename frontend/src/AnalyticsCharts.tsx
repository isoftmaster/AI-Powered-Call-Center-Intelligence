import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#00f2ff', '#2d8cf0', '#9d50bb', '#ff4d4d', '#ff9f43'];

interface AnalyticsData {
  sentiment_dist: any[];
  churn_trend: any[];
  issue_dist: any[];
}

const AnalyticsCharts: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8001/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="loader"></div>;
  if (!data) return <div>No data available</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
      <div className="panel" style={{ height: '350px' }}>
        <h3 className="panel-title">Sentiment Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.sentiment_dist}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.sentiment_dist.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#161821', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="panel" style={{ height: '350px' }}>
        <h3 className="panel-title">Churn Risk Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.churn_trend}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d8cf0" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2d8cf0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#a0a0ab" fontSize={10} />
            <YAxis stroke="#a0a0ab" fontSize={10} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ background: '#161821', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Area type="monotone" dataKey="risk" stroke="#2d8cf0" fillOpacity={1} fill="url(#colorRisk)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="panel" style={{ height: '350px', gridColumn: 'span 2' }}>
        <h3 className="panel-title">Issue Classification</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.issue_dist} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="#a0a0ab" fontSize={10} />
            <YAxis dataKey="name" type="category" stroke="#a0a0ab" fontSize={10} width={100} />
            <Tooltip 
              contentStyle={{ background: '#161821', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Bar dataKey="value" fill="#9d50bb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
