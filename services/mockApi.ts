import { User, UserRole, Student, Coach, Book, Assignment, DailyLog, TrialExamResult, LGSSubject, TitledWeeklyProgram } from '../types';

// MOCK USERS
export const mockCoach: Coach = {
  id: 'coach1',
  email: 'ahmet.hoca@example.com',
  fullName: 'Ahmet Yılmaz',
  role: UserRole.COACH,
};

export const mockCoach2: Coach = {
  id: 'coach2',
  email: 'zeynep.hoca@example.com',
  fullName: 'Zeynep Öztürk',
  role: UserRole.COACH,
};


export const mockStudent: Student = {
  id: 'student1',
  email: 'ayse.lgs@example.com',
  fullName: 'Ayşe Kaya',
  role: UserRole.STUDENT,
  coachId: 'coach1',
  programs: JSON.stringify([
    {
      id: `program-${Date.now()}`,
      title: "1. Hafta - Başlangıç Programı",
      createdAt: new Date().toISOString(),
      program: {
        "Pazartesi": [
          { "id": "pzt-1", "description": "40 Paragraf sorusu", "isCompleted": true },
          { "id": "pzt-2", "description": "30 Matematik sorusu", "isCompleted": false }
        ],
        "Salı": [
          { "id": "sal-1", "description": "40 Paragraf sorusu", "isCompleted": false },
          { "id": "sal-2", "description": "30 Matematik sorusu", "isCompleted": false }
        ],
        "Çarşamba": [
          { "id": "car-1", "description": "40 Paragraf sorusu", "isCompleted": false },
          { "id": "car-2", "description": "30 Fen Bilimleri sorusu", "isCompleted": false }
        ],
        "Perşembe": [
          { "id": "per-1", "description": "40 Paragraf sorusu", "isCompleted": false },
          { "id": "per-2", "description": "30 Fen Bilimleri sorusu", "isCompleted": false }
        ],
        "Cuma": [
          { "id": "cum-1", "description": "40 Paragraf sorusu", "isCompleted": false },
          { "id": "cum-2", "description": "30 İnkılap Tarihi sorusu", "isCompleted": false }
        ],
        "Cumartesi": [
          { "id": "cmt-1", "description": "Genel Deneme Sınavı", "isCompleted": false }
        ],
        "Pazar": [
          { "id": "paz-1", "description": "Haftalık tekrar ve dinlenme", "isCompleted": false }
        ]
      }
    }
  ]),
};

export const mockStudent2: Student = {
    id: 'student2',
    email: 'mehmet.lgs@example.com',
    fullName: 'Mehmet Vural',
    role: UserRole.STUDENT,
    coachId: 'coach1',
    programs: '[]',
};

export const mockStudent3: Student = {
    id: 'student3',
    email: 'ali.lgs@example.com',
    fullName: 'Ali Demir',
    role: UserRole.STUDENT,
    coachId: 'coach2',
    programs: '[]',
};

export const mockStudent4: Student = {
    id: 'student4',
    email: 'fatma.lgs@example.com',
    fullName: 'Fatma Şahin',
    role: UserRole.STUDENT,
    coachId: 'coach1',
    programs: '[]',
};

export const allUsers: User[] = [mockCoach, mockCoach2, mockStudent, mockStudent2, mockStudent3, mockStudent4];


// MOCK DATA
let students: Student[] = [mockStudent, mockStudent2, mockStudent3, mockStudent4];
let books: Book[] = [
    { id: 1, title: 'Matematik Süper Soru Bankası', subject: LGSSubject.MATEMATIK },
    { id: 2, title: 'Türkçe Paragrafın Ritmi', subject: LGSSubject.TURKCE },
    { id: 3, title: 'Fen Bilimleri Dinamo', subject: LGSSubject.FEN },
];
let assignments: Assignment[] = [];
let dailyLogs: DailyLog[] = [
    { id: 1, studentId: 'student1', subject: LGSSubject.MATEMATIK, questionCount: 50, date: '2024-07-25' },
    { id: 2, studentId: 'student1', subject: LGSSubject.TURKCE, questionCount: 40, date: '2024-07-25' },
    { id: 3, studentId: 'student1', subject: LGSSubject.FEN, questionCount: 60, date: '2024-07-26' },
    { id: 4, studentId: 'student3', subject: LGSSubject.INGILIZCE, questionCount: 30, date: '2024-07-26' },
    { id: 5, studentId: 'student4', subject: LGSSubject.INKILAP, questionCount: 25, date: '2024-07-26' },
];
let trialExams: TrialExamResult[] = [
    {
        id: 1, studentId: 'student1', examName: 'Genel Deneme 1', date: '2024-07-20',
        totalCorrect: 75, totalIncorrect: 12, totalBlank: 3,
        details: [
            { subject: LGSSubject.TURKCE, correct: 18, incorrect: 2, blank: 0 },
            { subject: LGSSubject.MATEMATIK, correct: 15, incorrect: 4, blank: 1 },
            { subject: LGSSubject.FEN, correct: 19, incorrect: 1, blank: 0 },
            { subject: LGSSubject.INKILAP, correct: 8, incorrect: 2, blank: 0 },
            { subject: LGSSubject.DIN, correct: 9, incorrect: 1, blank: 0 },
            { subject: LGSSubject.INGILIZCE, correct: 6, incorrect: 2, blank: 2 },
        ]
    }
];

// MOCK API FUNCTIONS
const api = {
  getStudentsByCoach: async (coachId: string): Promise<Student[]> => {
    return new Promise(res => setTimeout(() => res(students.filter(s => s.coachId === coachId)), 500));
  },
  getStudentById: async (studentId: string): Promise<Student | undefined> => {
    return new Promise(res => setTimeout(() => res(students.find(s => s.id === studentId)), 500));
  },
  getCoachById: async (coachId: string): Promise<Coach | undefined> => {
    return new Promise(res => setTimeout(() => res(allUsers.find(u => u.id === coachId && u.role === UserRole.COACH) as Coach | undefined), 200));
  },
  getAssignmentsByStudent: async (studentId: string): Promise<Assignment[]> => {
    return new Promise(res => setTimeout(() => res(assignments.filter(a => a.studentId === studentId)), 500));
  },
  getDailyLogsByStudent: async (studentId: string): Promise<DailyLog[]> => {
    return new Promise(res => setTimeout(() => res(dailyLogs.filter(d => d.studentId === studentId)), 500));
  },
  getTrialExamsByStudent: async (studentId: string): Promise<TrialExamResult[]> => {
     return new Promise(res => setTimeout(() => res(trialExams.filter(t => t.studentId === studentId)), 500));
  },
  getBooksByStudent: async (studentId: string): Promise<Book[]> => {
    return new Promise(res => setTimeout(() => res(books), 500)); // simplified
  },
  addDailyLog: async (log: Omit<DailyLog, 'id'>): Promise<DailyLog> => {
    const newLog = { ...log, id: Date.now() };
    dailyLogs.push(newLog);
    return new Promise(res => setTimeout(() => res(newLog), 300));
  },
  addTrialExam: async (exam: Omit<TrialExamResult, 'id'>): Promise<TrialExamResult> => {
    const newExam = { ...exam, id: Date.now() };
    trialExams.push(newExam);
    return new Promise(res => setTimeout(() => res(newExam), 300));
  },
  addStudent: async (data: { fullName: string, email: string, coachId: string }): Promise<Student> => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      role: UserRole.STUDENT,
      coachId: data.coachId,
      programs: '[]',
    };
    students.push(newStudent);
    allUsers.push(newStudent);
    return new Promise(res => setTimeout(() => res(newStudent), 500));
  },
  updateStudentPrograms: async (studentId: string, programs: string): Promise<Student | undefined> => {
    return new Promise(res => {
        setTimeout(() => {
            const studentIndex = students.findIndex(s => s.id === studentId);
            if (studentIndex !== -1) {
                students[studentIndex].programs = programs;
                res(students[studentIndex]);
            } else {
                res(undefined);
            }
        }, 500);
    });
  },
  updateAssignmentStatus: async (assignmentId: number, isCompleted: boolean): Promise<Assignment | undefined> => {
    return new Promise(res => {
        setTimeout(() => {
            const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
            if (assignmentIndex !== -1) {
                assignments[assignmentIndex].isCompleted = isCompleted;
                res(assignments[assignmentIndex]);
            } else {
                res(undefined);
            }
        }, 300);
    });
  },
};

export default api;