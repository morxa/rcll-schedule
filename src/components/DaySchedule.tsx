import React, { useEffect, useRef } from 'react';
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
  const currentGameRef = useRef<HTMLTableRowElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentGame && currentGameRef.current && tableContainerRef.current) {
      // Add a small delay to avoid excessive scrolling during rapid updates
      const timeoutId = setTimeout(() => {
        const currentRow = currentGameRef.current;
        if (!currentRow) return;
        
        // Get the header height to account for it
        const header = document.querySelector('.app-header') as HTMLElement;
        const headerHeight = header ? header.offsetHeight : 0;
        
        // Calculate the desired scroll position
        const rowTop = currentRow.offsetTop;
        
        // Position the current game in the upper portion of the visible area
        // but below the fixed header
        const targetScrollTop = rowTop - headerHeight - 100; // 100px buffer
        
        window.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      }, 100); // 100ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentGame, daySchedule.games]);

  return (
    <div className="day-schedule">
      <h2 className="day-title">{formatDate(daySchedule.date)}</h2>
      <div className="schedule-table-container" ref={tableContainerRef}>
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
            {daySchedule.games.map((game, index) => {
              const isCurrent = currentGame ? 
                currentGame.date === game.date && 
                currentGame.time === game.time : false;
              
              return (
                <GameRow
                  key={`${game.date}-${game.time}-${index}`}
                  game={game}
                  currentGame={currentGame}
                  isCurrent={isCurrent}
                  ref={isCurrent ? currentGameRef : undefined}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
