'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  BarChart3,
  Layers,
  Zap,
  Brain,
  Coffee,
  Moon,
  Sun,
  Settings,
  Info,
  X,
  Edit2,
  Trash2,
  Star,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getExams,
  getTopics,
  getSubjects,
  getHomework,
  saveHomework,
  deleteHomework,
  getPomodoroSessions
} from '@/lib/storage';
import { Exam, Topic, Subject, Homework } from '@/lib/types';

interface GanttTask {
  id: string;
  title: string;
  type: 'exam-prep' | 'homework' | 'review' | 'study' | 'break';
  subject: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
  description?: string;
  dependencies?: string[];
  completed: boolean;
  estimatedHours: number;
  actualHours?: number;
  relatedExamId?: string;
  relatedHomeworkId?: string;
  relatedTopicIds?: string[];
}

interface TimeSlot {
  hour: number;
  available: boolean;
  task?: GanttTask;
  efficiency: number; // 0-1 score based on personal study patterns
}

interface DaySchedule {
  date: Date;
  slots: TimeSlot[];
  totalAvailableHours: number;
  suggestedFocus: string;
}

export default function AgendaPage() {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [studyPreferences, setStudyPreferences] = useState({
    morningStart: 8,
    eveningEnd: 22,
    breakDuration: 15,
    sessionDuration: 45,
    preferredTimes: ['morning', 'afternoon'],
    avoidWeekends: false
  });
  const [loading, setLoading] = useState(true);

  // Load data and generate tasks
  useEffect(() => {
    generateTasks();
  }, []);

  const generateTasks = () => {
    setLoading(true);
    const exams = getExams().filter(e => e.status === 'pending');
    const homework = getHomework().filter(h => h.status === 'pending');
    const topics = getTopics();
    const subjects = getSubjects();

    const generatedTasks: GanttTask[] = [];

    // Generate exam preparation tasks
    exams.forEach(exam => {
      const examDate = new Date(exam.date);
      const today = new Date();
      const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const subject = subjects.find(s => s.name === exam.subject);
      
      if (daysUntil > 0 && daysUntil <= 30) {
        // Calculate preparation time based on exam topics and difficulty
        const examTopics = topics.filter(t => exam.topics.includes(t.id));
        const avgDifficulty = calculateAverageDifficulty(examTopics);
        const prepDays = Math.min(daysUntil - 1, Math.max(3, Math.ceil(examTopics.length * avgDifficulty)));
        
        // Create main exam preparation task
        const prepTask: GanttTask = {
          id: `exam-prep-${exam.id}`,
          title: `Preparazione ${exam.subject}`,
          type: 'exam-prep',
          subject: exam.subject,
          startDate: new Date(examDate.getTime() - (prepDays * 24 * 60 * 60 * 1000)),
          endDate: new Date(examDate.getTime() - (24 * 60 * 60 * 1000)),
          progress: 0,
          priority: exam.priority,
          difficulty: avgDifficulty > 2 ? 'hard' : avgDifficulty > 1.5 ? 'medium' : 'easy',
          color: subject?.color || '#3B82F6',
          description: `Preparazione per verifica di ${exam.subject} (${exam.type === 'written' ? 'Scritto' : 'Orale'})`,
          completed: false,
          estimatedHours: prepDays * 2,
          relatedExamId: exam.id,
          relatedTopicIds: exam.topics
        };
        generatedTasks.push(prepTask);

        // Create review sessions for each topic
        examTopics.forEach((topic, index) => {
          const topicStartOffset = Math.floor((prepDays / examTopics.length) * index);
          const reviewTask: GanttTask = {
            id: `review-${exam.id}-${topic.id}`,
            title: `Ripasso: ${topic.title}`,
            type: 'review',
            subject: exam.subject,
            startDate: new Date(prepTask.startDate.getTime() + (topicStartOffset * 24 * 60 * 60 * 1000)),
            endDate: new Date(prepTask.startDate.getTime() + ((topicStartOffset + 1) * 24 * 60 * 60 * 1000)),
            progress: topic.completed ? 100 : 0,
            priority: topic.importance === 'high' ? 'high' : topic.importance === 'low' ? 'low' : 'medium',
            difficulty: topic.difficulty,
            color: subject?.color || '#3B82F6',
            description: topic.description,
            completed: topic.completed,
            estimatedHours: topic.difficulty === 'hard' ? 2 : topic.difficulty === 'medium' ? 1.5 : 1,
            dependencies: [`exam-prep-${exam.id}`],
            relatedTopicIds: [topic.id]
          };
          generatedTasks.push(reviewTask);
        });
      }
    });

    // Generate homework tasks
    homework.forEach(hw => {
      const dueDate = new Date(hw.dueDate);
      const today = new Date();
      const subject = subjects.find(s => s.name === hw.subject);
      
      const hwTask: GanttTask = {
        id: `homework-${hw.id}`,
        title: hw.description,
        type: 'homework',
        subject: hw.subject,
        startDate: today,
        endDate: dueDate,
        progress: 0,
        priority: hw.priority,
        difficulty: hw.estimatedHours && hw.estimatedHours > 2 ? 'hard' : hw.estimatedHours && hw.estimatedHours > 1 ? 'medium' : 'easy',
        color: subject?.color || '#10B981',
        description: hw.notes,
        completed: false,
        estimatedHours: hw.estimatedHours || 1,
        relatedHomeworkId: hw.id
      };
      generatedTasks.push(hwTask);
    });

    // Generate regular study/review sessions for topics not in exams
    const unstudiedTopics = topics.filter(t => !t.completed && !t.markedForExam);
    unstudiedTopics.slice(0, 10).forEach(topic => {
      const subject = subjects.find(s => s.name === topic.subjectName);
      const studyTask: GanttTask = {
        id: `study-${topic.id}`,
        title: `Studio: ${topic.title}`,
        type: 'study',
        subject: topic.subjectName,
        startDate: new Date(),
        endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
        progress: 0,
        priority: topic.importance === 'high' ? 'high' : topic.importance === 'low' ? 'low' : 'medium',
        difficulty: topic.difficulty,
        color: subject?.color || '#8B5CF6',
        description: topic.description,
        completed: false,
        estimatedHours: topic.difficulty === 'hard' ? 3 : topic.difficulty === 'medium' ? 2 : 1,
        relatedTopicIds: [topic.id]
      };
      generatedTasks.push(studyTask);
    });

    // Sort tasks by priority and date
    generatedTasks.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.startDate.getTime() - b.startDate.getTime();
    });

    setTasks(generatedTasks);
    setLoading(false);
  };

  const calculateAverageDifficulty = (topics: Topic[]): number => {
    if (topics.length === 0) return 1.5;
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const sum = topics.reduce((acc, t) => acc + difficultyMap[t.difficulty], 0);
    return sum / topics.length;
  };

  // Generate calendar days for Gantt view
  const getCalendarDays = (): Date[] => {
    const days: Date[] = [];
    const startDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      // Start from Monday of current week
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + diff);
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
      }
    } else {
      // Month view
      startDate.setDate(1);
      const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      
      for (let i = 0; i < lastDay; i++) {
        const day = new Date(startDate);
        day.setDate(i + 1);
        days.push(day);
      }
    }
    
    return days;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterType !== 'all' && task.type !== filterType) return false;
      if (filterSubject !== 'all' && task.subject !== filterSubject) return false;
      return true;
    });
  }, [tasks, filterType, filterSubject]);

  const subjects = getSubjects();
  const calendarDays = getCalendarDays();

  const getTaskPosition = (task: GanttTask, days: Date[]): { left: string; width: string } | null => {
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    // Check if task is visible in current view
    if (task.endDate < firstDay || task.startDate > lastDay) {
      return null;
    }
    
    const totalDays = days.length;
    const dayWidth = 100 / totalDays;
    
    // Calculate start position
    let startOffset = 0;
    if (task.startDate >= firstDay) {
      const diffTime = task.startDate.getTime() - firstDay.getTime();
      startOffset = (diffTime / (1000 * 60 * 60 * 24)) * dayWidth;
    }
    
    // Calculate width
    const taskStart = task.startDate < firstDay ? firstDay : task.startDate;
    const taskEnd = task.endDate > lastDay ? lastDay : task.endDate;
    const taskDuration = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const width = taskDuration * dayWidth;
    
    return {
      left: `${startOffset}%`,
      width: `${width}%`
    };
  };

  const getTimeEfficiency = (hour: number): number => {
    // Calculate efficiency based on typical study patterns
    if (hour >= 9 && hour <= 11) return 0.9; // Morning peak
    if (hour >= 14 && hour <= 16) return 0.8; // Afternoon focus
    if (hour >= 19 && hour <= 21) return 0.85; // Evening study
    if (hour < 7 || hour > 23) return 0.2; // Very low efficiency
    return 0.6; // Average
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = (date: Date): string => {
    if (viewMode === 'week') {
      return date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
    }
    return date.getDate().toString();
  };

  const getTaskTypeIcon = (type: GanttTask['type']) => {
    switch(type) {
      case 'exam-prep': return <Target className="w-4 h-4" />;
      case 'homework': return <BookOpen className="w-4 h-4" />;
      case 'review': return <RefreshCw className="w-4 h-4" />;
      case 'study': return <Brain className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type: GanttTask['type']) => {
    switch(type) {
      case 'exam-prep': return 'Preparazione Verifica';
      case 'homework': return 'Compiti';
      case 'review': return 'Ripasso';
      case 'study': return 'Studio';
      case 'break': return 'Pausa';
      default: return 'Attività';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Generazione agenda intelligente...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agenda Intelligente</h1>
              <p className="text-gray-600">
                Pianificazione automatica basata su priorità, difficoltà e tempo disponibile
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Preferenze
              </button>
              <button
                onClick={generateTasks}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Rigenera Piano
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.type === 'exam-prep').length}
                </p>
                <p className="text-sm text-gray-600">Verifiche in preparazione</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.type === 'homework').length}
                </p>
                <p className="text-sm text-gray-600">Compiti da fare</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.reduce((acc, t) => acc + t.estimatedHours, 0).toFixed(1)}h
                </p>
                <p className="text-sm text-gray-600">Tempo stimato totale</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(tasks.filter(t => t.priority === 'high').length / tasks.length * 100)}%
                </p>
                <p className="text-sm text-gray-600">Priorità alta</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode & Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-l-lg transition-colors ${
                    viewMode === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Settimana
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-r-lg transition-colors ${
                    viewMode === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mese
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('prev')}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium text-gray-900 min-w-[150px] text-center">
                  {viewMode === 'week'
                    ? `${currentDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} - ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`
                    : currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
                  }
                </span>
                <button
                  onClick={() => handleNavigate('next')}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="exam-prep">Preparazione verifiche</option>
                  <option value="homework">Compiti</option>
                  <option value="review">Ripasso</option>
                  <option value="study">Studio</option>
                </select>
              </div>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutte le materie</option>
                {subjects.map(subject => (
                  <option key={subject.name} value={subject.name}>
                    {subject.displayName || subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Diagramma di Gantt
            </h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Timeline Header */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <div className="w-48 p-3 border-r border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Attività</span>
                </div>
                <div className="flex-1 flex">
                  {calendarDays.map((day, index) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    
                    return (
                      <div
                        key={index}
                        className={`flex-1 p-3 text-center border-r border-gray-200 ${
                          isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {formatDateHeader(day)}
                        </div>
                        {isToday && (
                          <div className="text-xs text-blue-600 mt-0.5">Oggi</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Rows */}
              <div className="divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nessuna attività da mostrare</p>
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const position = getTaskPosition(task, calendarDays);
                    if (!position) return null;

                    return (
                      <div key={task.id} className="flex hover:bg-gray-50 transition-colors">
                        {/* Task Info */}
                        <div className="w-48 p-3 border-r border-gray-200">
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 ${task.completed ? 'text-green-600' : 'text-gray-400'}`}>
                              {getTaskTypeIcon(task.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium text-gray-900 truncate ${
                                task.completed ? 'line-through' : ''
                              }`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500">{task.subject}</p>
                            </div>
                          </div>
                        </div>

                        {/* Gantt Bar */}
                        <div className="flex-1 relative p-2">
                          <div className="relative h-8">
                            <div
                              className={`absolute h-full rounded flex items-center px-2 cursor-pointer transition-all hover:opacity-90 ${
                                task.completed ? 'opacity-60' : ''
                              }`}
                              style={{
                                left: position.left,
                                width: position.width,
                                backgroundColor: task.color + '20',
                                borderLeft: `3px solid ${task.color}`,
                              }}
                              onClick={() => setSelectedTask(task)}
                            >
                              {/* Progress Bar */}
                              <div
                                className="absolute left-0 top-0 h-full rounded opacity-30"
                                style={{
                                  width: `${task.progress}%`,
                                  backgroundColor: task.color
                                }}
                              />
                              
                              {/* Task Content */}
                              <div className="relative z-10 flex items-center justify-between w-full">
                                <span className="text-xs font-medium text-gray-700 truncate">
                                  {task.estimatedHours}h
                                </span>
                                {task.priority === 'high' && (
                                  <AlertCircle className="w-3 h-3 text-red-600 ml-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">Preparazione Verifica</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Compiti</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Ripasso</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Studio</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-gray-600">Alta Priorità</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Details Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dettagli Attività</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Titolo</p>
                  <p className="font-medium text-gray-900">{selectedTask.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tipo</p>
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(selectedTask.type)}
                      <span className="text-gray-900">{getTaskTypeLabel(selectedTask.type)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Materia</p>
                    <p className="text-gray-900">{selectedTask.subject}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Priorità</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                      selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedTask.priority === 'high' ? 'Alta' :
                       selectedTask.priority === 'medium' ? 'Media' : 'Bassa'}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Difficoltà</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                      selectedTask.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedTask.difficulty === 'hard' ? 'Difficile' :
                       selectedTask.difficulty === 'medium' ? 'Media' : 'Facile'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Periodo</p>
                  <p className="text-gray-900">
                    {selectedTask.startDate.toLocaleDateString('it-IT')} - {selectedTask.endDate.toLocaleDateString('it-IT')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Tempo stimato</p>
                  <p className="text-gray-900">{selectedTask.estimatedHours} ore</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Progresso</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-700">{selectedTask.progress}%</span>
                  </div>
                </div>

                {selectedTask.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Descrizione</p>
                    <p className="text-gray-900">{selectedTask.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    toast.info('Funzionalità in sviluppo');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Modifica
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Preferenze Studio</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inizio giornata
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={studyPreferences.morningStart}
                      onChange={(e) => setStudyPreferences({
                        ...studyPreferences,
                        morningStart: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fine giornata
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={studyPreferences.eveningEnd}
                      onChange={(e) => setStudyPreferences({
                        ...studyPreferences,
                        eveningEnd: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durata sessione (min)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={studyPreferences.sessionDuration}
                      onChange={(e) => setStudyPreferences({
                        ...studyPreferences,
                        sessionDuration: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pausa (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      step="5"
                      value={studyPreferences.breakDuration}
                      onChange={(e) => setStudyPreferences({
                        ...studyPreferences,
                        breakDuration: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="avoidWeekends"
                    checked={studyPreferences.avoidWeekends}
                    onChange={(e) => setStudyPreferences({
                      ...studyPreferences,
                      avoidWeekends: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="avoidWeekends" className="text-sm text-gray-700">
                    Evita pianificazione nel weekend
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    generateTasks();
                    toast.success('Preferenze salvate e piano rigenerato');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salva e Rigenera
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}