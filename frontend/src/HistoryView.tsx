import React, { useEffect, useState } from 'react';
import './App.css';

interface CallRecord {
  call_id: string;
  transcript: string;
  insights: string;
  created_at: string;
}

function HistoryView() {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8001/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInsights = (text: string) => {
    return text.split('\n').filter(l => l.trim()).map((line, i) => {
      const match = line.match(/^(\d+\..*?):\s*(.*)$/);
      if (match) {
        return (
          <div key={i} className="insight-item">
            <span className="insight-label">{match[1]}</span>
            <div className="insight-value">{match[2]}</div>
          </div>
        );
      }
      return <div key={i} className="insight-item">{line}</div>;
    });
  };

  if (isLoading) return <div className="loader"></div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="history-container" style={{ width: '100%', textAlign: 'left' }}>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Call History Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No calls analyzed yet.</p>
          ) : (
            history.map((call) => (
              <div 
                key={call.call_id}
                className={`content-box ${selectedCall?.call_id === call.call_id ? 'active' : ''}`}
                style={{ 
                  cursor: 'pointer', 
                  padding: '1rem',
                  borderColor: selectedCall?.call_id === call.call_id ? 'var(--accent-cyan)' : 'var(--glass-border)',
                  background: selectedCall?.call_id === call.call_id ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                }}
                onClick={() => setSelectedCall(call)}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  {new Date(call.created_at).toLocaleString()}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ID: {call.call_id.split('-')[0]}...
                </div>
              </div>
            ))
          )}
        </div>

        <div className="history-details">
          {selectedCall ? (
            <div className="output-container" style={{ gridTemplateColumns: '1fr', margin: 0, gap: '2rem' }}>
              <div className="panel">
                <h3 className="panel-title">Analysis Insights</h3>
                <div className="content-box">
                  {renderInsights(selectedCall.insights)}
                </div>
              </div>
              <div className="panel">
                <h3 className="panel-title">Full Transcript</h3>
                <div className="content-box" style={{ fontSize: '0.9rem' }}>
                  {selectedCall.transcript}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Select a call from the list to view detailed behavioral insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryView;
