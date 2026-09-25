import type { SessionName, SessionConfig } from '@/types';

export const SESSIONS: SessionConfig[] = [
  { name: 'Asian', startUTC: 0, endUTC: 7, color: '#22D3EE', glow: 'rgba(34,211,238,0.4)' },
  { name: 'London', startUTC: 7, endUTC: 12, color: '#34D399', glow: 'rgba(52,211,153,0.4)' },
  { name: 'Overlap', startUTC: 12, endUTC: 17, color: '#D4AF37', glow: 'rgba(212,175,55,0.4)' },
  { name: 'New York', startUTC: 17, endUTC: 24, color: '#FB7185', glow: 'rgba(251,113,133,0.4)' },
];

// Gap hours 21-24 (0) are assigned to New York (thin late NY)
export function getSessionForHour(hour: number): SessionName {
  for (const s of SESSIONS) {
    if (s.endUTC > s.startUTC) {
      if (hour >= s.startUTC && hour < s.endUTC) return s.name;
    } else {
      if (hour >= s.startUTC || hour < s.endUTC) return s.name;
    }
  }
  return 'New York';
}

export function getSessionColor(name: SessionName): string {
  return SESSIONS.find((s) => s.name === name)?.color ?? '#888';
}

export function getSessionGlow(name: SessionName): string {
  return SESSIONS.find((s) => s.name === name)?.glow ?? 'rgba(200,200,200,0.3)';
}

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const SESSION_ORDER: SessionName[] = ['Asian', 'London', 'Overlap', 'New York'];
