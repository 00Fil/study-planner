'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  BookOpen,
  Trophy,
  Flame,
  CheckCircle,
  XCircle,
  MapPin,
  School,
  Sparkles,
  Brain,
  ChevronRight,
  Cloud,
  AlertTriangle,
  ClipboardList,
  Timer,
  Activity,
  ArrowRight,
  Bell,
  Users,
  Coffee,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getExams, getStudyStats, getCurrentWeekPlan, getSubjects, getTopics, getHomework } from '@/lib/supabase-storage';
import { getCurrentLesson, getNextLesson, getTodayLessons, getOptimalStudyPlan } from '@/lib/schedule-helpers';
import { formatDate, getDaysUntilExam, formatTime } from '@/lib/utils';
import { Exam, StudyStats, WeeklyPlan, Subject, Topic, Homework } from '@/lib/types';

// Interfaccia per Smart Plan
interface StudySlot {
  time: string;
  subject: string;
  topic: string;
  topicId?: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  type: 'review' | 'exercise' | 'study' | 'preparation';
}

interface SmartDayPlan {
  date: Date;
  studySlots: StudySlot[];
  totalMinutes: number;
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exams, setExams] = useState<Exam[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [stats, setStats] = useState<StudyStats[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeeklyPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [todayLessons, setTodayLessons] = useState<any[]>([]);
  const [smartPlanToday, setSmartPlanToday] = useState<SmartDayPlan | null>(null);
  const [studyGoals, setStudyGoals] = useState<{ [subject: string]: number }>({});
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [isInClass, setIsInClass] = useState(false);
  const [minutesUntilNext, setMinutesUntilNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateLessons();
      updateClassStatus();
    }, 60000);

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buongiorno');
    else if (hour < 18) setGreeting('Buon pomeriggio');
    else setGreeting('Buonasera');

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [examData, homeworkData, statsData, weekPlanData, subjectsData, topicsData] = await Promise.all([
        getExams(),
        getHomework(),
        getStudyStats(),
        getCurrentWeekPlan(),
        getSubjects(),
        getTopics()
      ]);
      
      const pendingExams = examData.filter(e => e.status === 'scheduled').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const pendingHomework = homeworkData.filter(h => h.status === 'pending').sort((a, b) => new Date(h.due_date).getTime() - new Date(b.due_date).getTime());
      
      setExams(pendingExams);
      setHomework(pendingHomework);
      setStats(statsData);
      setWeekPlan(weekPlanData);
      setSubjects(subjectsData);
      setAllTopics(topicsData);
      
      updateLessons();
      updateClassStatus();
      
      // Generate smart plan for today
      generateTodaySmartPlan(pendingExams);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLessons = () => {
    setCurrentLesson(getCurrentLesson());
    setNextLesson(getNextLesson());
    setTodayLessons(getTodayLessons());
  };
  
  const updateClassStatus = () => {
    const current = getCurrentLesson();
    const next = getNextLesson();
    
    setIsInClass(!!current);
    
    if (next) {
      const now = new Date();
      const [hours, minutes] = next.startTime.split(':').map(Number);
      const nextStart = new Date();
      nextStart.setHours(hours, minutes, 0, 0);
      
      const diff = Math.floor((nextStart.getTime() - now.getTime()) / (1000 * 60));
      setMinutesUntilNext(diff > 0 ? diff : null);
    } else {
      setMinutesUntilNext(null);
    }
  };
  
  const generateTodaySmartPlan = (exams: Exam[]) => {
    const today = new Date();
    const dayIndex = today.getDay();
    const optimalPlan = getOptimalStudyPlan(exams);
    setStudyGoals(optimalPlan);
    
    const studySlots: StudySlot[] = [];
    let totalMinutes = 0;
    
    if (dayIndex === 0) {
      // Domenica - più tempo libero
      studySlots.push({
        time: '9:00-11:00',
        subject: 'Varie',
        topic: 'Ripasso settimanale e preparazione',
        duration: 120,
        priority: 'high',
        type: 'preparation'
      });
      studySlots.push({
        time: '15:00-17:00',
        subject: 'Focus materia principale',
        topic: 'Studio approfondito',
        duration: 120,
        priority: 'medium',
        type: 'study'
      });
      totalMinutes = 240;
    } else if (dayIndex === 6) {
      // Sabato - tempo moderato
      studySlots.push({
        time: '14:30-16:00',
        subject: 'Compiti weekend',
        topic: 'Esercizi e compiti',
        duration: 90,
        priority: 'high',
        type: 'exercise'
      });
      studySlots.push({
        time: '16:30-18:00',
        subject: 'Ripasso',
        topic: 'Ripasso materie della settimana',
        duration: 90,
        priority: 'medium',
        type: 'review'
      });
      totalMinutes = 180;
    } else if (dayIndex !== 0) {
      // Giorni feriali - dopo scuola
      studySlots.push({
        time: '14:30-15:30',
        subject: 'Ripasso del giorno',
        topic: 'Ripasso lezioni mattutine',
        duration: 60,
        priority: 'high',
        type: 'review'
      });
      
      // Trova materia prioritaria basata sugli esami
      const prioritySubject = getPrioritySubject(today, exams);
      studySlots.push({
        time: '16:00-17:30',
        subject: prioritySubject,
        topic: 'Studio/Esercizi',
        duration: 90,
        priority: getExamPriority(prioritySubject, exams),
        type: 'study'
      });
      totalMinutes = 150;
    }
    
    setSmartPlanToday({
      date: today,
      studySlots,
      totalMinutes
    });
  };
  
  const getPrioritySubject = (date: Date, exams: Exam[]): string => {
    // Trova esami entro 7 giorni
    const urgentExams = exams.filter(e => {
      const daysUntil = Math.ceil((new Date(e.date).getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 7;
    });
    
    if (urgentExams.length > 0) {
      const exam = urgentExams[0];
      const examTopics = exam.topics.map((topicId: string) => {
        const topic = allTopics.find(t => t.id === topicId);
        return topic;
      }).filter(Boolean);
      
      const hasDifficultTopics = examTopics.some((t: any) => t.difficulty === 'hard');
      const subjectPrefix = hasDifficultTopics ? '🔴 ' : '';
      
      return `${subjectPrefix}${exam.subject}`;
    }
    
    // Rotazione default basata sul giorno
    const subjects = ['Matematica', 'Informatica', 'Sistemi e Reti', 'TPSIT', 'Italiano e Storia'];
    return subjects[date.getDay() % subjects.length];
  };
  
  const getExamPriority = (subject: string, exams: Exam[]): 'high' | 'medium' | 'low' => {
    const exam = exams.find(e => e.subject === subject);
    if (!exam) return 'low';
    
    const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 3) return 'high';
    if (daysUntil <= 7) return 'medium';
    return 'low';
  };

  const upcomingExams = exams.slice(0, 3);
  const todayTasks = weekPlan?.days.find(d => new Date(d.date).toDateString() === new Date().toDateString());
  const completedTasksToday = todayTasks ? 
    [todayTasks.afternoon.immediateReview, todayTasks.afternoon.mainSubject, todayTasks.afternoon.secondarySubject, todayTasks.evening.exercises]
      .filter(t => t.completed).length : 0;
  const totalTasksToday = 4;

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-600">Caricamento dashboard...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
        {/* Top Info Bar - Responsive for mobile */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Current/Next Lesson Info - Mobile optimized */}
            <div className="flex-1">
              {isInClass && currentLesson ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">IN CORSO ORA</p>
                    <p className="font-bold text-gray-900">{currentLesson.subject}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span className="font-medium">{currentLesson.room}</span>
                      <span className="text-gray-400">•</span>
                      <span>fino alle {currentLesson.endTime}</span>
                    </div>
                  </div>
                </div>
              ) : nextLesson ? (
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <School className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">PROSSIMA LEZIONE</p>
                    <p className="font-bold text-gray-900">{nextLesson.subject}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span className="font-medium text-blue-600">{nextLesson.room}</span>
                      <span className="text-gray-400">•</span>
                      <Clock className="w-3 h-3" />
                      <span>{nextLesson.startTime}</span>
                      {minutesUntilNext && minutesUntilNext < 60 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-orange-600 font-medium">tra {minutesUntilNext} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Coffee className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">NESSUNA LEZIONE</p>
                    <p className="font-bold text-gray-900">Giornata libera</p>
                    <p className="text-sm text-gray-600">Ottimo momento per studiare!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats - Mobile grid layout */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.totalHours || 0}h</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Studio totale</p>
              </div>
              <div className="hidden sm:block h-10 w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats?.studyStreak || 0}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Giorni streak</p>
              </div>
              <div className="hidden sm:block h-10 w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats?.averageGrade?.toFixed(1) || '-'}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Media voti</p>
              </div>
            </div>

            {/* Quick Actions - Hidden on mobile, shown in bottom nav */}
            <div className="hidden sm:flex items-center gap-2">
              <Link 
                href="/schedule"
                className="btn-touch bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden lg:inline">Orario</span>
              </Link>
              <Link 
                href="/pomodoro"
                className="btn-touch bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Timer className="w-4 h-4" />
                <span className="hidden lg:inline">Studia</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Urgent Tasks Overview - Compiti e Verifiche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Homework Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Compiti da fare</h3>
              </div>
              <Link 
                href="/homework"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Tutti →
              </Link>
            </div>
            
            {homework.length > 0 ? (
              <div className="space-y-2">
                {homework.slice(0, 3).map(hw => {
                  const daysUntil = Math.ceil((new Date(hw.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 1;
                  
                  return (
                    <div key={hw.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{hw.subject}</p>
                          <p className="text-xs text-gray-600 line-clamp-1">{hw.description}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className={`text-xs font-medium ${
                            isUrgent ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {daysUntil === 0 ? 'Oggi' : 
                             daysUntil === 1 ? 'Domani' : 
                             `${daysUntil} giorni`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {homework.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-1">
                    +{homework.length - 3} altri compiti
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Nessun compito pendente!</p>
              </div>
            )}
          </div>

          {/* Exams Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Prossime verifiche</h3>
              </div>
              <Link 
                href="/exams"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Tutte →
              </Link>
            </div>
            
            {exams.length > 0 ? (
              <div className="space-y-2">
                {exams.slice(0, 3).map(exam => {
                  const daysUntil = getDaysUntilExam(exam.date);
                  const urgency = daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low';
                  
                  return (
                    <div key={exam.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              urgency === 'high' ? 'bg-red-500' : 
                              urgency === 'medium' ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`} />
                            <p className="font-medium text-gray-900 text-sm">{exam.subject}</p>
                          </div>
                          <p className="text-xs text-gray-600 pl-4">
                            {exam.type === 'written' ? 'Scritto' : 'Orale'} • {exam.topics.length} argomenti
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className={`text-xs font-medium ${
                            urgency === 'high' ? 'text-red-600' : 
                            urgency === 'medium' ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {daysUntil === 0 ? 'OGGI' : 
                             daysUntil === 1 ? 'DOMANI' : 
                             `${daysUntil} giorni`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(exam.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {exams.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-1">
                    +{exams.length - 3} altre verifiche
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Nessuna verifica in programma!</p>
                <Link 
                  href="/exams"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  Aggiungi verifica <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ClasseViva Sync Banner - Show only if no exams */}
        {exams.length === 0 && (
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                  <Cloud className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">🎉 Novità: Sincronizzazione ClasseViva!</h3>
                  <p className="text-cyan-100 mb-1">
                    Importa automaticamente compiti, verifiche e voti da ClasseViva
                  </p>
                  <div className="flex items-center gap-4 text-sm text-cyan-200">
                    <span>✓ Copia e incolla</span>
                    <span>✓ File CSV/JSON</span>
                    <span>✓ Rilevamento automatico</span>
                  </div>
                </div>
              </div>
              <Link 
                href="/sync"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Cloud className="w-5 h-5" />
                Prova subito
              </Link>
            </div>
          </div>
        )}

        {/* Afternoon Study Widget - Compact */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Piano Studio Pomeridiano</h2>
                  <p className="text-xs text-indigo-100">Ottimizza il tuo tempo di studio</p>
                </div>
              </div>
              <Link 
                href="/smart-plan"
                className="flex items-center gap-1 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-bold"
              >
                Gestisci Piano
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Da Ripassare Oggi */}
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Da Ripassare</span>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {todayLessons ? todayLessons.length : 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">lezioni di oggi</p>
              </div>
              
              {/* Tempo Studio Consigliato */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Tempo Studio</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {exams.length > 0 && getDaysUntilExam(exams[0].date) <= 3 ? '3h' : '2.5h'}
                </p>
                <p className="text-xs text-gray-600 mt-1">consigliato oggi</p>
              </div>
              
              {/* Focus Prioritario */}
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">Focus su</span>
                </div>
                <p className="text-lg font-bold text-red-600 truncate">
                  {exams.length > 0 ? exams[0].subject : 'Compiti'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {exams.length > 0 ? `verifica tra ${getDaysUntilExam(exams[0].date)}g` : 'per domani'}
                </p>
              </div>
            </div>
            
            {/* Quick Timeline */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">15:00 - Ripasso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">16:00 - Studio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">17:30 - Esercizi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Prossime Verifiche</h2>
            <Link 
              href="/exams"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Vedi tutte →
            </Link>
          </div>
          
          {upcomingExams.length > 0 ? (
            <div className="space-y-3">
              {upcomingExams.map(exam => {
                const daysUntil = getDaysUntilExam(exam.date);
                const urgency = daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low';
                
                return (
                  <div 
                    key={exam.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        urgency === 'high' ? 'bg-red-500' : 
                        urgency === 'medium' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{exam.subject}</p>
                        <p className="text-sm text-gray-500">
                          {exam.type === 'written' ? 'Scritto' : 'Orale'} • {exam.topics.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        urgency === 'high' ? 'text-red-600' : 
                        urgency === 'medium' ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`}>
                        {daysUntil === 0 ? 'Oggi' : 
                         daysUntil === 1 ? 'Domani' : 
                         `${daysUntil} giorni`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(exam.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessuna verifica programmata</p>
              <Link 
                href="/exams"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aggiungi verifica
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/pomodoro"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Inizia Pomodoro</p>
            </div>
          </Link>

          <Link 
            href="/homework"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-3 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Compiti</p>
            </div>
          </Link>

          <Link 
            href="/sync"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mb-3 group-hover:from-blue-200 group-hover:to-cyan-200 transition-colors">
                <Cloud className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">ClasseViva</p>
            </div>
          </Link>

          <Link 
            href="/subjects"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Materie</p>
            </div>
          </Link>
        </div>

        {/* Additional Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Link 
            href="/stats"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Statistiche</p>
            </div>
          </Link>

          <Link 
            href="/goals"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Obiettivi</p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

// Helper component for task items
function TaskItem({ task, label }: { task: any, label: string }) {
  if (!task) return null;
  
  return (
    <div className="flex items-center gap-2">
      {task.completed ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-300" />
      )}
      <span className={`text-sm ${task.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
        {label}: {task.name || 'Non specificato'} ({task.duration}min)
      </span>
    </div>
  );
}
