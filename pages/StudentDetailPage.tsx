
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { Student, DailyLog, TrialExamResult, WeeklyProgram, ProgramTask, TitledWeeklyProgram, Homework } from '../types';
import supabaseApi from '../services/supabaseApi';
import { useTheme } from '../contexts/ThemeContext';
import Calendar from '../components/common/Calendar';
import HomeworkModal from '../components/common/HomeworkModal';

const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const getInitialProgram = (): WeeklyProgram => {
    const program: WeeklyProgram = {};
    DAYS_OF_WEEK.forEach(day => {
      program[day] = [];
    });
    return program;
};

const StudentDetailPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [trialExams, setTrialExams] = useState<TrialExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyProgram, setWeeklyProgram] = useState<WeeklyProgram>(getInitialProgram());
  const [programTitle, setProgramTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('program');
  const [openDay, setOpenDay] = useState<string | null>('Pazartesi');
  const [openTrackingProgramId, setOpenTrackingProgramId] = useState<string | null>(null);
  const [openExamId, setOpenExamId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Homework states
  const [homework, setHomework] = useState<Homework[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateHomework, setSelectedDateHomework] = useState<Homework[]>([]);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  
  // Drag and Drop state
  const dragItem = useRef<{ fromDay: string, fromIndex: number } | null>(null);
  const dragOverItem = useRef<{ toDay: string, toIndex: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDeleteStudent = async () => {
    if (!student) return;
    
    const success = await supabaseApi.deleteStudent(student.id);
    if (success) {
      navigate('/coach');
    } else {
      alert('Öğrenci silinirken bir hata oluştu!');
    }
  };

  const calculateProgramCompletion = (program: WeeklyProgram): number => {
    let totalTasks = 0;
    let completedTasks = 0;

    Object.values(program).forEach(dayTasks => {
        if (Array.isArray(dayTasks)) {
            dayTasks.forEach(task => {
                totalTasks++;
                if (task.isCompleted) {
                    completedTasks++;
                }
            });
        }
    });

    if (totalTasks === 0) {
        return 0;
    }

    return Math.round((completedTasks / totalTasks) * 100);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const [studentData, dailyLogsData, trialExamsData, homeworkData] = await Promise.all([
            supabaseApi.getStudentById(studentId),
            supabaseApi.getDailyLogsByStudent(studentId),
            supabaseApi.getTrialExamsByStudent(studentId),
            supabaseApi.getHomeworkByStudent(studentId)
        ]);
        
        setStudent(studentData || null);
        setDailyLogs(dailyLogsData);
        setHomework(homeworkData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        const sortedExams = trialExamsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTrialExams(sortedExams);
        if (sortedExams.length > 0) {
            setOpenExamId(sortedExams[0].id);
        }

      } catch (error) {
        console.error("Failed to fetch student data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);
  
  const handleTaskDescriptionChange = (day: string, taskIndex: number, value: string) => {
    setWeeklyProgram(prev => {
        const newProgram = {...prev};
        const dayTasks = [...(newProgram[day] || [])];
        const updatedTask = { ...dayTasks[taskIndex], description: value };
        dayTasks[taskIndex] = updatedTask;
        newProgram[day] = dayTasks;
        return newProgram;
    });
  };

  const handleAddTask = (day: string) => {
    setWeeklyProgram(prev => {
        const newProgram = {...prev};
        const dayTasks = prev[day] ? [...prev[day]] : [];
        dayTasks.push({
            id: `${day.toLowerCase().slice(0,3)}-${Date.now()}`,
            description: '',
            isCompleted: false
        });
        newProgram[day] = dayTasks;
        return newProgram;
    });
  };

  const handleDeleteTask = (day: string, taskIndex: number) => {
    setWeeklyProgram(prev => {
        const newProgram = {...prev};
        const dayTasks = prev[day] ? [...prev[day]] : [];
        dayTasks.splice(taskIndex, 1);
        newProgram[day] = dayTasks;
        return newProgram;
    });
  };

  const handleSaveProgram = async () => {
    if (!studentId || !programTitle.trim()) {
        alert("Lütfen program için bir başlık girin.");
        return;
    }
    setIsSaving(true);
    setSaveSuccess(false);

    const newProgram: TitledWeeklyProgram = {
        id: `program-${Date.now()}`,
        title: programTitle,
        createdAt: new Date().toISOString(),
        program: weeklyProgram,
    };
    
    const existingPrograms: TitledWeeklyProgram[] = student?.programs ? JSON.parse(student.programs) : [];
    const updatedPrograms = [newProgram, ...existingPrograms];
    const programsToSave = JSON.stringify(updatedPrograms);

    await supabaseApi.updateStudentPrograms(studentId, programsToSave);
    
    setStudent(prev => prev ? {...prev, programs: programsToSave} : null);

    // Reset the form
    setWeeklyProgram(getInitialProgram());
    setProgramTitle('');
    setOpenDay('Pazartesi');

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  const handleDuplicateProgram = (programToDuplicate: TitledWeeklyProgram) => {
      const newProgramData: WeeklyProgram = {};
      Object.entries(programToDuplicate.program).forEach(([day, tasks]) => {
          newProgramData[day] = (tasks as ProgramTask[]).map((task: ProgramTask) => ({
              ...task,
              id: `${day.toLowerCase().slice(0,3)}-${Date.now()}-${Math.random()}`
          }));
      });
  
      setProgramTitle(`Kopya: ${programToDuplicate.title}`);
      setWeeklyProgram(newProgramData);
      setActiveTab('program');
      setOpenDay(DAYS_OF_WEEK[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fromDay: string, fromIndex: number) => {
      dragItem.current = { fromDay, fromIndex };
      setTimeout(() => setDragging(true), 0);
  };

  const handleDragEnter = (e: React.DragEvent, toDay: string, toIndex: number) => {
      if(dragItem.current?.fromDay === toDay && dragItem.current?.fromIndex === toIndex) return;
      dragOverItem.current = { toDay, toIndex };
  };

  const handleDrop = (e: React.DragEvent) => {
      if (!dragItem.current || !dragOverItem.current) return;
      
      const { fromDay, fromIndex } = dragItem.current;
      const { toDay, toIndex } = dragOverItem.current;
      
      const newProgram = JSON.parse(JSON.stringify(weeklyProgram));
      const draggedTask = newProgram[fromDay].splice(fromIndex, 1)[0];
      
      if (!newProgram[toDay]) {
          newProgram[toDay] = [];
      }

      if (fromDay === toDay) {
         newProgram[toDay].splice(toIndex, 0, draggedTask);
      } else {
         newProgram[toDay].splice(toIndex, 0, draggedTask);
      }

      setWeeklyProgram(newProgram);
      
      dragItem.current = null;
      dragOverItem.current = null;
      setDragging(false);
  };
  
  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setDragging(false);
  };

  // Homework functions
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const dayHomework = homework.filter(hw => hw.date === dateStr);
    setSelectedDateHomework(dayHomework);
  };

  const handleSaveHomework = async (newHomework: Omit<Homework, 'id' | 'createdAt'>) => {
    if (!auth?.user || !studentId) return;
    
    const homeworkData = {
      ...newHomework,
      studentId,
      coachId: auth.user.id
    };

    const savedHomework = await supabaseApi.addHomework(homeworkData);
    if (savedHomework) {
      setHomework(prev => [...prev, savedHomework].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      // Update selected date homework if it's the same date
      if (selectedDate && selectedDate.toISOString().split('T')[0] === savedHomework.date) {
        setSelectedDateHomework(prev => [...prev, savedHomework]);
      }
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    const success = await supabaseApi.deleteHomework(homeworkId);
    if (success) {
      setHomework(prev => prev.filter(hw => hw.id !== homeworkId));
      setSelectedDateHomework(prev => prev.filter(hw => hw.id !== homeworkId));
    }
  };

  const getHomeworkDates = () => {
    return homework.map(hw => hw.date);
  };


  if (!auth?.user) return null;

  if (loading) {
    return (
      <>
        <Header user={auth.user} />
        <div className="flex justify-center items-center h-screen">
          <Spinner />
        </div>
      </>
    );
  }

  if (!student) {
    return (
      <>
        <Header user={auth.user} />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Öğrenci Bulunamadı</h2>
          <Link to="/coach" className="text-violet-600 hover:underline">Geri Dön</Link>
        </div>
      </>
    );
  }

  // Process data for charts
  const dailyLogChartData = dailyLogs.reduce((acc, log) => {
    let entry = acc.find(item => item.date === log.date);
    if (!entry) {
        entry = { date: log.date };
        acc.push(entry);
    }
    entry[log.subject] = log.questionCount;
    return acc;
  }, [] as any[]);

  const trialExamChartData = trialExams
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(exam => ({
        name: `${new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}`,
        'Toplam Net': parseFloat((exam.totalCorrect - (exam.totalIncorrect / 3)).toFixed(2)),
    }));

  const TabButton = ({ tabId, children }: { tabId: string; children?: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`w-full text-center px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 transform focus:outline-none whitespace-nowrap ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg scale-105'
          : 'bg-[var(--bg-tab-inactive)] text-[var(--text-secondary)] hover:bg-white/90 dark:hover:bg-slate-600/60 hover:shadow-md'
      }`}
    >
      {children}
    </button>
  );

  const studentPrograms: TitledWeeklyProgram[] = student.programs ? JSON.parse(student.programs).sort((a: TitledWeeklyProgram, b: TitledWeeklyProgram) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  const hasProgramTasks = studentPrograms.length > 0;

  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <>
      <Header user={auth.user} />
      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Link to="/coach" className="mr-2 sm:mr-4 text-[var(--text-secondary)] hover:text-violet-600 p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </Link>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-xl sm:text-3xl mr-3 sm:mr-4 shadow-lg">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">{student.fullName}</h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] truncate max-w-[200px] sm:max-w-none">{student.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Öğrenciyi Sil</span>
            <span className="sm:hidden">Sil</span>
          </button>
        </div>

        <div className="flex space-x-1 sm:space-x-2 md:space-x-4 mb-6 sm:mb-8 p-1 sm:p-2 bg-[var(--bg-tab-container)] rounded-xl overflow-x-auto">
            <TabButton tabId="program">
              <span className="hidden sm:inline">📅 Ödev Takvimi</span>
              <span className="sm:hidden">Ödevler</span>
            </TabButton>
            <TabButton tabId="odevler">
              <span className="hidden sm:inline">📋 Program Oluştur</span>
              <span className="sm:hidden">Program</span>
            </TabButton>
            <TabButton tabId="soru-analizi">
              <span className="hidden sm:inline">Soru Analizi</span>
              <span className="sm:hidden">Soru</span>
            </TabButton>
            <TabButton tabId="deneme-analizi">
              <span className="hidden sm:inline">Deneme Analizi</span>
              <span className="sm:hidden">Deneme</span>
            </TabButton>
        </div>

        <div className="mt-8">
            {activeTab === 'program' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <Card title="📅 Ödev Takvimi">
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      homeworkDates={getHomeworkDates()}
                    />
                    
                    <button
                      onClick={() => setIsHomeworkModalOpen(true)}
                      className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-lg font-semibold hover:from-violet-700 hover:to-fuchsia-600 transition-all shadow-md"
                    >
                      + Yeni Ödev Ekle
                    </button>
                  </Card>

                  {/* Selected Date Homework */}
                  <Card title={selectedDate ? 
                    `${selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })} - Ödevler` : 
                    "Tarih Seçin"
                  }>
                    {selectedDate ? (
                      selectedDateHomework.length > 0 ? (
                        <div className="space-y-3">
                          {selectedDateHomework.map(hw => (
                            <div key={hw.id} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                              <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                  <h5 className="font-medium text-orange-800 dark:text-orange-200">{hw.title}</h5>
                                  {hw.description && (
                                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">{hw.description}</p>
                                  )}
                                  <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">
                                    {hw.isCompleted ? '✅ Tamamlandı' : '⏳ Bekliyor'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteHomework(hw.id)}
                                  className="ml-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Ödevi Sil"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-secondary)] italic text-center py-8">
                          Bu tarih için ödev bulunmuyor.
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)] italic text-center py-8">
                        Ödevleri görmek için takvimden bir tarih seçin.
                      </p>
                    )}
                  </Card>

                  {/* All Homework List */}
                  <div className="lg:col-span-2">
                    <Card title="Tüm Ödevler">
                      {homework.length > 0 ? (
                        <div className="space-y-3">
                          {homework.map(hw => (
                            <div key={hw.id} className={`p-4 rounded-lg border transition-all ${
                              hw.isCompleted 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                  <div className="flex items-center space-x-2">
                                    <h5 className={`font-medium ${hw.isCompleted ? 'line-through text-emerald-600 dark:text-emerald-400' : 'text-orange-800 dark:text-orange-200'}`}>
                                      {hw.title}
                                    </h5>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      hw.isCompleted 
                                        ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : 'bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                    }`}>
                                      {hw.isCompleted ? 'Tamamlandı' : 'Bekliyor'}
                                    </span>
                                  </div>
                                  {hw.description && (
                                    <p className={`text-sm mt-1 ${hw.isCompleted ? 'line-through text-emerald-500 dark:text-emerald-500' : 'text-orange-600 dark:text-orange-300'}`}>
                                      {hw.description}
                                    </p>
                                  )}
                                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                                    📅 {new Date(hw.date).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteHomework(hw.id)}
                                  className="ml-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Ödevi Sil"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📝</div>
                          <p className="text-[var(--text-secondary)]">{student?.fullName} için henüz ödev eklenmemiş.</p>
                          <p className="text-sm text-[var(--text-secondary)] mt-2">Yukarıdaki "Yeni Ödev Ekle" butonunu kullanarak ödev ekleyebilirsiniz.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
            )}

             {activeTab === 'odevler' && (
                <div className="space-y-6">
                  <Card title="Yeni Haftalık Program Oluştur">
                      <div className="mb-6">
                          <label htmlFor="programTitle" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Program Başlığı</label>
                          <input
                              type="text"
                              id="programTitle"
                              value={programTitle}
                              onChange={(e) => setProgramTitle(e.target.value)}
                              placeholder="Örn: 2. Hafta - Paragraf Kampı"
                              className="block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"
                          />
                      </div>
                      <div className="space-y-2">
                          {DAYS_OF_WEEK.map(day => {
                              const isOpen = openDay === day;
                              const tasksForDay = weeklyProgram[day] || [];
                              return (
                                  <div key={day} className="border border-[var(--border-color-light)] rounded-lg overflow-hidden transition-all duration-300 bg-[var(--bg-card)]">
                                      <button
                                          onClick={() => setOpenDay(isOpen ? null : day)}
                                          className="w-full flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 transition-colors"
                                      >
                                          <div className="flex items-center space-x-3">
                                              <span className="font-bold text-[var(--text-primary)] text-lg">{day}</span>
                                              {tasksForDay.length > 0 && (
                                                  <span className="bg-violet-200 text-violet-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tasksForDay.length} görev</span>
                                              )}
                                          </div>
                                          <svg className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                      </button>
                                      {isOpen && (
                                          <div 
                                              className="p-4 bg-[var(--bg-input)] space-y-3"
                                              onDrop={handleDrop}
                                              onDragOver={(e) => e.preventDefault()}
                                          >
                                              {tasksForDay.map((task, index) => (
                                                  <div 
                                                      key={task.id} 
                                                      className={`flex items-center space-x-2 transition-opacity ${dragging && dragItem.current?.fromIndex === index && dragItem.current?.fromDay === day ? 'opacity-30' : 'opacity-100'}`}
                                                      draggable
                                                      onDragStart={(e) => handleDragStart(e, day, index)}
                                                      onDragEnter={(e) => handleDragEnter(e, day, index)}
                                                      onDragEnd={handleDragEnd}
                                                      onDragOver={(e) => e.preventDefault()}
                                                  >
                                                      <span className="cursor-grab text-slate-400 hover:text-slate-600" title="Sıralamak için sürükle">
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                                      </span>
                                                      <input
                                                          type="text"
                                                          className="flex-grow p-2 border border-[var(--border-color-light)] rounded-lg bg-[var(--bg-input)] focus:ring-2 focus:ring-violet-500 focus:outline-none transition text-[var(--text-primary)]"
                                                          placeholder="Görev açıklaması..."
                                                          value={task.description}
                                                          onChange={(e) => handleTaskDescriptionChange(day, index, e.target.value)}
                                                      />
                                                      <button onClick={() => handleDeleteTask(day, index)} className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-full transition-colors flex-shrink-0">
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                          </svg>
                                                      </button>
                                                  </div>
                                              ))}
                                              {dragOverItem.current && dragOverItem.current.toDay === day && dragOverItem.current.toIndex === tasksForDay.length && (
                                                  <div className="h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg border-2 border-dashed border-violet-300 dark:border-violet-700"></div>
                                              )}
                                              <button onClick={() => handleAddTask(day)} className="mt-2 text-sm text-violet-600 hover:text-violet-800 dark:hover:text-violet-400 font-semibold transition-colors py-1 px-2 rounded hover:bg-violet-100/70 dark:hover:bg-violet-900/30">
                                                  + Görev Ekle
                                              </button>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                      <button 
                          onClick={handleSaveProgram}
                          disabled={isSaving}
                          className={`mt-6 w-full text-white py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                              saveSuccess ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-violet-600 to-fuchsia-500'
                          } disabled:bg-slate-400`}
                      >
                          {isSaving ? 'Kaydediliyor...' : (saveSuccess ? 'Program Eklendi!' : 'Yeni Programı Ekle')}
                      </button>
                  </Card>

                  <Card title="Haftalık Program Takibi">
                      {hasProgramTasks ? (
                         <div className="space-y-4">
                          {studentPrograms.map(p => {
                              const isOpen = openTrackingProgramId === p.id;
                              const completionPercentage = calculateProgramCompletion(p.program);
                              return (
                                 <div key={p.id} className="border border-[var(--border-color-light)] rounded-lg overflow-hidden transition-all duration-300 bg-[var(--bg-card)] shadow-sm">
                                      <button
                                          onClick={() => setOpenTrackingProgramId(isOpen ? null : p.id)}
                                          className="w-full flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 transition-colors"
                                      >
                                          <div className='text-left w-full mr-4'>
                                              <div className="flex justify-between items-center gap-2">
                                                  <h4 className="font-bold text-[var(--text-primary)] text-lg flex-grow">{p.title}</h4>
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDuplicateProgram(p); }} 
                                                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors flex-shrink-0"
                                                    title="Bu Programı Kopyala"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
                                                    </svg>
                                                  </button>
                                                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                                                      completionPercentage === 100 
                                                      ? 'bg-emerald-200 text-emerald-800' 
                                                      : 'bg-violet-200 text-violet-800'
                                                  }`}>
                                                      %{completionPercentage}
                                                  </span>
                                              </div>
                                              <p className="text-xs text-[var(--text-secondary)] mt-1">Oluşturulma: {new Date(p.createdAt).toLocaleDateString()}</p>
                                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                                                  <div 
                                                      className={`h-2 rounded-full transition-all duration-500 ${
                                                          completionPercentage === 100 
                                                          ? 'bg-emerald-500' 
                                                          : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                                      }`} 
                                                      style={{ width: `${completionPercentage}%` }}
                                                  ></div>
                                              </div>
                                          </div>
                                          <svg className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                      </button>
                                      {isOpen && (
                                          <div className="p-4 bg-[var(--bg-input)] space-y-4">
                                              {DAYS_OF_WEEK.map(day => {
                                                  const tasks = p.program[day] || [];
                                                  if (tasks.length === 0) return null;
                                                  return (
                                                      <div key={day}>
                                                          <h4 className="font-bold text-md text-[var(--text-secondary)]">{day}</h4>
                                                          <ul className="mt-2 space-y-2">
                                                              {tasks.map((task: ProgramTask) => (
                                                                  <li key={task.id} className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                                                                      task.isCompleted ? 'bg-emerald-100/70 dark:bg-emerald-900/40 text-slate-500 dark:text-slate-400 line-through' : 'bg-slate-100/70 dark:bg-slate-700/50 text-[var(--text-primary)]'
                                                                    }`}>
                                                                      <svg className={`w-5 h-5 mr-3 flex-shrink-0 ${task.isCompleted ? 'text-emerald-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                      </svg>
                                                                      <span>{task.description}</span>
                                                                  </li>
                                                              ))}
                                                          </ul>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )}
                                  </div>
                              )
                          })}
                         </div>
                      ) : (
                          <p className="text-[var(--text-secondary)] text-center py-4">Öğrenciye atanmış program bulunmuyor.</p>
                      )}
                  </Card>
                </div>
            )}

            {activeTab === 'soru-analizi' && (
                <Card title="Günlük Soru Sayısı Raporu">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyLogChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e0e0e0'} />
                            <XAxis dataKey="date" tick={{fill: chartTextColor}} />
                            <YAxis tick={{fill: chartTextColor}} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', color: chartTextColor, backdropFilter: 'blur(5px)', borderRadius: '0.75rem', border: `1px solid ${theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.1)'}` }} />
                            <Legend wrapperStyle={{ color: chartTextColor }}/>
                            <Bar dataKey="Türkçe" stackId="a" fill="#8b5cf6" />
                            <Bar dataKey="Matematik" stackId="a" fill="#c026d3" />
                            <Bar dataKey="Fen Bilimleri" stackId="a" fill="#38bdf8" />
                            <Bar dataKey="T.C. İnkılap Tarihi" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="Din Kültürü" stackId="a" fill="#10b981" />
                            <Bar dataKey="İngilizce" stackId="a" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {activeTab === 'deneme-analizi' && (
                <Card title="Deneme Sınavı Analizi">
                    {trialExams.length > 0 ? (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-[var(--text-secondary)] text-center">Net Gelişim Grafiği</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={trialExamChartData}
                                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e0e0e0'} />
                                        <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
                                        <YAxis tick={{ fill: chartTextColor }} domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)', color: chartTextColor, backdropFilter: 'blur(5px)', borderRadius: '0.75rem', border: `1px solid ${theme === 'dark' ? '#334155' : 'rgba(0,0,0,0.1)'}` }} />
                                        <Legend wrapperStyle={{ color: chartTextColor }}/>
                                        <Line type="monotone" dataKey="Toplam Net" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-4">
                                {trialExams.map(exam => {
                                    const isOpen = openExamId === exam.id;
                                    return (
                                        <div key={exam.id} className="border border-[var(--border-color-light)] rounded-lg overflow-hidden transition-all duration-300 bg-[var(--bg-card)] shadow-sm">
                                            <button
                                                onClick={() => setOpenExamId(isOpen ? null : exam.id)}
                                                className="w-full flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 transition-colors"
                                            >
                                                <div className="text-left">
                                                    <h4 className="font-bold text-[var(--text-primary)]">{exam.examName}</h4>
                                                    <p className="text-sm text-[var(--text-secondary)]">{new Date(exam.date).toLocaleDateString('tr-TR')}</p>
                                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                                        Toplam: <span className="font-semibold text-emerald-600">{exam.totalCorrect}D</span> - <span className="font-semibold text-rose-600 ml-2">{exam.totalIncorrect}Y</span> - <span className="font-semibold text-slate-500 dark:text-slate-400 ml-2">{exam.totalBlank}B</span>
                                                    </p>
                                                </div>
                                                <svg className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {isOpen && (
                                                <div className="p-4 bg-[var(--bg-input)] overflow-x-auto">
                                                    <table className="w-full min-w-[400px] text-sm text-left text-[var(--text-secondary)]">
                                                        <thead className="text-xs text-[var(--text-primary)] uppercase bg-slate-100/70 dark:bg-slate-700/50">
                                                            <tr>
                                                                <th scope="col" className="px-4 py-3 rounded-l-lg">Ders</th>
                                                                <th scope="col" className="px-4 py-3 text-center">Doğru</th>
                                                                <th scope="col" className="px-4 py-3 text-center">Yanlış</th>
                                                                <th scope="col" className="px-4 py-3 text-center">Boş</th>
                                                                <th scope="col" className="px-4 py-3 text-center font-bold rounded-r-lg">Net</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {exam.details.map(d => {
                                                                const net = d.correct - d.incorrect / 3;
                                                                return (
                                                                    <tr key={d.subject} className="border-b border-[var(--border-color-light)] last:border-b-0">
                                                                        <th scope="row" className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">{d.subject}</th>
                                                                        <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{d.correct}</td>
                                                                        <td className="px-4 py-3 text-center text-rose-600 font-semibold">{d.incorrect}</td>
                                                                        <td className="px-4 py-3 text-center">{d.blank}</td>
                                                                        <td className="px-4 py-3 text-center font-bold text-violet-700">{net.toFixed(2)}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : <p className="text-[var(--text-secondary)] text-center py-4">Henüz deneme sonucu girilmemiş.</p>}
                </Card>
            )}
        </div>
      </main>
      
      {/* Silme Onay Modalı */}
      {showDeleteModal && student && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Öğrenciyi Sil
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                <span className="font-semibold">{student.fullName}</span> isimli öğrenciyi silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz ve tüm veriler (programlar, günlük kayıtlar, denemeler) silinecektir.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homework Modal */}
      <HomeworkModal
        isOpen={isHomeworkModalOpen}
        onClose={() => setIsHomeworkModalOpen(false)}
        selectedDate={selectedDate}
        onSave={handleSaveHomework}
      />
    </>
  );
};

export default StudentDetailPage;
