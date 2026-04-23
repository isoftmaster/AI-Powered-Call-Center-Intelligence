import React, { useState, useEffect } from 'react';
import './App.css';
import TextUpload from './TextUpload';
import HistoryView from './HistoryView';
import AudioWaveform from './AudioWaveform';
import AnalyticsCharts from './AnalyticsCharts';

function App() {
  const [mode, setMode] = useState<'audio' | 'text' | 'history' | 'dashboard'>('audio');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [insights, setInsights] = useState('');
  const [structuredInsights, setStructuredInsights] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      setError('Please select an audio file.');
      return;
    }

    setIsLoading(true);
    setError('');
    setTranscript('');
    setInsights('');
    setStructuredInsights(null);

    const formData = new FormData();
    formData.append('file', audioFile);

    try {
      const response = await fetch('http://localhost:8001/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server error during analysis.');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setInsights(data.insights);
      setStructuredInsights(data.insights_structured);
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
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

  return (
    <div className="App">
      <div className="container" style={{ maxWidth: (mode === 'history' || mode === 'dashboard') ? '1200px' : '1000px' }}>
        <header className="header">
          <h1 className="title">Call Intelligence</h1>
          <p className="subtitle">AI-Powered Behavioral Insights & Predictive Analytics</p>
        </header>

        <div className="mode-toggle">
          {['audio', 'text', 'history', 'dashboard'].map((m) => (
            <button 
              key={m}
              className={`mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m as any)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="glass-card">
          {mode === 'audio' && (
            <div className="upload-section">
              <div className="file-input-wrapper">
                <div className="upload-icon">?</div>
                <p>{audioFile ? audioFile.name : 'Drop audio file or click to browse'}</p>
                <input type="file" accept="audio/*" onChange={handleFileChange} />
              </div>

              {audioUrl && <AudioWaveform url={audioUrl} />}
              
              <button className="primary-btn" onClick={handleUpload} disabled={isLoading || !audioFile}>
                {isLoading && <span className="loader"></span>}
                {isLoading ? 'Processing Pipeline...' : 'Run Analysis'}
              </button>

              {error && <div className="error-msg">{error}</div>}
            </div>
          )}

          {mode === 'text' && <TextUpload />}
          {mode === 'history' && <HistoryView />}
          {mode === 'dashboard' && <AnalyticsCharts />}
        </div>

        {(transcript || insights) && mode === 'audio' && (
          <div className="output-container">
            <div className="panel">
              <h3 className="panel-title">Original Transcript</h3>
              <div className="content-box">
                {transcript || "Transcription in progress..."}
              </div>
              
              {structuredInsights && (
                <div className="panel" style={{ marginTop: '1rem', border: 'none', background: 'transparent', padding: 0 }}>
                  <h3 className="panel-title">Predictive Metrics</h3>
                  <div className="content-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="insight-item">
                      <span className="insight-label">Sentiment</span>
                      <div className={`insight-value ${structuredInsights.sentiment === 'Negative' ? 'error-text' : ''}`} style={{ fontSize: '1.2rem', color: structuredInsights.sentiment === 'Positive' ? '#00f2ff' : '' }}>
                        {structuredInsights.sentiment}
                      </div>
                    </div>
                    <div className="insight-item">
                      <span className="insight-label">Churn Risk</span>
                      <div className="insight-value" style={{ fontSize: '1.2rem', color: structuredInsights.churn_risk_score > 70 ? '#ff4d4d' : '#2d8cf0' }}>
                        {structuredInsights.churn_risk_score}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="panel">
              <h3 className="panel-title">Behavioral Insights</h3>
              <div className="content-box">
                {insights ? renderInsights(insights) : "Analysis in progress..."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
