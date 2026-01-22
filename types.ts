
export type Role = 'hermano' | 'junta';
export type EventType = 'cena' | 'junta' | 'especial';
export type TurnType = 'figura' | 'cocina';

export interface Brother {
  id: string;
  name: string;
  nickname: string;
  role: Role;
  points: number;
  attendanceStreak?: number;
}

export interface Guest {
  name: string;
  price: number;
}

export interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  guestPrice: number;
  attendees: string[];
  guests: Record<string, Guest[]>;
  closed: boolean;
  deadline: string;
}

export interface Reservation {
  id: string;
  date: string;
  reason: string;
  brotherId: string;
}

export interface Turn {
  id: string;
  date: string;
  concept: string;
  type: TurnType;
  brotherIds: string[];
}

export interface AppState {
  brothers: Brother[];
  events: EventData[];
  turns: Turn[];
  reservations: Reservation[];
  currentUser: Brother | null;
  isLoggedIn: boolean;
  isAdminAuth: boolean;
}
