import { useState, useEffect } from 'react';
import './ScheduleConfig.css';

interface ScheduleConfigProps {
  isVisible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ScheduleConfig: React.FC<ScheduleConfigProps> = ({ isVisible, onClose, onRefresh }) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    const externalUrl = import.meta.env.VITE_SCHEDULE_CSV_URL;
    setCurrentUrl(externalUrl || 'Local file (/schedule.csv)');
  }, []);

  if (!isVisible) return null;

  return (
    <div className="config-overlay" onClick={onClose}>
      <div className="config-modal" onClick={e => e.stopPropagation()}>
        <div className="config-header">
          <h3>Schedule Configuration</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="config-content">
          <div className="config-section">
            <label>Schedule Source:</label>
            <div className="url-display">
              {currentUrl}
            </div>
          </div>
          
          <div className="config-section">
            <label>Timezone Configuration:</label>
            <p className="timezone-note">
              Schedule timezone: {import.meta.env.VITE_SCHEDULE_TIMEZONE || 'Browser timezone'}<br/>
              Display timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone} (Your browser's timezone)
            </p>
          </div>
          
          {import.meta.env.VITE_SCHEDULE_CSV_URL && (
            <div className="config-section">
              <button className="refresh-button" onClick={onRefresh}>
                🔄 Refresh Schedule
              </button>
              <p className="refresh-note">Force reload from external source (bypasses cache)</p>
            </div>
          )}
          
          <div className="config-info">
            <p><strong>📍 Current source:</strong> {import.meta.env.VITE_SCHEDULE_CSV_URL ? 'External URL' : 'Local file'}</p>
            <p><strong>� Schedule timezone:</strong> {import.meta.env.VITE_SCHEDULE_TIMEZONE || 'Browser timezone'}</p>
            <p><strong>�🔄 Updates:</strong> {import.meta.env.VITE_SCHEDULE_CSV_URL ? 'Automatic when URL content changes' : 'Requires redeployment'}</p>
            <p><strong>⚙️ Configuration:</strong> Set via environment variables (VITE_SCHEDULE_CSV_URL, VITE_SCHEDULE_TIMEZONE)</p>
            {import.meta.env.VITE_SCHEDULE_CSV_URL && (
              <p><strong>🌐 CORS handling:</strong> Tries direct fetch first, falls back to CORS proxy if needed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
