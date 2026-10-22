import { HALL_SIZE, type ScoreEntry } from './ports/save-port';

/** True when `points` earns a line: the table has room, or the score beats the last line. A zero never qualifies. */
export function qualifies(entries: readonly ScoreEntry[], points: number): boolean {
  if (points <= 0) return false;
  const last = entries[HALL_SIZE - 1];
  return last === undefined || points > last.points;
}

/** A new table with `entry` inserted by points descending (after equal scores), cut to `HALL_SIZE`. */
export function insertScore(entries: readonly ScoreEntry[], entry: ScoreEntry): ScoreEntry[] {
  const at = entries.findIndex((e) => e.points < entry.points);
  const index = at === -1 ? entries.length : at;
  return [...entries.slice(0, index), entry, ...entries.slice(index)].slice(0, HALL_SIZE);
}
