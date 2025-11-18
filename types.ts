
export enum UserRole {
  COACH = 'coach',
  STUDENT = 'student',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string; // Optional for frontend, never send to client
}

export interface Student extends User {
  coachId: string;
  programs?: string; // JSON string of TitledWeeklyProgram[]
}

export interface Coach extends User {}

export interface Book {
  id: number;
  title: string;
  subject: string;
}

export interface Assignment {
  id: number;
  studentId: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface DailyLog {
  id: number;
  studentId: string;
  subject: LGSSubject;
  questionCount: number;
  date: string; // YYYY-MM-DD
}

export interface TrialExamResult {
  id: number;
  studentId: string;
  examName: string;
  date: string; // YYYY-MM-DD
  totalCorrect: number;
  totalIncorrect: number;
  totalBlank: number;
  details: TrialExamSubjectDetail[];
}

export interface TrialExamSubjectDetail {
  subject: LGSSubject;
  correct: number;
  incorrect: number;
  blank: number;
}

export enum LGSSubject {
  TURKCE = 'Türkçe',
  MATEMATIK = 'Matematik',
  FEN = 'Fen Bilimleri',
  INKILAP = 'T.C. İnkılap Tarihi',
  DIN = 'Din Kültürü',
  INGILIZCE = 'İngilizce',
}

export interface ProgramTask {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface WeeklyProgram {
  [key: string]: ProgramTask[]; // e.g., { "Pazartesi": [ { id: '...', description: '...', isCompleted: false } ] }
}

export interface TitledWeeklyProgram {
  id: string;
  title: string;
  program: WeeklyProgram;
  createdAt: string; // ISO String
}

export interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  total_score: number;
  monthly_questions: number;  // PostgreSQL'den INTEGER olarak geliyor
  monthly_exams: number;      // PostgreSQL'den INTEGER olarak geliyor
  last_activity: string;      // Date string
  rank: number;
  streak_days: number;
}

export interface Homework {
  id: string;
  studentId: string;
  coachId: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  createdAt: string;
}
