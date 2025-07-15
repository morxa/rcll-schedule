# Competition Schedule Webapp

A modern React TypeScript application for displaying and managing competition schedules with real-time current game highlighting.

## Features

- **📅 Multi-day Schedule**: Display schedule for July 16-20, 2025
- **⏰ 30-minute Timeslots**: Shows games in 30-minute intervals
- **🎨 Team Colors**: Visual distinction between CYAN and MAGENTA teams
- **🔴 Live Highlighting**: Real-time highlighting of current games
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **📊 CSV Data**: Easy schedule editing through CSV format
- **⚡ Fast Loading**: Built with Vite for optimal performance

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Schedule Management

The schedule can be managed in two ways:

### 1. External CSV URL (Recommended for production)
Set the `VITE_SCHEDULE_CSV_URL` environment variable to load the schedule from an external source:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your CSV URL
VITE_SCHEDULE_CSV_URL=https://your-csv-url.com/schedule.csv
```

**Benefits:**
- Update schedule without redeploying the website
- Can use GitHub Gist, Google Sheets, or any public CSV URL
- Automatic fallback to local file if external URL fails
- **CORS handling**: Automatically tries direct fetch first, then uses CORS proxy if needed

**CORS Support:**
The app handles CORS (Cross-Origin) issues automatically:
1. First attempts direct fetch from your URL
2. If CORS blocks the request, uses `allorigins.win` proxy service
3. Falls back to local file if both methods fail

### 2. Local CSV File
Place your schedule in `public/schedule.csv` (fallback method)

### CSV Format

The schedule CSV file should follow this format:

```csv
date,time,cyan_team,magenta_team,game_type
2025-07-16,09:00,Team Alpha,Team Beta,Match
2025-07-16,09:30,Team Gamma,Team Delta,Match
```

### CSV Format Details

- **date**: Date in YYYY-MM-DD format
- **time**: Time in HH:MM format (24-hour)
- **cyan_team**: Name of the CYAN team
- **magenta_team**: Name of the MAGENTA team
- **game_type**: Type of game (Match, Semi-Final, Final, Break, etc.)

### Special Events
For events like ceremonies or breaks, use the same text in both team columns:
```csv
2025-07-16,08:30,Opening Ceremony,Opening Ceremony,Ceremony
2025-07-16,10:30,Coffee Break,Coffee Break,Break
```

## Features in Detail

### Current Game Highlighting
- Games are automatically highlighted when they are currently happening
- Updates every 30 seconds to ensure accuracy
- Prominent banner shows the live game at the top

### Team Color Coding
- CYAN teams are displayed with blue styling
- MAGENTA teams are displayed with pink styling
- Visual distinction makes it easy to follow teams

### Day Navigation
- Easy switching between competition days
- Current day is highlighted with green accent
- Mobile-friendly navigation buttons

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/         # React components
│   ├── DaySchedule.tsx    # Day schedule display
│   ├── GameRow.tsx        # Individual game row
│   └── *.css             # Component styles
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── App.tsx           # Main application component
```

## Customization

### Adding More Days
Add more entries to the CSV file with different dates.

### Changing Time Intervals
Modify the CSV file to use different time intervals (15 min, 1 hour, etc.).

### Team Names
Update team names directly in the CSV file.

### Styling
Modify the CSS files in the `src/components/` directory to customize the appearance.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available under the [MIT License](LICENSE).
