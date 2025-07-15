import type { ScheduleEntry, DaySchedule } from '../types/schedule';

export async function loadScheduleFromCSV(): Promise<DaySchedule[]> {
  try {
    const response = await fetch('/schedule.csv');
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading schedule:', error);
    return [];
  }
}

export function parseCSV(csvText: string): DaySchedule[] {
  const lines = csvText.trim().split('\n');
  lines[0].split(','); // Skip headers
  
  const entries: ScheduleEntry[] = lines.slice(1).map(line => {
    const values = line.split(',');
    const cyanTeam = values[2];
    const magentaTeam = values[3];
    const gameType = values[4];
    
    // Check if this is a special event (same text in both team columns or special keywords)
    const isSpecialEvent = cyanTeam === magentaTeam || 
                          ['Opening Ceremony', 'Closing Ceremony', 'Awards', 'Lunch', 'Coffee Break'].includes(cyanTeam);
    
    return {
      date: values[0],
      time: values[1],
      cyanTeam,
      magentaTeam,
      gameType,
      isSpecialEvent,
      eventTitle: isSpecialEvent ? cyanTeam : undefined
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
  const currentDate = now.toISOString().split('T')[0];
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
  const currentDate = now.toISOString().split('T')[0];
  
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
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
