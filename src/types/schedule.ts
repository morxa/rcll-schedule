export interface ScheduleEntry {
  date: string;
  time: string;
  cyanTeam: string;
  magentaTeam: string;
  gameType: string;
  isSpecialEvent?: boolean;
  eventTitle?: string;
  cyanScore?: number;
  magentaScore?: number;
}

export interface DaySchedule {
  date: string;
  games: ScheduleEntry[];
}

export type TeamColor = 'CYAN' | 'MAGENTA';
