import React from 'react';
import type { DaySchedule, ScheduleEntry } from '../types/schedule';
import { GameRow } from './GameRow';
import { formatDate } from '../utils/scheduleUtils';
import './DaySchedule.css';

interface DayScheduleProps {
  daySchedule: DaySchedule;
  currentGame: ScheduleEntry | null;
}

export const DayScheduleComponent: React.FC<DayScheduleProps> = ({ 
  daySchedule, 
  currentGame 
}) => {
  return (
    <div className="day-schedule">
      <h2 className="day-title">{formatDate(daySchedule.date)}</h2>
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Time</th>
              <th className="cyan-header">CYAN Team</th>
              <th></th>
              <th className="magenta-header">MAGENTA Team</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {daySchedule.games.map((game, index) => (
              <GameRow
                key={`${game.date}-${game.time}-${index}`}
                game={game}
                currentGame={currentGame}
                isCurrent={currentGame ? 
                  currentGame.date === game.date && 
                  currentGame.time === game.time : false}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
