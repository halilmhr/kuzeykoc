
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { DailyLog, LGSSubject, TrialExamResult, TrialExamSubjectDetail, Coach, LeaderboardEntry, Homework } from '../types';
import supabaseApi from '../services/supabaseApi';
import { LGS_SUBJECTS } from '../constants';
import MotivationalModal from '../components/student/MotivationalModal';
import { motivationalMessages } from '../services/motivationalMessages';
import Calendar from '../components/common/Calendar';

const StudentDashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('homework');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ coach: Coach, message: string } | null>(null);

  useEffect(() => {
    const prepareMotivationalModal = async () => {
      if (auth?.user) {
        try {
          const studentData = await supabaseApi.getStudentById(auth.user.id);
          if (studentData?.coachId) {
            // Self-coach durumunda özel mesaj
            if (studentData.coachId === auth.user.id) {
              const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
              const message = motivationalMessages[randomIndex];
              setModalContent({ 
                coach: { 
                  id: auth.user.id, 
                  fullName: auth.user.fullName, 
                  email: auth.user.email, 
                  role: 'coach' 
                }, 
                message 
              });
              setShowModal(true);
            } else {
              // Farklı coach varsa normal modal
              const coachData = await supabaseApi.getCoachById(studentData.coachId);
              if (coachData) {
                const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
                const message = motivationalMessages[randomIndex];
                setModalContent({ coach: coachData, message });
                setShowModal(true);
              }
            }
          }
        } catch (error) {
          console.error("Failed to prepare motivational modal:", error);
        }
      }
    };

    prepareMotivationalModal();
  }, [auth?.user]);
  
  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!auth?.user) return null;

  const TabButton = ({ tabId, children }: { tabId: string; children?: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 transform focus:outline-none whitespace-nowrap ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg scale-105'
          : 'bg-[var(--bg-tab-inactive)] text-[var(--text-secondary)] hover:bg-white/90 dark:hover:bg-slate-600/60 hover:shadow-md'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      {showModal && modalContent && (
        <MotivationalModal
          studentName={auth.user.fullName}
          coachName={modalContent.coach.fullName}
          message={modalContent.message}
          onClose={handleCloseModal}
          isSelfCoach={modalContent.coach.id === auth.user.id}
        />
      )}
      <Header user={auth.user} />
      <main className="max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 md:space-x-4 mb-6 sm:mb-8 p-1 sm:p-2 bg-[var(--bg-tab-container)] rounded-xl overflow-x-auto">
          <TabButton tabId="homework">📝 Ödevlerim</TabButton>
          <TabButton tabId="dailyLog">Günlük Takip</TabButton>
          <TabButton tabId="examLog">Deneme Sonuçları</TabButton>
          <TabButton tabId="leaderboard">🏆 Liderlik</TabButton>
        </div>
        <div>
          {activeTab === 'homework' && <HomeworkPanel />}
          {activeTab === 'dailyLog' && <DailyLogPanel />}
          {activeTab === 'examLog' && <ExamLogPanel />}
          {activeTab === 'leaderboard' && <LeaderboardPanel />}
        </div>
      </main>
    </>
  );
};


const DailyLogPanel = () => {
    const auth = useContext(AuthContext);
    const [logData, setLogData] = useState<{[key in LGSSubject]?: number}>({});
    
    // Helper function to convert Date to YYYY-MM-DD format without timezone issues
    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [date, setDate] = useState(formatDateToLocal(new Date()));
    const [submitting, setSubmitting] = useState(false);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDate, setOpenDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchDailyLogs = async () => {
            if (auth?.user) {
                setLoading(true);
                const logs = await supabaseApi.getDailyLogsByStudent(auth.user.id);
                setDailyLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setLoading(false);
            }
        };
        fetchDailyLogs();
    }, [auth?.user]);

    const subjectColors: { [key in LGSSubject]: string } = {
        [LGSSubject.TURKCE]: 'text-sky-600',
        [LGSSubject.MATEMATIK]: 'text-violet-600',
        [LGSSubject.FEN]: 'text-emerald-600',
        [LGSSubject.INKILAP]: 'text-orange-600',
        [LGSSubject.DIN]: 'text-amber-600',
        [LGSSubject.INGILIZCE]: 'text-rose-600',
    };

    const handleCountChange = (subject: LGSSubject, count: string) => {
        const numCount = parseInt(count, 10);
        setLogData(prev => ({...prev, [subject]: isNaN(numCount) ? 0 : numCount}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.user) return;
        setSubmitting(true);
        
        const logEntries = Object.entries(logData)
            .filter(([, count]) => (count as number) > 0)
            .map(([subject, count]) => 
                supabaseApi.addDailyLog({
                    studentId: auth.user!.id,
                    subject: subject as LGSSubject,
                    questionCount: count as number,
                    date: date,
                })
            );
        
        await Promise.all(logEntries);

        // Refresh the logs after saving
        const updatedLogs = await supabaseApi.getDailyLogsByStudent(auth.user.id);
        setDailyLogs(updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        setSubmitting(false);
        setLogData({});
        alert('Günlük veriler başarıyla kaydedildi!');
    };

    // Group logs by date
    const logsByDate = dailyLogs.reduce((acc, log) => {
        if (!acc[log.date]) {
            acc[log.date] = [];
        }
        acc[log.date].push(log);
        return acc;
    }, {} as { [key: string]: DailyLog[] });

    const dateEntries = Object.entries(logsByDate).sort(([a], [b]) => 
        new Date(b).getTime() - new Date(a).getTime()
    );

    return (
        <div className="space-y-8">
            <Card title="Günlük Soru Sayısı Ekle">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="logDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tarih</label>
                        <input type="date" id="logDate" value={date} onChange={e => setDate(e.target.value)} className="block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {LGS_SUBJECTS.map(subject => (
                            <div key={subject}>
                                <label htmlFor={subject} className={`block text-sm font-semibold ${subjectColors[subject] || 'text-[var(--text-secondary)]'}`}>{subject}</label>
                                <input
                                    type="number"
                                    id={subject}
                                    value={logData[subject] || ''}
                                    onChange={e => handleCountChange(subject, e.target.value)}
                                    placeholder="Soru sayısı"
                                    className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                />
                            </div>
                        ))}
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-violet-700 hover:to-fuchsia-600 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                        {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </form>
            </Card>

            <Card title="Geçmiş Soru Kayıtlarım">
                {loading ? (
                    <Spinner />
                ) : dateEntries.length > 0 ? (
                    <div className="space-y-4">
                        {dateEntries.map(([date, logs]) => {
                            const isOpen = openDate === date;
                            const logList = logs as DailyLog[];
                            const totalQuestions = logList.reduce((sum, log) => sum + log.questionCount, 0);
                            return (
                                <div key={date} className="border border-[var(--border-color-light)] rounded-lg overflow-hidden transition-all duration-300 bg-[var(--bg-card)] shadow-sm">
                                    <button
                                        onClick={() => setOpenDate(isOpen ? null : date)}
                                        className="w-full flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 transition-colors"
                                        aria-expanded={isOpen}
                                        aria-controls={`daily-log-${date}`}
                                    >
                                        <div className="text-left">
                                            <h4 className="font-bold text-[var(--text-primary)]">{new Date(date).toLocaleDateString('tr-TR', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}</h4>
                                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                                Toplam <span className="font-semibold text-violet-600">{totalQuestions}</span> soru çözüldü
                                            </p>
                                        </div>
                                        <svg className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isOpen && (
                                        <div id={`daily-log-${date}`} className="p-4 bg-[var(--bg-input)]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(() => {
                                                    // Group logs by subject for the same date
                                                    const logsBySubject = logList.reduce((acc, log) => {
                                                        const subject = log.subject as LGSSubject;
                                                        if (!acc[subject]) {
                                                            acc[subject] = 0;
                                                        }
                                                        acc[subject] += log.questionCount;
                                                        return acc;
                                                    }, {} as { [key in LGSSubject]?: number });

                                                    return Object.entries(logsBySubject).map(([subject, totalCount]) => (
                                                        <div key={subject} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border-l-4 border-violet-500 shadow-sm">
                                                            <span className={`font-semibold ${subjectColors[subject as LGSSubject] || 'text-[var(--text-secondary)]'}`}>
                                                                {subject}
                                                            </span>
                                                            <span className="text-lg font-bold text-[var(--text-primary)] bg-violet-100 dark:bg-violet-900/40 px-3 py-1 rounded-full">
                                                                {totalCount}
                                                            </span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-[var(--text-secondary)] text-center py-4">Henüz soru kaydı bulunmuyor.</p>
                )}
            </Card>
        </div>
    );
};

const ExamLogPanel = () => {
    const auth = useContext(AuthContext);
    
    // Helper function to convert Date to YYYY-MM-DD format without timezone issues
    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [examName, setExamName] = useState('');
    const [examDate, setExamDate] = useState(formatDateToLocal(new Date()));
    const [submitting, setSubmitting] = useState(false);
    const [examDetails, setExamDetails] = useState<{[key in LGSSubject]?: {correct: number, incorrect: number}}>({});
    const [examHistory, setExamHistory] = useState<TrialExamResult[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [openExamId, setOpenExamId] = useState<number | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (auth?.user) {
                setLoadingHistory(true);
                const history = await supabaseApi.getTrialExamsByStudent(auth.user.id);
                setExamHistory(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [auth?.user]);


    const subjectColors: { [key in LGSSubject]: string } = {
        [LGSSubject.TURKCE]: 'text-sky-600',
        [LGSSubject.MATEMATIK]: 'text-violet-600',
        [LGSSubject.FEN]: 'text-emerald-600',
        [LGSSubject.INKILAP]: 'text-orange-600',
        [LGSSubject.DIN]: 'text-amber-600',
        [LGSSubject.INGILIZCE]: 'text-rose-600',
    };

    const handleDetailChange = (subject: LGSSubject, field: 'correct' | 'incorrect', value: string) => {
        const numValue = parseInt(value, 10);
        setExamDetails(prev => ({
            ...prev,
            [subject]: {
                ...(prev[subject] || { correct: 0, incorrect: 0 }),
                [field]: isNaN(numValue) ? 0 : numValue
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.user || !examName.trim()) {
            alert('Sınav adı gereklidir.');
            return;
        }

        // Validate exam details
        const hasValidData = LGS_SUBJECTS.some(subject => {
            const correct = examDetails[subject]?.correct || 0;
            const incorrect = examDetails[subject]?.incorrect || 0;
            return correct > 0 || incorrect > 0;
        });

        if (!hasValidData) {
            alert('En az bir dersin sonucunu girmelisiniz.');
            return;
        }

        setSubmitting(true);

        const details: TrialExamSubjectDetail[] = LGS_SUBJECTS.map((subject: LGSSubject) => {
            const correct = examDetails[subject]?.correct || 0;
            const incorrect = examDetails[subject]?.incorrect || 0;
            const totalQuestions =
              subject === LGSSubject.MATEMATIK ||
              subject === LGSSubject.TURKCE ||
              subject === LGSSubject.FEN
                ? 20
                : 10;
            
            // Ensure blank is never negative
            const blank = Math.max(0, totalQuestions - (correct + incorrect));
            
            return {
                subject,
                correct,
                incorrect,
                blank,
            };
        });

        const totalCorrect = details.reduce((sum, d) => sum + d.correct, 0);
        const totalIncorrect = details.reduce((sum, d) => sum + d.incorrect, 0);
        const totalBlank = details.reduce((sum, d) => sum + d.blank, 0);

        const newExam: Omit<TrialExamResult, 'id'> = {
            studentId: auth.user.id,
            examName,
            date: examDate,
            totalCorrect,
            totalIncorrect,
            totalBlank,
            details,
        };
        
        try {
            const savedExam = await supabaseApi.addTrialExam(newExam);
            
            if (savedExam) {
                setExamHistory(prev => [savedExam, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                
                setExamName('');
                setExamDate(formatDateToLocal(new Date()));
                setExamDetails({});
                alert('Deneme sonucu başarıyla kaydedildi!');
            } else {
                alert('Deneme sonucu kaydedilirken bir hata oluştu.');
            }

        } catch (error) {
            console.error("Failed to save exam result:", error);
            alert('Deneme sonucu kaydedilirken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <Card title="Deneme Sonucu Ekle">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="examName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Deneme Adı</label>
                            <input type="text" id="examName" value={examName} onChange={e => setExamName(e.target.value)} className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]" placeholder="Örn: Genel Deneme 2" required />
                        </div>
                         <div>
                            <label htmlFor="examDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tarih</label>
                            <input type="date" id="examDate" value={examDate} onChange={e => setExamDate(e.target.value)} className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-x-4 border-b border-[var(--border-color-light)] pb-2">
                        <div className="font-semibold text-[var(--text-secondary)]">Ders</div>
                        <div className="font-semibold text-[var(--text-secondary)] text-center">Doğru</div>
                        <div className="font-semibold text-[var(--text-secondary)] text-center">Yanlış</div>
                    </div>
                    
                    <div className="space-y-2">
                        {LGS_SUBJECTS.map(subject => (
                            <div key={subject} className="grid grid-cols-3 gap-x-4 items-center">
                                <label className={`text-sm font-semibold ${subjectColors[subject]}`}>{subject}</label>
                                <input
                                    type="number"
                                    placeholder="D"
                                    min="0"
                                    value={examDetails[subject]?.correct || ''}
                                    onChange={e => handleDetailChange(subject, 'correct', e.target.value)}
                                    className="w-full text-center rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                />
                                <input
                                    type="number"
                                    placeholder="Y"
                                    min="0"
                                    value={examDetails[subject]?.incorrect || ''}
                                    onChange={e => handleDetailChange(subject, 'incorrect', e.target.value)}
                                    className="w-full text-center rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                />
                            </div>
                        ))}
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white py-3 px-4 rounded-lg font-semibold hover:from-sky-600 hover:to-cyan-500 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                        {submitting ? 'Kaydediliyor...' : 'Deneme Sonucunu Kaydet'}
                    </button>
                </form>
            </Card>

            <Card title="Geçmiş Denemelerim">
                {loadingHistory ? (
                    <Spinner />
                ) : examHistory.length > 0 ? (
                    <div className="space-y-4">
                        {examHistory.filter(exam => exam != null).map(exam => {
                            const isOpen = openExamId === exam.id;
                            return (
                                <div key={exam.id} className="border border-[var(--border-color-light)] rounded-lg overflow-hidden transition-all duration-300 bg-[var(--bg-card)] shadow-sm">
                                    <button
                                        onClick={() => setOpenExamId(isOpen ? null : exam.id)}
                                        className="w-full flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 transition-colors"
                                        aria-expanded={isOpen}
                                        aria-controls={`exam-details-${exam.id}`}
                                    >
                                        <div className="text-left">
                                            <h4 className="font-bold text-[var(--text-primary)]">{exam.examName}</h4>
                                            <p className="text-sm text-[var(--text-secondary)]">{new Date(exam.date).toLocaleDateString('tr-TR')}</p>
                                            <p className="text-sm text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium">Toplam:</span>
                                                <span className="font-black text-white bg-emerald-600 shadow-lg px-3 py-1.5 rounded-lg border-2 border-emerald-700">{exam.totalCorrect}D</span>
                                                <span className="font-black text-white bg-rose-600 shadow-lg px-3 py-1.5 rounded-lg border-2 border-rose-700">{exam.totalIncorrect}Y</span>
                                                <span className="font-black text-black bg-yellow-400 shadow-lg px-3 py-1.5 rounded-lg border-2 border-yellow-500">{exam.totalBlank}B</span>
                                            </p>
                                        </div>
                                        <svg className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isOpen && (
                                        <div id={`exam-details-${exam.id}`} className="p-4 bg-white overflow-x-auto border-2 border-gray-400 rounded-lg shadow-lg">
                                            <table className="w-full min-w-[400px] text-sm text-left border-2 border-gray-600 bg-white shadow-xl rounded-lg overflow-hidden"
                                                   style={{fontFamily: 'Arial, sans-serif'}}>
                                                <thead className="text-xs text-[var(--text-primary)] uppercase bg-green-600 text-white border-b-2 border-gray-400">
                                                    <tr>
                                                        <th scope="col" className="px-2 py-1.5 border-r border-gray-400 bg-green-700 font-bold text-xs">Ders</th>
                                                        <th scope="col" className="px-2 py-1.5 text-center border-r border-gray-400 bg-green-700 font-bold text-xs">Doğru</th>
                                                        <th scope="col" className="px-2 py-1.5 text-center border-r border-gray-400 bg-green-700 font-bold text-xs">Yanlış</th>
                                                        <th scope="col" className="px-2 py-1.5 text-center border-r border-gray-400 bg-green-700 font-bold text-xs">Boş</th>
                                                        <th scope="col" className="px-2 py-1.5 text-center bg-green-700 font-bold text-xs">Net</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {exam.details.map(d => {
                                                        const net = d.correct - d.incorrect / 3;
                                                        return (
                                                            <tr key={d.subject} className="border-b border-gray-400 last:border-b-2 hover:bg-blue-50 transition-colors even:bg-gray-50 odd:bg-white">
                                                                <th scope="row" className="px-2 py-1.5 font-medium border-r border-gray-400 bg-gray-100 text-left">
                                                                    <span className="font-bold text-gray-800 text-xs">{d.subject}</span>
                                                                </th>
                                                                <td className="px-2 py-1.5 text-center border-r border-gray-400 bg-green-50">
                                                                    <div className="font-bold text-green-800 bg-green-200 px-2 py-1 rounded border border-green-400 inline-block text-xs">
                                                                        {d.correct}
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center border-r border-gray-400 bg-red-50">
                                                                    <div className="font-bold text-red-800 bg-red-200 px-2 py-1 rounded border border-red-400 inline-block text-xs">
                                                                        {d.incorrect}
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center border-r border-gray-400 bg-yellow-50">
                                                                    <div className="font-bold text-yellow-800 bg-yellow-200 px-2 py-1 rounded border border-yellow-400 inline-block text-xs">
                                                                        {d.blank}
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center bg-blue-50">
                                                                    <div className="font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded border border-blue-400 inline-block text-xs">
                                                                        {net.toFixed(2)}
                                                                    </div>
                                                                </td>
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
                ) : (
                    <p className="text-[var(--text-secondary)] text-center py-4">Henüz kaydedilmiş bir deneme sonucu bulunmuyor.</p>
                )}
            </Card>
        </div>
    );
};

const LeaderboardPanel: React.FC = () => {
    const auth = useContext(AuthContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (auth?.user) {
                setLeaderboardLoading(true);
                try {
                    console.log('🔍 Fetching student data for user:', auth.user.id);
                    const student = await supabaseApi.getStudentById(auth.user.id);
                    console.log('👤 Student data:', student);
                    setStudentData(student);
                    
                    if (student?.coachId) {
                        console.log('📊 Fetching leaderboard for coach:', student.coachId);
                        const leaderboardData = await supabaseApi.getCoachLeaderboard(student.coachId);
                        console.log('✅ Leaderboard data:', leaderboardData);
                        setLeaderboard(leaderboardData);
                    } else {
                        console.log('⚠️ No coach ID found for student');
                    }
                } catch (error) {
                    console.error("❌ Failed to fetch leaderboard:", error);
                    // Hata durumunda boş array set edelim
                    setLeaderboard([]);
                } finally {
                    setLeaderboardLoading(false);
                }
            }
        };

        fetchLeaderboard();
    }, [auth?.user]);

    const handleRefreshLeaderboard = async () => {
        if (studentData?.coachId) {
            setLeaderboardLoading(true);
            try {
                console.log('🔄 Refreshing leaderboard for coach:', studentData.coachId);
                const leaderboardData = await supabaseApi.getCoachLeaderboard(studentData.coachId);
                console.log('✅ Refreshed leaderboard data:', leaderboardData);
                setLeaderboard(leaderboardData);
            } catch (error) {
                console.error("❌ Failed to refresh leaderboard:", error);
                // Hata durumunda mevcut veriyi koruyalım
            } finally {
                setLeaderboardLoading(false);
            }
        } else {
            console.log('⚠️ No coach ID available for refresh');
        }
    };

    return (
        <Card 
            title="🏆 Liderlik Tablosu"
            extra={
                <button
                    onClick={handleRefreshLeaderboard}
                    disabled={leaderboardLoading}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                >
                    <span className={leaderboardLoading ? 'animate-spin' : ''}>🔄</span>
                    <span>Yenile</span>
                </button>
            }
        >
            {leaderboardLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Liderlik tablosu yükleniyor...</p>
                </div>
            ) : leaderboard.length > 0 ? (
                <div className="space-y-4">
                    {leaderboard.map((student, index) => {
                        const isCurrentStudent = student.student_id === auth?.user?.id;
                        const getMedal = (rank: number) => {
                            if (rank === 1) return "🥇";
                            if (rank === 2) return "🥈";
                            if (rank === 3) return "🥉";
                            return `#${rank}`;
                        };
                        
                        return (
                            <div 
                                key={student.student_id}
                                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                                    isCurrentStudent 
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600 shadow-lg' 
                                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="text-2xl font-bold min-w-[50px] text-center">
                                        {getMedal(student.rank)}
                                    </div>
                                    <div className={`${isCurrentStudent ? 'font-bold' : ''}`}>
                                        <div className={`text-lg font-semibold ${isCurrentStudent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {isCurrentStudent ? `Sen (${student.student_name})` : student.student_name}
                                            {isCurrentStudent && <span className="ml-2 text-xl">👈</span>}
                                        </div>
                                        {student.streak_days > 0 && (
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-orange-500">🔥</span>
                                                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                                    {student.streak_days} günlük seri
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${isCurrentStudent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {student.total_score}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        puan
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    
                    {leaderboard.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="text-center text-sm text-blue-700 dark:text-blue-300">
                                <span className="font-medium">🎯 Hedefinize odaklanın!</span> Sağlıklı rekabet ile birlikte gelişim gösterin.
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Henüz Liderlik Verisi Yok
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        Çalışmalarınızı kaydettikçe burada sıralamanızı görebileceksiniz!
                    </div>
                </div>
            )}
        </Card>
    );
};

const HomeworkPanel: React.FC = () => {
    const auth = useContext(AuthContext);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDateHomework, setSelectedDateHomework] = useState<Homework[]>([]);

    // Helper function to convert Date to YYYY-MM-DD format without timezone issues
    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchHomework = async () => {
            if (auth?.user) {
                setLoading(true);
                const homeworkData = await supabaseApi.getHomeworkByStudent(auth.user.id);
                setHomework(homeworkData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setLoading(false);
            }
        };
        fetchHomework();
    }, [auth?.user]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        const dateStr = formatDateToLocal(date);
        const dayHomework = homework.filter(hw => hw.date === dateStr);
        setSelectedDateHomework(dayHomework);
    };

    const handleToggleHomework = async (homeworkId: string) => {
        const homeworkToUpdate = homework.find(hw => hw.id === homeworkId);
        if (!homeworkToUpdate) return;

        const updatedHomework = await supabaseApi.updateHomework(homeworkId, {
            ...homeworkToUpdate,
            isCompleted: !homeworkToUpdate.isCompleted
        });

        if (updatedHomework) {
            setHomework(prev => prev.map(hw => 
                hw.id === homeworkId ? { ...hw, isCompleted: !hw.isCompleted } : hw
            ));
            
            // Update selected date homework if necessary
            if (selectedDate && formatDateToLocal(selectedDate) === updatedHomework.date) {
                setSelectedDateHomework(prev => prev.map(hw => 
                    hw.id === homeworkId ? { ...hw, isCompleted: !hw.isCompleted } : hw
                ));
            }

            // Show success message if homework was completed
            if (!homeworkToUpdate.isCompleted) {
                // Temporary success feedback (you could add a toast notification here)
                console.log("🎉 Ödev tamamlandı!");
            }
        }
    };

    const getHomeworkDates = () => {
        return homework.map(hw => hw.date);
    };

    const upcomingHomework = homework.filter(hw => 
        !hw.isCompleted && new Date(hw.date) >= new Date()
    ).slice(0, 5);

    const completedHomework = homework.filter(hw => hw.isCompleted);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card title="📅 Ödev Takvimi">
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <span className="font-semibold">💡 İpucu:</span> Takvimden bir tarih seçerek o günün ödevlerini görüntüleyebilir ve tamamlayabilirsiniz!
                        </p>
                    </div>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        homeworkDates={getHomeworkDates()}
                    />
                    
                    {selectedDate && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-[var(--text-primary)] mb-3">
                                {selectedDate.toLocaleDateString('tr-TR', { 
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })} - Ödevler
                            </h4>
                            
                            {selectedDateHomework.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDateHomework.map(hw => (
                                        <div key={hw.id} className={`p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] ${
                                            hw.isCompleted 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 animate-pulse-once' 
                                                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                                        }`}>
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={hw.isCompleted}
                                                        onChange={() => handleToggleHomework(hw.id)}
                                                        className="h-6 w-6 rounded-md border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer transition-all duration-200 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 hover:border-emerald-400"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <h5 className={`font-semibold text-base ${hw.isCompleted ? 'line-through text-emerald-700 dark:text-emerald-400' : 'text-orange-800 dark:text-orange-200'}`}>
                                                        {hw.title}
                                                    </h5>
                                                    {hw.description && (
                                                        <p className={`text-sm mt-2 ${hw.isCompleted ? 'line-through text-emerald-600 dark:text-emerald-500' : 'text-orange-700 dark:text-orange-300'}`}>
                                                            {hw.description}
                                                        </p>
                                                    )}
                                                    <div className={`mt-3 flex items-center space-x-2 text-xs ${hw.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                        {hw.isCompleted ? (
                                                            <>
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="font-medium">Tamamlandı!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="font-medium">Bekliyor - Tamamlamak için kutucuğu işaretle</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                    <div className="text-3xl mb-3">📋</div>
                                    <p className="text-sm text-[var(--text-secondary)] font-medium">Bu tarih için ödev bulunmuyor</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">Koçunuz size bu tarih için ödev vermemiş</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Upcoming Homework */}
                <Card title="⏰ Yaklaşan Ödevler">
                    {loading ? (
                        <Spinner />
                    ) : upcomingHomework.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingHomework.map(hw => {
                                const daysLeft = Math.ceil((new Date(hw.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={hw.id} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <h5 className="font-medium text-orange-800 dark:text-orange-200">{hw.title}</h5>
                                                {hw.description && (
                                                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">{hw.description}</p>
                                                )}
                                                <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">
                                                    📅 {new Date(hw.date).toLocaleDateString('tr-TR')}
                                                </p>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                daysLeft <= 1 
                                                    ? 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                                    : daysLeft <= 3 
                                                        ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                        : 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                                {daysLeft <= 0 ? 'Bugün!' : `${daysLeft} gün`}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleHomework(hw.id)}
                                            className="mt-3 w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-all duration-200 hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Tamamlandı olarak işaretle</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">🎉</div>
                            <p className="text-[var(--text-secondary)]">Yaklaşan ödeviniz bulunmuyor!</p>
                            <p className="text-sm text-[var(--text-secondary)] mt-2">Harika iş çıkarıyorsunuz!</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Completed Homework */}
            <Card title="✅ Tamamlanan Ödevler">
                {completedHomework.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedHomework.map(hw => (
                            <div key={hw.id} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <h5 className="font-medium text-emerald-800 dark:text-emerald-200 line-through">{hw.title}</h5>
                                {hw.description && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1 line-through">{hw.description}</p>
                                )}
                                <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2">
                                    📅 {new Date(hw.date).toLocaleDateString('tr-TR')} ✅ Tamamlandı
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[var(--text-secondary)] text-center py-4">Henüz tamamlanmış ödev bulunmuyor.</p>
                )}
            </Card>
        </div>
    );
};

export default StudentDashboard;