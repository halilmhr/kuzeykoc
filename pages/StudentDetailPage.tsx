
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { Student, DailyLog, TrialExamResult, Homework } from '../types';
import supabaseApi from '../services/supabaseApi';
import { useTheme } from '../contexts/ThemeContext';
import Calendar from '../components/common/Calendar';
import HomeworkModal from '../components/common/HomeworkModal';



const StudentDetailPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [trialExams, setTrialExams] = useState<TrialExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('program');
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

  // Daily log analysis functions
  const getDailyLogDates = () => {
    // Ensure consistent date format
    return dailyLogs.map(log => {
      // If log.date is already in YYYY-MM-DD format, use it directly
      if (typeof log.date === 'string' && log.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return log.date;
      }
      // Otherwise convert to consistent format
      return new Date(log.date).toISOString().split('T')[0];
    });
  };

  const getSelectedDateLogs = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    return dailyLogs.filter(log => {
      // Normalize log date to YYYY-MM-DD format
      let logDateStr;
      if (typeof log.date === 'string' && log.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        logDateStr = log.date;
      } else {
        logDateStr = new Date(log.date).toISOString().split('T')[0];
      }
      return logDateStr === dateStr;
    });
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Türkçe': 'bg-sky-500',
      'Matematik': 'bg-violet-500', 
      'Fen Bilimleri': 'bg-emerald-500',
      'T.C. İnkılap Tarihi': 'bg-amber-500',
      'Din Kültürü': 'bg-green-500',
      'İngilizce': 'bg-red-500'
    };
    return colors[subject] || 'bg-gray-500';
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

  // Process data for charts - normalize dates for consistency
  const dailyLogChartData = dailyLogs.reduce((acc, log) => {
    // Normalize date format
    let normalizedDate;
    if (typeof log.date === 'string' && log.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      normalizedDate = log.date;
    } else {
      normalizedDate = new Date(log.date).toISOString().split('T')[0];
    }

    let entry = acc.find(item => item.date === normalizedDate);
    if (!entry) {
        entry = { date: normalizedDate };
        acc.push(entry);
    }
    
    // If same subject already exists for this date, add to existing count
    if (entry[log.subject]) {
      entry[log.subject] += log.questionCount;
    } else {
      entry[log.subject] = log.questionCount;
    }
    
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

            {activeTab === 'soru-analizi' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <Card title="📅 Günlük Çalışma Takvimi">
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      homeworkDates={getDailyLogDates()}
                    />
                  </Card>

                  {/* Selected Date Details */}
                  <Card title={selectedDate ? 
                    `${selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })} - Çözdüğü Sorular` : 
                    "Tarih Seçin"
                  }>
                    {selectedDate ? (
                      getSelectedDateLogs().length > 0 ? (
                        <div className="space-y-3">
                          {getSelectedDateLogs().map((log, index) => (
                            <div key={`${log.subject}-${log.date}-${index}`} className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-4 h-4 rounded-full ${getSubjectColor(log.subject)}`}></div>
                                  <h5 className="font-medium text-violet-800 dark:text-violet-200">{log.subject}</h5>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{log.questionCount} soru</p>
                                  <p className="text-xs text-violet-500 dark:text-violet-400">{new Date(log.date).toLocaleDateString('tr-TR')}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-800 dark:text-emerald-200">Günlük Toplam:</span>
                              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                {getSelectedDateLogs().reduce((sum, log) => sum + log.questionCount, 0)} soru
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-secondary)] italic text-center py-8">
                          Bu tarih için soru çözüm kaydı bulunmuyor.
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)] italic text-center py-8">
                        Günlük soru detaylarını görmek için takvimden bir tarih seçin.
                      </p>
                    )}
                  </Card>

                  {/* Chart */}
                  <div className="lg:col-span-2">
                    <Card title="Günlük Soru Sayısı Grafiği">
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
                  </div>
                </div>
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
