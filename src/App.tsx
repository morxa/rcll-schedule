import { useState, useEffect, useCallback } from 'react';
import type { DaySchedule, ScheduleEntry } from './types/schedule';
import { DayScheduleComponent } from './components/DaySchedule';
import { ScheduleConfig } from './components/ScheduleConfig';
import { loadScheduleFromCSV, getCurrentGame, formatTimeWithTimezone } from './utils/scheduleUtils';
import './App.css';

function App() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [currentGame, setCurrentGame] = useState<ScheduleEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [isBackgroundUpdate, setIsBackgroundUpdate] = useState(false);
  const [hasLoadedExternalData, setHasLoadedExternalData] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      // Only show loading screen if we have no data yet (first load)
      const hasExistingData = schedule.length > 0;
      
      if (!hasExistingData && !isRefresh) {
        setLoading(true);
      } else {
        setIsBackgroundUpdate(true);
      }
      
      setError(null);
      console.log('App: Starting to load schedule data...');
      
      // Allow fallback to local file only on first load when no external data was loaded before
      const allowFallback = !hasExistingData && !hasLoadedExternalData;
      console.log('App: allowFallback =', allowFallback, '(hasExistingData:', hasExistingData, ', hasLoadedExternalData:', hasLoadedExternalData, ')');
      const scheduleData = await loadScheduleFromCSV(allowFallback);
      
      console.log('App: Schedule data loaded:', scheduleData.length, 'days');
      
      if (scheduleData.length === 0) {
        // Only show error if we have no existing data
        if (!hasExistingData) {
          setError('No schedule data found - check console for loading errors');
          setLoading(false);
        } else {
          console.warn('Background update failed: No schedule data found, keeping existing data');
        }
        setIsBackgroundUpdate(false);
        return;
      }
      
      // Track that we've successfully loaded external data (if external URL is configured)
      if (import.meta.env.VITE_SCHEDULE_CSV_URL) {
        setHasLoadedExternalData(true);
      }
      
      setSchedule(scheduleData);
      
      // Set current date as default (only on first load)
      if (!hasExistingData) {
        const today = new Date().getFullYear() + '-' + 
                     String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
                     String(new Date().getDate()).padStart(2, '0');
        const todayExists = scheduleData.some(day => day.date === today);
        setSelectedDate(todayExists ? today : scheduleData[0]?.date || '');
      }
      
      setError(null); // Clear any previous errors
      setLoading(false);
      setIsBackgroundUpdate(false);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('App: Failed to load schedule:', err);
      
      // Only show error if we have no existing data
      const hasExistingData = schedule.length > 0;
      if (!hasExistingData) {
        setError(`Failed to load schedule data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      } else {
        console.warn('Background update failed, keeping existing data:', err);
      }
      setIsBackgroundUpdate(false);
    }
  }, [schedule.length, hasLoadedExternalData]);

  const refreshSchedule = useCallback(() => {
    console.log('Manual refresh triggered');
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const updateCurrentGame = () => {
      const current = getCurrentGame(schedule);
      setCurrentGame(current);
    };

    updateCurrentGame();
    const interval = setInterval(updateCurrentGame, 30000); // Update current game every 30 seconds

    return () => clearInterval(interval);
  }, [schedule]);

  // Separate effect for updating current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Auto-refresh schedule every 5 minutes if using external URL
  useEffect(() => {
    const externalUrl = import.meta.env.VITE_SCHEDULE_CSV_URL;
    if (!externalUrl) return;

    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing schedule due to cache expiration...');
      loadData(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">{error}</div>
      </div>
    );
  }

  const selectedDaySchedule = schedule.find(day => day.date === selectedDate);
  // Format current date to match CSV format (YYYY-MM-DD)
  const today = new Date().getFullYear() + '-' + 
               String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
               String(new Date().getDate()).padStart(2, '0');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="title-with-logo">
            <img 
              src="https://ll.robocup.org/wp-content/uploads/2023/04/RCfed_high_M_Transp.png" 
              alt="RoboCup Logo" 
              className="logo"
            />
            <h1>RCLL Competition Schedule</h1>
          </div>
          <button 
            className="config-button" 
            onClick={() => setShowConfig(true)}
            title="Schedule Configuration"
          >
            ⚙️
          </button>
        </div>
        
        {currentGame && currentGame.date === today && (
          <div className="current-game-banner">
            <div className="banner-content">
              <span className="banner-label">LIVE NOW:</span>
              {currentGame.isSpecialEvent ? (
                <span className="special-event-banner">{currentGame.eventTitle}</span>
              ) : (
                <>
                  <span className="cyan-team-banner">{currentGame.cyanTeam}</span>
                  <span className="vs-banner">vs</span>
                  <span className="magenta-team-banner">{currentGame.magentaTeam}</span>
                </>
              )}
              <span className="time-banner">({formatTimeWithTimezone(currentGame.time, currentGame.date)})</span>
            </div>
          </div>
        )}
      </header>

      <nav className="date-nav">
        {schedule.map(day => {
          // Parse date as local to avoid timezone issues
          const [year, month, dayNum] = day.date.split('-');
          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayNum));
          
          return (
            <button
              key={day.date}
              className={`date-button ${selectedDate === day.date ? 'active' : ''} ${day.date === today ? 'today' : ''}`}
              onClick={() => setSelectedDate(day.date)}
            >
              {localDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </button>
          );
        })}
      </nav>

      <main className="main-content">
        {selectedDaySchedule ? (
          <DayScheduleComponent 
            daySchedule={selectedDaySchedule} 
            currentGame={currentGame} 
          />
        ) : (
          <div className="no-schedule">No schedule found for selected date</div>
        )}
      </main>

      <div className="livestream-info">
        <h3>📡 Watch Live Streams</h3>
        <div className="livestream-links">
          <a 
            href="https://www.youtube.com/watch?v=7T4LYY8wjBk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="livestream-link youtube"
          >
            <span className="platform-icon">▶️</span>
            YouTube Live
          </a>
          <a 
            href="https://www.twitch.tv/robocupofficial" 
            target="_blank" 
            rel="noopener noreferrer"
            className="livestream-link twitch"
          >
            <span className="platform-icon">🎮</span>
            Twitch
          </a>
        </div>
      </div>

      <footer className="app-footer">
        <p>
          Current time: {currentTime.toLocaleTimeString()} • 
          Last update: {lastUpdate.toLocaleTimeString()} • 
          <span className={`update-indicator ${isBackgroundUpdate ? 'updating' : ''}`}>
            {isBackgroundUpdate ? '⟳' : '●'}
          </span> 
          {isBackgroundUpdate ? 'Updating...' : 'Auto-updating'}
          {import.meta.env.VITE_SCHEDULE_CSV_URL && ' • Schedule refreshes every 5min'}
        </p>
      </footer>

      <ScheduleConfig 
        isVisible={showConfig} 
        onClose={() => setShowConfig(false)} 
        onRefresh={refreshSchedule}
      />
    </div>
  );
}

export default App;
