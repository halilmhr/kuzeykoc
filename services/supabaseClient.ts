import { createClient } from '@supabase/supabase-js';
import { User, Student, Coach, Assignment, DailyLog, TrialExamResult, Book, UserRole } from '../types';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';
import { NotificationService } from './notificationService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Please check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Tables API Functions

// Users
export async function getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role
    } as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    
    if (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role
    } as User;
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating user:', error);
        return null;
    }
    return data as User;
}

// Students
export async function getStudentsByCoach(coachId: string): Promise<Student[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', UserRole.STUDENT)
        .eq('coach_id', coachId);
    
    if (error) {
        console.error('Error fetching students:', error);
        return [];
    }
    
    // Map database fields to TypeScript interface
    return data.map(student => ({
        id: student.id,
        email: student.email,
        fullName: student.full_name,
        role: student.role,
        coachId: student.coach_id,
        programs: student.programs || '[]'
    })) as Student[];
}

export async function getStudentById(studentId: string): Promise<Student | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .eq('role', UserRole.STUDENT)
        .single();
    
    if (error) {
        console.error('Error fetching student:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        coachId: data.coach_id,
        programs: data.programs || '[]'
    } as Student;
}

export async function updateStudentPrograms(studentId: string, programs: string): Promise<Student | null> {
    const { data, error } = await supabase
        .from('users')
        .update({ programs })
        .eq('id', studentId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating student programs:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        coachId: data.coach_id,
        programs: data.programs || '[]'
    } as Student;
}

export async function addStudent(studentData: { fullName: string, email: string, coachId: string, password: string }): Promise<Student | null> {
    const newStudent = {
        email: studentData.email,
        full_name: studentData.fullName,
        role: UserRole.STUDENT,
        coach_id: studentData.coachId,
        programs: '[]',
        password_hash: hashPassword(studentData.password)
    };
    
    const { data, error } = await supabase
        .from('users')
        .insert([newStudent])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding student:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        coachId: data.coach_id,
        programs: data.programs || '[]'
    } as Student;
}

export async function deleteStudent(studentId: string): Promise<boolean> {
    // First delete related data
    const { error: dailyLogsError } = await supabase
        .from('daily_logs')
        .delete()
        .eq('student_id', studentId);
    
    if (dailyLogsError) {
        console.error('Error deleting daily logs:', dailyLogsError);
    }

    const { error: assignmentsError } = await supabase
        .from('assignments')
        .delete()
        .eq('student_id', studentId);
    
    if (assignmentsError) {
        console.error('Error deleting assignments:', assignmentsError);
    }

    const { error: trialsError } = await supabase
        .from('trial_exams')
        .delete()
        .eq('student_id', studentId);
    
    if (trialsError) {
        console.error('Error deleting trial exams:', trialsError);
    }

    // Finally delete the student
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', studentId)
        .eq('role', UserRole.STUDENT);
    
    if (error) {
        console.error('Error deleting student:', error);
        return false;
    }
    
    return true;
}

// Coaches
export async function getCoachById(coachId: string): Promise<Coach | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', coachId)
        .eq('role', UserRole.COACH)
        .single();
    
    if (error) {
        console.error('Error fetching coach:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role
    } as Coach;
}

// Assignments
export async function getAssignmentsByStudent(studentId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });
    
    if (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }
    
    // Map database fields to TypeScript interface
    return data.map(assignment => ({
        id: assignment.id,
        studentId: assignment.student_id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        isCompleted: assignment.is_completed
    })) as Assignment[];
}

export async function updateAssignmentStatus(assignmentId: number, isCompleted: boolean): Promise<Assignment | null> {
    const { data, error } = await supabase
        .from('assignments')
        .update({ is_completed: isCompleted })
        .eq('id', assignmentId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating assignment:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        studentId: data.student_id,
        title: data.title,
        description: data.description,
        dueDate: data.due_date,
        isCompleted: data.is_completed
    } as Assignment;
}

// Daily Logs
export async function getDailyLogsByStudent(studentId: string): Promise<DailyLog[]> {
    const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
    
    if (error) {
        console.error('Error fetching daily logs:', error);
        return [];
    }
    
    // Map database fields to TypeScript interface and merge same day same subject entries
    const rawLogs = data.map(log => ({
        id: log.id,
        studentId: log.student_id,
        subject: log.subject,
        questionCount: log.question_count,
        date: log.date
    })) as DailyLog[];

    // Group by date and subject, then sum question counts
    const mergedLogs = rawLogs.reduce((acc: DailyLog[], current) => {
        const existingIndex = acc.findIndex(
            log => log.date === current.date && log.subject === current.subject
        );
        
        if (existingIndex !== -1) {
            // Merge with existing entry
            acc[existingIndex].questionCount += current.questionCount;
        } else {
            // Add new entry
            acc.push({
                ...current,
                id: current.id // Keep the first ID for reference
            });
        }
        
        return acc;
    }, []);

    return mergedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addDailyLog(logData: Omit<DailyLog, 'id'>): Promise<DailyLog | null> {
    // First check if there's already a log for the same day and subject
    const { data: existingLog, error: searchError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', logData.studentId)
        .eq('subject', logData.subject)
        .eq('date', logData.date)
        .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error searching for existing daily log:', searchError);
        return null;
    }

    let result: DailyLog;
    let isNewEntry = false;

    if (existingLog) {
        // Update existing log by adding question counts
        const newQuestionCount = existingLog.question_count + logData.questionCount;
        
        const { data: updatedData, error: updateError } = await supabase
            .from('daily_logs')
            .update({ question_count: newQuestionCount })
            .eq('id', existingLog.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating daily log:', updateError);
            return null;
        }

        result = {
            id: updatedData.id,
            studentId: updatedData.student_id,
            subject: updatedData.subject,
            questionCount: updatedData.question_count,
            date: updatedData.date
        } as DailyLog;
    } else {
        // Insert new log
        const { data, error } = await supabase
            .from('daily_logs')
            .insert([{
                student_id: logData.studentId,
                subject: logData.subject,
                question_count: logData.questionCount,
                date: logData.date
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error adding daily log:', error);
            return null;
        }

        result = {
            id: data.id,
            studentId: data.student_id,
            subject: data.subject,
            questionCount: data.question_count,
            date: data.date
        } as DailyLog;
        isNewEntry = true;
    }

    // Send notification to coach
    try {
        const student = await getStudentById(logData.studentId);
        const coachId = await getStudentCoach(logData.studentId);
        
        if (student && coachId) {
            // Supabase notification to coach
            await createNotification(
                coachId,
                'daily_log',
                `📚 ${student.fullName} Çalışma Ekledi`,
                `${logData.subject} dersinden ${logData.questionCount} soru çözdü`,
                {
                    studentId: logData.studentId,
                    studentName: student.fullName,
                    subject: logData.subject,
                    questionCount: logData.questionCount,
                    date: logData.date
                }
            );
            console.log('✅ Notification sent to coach:', coachId);
        }
    } catch (notificationError) {
        console.error('Error sending notification to coach:', notificationError);
        // Don't fail the main operation if notification fails
    }

    return result;
}

// Trial Exams
export async function getTrialExamsByStudent(studentId: string): Promise<TrialExamResult[]> {
    const { data, error } = await supabase
        .from('trial_exams')
        .select(`
            *,
            trial_exam_details (*)
        `)
        .eq('student_id', studentId)
        .order('date', { ascending: false });
    
    if (error) {
        console.error('Error fetching trial exams:', error);
        return [];
    }
    
    // Map database fields to TypeScript interface
    return data.map(exam => ({
        id: exam.id,
        studentId: exam.student_id,
        examName: exam.exam_name,
        date: exam.date,
        totalCorrect: exam.total_correct,
        totalIncorrect: exam.total_incorrect,
        totalBlank: exam.total_blank,
        details: exam.trial_exam_details ? exam.trial_exam_details.map((detail: any) => ({
            subject: detail.subject,
            correct: detail.correct,
            incorrect: detail.incorrect,
            blank: detail.blank
        })) : []
    })) as TrialExamResult[];
}

export async function addTrialExam(examData: Omit<TrialExamResult, 'id'>): Promise<TrialExamResult | null> {
    // First insert the main exam record
    const { data: examRecord, error: examError } = await supabase
        .from('trial_exams')
        .insert([{
            student_id: examData.studentId,
            exam_name: examData.examName,
            date: examData.date,
            total_correct: examData.totalCorrect,
            total_incorrect: examData.totalIncorrect,
            total_blank: examData.totalBlank
        }])
        .select()
        .single();
    
    if (examError) {
        console.error('Error adding trial exam:', examError);
        return null;
    }
    
    // Then insert the details
    if (examData.details && examData.details.length > 0) {
        const detailsData = examData.details.map(detail => ({
            trial_exam_id: examRecord.id,
            subject: detail.subject,
            correct: detail.correct,
            incorrect: detail.incorrect,
            blank: detail.blank
        }));
        
        const { error: detailsError } = await supabase
            .from('trial_exam_details')
            .insert(detailsData);
        
        if (detailsError) {
            console.error('Error adding trial exam details:', detailsError);
        }
    }
    
    const result = {
        id: examRecord.id,
        studentId: examRecord.student_id,
        examName: examRecord.exam_name,
        date: examRecord.date,
        totalCorrect: examRecord.total_correct,
        totalIncorrect: examRecord.total_incorrect,
        totalBlank: examRecord.total_blank,
        details: examData.details || []
    } as TrialExamResult;

    // Send notification to coach
    try {
        const student = await getStudentById(examData.studentId);
        const coachId = await getStudentCoach(examData.studentId);
        
        if (student && coachId) {
            // Supabase notification to coach
            await createNotification(
                coachId,
                'trial_exam',
                `📝 ${student.fullName} Deneme Sınavı Ekledi`,
                `${examData.examName}: ${examData.totalCorrect} doğru, ${examData.totalIncorrect} yanlış`,
                {
                    studentId: examData.studentId,
                    studentName: student.fullName,
                    examName: examData.examName,
                    totalCorrect: examData.totalCorrect,
                    totalIncorrect: examData.totalIncorrect,
                    totalBlank: examData.totalBlank,
                    date: examData.date
                }
            );
            console.log('✅ Trial exam notification sent to coach:', coachId);
        }
    } catch (notificationError) {
        console.error('Error sending trial exam notification:', notificationError);
    }

    return result;
}

// Books
export async function getBooks(): Promise<Book[]> {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('subject', { ascending: true });
    
    if (error) {
        console.error('Error fetching books:', error);
        return [];
    }
    return data as Book[];
}

// Authentication helpers
export async function authenticateUser(email: string, password: string, role: UserRole): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .single();
    
    if (error || !data) {
        console.error('Error fetching user for authentication:', error);
        return null;
    }
    
    // Verify password
    if (!verifyPassword(password, data.password_hash)) {
        return null;
    }
    
    // Return user without password
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role
    } as User;
}

// Coach management
export async function createCoach(coachData: { fullName: string, email: string, password: string }): Promise<Coach | null> {
    const newCoach = {
        email: coachData.email,
        full_name: coachData.fullName,
        role: UserRole.COACH,
        password_hash: hashPassword(coachData.password)
    };
    
    const { data, error } = await supabase
        .from('users')
        .insert([newCoach])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating coach:', error);
        return null;
    }
    
    // Map database fields to TypeScript interface
    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role
    } as Coach;
}

// Leaderboard functions
export const getCoachLeaderboard = async (coachId: string) => {
    console.log('🔍 Fetching leaderboard for coach ID:', coachId);
    
    const { data, error } = await supabase
        .rpc('get_coach_leaderboard', { coach_id: coachId });
    
    if (error) {
        console.error('❌ Error fetching leaderboard:', error);
        throw new Error('Failed to fetch leaderboard');
    }
    
    console.log('✅ Leaderboard data received:', data);
    console.log('📊 Number of students in leaderboard:', data?.length || 0);
    
    return data || [];
}

// Homework Functions
export const getHomeworkByStudent = async (studentId: string) => {
    const { data, error } = await supabase
        .from('homework')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching homework by student:', error);
        throw error;
    }

    // Map database fields to frontend interface
    return data?.map(hw => ({
        id: hw.id,
        title: hw.title,
        description: hw.description,
        date: hw.date,
        studentId: hw.student_id,
        coachId: hw.coach_id,
        isCompleted: hw.is_completed,
        createdAt: hw.created_at
    })) || [];
};

export const getHomeworkByCoach = async (coachId: string) => {
    const { data, error } = await supabase
        .from('homework')
        .select('*')
        .eq('coach_id', coachId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching homework by coach:', error);
        throw error;
    }

    // Map database fields to frontend interface
    return data?.map(hw => ({
        id: hw.id,
        title: hw.title,
        description: hw.description,
        date: hw.date,
        studentId: hw.student_id,
        coachId: hw.coach_id,
        isCompleted: hw.is_completed,
        createdAt: hw.created_at
    })) || [];
};

export const addHomework = async (homeworkData: {
    title: string;
    description?: string;
    date: string;
    studentId: string;
    coachId: string;
}) => {
    console.log('🔧 Adding homework with data:', homeworkData);
    
    const insertData = {
        title: homeworkData.title,
        description: homeworkData.description,
        date: homeworkData.date,
        student_id: homeworkData.studentId,
        coach_id: homeworkData.coachId,
        is_completed: false
    };
    
    console.log('📝 Insert data:', insertData);
    
    const { data, error } = await supabase
        .from('homework')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error('Error adding homework:', error);
        throw error;
    }

    // Map database fields to frontend interface
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        studentId: data.student_id,
        coachId: data.coach_id,
        isCompleted: data.is_completed,
        createdAt: data.created_at
    };
};

export const updateHomework = async (id: string, updates: {
    title?: string;
    description?: string;
    date?: string;
    isCompleted?: boolean;
}) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;

    const { data, error } = await supabase
        .from('homework')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating homework:', error);
        throw error;
    }

    const result = {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        studentId: data.student_id,
        coachId: data.coach_id,
        isCompleted: data.is_completed,
        createdAt: data.created_at
    };

    // Send notification to coach if homework was completed
    if (updates.isCompleted === true) {
        try {
            const student = await getStudentById(data.student_id);
            const coachId = await getStudentCoach(data.student_id);
            
            if (student && coachId) {
                // 1. Single homework completion notification
                await createNotification(
                    coachId,
                    'homework_completed',
                    `✅ ${student.fullName} Ödev Tamamladı`,
                    `"${data.title}" ödevini tamamladı`,
                    {
                        studentId: data.student_id,
                        studentName: student.fullName,
                        homeworkId: data.id,
                        homeworkTitle: data.title,
                        completedAt: new Date().toISOString()
                    }
                );
                console.log('✅ Homework completion notification sent to coach:', coachId);

                // 2. Check if all daily homework completed
                await checkDailyHomeworkCompletion(data.student_id, data.date, coachId, student.fullName);
            }
        } catch (notificationError) {
            console.error('Error sending homework completion notification to coach:', notificationError);
        }
    }

    return result;
};

export const deleteHomework = async (id: string) => {
    const { error } = await supabase
        .from('homework')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting homework:', error);
        throw error;
    }

    return true;
};

// Notifications
export async function createNotification(recipientId: string, type: string, title: string, message: string, data?: any): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                recipient_id: recipientId,
                coach_id: recipientId, // Coach'a gönderildiği için aynı ID
                type: type,
                title: title,
                message: message,
                data: data,
                is_read: false
            });

        if (error) {
            console.error('Error creating notification:', error);
            return false;
        }

        console.log('✅ Notification created for recipient:', recipientId);
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}

export async function getUnreadNotifications(userId: string) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('coach_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

// Debug: Test bildirimi oluştur
export async function createTestNotification(coachId: string): Promise<boolean> {
    console.log('🧪 Creating test notification for coach:', coachId);
    
    return await createNotification(
        coachId,
        'test_notification',
        '🧪 TEST BİLDİRİM - Real-time Sistem Testi',
        `Bu bir test bildirimidir. Zaman: ${new Date().toLocaleTimeString('tr-TR')}`,
        { 
            test: true, 
            timestamp: new Date().toISOString(),
            coachId: coachId
        }
    );
}

// Debug: Bildirim istatistikleri
export async function getNotificationStats(coachId: string) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('coach_id', coachId);

        if (error) {
            console.error('Error fetching notification stats:', error);
            return null;
        }

        const stats = {
            total: data?.length || 0,
            unread: data?.filter(n => !n.is_read).length || 0,
            today: data?.filter(n => {
                const today = new Date().toDateString();
                const notifDate = new Date(n.created_at).toDateString();
                return today === notifDate;
            }).length || 0
        };

        console.log('📊 Notification stats for coach', coachId, ':', stats);
        return stats;
    } catch (error) {
        console.error('Error in getNotificationStats:', error);
        return null;
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

export async function getStudentCoach(studentId: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('coach_id')
            .eq('id', studentId)
            .eq('role', 'student')
            .single();

        if (error) {
            console.error('Error getting student coach:', error);
            return null;
        }

        return data?.coach_id || null;
    } catch (error) {
        console.error('Error getting student coach:', error);
        return null;
    }
}

// Check if all homework for the day is completed
async function checkDailyHomeworkCompletion(studentId: string, date: string, coachId: string, studentName: string): Promise<void> {
    try {
        const { data: todaysHomework, error } = await supabase
            .from('homework')
            .select('*')
            .eq('student_id', studentId)
            .eq('date', date);

        if (error) {
            console.error('Error checking daily homework:', error);
            return;
        }

        if (!todaysHomework || todaysHomework.length === 0) return;

        // Check if all homework for the day is completed
        const allCompleted = todaysHomework.every(hw => hw.is_completed === true);
        const totalHomework = todaysHomework.length;

        if (allCompleted && totalHomework > 0) {
            // Get homework titles for better message
            const homeworkTitles = todaysHomework.map(hw => hw.title).join(', ');
            
            // Send daily completion notification
            await createNotification(
                coachId,
                'daily_homework_completed',
                `🎉 ${studentName} Günlük Ödevleri Tamamladı!`,
                `${date} tarihli ${totalHomework} ödevini tamamen bitirdi: ${homeworkTitles}`,
                {
                    studentId: studentId,
                    studentName: studentName,
                    date: date,
                    totalHomework: totalHomework,
                    homeworkTitles: homeworkTitles,
                    completedAt: new Date().toISOString()
                }
            );
            console.log('🎉 Daily homework completion notification sent to coach:', coachId);
        }
    } catch (error) {
        console.error('Error checking daily homework completion:', error);
    }
}


