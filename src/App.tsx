import { useState, useEffect, useCallback } from 'react';
import type { DaySchedule, ScheduleEntry } from './types/schedule';
import { DayScheduleComponent } from './components/DaySchedule';
import { ScheduleConfig } from './components/ScheduleConfig';
import { loadScheduleFromCSV, getCurrentGame } from './utils/scheduleUtils';
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('App: Starting to load schedule data...');
      const scheduleData = await loadScheduleFromCSV();
      console.log('App: Schedule data loaded:', scheduleData.length, 'days');
      
      if (scheduleData.length === 0) {
        setError('No schedule data found - check console for loading errors');
        setLoading(false);
        return;
      }
      
      setSchedule(scheduleData);
      
      // Set current date as default
      const today = new Date().toISOString().split('T')[0];
      const todayExists = scheduleData.some(day => day.date === today);
      setSelectedDate(todayExists ? today : scheduleData[0]?.date || '');
      
      setError(null); // Clear any previous errors
      setLoading(false);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('App: Failed to load schedule:', err);
      setError(`Failed to load schedule data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, []);

  const refreshSchedule = useCallback(() => {
    console.log('Manual refresh triggered');
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const updateCurrentGame = () => {
      const current = getCurrentGame(schedule);
      setCurrentGame(current);
      setLastUpdate(new Date()); // Track when we last updated the game
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
      loadData();
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
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>RCLL Competition Schedule</h1>
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
              <span className="time-banner">({currentGame.time})</span>
            </div>
          </div>
        )}
      </header>

      <nav className="date-nav">
        {schedule.map(day => (
          <button
            key={day.date}
            className={`date-button ${selectedDate === day.date ? 'active' : ''} ${day.date === today ? 'today' : ''}`}
            onClick={() => setSelectedDate(day.date)}
          >
            {new Date(day.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </button>
        ))}
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

      <footer className="app-footer">
        <p>
          Current time: {currentTime.toLocaleTimeString()} • 
          Last update: {lastUpdate.toLocaleTimeString()} • 
          <span className="update-indicator">●</span> Auto-updating
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
