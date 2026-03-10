export interface ParsedDuration {
  ms: number | null;    // null means permanent — callers check isPermanent not ms
  isPermanent: boolean;
  label: string;        // human-readable, used in audit log messages
}

export function parseDuration(raw: string): ParsedDuration {
  const s = raw.trim().toLowerCase();

  // Permanent variants — check these before the regex so "permanent" doesn't
  // accidentally match any future regex group
  if (['permanent', 'perm', 'forever', 'indefinite'].includes(s)) {
    return { ms: null, isPermanent: true, label: 'permanent' };
  }

  // Match "N unit" — handles: "2 minutes", "2min", "1 day", "1d", "3 hrs", "2h"
  const match = s.match(/^(\d+)\s*(min(?:ute)?s?|hr?s?|hours?|days?|d|weeks?|w|h)$/);

  if (!match) {
    // Unknown format — treat as permanent so we never silently grant
    // zero-length access without anyone noticing
    return { ms: null, isPermanent: true, label: raw };
  }

  const value = parseInt(match[1], 10);
  const unit  = match[2];

  let ms: number;
  let label: string;

  if (unit.startsWith('min')) {
    ms    = value * 60 * 1000;
    label = `${value} minute${value !== 1 ? 's' : ''}`;
  } else if (unit.startsWith('h') || unit.startsWith('hr') || unit.startsWith('hour')) {
    ms    = value * 60 * 60 * 1000;
    label = `${value} hour${value !== 1 ? 's' : ''}`;
  } else if (unit.startsWith('d')) {
    ms    = value * 24 * 60 * 60 * 1000;
    label = `${value} day${value !== 1 ? 's' : ''}`;
  } else if (unit.startsWith('w')) {
    ms    = value * 7 * 24 * 60 * 60 * 1000;
    label = `${value} week${value !== 1 ? 's' : ''}`;
  } else {
    return { ms: null, isPermanent: true, label: raw };
  }

  return { ms, isPermanent: false, label };
}