import type { ScheduleEntry, DaySchedule } from '../types/schedule';

export async function loadScheduleFromCSV(allowFallback = true): Promise<DaySchedule[]> {
  try {
    // Try to load from external URL first, then fallback to local file (only if allowed)
    const externalUrl = import.meta.env.VITE_SCHEDULE_CSV_URL;
    let csvText: string = '';
    
    if (externalUrl) {
      try {
        console.log('Loading schedule from external URL:', externalUrl);
        
        // First try direct fetch
        try {
          const cacheBuster = Date.now();
          const urlWithCacheBuster = `${externalUrl}?cb=${cacheBuster}`;
          
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(urlWithCacheBuster, { 
            signal: controller.signal 
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          csvText = await response.text();
          console.log('Successfully loaded schedule from external URL (direct)');
        } catch (corsError) {
          // Clean up timeout if fetch was aborted
          if (corsError instanceof Error && corsError.name === 'AbortError') {
            console.log('Direct fetch aborted due to timeout');
          }
          console.warn('Direct fetch failed (likely CORS), trying CORS proxy...', corsError);
          
          try {
            // Try with CORS proxy - add cache busting parameter
            const cacheBuster = Date.now();
            const urlWithCacheBuster = `${externalUrl}?cb=${cacheBuster}`;
            const corsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlWithCacheBuster)}`;
            console.log('Attempting CORS proxy with cache-busted URL:', corsProxyUrl);
            
            // Add timeout for proxy request
            const proxyController = new AbortController();
            const proxyTimeoutId = setTimeout(() => proxyController.abort(), 15000); // 15 second timeout
            
            const proxyResponse = await fetch(corsProxyUrl, {
              signal: proxyController.signal
            });
            clearTimeout(proxyTimeoutId);
            
            if (!proxyResponse.ok) {
              throw new Error(`CORS proxy failed! status: ${proxyResponse.status}`);
            }
            
            const data = await proxyResponse.json();
            
            // Check if content is in base64 format (allorigins.win sometimes returns this)
            let content = data.contents;
            if (content && content.startsWith('data:text/csv;base64,')) {
              // Decode base64 content
              const base64Data = content.replace('data:text/csv;base64,', '');
              content = atob(base64Data);
              console.log('Decoded base64 CSV content from CORS proxy');
            }
            
            // Validate that we actually got content
            if (!content || content.trim() === '') {
              throw new Error('CORS proxy returned empty content');
            }
            
            // Additional validation: check if it looks like CSV
            if (!content.includes(',') || content.split('\n').length < 2) {
              throw new Error('CORS proxy returned invalid CSV format');
            }
            
            csvText = content;
            console.log('Successfully loaded schedule via CORS proxy, content length:', csvText.length);
          } catch (proxyError) {
            console.error('Primary CORS proxy failed:', proxyError);
            
            // Try alternative CORS proxy
            try {
              console.log('Trying alternative CORS proxy...');
              const altCacheBuster = Date.now();
              const altUrlWithCacheBuster = `${externalUrl}?cb=${altCacheBuster}`;
              const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(altUrlWithCacheBuster)}`;
              
              // Add timeout for alternative proxy
              const altController = new AbortController();
              const altTimeoutId = setTimeout(() => altController.abort(), 15000); // 15 second timeout
              
              const altResponse = await fetch(altProxyUrl, {
                signal: altController.signal
              });
              clearTimeout(altTimeoutId);
              
              if (!altResponse.ok) {
                throw new Error(`Alternative CORS proxy failed! status: ${altResponse.status}`);
              }
              
              csvText = await altResponse.text();
              
              if (!csvText || csvText.trim() === '' || !csvText.includes(',')) {
                throw new Error('Alternative CORS proxy returned invalid content');
              }
              
              console.log('Successfully loaded schedule via alternative CORS proxy');
            } catch (altProxyError) {
              console.error('All CORS proxy methods failed:', altProxyError);
              throw new Error(`All external loading methods failed. Primary: ${proxyError instanceof Error ? proxyError.message : proxyError}, Alternative: ${altProxyError instanceof Error ? altProxyError.message : altProxyError}`);
            }
          }
        }
        
      } catch (externalError) {
        if (allowFallback) {
          console.warn('Failed to load from external URL and CORS proxy, falling back to local file:', externalError);
          // Fallback to local file
          const localResponse = await fetch('/schedule.csv');
          csvText = await localResponse.text();
          console.log('Successfully loaded schedule from local file');
        } else {
          console.error('Failed to load from external URL and fallback not allowed:', externalError);
          throw externalError;
        }
      }
    } else {
      // No external URL configured, use local file
      console.log('No external URL configured, loading from local file');
      const response = await fetch('/schedule.csv');
      csvText = await response.text();
    }

    // Validate CSV content before parsing
    if (!csvText || csvText.trim() === '') {
      throw new Error('CSV content is empty');
    }

    if (!csvText.includes(',')) {
      throw new Error('CSV content does not appear to be valid CSV format');
    }

    console.log('CSV content loaded successfully, length:', csvText.length, 'lines:', csvText.split('\n').length);
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading schedule:', error);
    return [];
  }
}

export function parseCSV(csvText: string): DaySchedule[] {
  const lines = csvText.trim().split('\n');
  lines[0].split(','); // Skip headers
  
  const entries: ScheduleEntry[] = lines.slice(1)
    .filter(line => line.trim() !== '') // Filter out empty lines
    .filter(line => line.split(',').length >= 3) // Ensure minimum required columns (date, time, at least one more)
    .map(line => {
      const values = line.split(',');
      const cyanTeam = values[2];
      const magentaTeam = values[3];
      const gameType = values[4];
      const cyanScore = values[5] && values[5] !== '-' ? parseInt(values[5]) : undefined;
      const magentaScore = values[6] && values[6] !== '-' ? parseInt(values[6]) : undefined;
      const isLivestreamed = values[7] === '1';
      
      // Check if this is a special event (blank team columns or same text in both columns)
      const isSpecialEvent = (!cyanTeam && !magentaTeam) || (cyanTeam === magentaTeam) || 
                            ['Opening Ceremony', 'Closing Ceremony', 'Awards', 'Lunch', 'Coffee Break'].includes(cyanTeam);
      
      return {
        date: values[0],
        time: values[1],
        cyanTeam,
        magentaTeam,
        gameType,
        isSpecialEvent,
        eventTitle: isSpecialEvent ? (gameType || cyanTeam) : undefined,
        cyanScore: !isNaN(cyanScore!) ? cyanScore : undefined,
        magentaScore: !isNaN(magentaScore!) ? magentaScore : undefined,
        isLivestreamed
      };
    });

  // Group by date
  const groupedByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, ScheduleEntry[]>);

  return Object.entries(groupedByDate).map(([date, games]) => ({
    date,
    games: games.sort((a, b) => a.time.localeCompare(b.time))
  }));
}

export function getCurrentGame(schedule: DaySchedule[]): ScheduleEntry | null {
  const now = new Date();
  // Format current date to match CSV format (YYYY-MM-DD)
  const currentDate = now.getFullYear() + '-' + 
                     String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getDate()).padStart(2, '0');
  const currentTime = now.toTimeString().slice(0, 5);

  const todaySchedule = schedule.find(day => day.date === currentDate);
  if (!todaySchedule) return null;

  // Find the game that's currently happening or the next one
  for (let i = 0; i < todaySchedule.games.length; i++) {
    const game = todaySchedule.games[i];
    const gameTime = game.time;
    const nextGameTime = i < todaySchedule.games.length - 1 ? todaySchedule.games[i + 1].time : '23:59';
    
    if (currentTime >= gameTime && currentTime < nextGameTime) {
      return game;
    }
  }

  return null;
}

export function getGameStatus(game: ScheduleEntry, currentGame: ScheduleEntry | null): 'past' | 'current' | 'future' {
  const now = new Date();
  // Format current date to match CSV format (YYYY-MM-DD)
  const currentDate = now.getFullYear() + '-' + 
                     String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getDate()).padStart(2, '0');
  
  // If it's not today, check if it's past or future
  if (game.date < currentDate) return 'past';
  if (game.date > currentDate) return 'future';

  // If this is the current game, mark it as current
  if (currentGame && 
      game.date === currentGame.date && 
      game.time === currentGame.time &&
      game.cyanTeam === currentGame.cyanTeam &&
      game.magentaTeam === currentGame.magentaTeam) {
    return 'current';
  }

  // For today's games, check if they're in the past
  const currentTime = now.toTimeString().slice(0, 5);
  const gameTime = game.time;
  const gameEndTime = addMinutesToTime(gameTime, 30);
  
  if (currentTime >= gameEndTime) return 'past';
  return 'future';
}

function addMinutesToTime(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: undefined // Let the browser decide based on locale
  });
}
