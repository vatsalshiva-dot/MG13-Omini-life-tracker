import { parseMutationsLocally } from './src/lib/ai/CommandParser'

const text = "spent $15.50 on delicious lunch. Also marked workout as done with 15 reps. remind me to call mom."
const result = parseMutationsLocally(text, { items: { habits: ['workout'] }, journalPrompts: [] }, '2026-05-29')
console.dir(result, { depth: null })
