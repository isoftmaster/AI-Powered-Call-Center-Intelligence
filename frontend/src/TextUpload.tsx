import React, { useState } from 'react';
import './App.css';

function TextUpload() {
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [insights, setInsights] = useState('');
  const [structuredInsights, setStructuredInsights] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Please enter a transcript.');
      return;
    }

    setIsLoading(true);
    setError('');
    setTranscript('');
    setInsights('');
    setStructuredInsights(null);

    const formData = new FormData();
    formData.append('transcript', inputText);

    try {
      const response = await fetch('http://localhost:8001/analyze-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text.');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setInsights(data.insights);
      setStructuredInsights(data.insights_structured);
    } catch (err: any) {
      setError(err.message || 'Unexpected error occurred.');
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
    <div className="upload-section">
      <textarea
        placeholder="Paste customer service transcript here... (e.g. Agent: Hello... Customer: Hi...)"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button className="primary-btn" onClick={handleSubmit} disabled={isLoading || !inputText}>
        {isLoading && <span className="loader"></span>}
        {isLoading ? 'Analyzing Behavioral Data...' : 'Analyze Transcript'}
      </button>

      {error && <div className="error-msg">{error}</div>}

      {(transcript || insights) && (
        <div className="output-container" style={{ width: '100%', maxWidth: 'none', textAlign: 'left' }}>
          <div className="panel">
            <h3 className="panel-title">Processed Transcript</h3>
            <div className="content-box">
              {transcript.split('\n').map((line, i) => (
                <div key={i} style={{ marginBottom: '0.5rem' }}>
                  {line.startsWith('Agent:') || line.startsWith('Customer:') ? (
                    <>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{line.split(':')[0]}:</strong>
                      {line.split(':').slice(1).join(':')}
                    </>
                  ) : line}
                </div>
              ))}
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
  );
}

export default TextUpload;
