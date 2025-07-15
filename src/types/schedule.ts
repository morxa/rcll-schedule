export interface ScheduleEntry {
  date: string;
  time: string;
  cyanTeam: string;
  magentaTeam: string;
  gameType: string;
  isSpecialEvent?: boolean;
  eventTitle?: string;
}

export interface DaySchedule {
  date: string;
  games: ScheduleEntry[];
}

export type TeamColor = 'CYAN' | 'MAGENTA';
