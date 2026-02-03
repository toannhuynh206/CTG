import pool from './pool.js';
import dotenv from 'dotenv';

dotenv.config();

// Seed a test puzzle for today (or the next Monday)
async function seed() {
  const today = new Date();
  // Get next Monday or today if Monday
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (1 - dayOfWeek + 7) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  const dateStr = monday.toISOString().split('T')[0];

  // Also seed for today regardless of day (for dev testing)
  const todayStr = today.toISOString().split('T')[0];

  const connectionsData = {
    groups: [
      {
        label: 'Chicago Landmarks',
        words: ['BEAN', 'WRIGLEY', 'NAVY PIER', 'WILLIS'],
        difficulty: 1,
        color: '#F9DF6D',
      },
      {
        label: 'Pizza Styles',
        words: ['DEEP DISH', 'THIN CRUST', 'STUFFED', 'TAVERN'],
        difficulty: 2,
        color: '#A0C35A',
      },
      {
        label: 'Cubs Players',
        words: ['BANKS', 'SANDBERG', 'SANTO', 'SOSA'],
        difficulty: 3,
        color: '#B0C4EF',
      },
      {
        label: '___ Park',
        words: ['LINCOLN', 'HYDE', 'GRANT', 'MILLENNIUM'],
        difficulty: 4,
        color: '#BA81C5',
      },
    ],
  };

  // Valid 5x5 word square (no black cells):
  //   0   1   2   3   4
  // 0 H   E   A   R   T
  // 1 E   M   B   E   R
  // 2 A   B   U   S   E
  // 3 R   E   S   I   N
  // 4 T   R   E   N   D
  const crosswordData = {
    size: 5,
    grid: [
      ['H', 'E', 'A', 'R', 'T'],
      ['E', 'M', 'B', 'E', 'R'],
      ['A', 'B', 'U', 'S', 'E'],
      ['R', 'E', 'S', 'I', 'N'],
      ['T', 'R', 'E', 'N', 'D'],
    ],
    clues: {
      across: [
        { number: 1, clue: 'It beats in your chest', answer: 'HEART', row: 0, col: 0, direction: 'across' as const },
        { number: 6, clue: 'Glowing coal remnant', answer: 'EMBER', row: 1, col: 0, direction: 'across' as const },
        { number: 7, clue: 'Misuse or mistreat', answer: 'ABUSE', row: 2, col: 0, direction: 'across' as const },
        { number: 8, clue: 'Pine tree product', answer: 'RESIN', row: 3, col: 0, direction: 'across' as const },
        { number: 9, clue: 'Popular on social media', answer: 'TREND', row: 4, col: 0, direction: 'across' as const },
      ],
      down: [
        { number: 1, clue: 'Core or center of something', answer: 'HEART', row: 0, col: 0, direction: 'down' as const },
        { number: 2, clue: 'Hot, still-glowing piece of wood', answer: 'EMBER', row: 0, col: 1, direction: 'down' as const },
        { number: 3, clue: 'Take advantage of', answer: 'ABUSE', row: 0, col: 2, direction: 'down' as const },
        { number: 4, clue: 'Sticky tree sap substance', answer: 'RESIN', row: 0, col: 3, direction: 'down' as const },
        { number: 5, clue: 'Fashion movement or fad', answer: 'TREND', row: 0, col: 4, direction: 'down' as const },
      ],
    },
  };

  // Seed for today (dev) and next Monday
  for (const date of [todayStr, dateStr]) {
    await pool.query(
      `INSERT INTO puzzles (date, connections_data, crossword_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (date) DO UPDATE SET
         connections_data = EXCLUDED.connections_data,
         crossword_data = EXCLUDED.crossword_data`,
      [date, JSON.stringify(connectionsData), JSON.stringify(crosswordData)]
    );
    console.log(`Seeded puzzle for ${date}`);
  }

  await pool.end();
  console.log('Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
