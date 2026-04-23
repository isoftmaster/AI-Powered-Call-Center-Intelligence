import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
  url: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      waveSurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#2d8cf0',
        progressColor: '#00f2ff',
        cursorColor: '#ffffff',
        barWidth: 2,
        barRadius: 3,
        height: 60,
      });

      waveSurferRef.current.load(url).catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('WaveSurfer load error:', err);
        }
      });

      return () => {
        waveSurferRef.current?.destroy();
      };
    }
  }, [url]);

  return (
    <div style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
      <div ref={containerRef} />
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button 
          className="mode-btn active" 
          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
          onClick={() => waveSurferRef.current?.playPause()}
        >
          Play / Pause
        </button>
      </div>
    </div>
  );
};

export default AudioWaveform;
