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
  Cloud
} from 'lucide-react';
import Link from 'next/link';
import { getExams, getStudyStats, getCurrentWeekPlan, getSubjects, getTopics } from '@/lib/storage';
import { getCurrentLesson, getNextLesson, getTodayLessons, getOptimalStudyPlan } from '@/lib/schedule-helpers';
import { formatDate, getDaysUntilExam, formatTime } from '@/lib/utils';
import { Exam, StudyStats, WeeklyPlan, Subject, Topic } from '@/lib/types';

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
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeeklyPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [todayLessons, setTodayLessons] = useState<any[]>([]);
  const [smartPlanToday, setSmartPlanToday] = useState<SmartDayPlan | null>(null);
  const [studyGoals, setStudyGoals] = useState<{ [subject: string]: number }>({});
  const [allTopics, setAllTopics] = useState<Topic[]>([]);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateLessons();
    }, 60000);

    // Load data
    const pendingExams = getExams().filter(e => e.status === 'pending').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setExams(pendingExams);
    setStats(getStudyStats());
    setWeekPlan(getCurrentWeekPlan());
    setSubjects(getSubjects());
    setAllTopics(getTopics());
    updateLessons();
    
    // Generate smart plan for today
    generateTodaySmartPlan(pendingExams);

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buongiorno');
    else if (hour < 18) setGreeting('Buon pomeriggio');
    else setGreeting('Buonasera');

    return () => clearInterval(timer);
  }, []);

  const updateLessons = () => {
    setCurrentLesson(getCurrentLesson());
    setNextLesson(getNextLesson());
    setTodayLessons(getTodayLessons());
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Current Lesson */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {greeting}! 👋
              </h1>
              <p className="text-blue-100 mb-4">
                {currentTime.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Link 
              href="/schedule"
              className="bg-white/20 backdrop-blur hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-white"
            >
              Vedi Orario →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm opacity-90">Ore di studio</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalHours || 0}h</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-sm opacity-90">Streak</span>
              </div>
              <p className="text-2xl font-bold">{stats?.studyStreak || 0} giorni</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm opacity-90">Media voti</span>
              </div>
              <p className="text-2xl font-bold">{stats?.averageGrade?.toFixed(1) || '-'}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm opacity-90">Completamento</span>
              </div>
              <p className="text-2xl font-bold">
                {stats && stats.totalTasks > 0 
                  ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Next Lesson Card */}
        {nextLesson && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <School className="w-5 h-5" />
                  <span className="text-green-100 text-sm font-medium">Prossima Lezione</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{nextLesson.subject}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-100" />
                    <span className="font-medium">{nextLesson.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-100" />
                    <span>{nextLesson.startTime} - {nextLesson.endTime}</span>
                  </div>
                </div>
              </div>
              <Link 
                href="/schedule"
                className="bg-white/20 backdrop-blur hover:bg-white/30 transition-colors px-4 py-3 rounded-lg flex flex-col items-center"
              >
                <span className="text-2xl font-bold">{nextLesson.startTime}</span>
                <span className="text-xs">Orario completo →</span>
              </Link>
            </div>
          </div>
        )}

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

        {/* Smart Plan Widget */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Piano Studio Intelligente</h2>
                  <p className="text-xs text-purple-100">Ottimizzato per le tue verifiche</p>
                </div>
              </div>
              <Link 
                href="/smart-plan"
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                Gestisci piano
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {smartPlanToday && smartPlanToday.studySlots.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Tempo totale</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {Math.floor(smartPlanToday.totalMinutes / 60)}h {smartPlanToday.totalMinutes % 60}m
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Sessioni</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{smartPlanToday.studySlots.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Focus</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {Object.entries(studyGoals).sort((a, b) => b[1] - a[1])[0]?.[0]?.substring(0, 10) || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Study Slots */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Programma di oggi
                  </h3>
                  {smartPlanToday.studySlots.map((slot, idx) => (
                    <div 
                      key={idx}
                      className={`relative bg-white rounded-lg p-4 border-l-4 transition-all hover:shadow-md ${
                        slot.priority === 'high' 
                          ? 'border-red-500' 
                          : slot.priority === 'medium'
                          ? 'border-yellow-500'
                          : 'border-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{slot.subject}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              slot.type === 'review' ? 'bg-blue-100 text-blue-700' :
                              slot.type === 'exercise' ? 'bg-purple-100 text-purple-700' :
                              slot.type === 'study' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {slot.type === 'review' ? 'Ripasso' :
                               slot.type === 'exercise' ? 'Esercizi' :
                               slot.type === 'study' ? 'Studio' :
                               'Preparazione'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{slot.topic}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{slot.time}</span>
                          </div>
                          <span className="text-xs text-gray-500">{slot.duration} min</span>
                        </div>
                      </div>
                      
                      {/* Priority indicator */}
                      {slot.priority === 'high' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* AI Insights */}
                {Object.keys(studyGoals).length > 0 && (
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">💡 Suggerimento AI</p>
                        <p className="text-sm text-gray-700">
                          {exams.length > 0 && exams[0] ? (
                            <>Focus su <strong>{exams[0].subject}</strong> - verifica tra {getDaysUntilExam(exams[0].date)} giorni. 
                            Dedica almeno {Math.round((studyGoals[exams[0].subject] || 60) / 60)} ore questa settimana.</>
                          ) : (
                            'Ottimo momento per consolidare gli argomenti e fare esercizi extra!'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-gray-900 font-medium mb-2">Piano studio non ancora generato</p>
                <p className="text-sm text-gray-600 mb-4">Crea un piano personalizzato basato sul tuo orario e le verifiche</p>
                <Link 
                  href="/smart-plan"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Genera Piano Intelligente
                </Link>
              </div>
            )}
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
            href="/smart-plan"
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:from-purple-200 group-hover:to-blue-200 transition-colors">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Smart Plan</p>
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
