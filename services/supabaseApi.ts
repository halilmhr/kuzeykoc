import { 
    getStudentsByCoach as supabaseGetStudentsByCoach,
    getStudentById as supabaseGetStudentById,
    getCoachById as supabaseGetCoachById,
    getAssignmentsByStudent as supabaseGetAssignmentsByStudent,
    getDailyLogsByStudent as supabaseGetDailyLogsByStudent,
    getTrialExamsByStudent as supabaseGetTrialExamsByStudent,
    getBooks as supabaseGetBooks,
    addDailyLog as supabaseAddDailyLog,
    addTrialExam as supabaseAddTrialExam,
    addStudent as supabaseAddStudent,
    deleteStudent as supabaseDeleteStudent,
    updateStudentPrograms as supabaseUpdateStudentPrograms,
    updateAssignmentStatus as supabaseUpdateAssignmentStatus,
    authenticateUser as supabaseAuthenticateUser,
    createCoach as supabaseCreateCoach,
    getCoachLeaderboard as supabaseGetCoachLeaderboard,
    getHomeworkByStudent as supabaseGetHomeworkByStudent,
    getHomeworkByCoach as supabaseGetHomeworkByCoach,
    addHomework as supabaseAddHomework,
    updateHomework as supabaseUpdateHomework,
    deleteHomework as supabaseDeleteHomework
} from './supabaseClient';
import { User, UserRole, Student, Coach, Book, Assignment, DailyLog, TrialExamResult, Homework } from '../types';

// Real Supabase API functions
const supabaseApi = {
  // Authentication
  authenticateUser: async (email: string, password: string, role: UserRole): Promise<User | null> => {
    try {
      return await supabaseAuthenticateUser(email, password, role);
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  },

  // Students
  getStudentsByCoach: async (coachId: string): Promise<Student[]> => {
    try {
      return await supabaseGetStudentsByCoach(coachId);
    } catch (error) {
      console.error('Error fetching students by coach:', error);
      return [];
    }
  },

  getStudentById: async (studentId: string): Promise<Student | null> => {
    try {
      return await supabaseGetStudentById(studentId);
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      return null;
    }
  },

  addStudent: async (data: { fullName: string, email: string, coachId: string, password: string }): Promise<Student | null> => {
    try {
      return await supabaseAddStudent(data);
    } catch (error) {
      console.error('Error adding student:', error);
      return null;
    }
  },

  deleteStudent: async (studentId: string): Promise<boolean> => {
    try {
      return await supabaseDeleteStudent(studentId);
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  },

  updateStudentPrograms: async (studentId: string, programs: string): Promise<Student | null> => {
    try {
      return await supabaseUpdateStudentPrograms(studentId, programs);
    } catch (error) {
      console.error('Error updating student programs:', error);
      return null;
    }
  },

  // Coaches
  getCoachById: async (coachId: string): Promise<Coach | null> => {
    try {
      return await supabaseGetCoachById(coachId);
    } catch (error) {
      console.error('Error fetching coach by ID:', error);
      return null;
    }
  },

  // Assignments
  getAssignmentsByStudent: async (studentId: string): Promise<Assignment[]> => {
    try {
      return await supabaseGetAssignmentsByStudent(studentId);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  },

  updateAssignmentStatus: async (assignmentId: number, isCompleted: boolean): Promise<Assignment | null> => {
    try {
      return await supabaseUpdateAssignmentStatus(assignmentId, isCompleted);
    } catch (error) {
      console.error('Error updating assignment status:', error);
      return null;
    }
  },

  // Daily Logs
  getDailyLogsByStudent: async (studentId: string): Promise<DailyLog[]> => {
    try {
      return await supabaseGetDailyLogsByStudent(studentId);
    } catch (error) {
      console.error('Error fetching daily logs:', error);
      return [];
    }
  },

  addDailyLog: async (log: Omit<DailyLog, 'id'>): Promise<DailyLog | null> => {
    try {
      return await supabaseAddDailyLog(log);
    } catch (error) {
      console.error('Error adding daily log:', error);
      return null;
    }
  },

  // Trial Exams
  getTrialExamsByStudent: async (studentId: string): Promise<TrialExamResult[]> => {
    try {
      return await supabaseGetTrialExamsByStudent(studentId);
    } catch (error) {
      console.error('Error fetching trial exams:', error);
      return [];
    }
  },

  addTrialExam: async (exam: Omit<TrialExamResult, 'id'>): Promise<TrialExamResult | null> => {
    try {
      return await supabaseAddTrialExam(exam);
    } catch (error) {
      console.error('Error adding trial exam:', error);
      return null;
    }
  },

  // Books
  getBooksByStudent: async (studentId: string): Promise<Book[]> => {
    try {
      // For now, return all books - you can modify this to filter by student if needed
      return await supabaseGetBooks();
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  },

  // Coach management
  createCoach: async (data: { fullName: string, email: string, password: string }): Promise<Coach | null> => {
    try {
      return await supabaseCreateCoach(data);
    } catch (error) {
      console.error('Error creating coach:', error);
      return null;
    }
  },

  // Leaderboard
  getCoachLeaderboard: async (coachId: string) => {
    try {
      return await supabaseGetCoachLeaderboard(coachId);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  // Homework - Real Supabase Implementation
  getHomeworkByStudent: async (studentId: string) => {
    try {
      return await supabaseGetHomeworkByStudent(studentId);
    } catch (error) {
      console.error('Error fetching homework by student:', error);
      return [];
    }
  },

  getHomeworkByCoach: async (coachId: string) => {
    try {
      return await supabaseGetHomeworkByCoach(coachId);
    } catch (error) {
      console.error('Error fetching homework by coach:', error);
      return [];
    }
  },

  addHomework: async (homework: any) => {
    try {
      return await supabaseAddHomework(homework);
    } catch (error) {
      console.error('Error adding homework:', error);
      return null;
    }
  },

  updateHomework: async (id: string, updates: any) => {
    try {
      return await supabaseUpdateHomework(id, updates);
    } catch (error) {
      console.error('Error updating homework:', error);
      return null;
    }
  },

  deleteHomework: async (id: string) => {
    try {
      return await supabaseDeleteHomework(id);
    } catch (error) {
      console.error('Error deleting homework:', error);
      return false;
    }
  },
};

export default supabaseApi;