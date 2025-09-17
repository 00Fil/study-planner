'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Upload,
  FileText,
  GraduationCap,
  Users,
  ArrowRight,
  List,
  CalendarDays,
  BookMarked
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getExams,
  getTopics,
  getSubjects,
  getHomework,
  saveHomework,
  deleteHomework,
  getPomodoroSessions,
  saveExam,
  deleteExam,
  saveTopic
} from '@/lib/storage';
import { Exam, Topic, Subject, Homework } from '@/lib/types';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'exam' | 'homework' | 'review' | 'study' | 'exam-prep';
  subject: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
  color: string;
  completed: boolean;
  estimatedHours?: number;
  description?: string;
  icon?: any;
  relatedExamId?: string;
  relatedHomeworkId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export default function AgendaPage() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayPanel, setShowDayPanel] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Load data and generate events
  useEffect(() => {
    generateCalendarEvents();
  }, []);

  const generateCalendarEvents = () => {
    setLoading(true);
    const exams = getExams().filter(e => e.status === 'pending');
    const homework = getHomework().filter(h => h.status === 'pending');
    const topics = getTopics();
    const subjectsList = getSubjects();
    setSubjects(subjectsList);

    const events: CalendarEvent[] = [];

    // Add exams as events
    exams.forEach(exam => {
      const subject = subjectsList.find(s => s.name === exam.subject);
      events.push({
        id: `exam-${exam.id}`,
        title: `Verifica ${exam.subject}`,
        type: 'exam',
        subject: exam.subject,
        date: new Date(exam.date),
        priority: exam.priority,
        color: subject?.color || '#EF4444',
        completed: false,
        estimatedHours: exam.topics.length * 2,
        description: `${exam.type === 'written' ? 'Scritto' : 'Orale'} - ${exam.topics.length} argomenti`,
        icon: AlertTriangle,
        relatedExamId: exam.id,
        difficulty: 'hard'
      });

      // Add exam preparation sessions
      const examDate = new Date(exam.date);
      const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil <= 14) {
        // Add preparation sessions
        for (let i = Math.max(1, daysUntil - 7); i < daysUntil; i++) {
          const prepDate = new Date(today);
          prepDate.setDate(today.getDate() + i);
          
          events.push({
            id: `prep-${exam.id}-${i}`,
            title: `Prep. ${exam.subject}`,
            type: 'exam-prep',
            subject: exam.subject,
            date: prepDate,
            priority: daysUntil <= 3 ? 'high' : 'medium',
            color: subject?.color || '#8B5CF6',
            completed: false,
            estimatedHours: 2,
            description: `Preparazione per verifica del ${examDate.toLocaleDateString('it-IT')}`,
            icon: GraduationCap,
            relatedExamId: exam.id
          });
        }

        // Add intensive review the day before
        const dayBefore = new Date(examDate);
        dayBefore.setDate(examDate.getDate() - 1);
        events.push({
          id: `intensive-${exam.id}`,
          title: `Ripasso ${exam.subject}`,
          type: 'review',
          subject: exam.subject,
          date: dayBefore,
          priority: 'high',
          color: subject?.color || '#F59E0B',
          completed: false,
          estimatedHours: 3,
          description: 'Ripasso intensivo pre-verifica',
          icon: RefreshCw,
          relatedExamId: exam.id
        });
      }
    });

    // Add homework as events
    homework.forEach(hw => {
      const subject = subjectsList.find(s => s.name === hw.subject);
      const dueDate = new Date(hw.dueDate);
      
      events.push({
        id: `homework-${hw.id}`,
        title: hw.description,
        type: 'homework',
        subject: hw.subject,
        date: dueDate,
        priority: hw.priority,
        color: subject?.color || '#10B981',
        completed: hw.status === 'completed',
        estimatedHours: hw.estimatedHours || 1,
        description: hw.notes,
        icon: FileText,
        relatedHomeworkId: hw.id,
        difficulty: hw.estimatedHours && hw.estimatedHours > 2 ? 'hard' : 
                   hw.estimatedHours && hw.estimatedHours > 1 ? 'medium' : 'easy'
      });
    });

    // Add weekly review sessions for main subjects
    const mainSubjects = subjectsList.filter(s => s.importance === 'high').slice(0, 3);
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      mainSubjects.forEach((subject, index) => {
        const reviewDate = new Date(today);
        reviewDate.setDate(today.getDate() + (weekOffset * 7) + index + 1);
        
        events.push({
          id: `review-${subject.id}-week-${weekOffset}`,
          title: `Ripasso ${subject.name}`,
          type: 'review',
          subject: subject.name,
          date: reviewDate,
          priority: 'low',
          color: subject.color || '#3B82F6',
          completed: false,
          estimatedHours: 1,
          description: 'Ripasso settimanale programmato',
          icon: BookMarked
        });
      });
    }

    // Add study sessions for topics not covered by exams
    const unstudiedTopics = topics.filter(t => !t.completed && !t.markedForExam);
    unstudiedTopics.slice(0, 10).forEach((topic, index) => {
      const subject = subjectsList.find(s => s.name === topic.subjectName);
      const studyDate = new Date(today);
      studyDate.setDate(today.getDate() + Math.floor(index / 2) + 2);
      
      events.push({
        id: `study-${topic.id}`,
        title: topic.title,
        type: 'study',
        subject: topic.subjectName,
        date: studyDate,
        priority: topic.importance === 'high' ? 'medium' : 'low',
        color: subject?.color || '#6366F1',
        completed: topic.completed,
        estimatedHours: topic.difficulty === 'hard' ? 2 : 1,
        description: topic.description,
        icon: Brain,
        difficulty: topic.difficulty
      });
    });

    setCalendarEvents(events);
    setLoading(false);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return calendarEvents.filter(event => {
      const eventDateStr = event.date.toDateString();
      return eventDateStr === dateStr;
    }).filter(event => {
      if (filterType !== 'all' && event.type !== filterType) return false;
      if (filterSubject !== 'all' && event.subject !== filterSubject) return false;
      return true;
    });
  };

  // Calendar grid generation
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: (Date | null)[] = [];
    const current = new Date(startDate);
    
    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const daysInMonth = getDaysInMonth();

  // Event type styling
  const getEventTypeStyle = (type: CalendarEvent['type']) => {
    switch(type) {
      case 'exam':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'homework':
        return 'bg-green-50 border-green-300 text-green-900';
      case 'exam-prep':
        return 'bg-purple-50 border-purple-300 text-purple-900';
      case 'review':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      case 'study':
        return 'bg-blue-50 border-blue-300 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-900';
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch(type) {
      case 'exam':
        return <AlertTriangle className="w-3 h-3" />;
      case 'homework':
        return <FileText className="w-3 h-3" />;
      case 'exam-prep':
        return <GraduationCap className="w-3 h-3" />;
      case 'review':
        return <RefreshCw className="w-3 h-3" />;
      case 'study':
        return <Brain className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  // Stats calculation
  const stats = {
    totalEvents: calendarEvents.length,
    exams: calendarEvents.filter(e => e.type === 'exam').length,
    homework: calendarEvents.filter(e => e.type === 'homework').length,
    todayEvents: getEventsForDate(today).length,
    weekEvents: calendarEvents.filter(e => {
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      return e.date >= today && e.date <= weekFromNow;
    }).length
  };

  const handleDayClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setShowDayPanel(true);
  };

  // Navigation
  const previousMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Handle event completion
  const handleEventComplete = (event: CalendarEvent) => {
    if (event.type === 'exam' && event.relatedExamId) {
      const exams = getExams();
      const exam = exams.find(e => e.id === event.relatedExamId);
      if (exam) {
        exam.status = 'completed';
        saveExam(exam);
        toast.success(`✅ Verifica di ${exam.subject} completata!`);
        setTimeout(() => generateCalendarEvents(), 100); // Refresh with small delay for smooth UX
      }
    } else if (event.type === 'homework' && event.relatedHomeworkId) {
      const homework = getHomework();
      const hw = homework.find(h => h.id === event.relatedHomeworkId);
      if (hw) {
        hw.status = 'completed';
        saveHomework(hw);
        toast.success(`✅ Compito di ${hw.subject} completato!`);
        setTimeout(() => generateCalendarEvents(), 100); // Refresh with small delay for smooth UX
      }
    } else if ((event.type === 'review' || event.type === 'study') && event.id.includes('topic')) {
      // Mark topic as completed
      const topicId = event.id.split('-').pop();
      if (topicId) {
        const topics = getTopics();
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
          topic.completed = true;
          saveTopic(topic);
          toast.success(`✅ Argomento completato!`);
          setTimeout(() => generateCalendarEvents(), 100); // Refresh with small delay for smooth UX
        }
      }
    } else {
      // For other types, just mark as completed in UI
      toast.success('✅ Attività completata!');
      setTimeout(() => generateCalendarEvents(), 100);
    }
  };

  // Handle event deletion
  const handleEventDelete = (event: CalendarEvent) => {
    if (event.type === 'exam' && event.relatedExamId) {
      deleteExam(event.relatedExamId);
      toast.success('Verifica eliminata');
    } else if (event.type === 'homework' && event.relatedHomeworkId) {
      deleteHomework(event.relatedHomeworkId);
      toast.success('Compito eliminato');
    } else {
      toast.info('Questo evento non può essere eliminato direttamente');
      return;
    }
    generateCalendarEvents(); // Refresh events
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  // Navigate to edit page
  const handleEventEdit = (event: CalendarEvent) => {
    if (event.type === 'exam' && event.relatedExamId) {
      window.location.href = `/exams?edit=${event.relatedExamId}`;
    } else if (event.type === 'homework' && event.relatedHomeworkId) {
      window.location.href = `/homework?edit=${event.relatedHomeworkId}`;
    } else {
      toast.info('Modifica non disponibile per questo tipo di evento');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agenda Studio</h1>
              <p className="text-gray-600">
                Visualizza e organizza tutte le tue attività di studio in un unico calendario
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {viewMode === 'calendar' ? <List className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                {viewMode === 'calendar' ? 'Vista Lista' : 'Vista Calendario'}
              </button>
              <button
                onClick={generateCalendarEvents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Aggiorna
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                <p className="text-sm text-gray-600">Eventi Totali</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.exams}</p>
                <p className="text-sm text-gray-600">Verifiche</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.homework}</p>
                <p className="text-sm text-gray-600">Compiti</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.todayEvents}</p>
                <p className="text-sm text-gray-600">Oggi</p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.weekEvents}</p>
                <p className="text-sm text-gray-600">Questa Settimana</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtra per:</span>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutti i tipi</option>
              <option value="exam">Verifiche</option>
              <option value="homework">Compiti</option>
              <option value="exam-prep">Preparazione</option>
              <option value="review">Ripasso</option>
              <option value="study">Studio</option>
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutte le materie</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button
                    onClick={goToToday}
                    className="text-sm text-white/80 hover:text-white mt-1"
                  >
                    Vai a oggi
                  </button>
                </div>

                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Day Headers */}
              {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
                <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {daysInMonth.map((date, index) => {
                const eventsForDay = date ? getEventsForDate(date) : [];
                const isToday = date && date.toDateString() === today.toDateString();
                const isCurrentMonth = date && date.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();
                const hasExam = eventsForDay.some(e => e.type === 'exam');
                const hasHighPriority = eventsForDay.some(e => e.priority === 'high');

                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[110px] relative border ${
                      !isCurrentMonth ? 'bg-gray-50' : ''
                    } ${isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''} ${
                      isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset' : ''
                    } ${date ? 'hover:bg-gray-50 cursor-pointer' : ''} 
                    ${hasExam ? 'border-red-200' : hasHighPriority ? 'border-orange-200' : 'border-gray-100'}
                    transition-all duration-200`}
                    onClick={() => handleDayClick(date)}
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {date && (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className={`text-sm font-bold ${
                            isToday ? 'text-blue-600' : 
                            !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {date.getDate()}
                          </div>
                          {eventsForDay.length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              hasExam ? 'bg-red-100 text-red-700' :
                              hasHighPriority ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {eventsForDay.length}
                            </span>
                          )}
                        </div>

                        {/* Events Display - Simplified Stack */}
                        {eventsForDay.length > 0 && (
                          <div className="space-y-1">
                            {/* Show first 2-3 events as small pills */}
                            {eventsForDay.slice(0, 3).map((event, idx) => {
                              const Icon = getEventIcon(event.type);
                              return (
                                <div
                                  key={event.id}
                                  className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-1 relative ${
                                    event.completed ? (
                                      'bg-gray-100 text-gray-600 line-through'
                                    ) : (
                                      event.type === 'exam' ? 'bg-red-100 text-red-700' :
                                      event.type === 'homework' ? 'bg-green-100 text-green-700' :
                                      event.type === 'exam-prep' ? 'bg-purple-100 text-purple-700' :
                                      event.type === 'review' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    )
                                  }`}
                                >
                                  <div className="flex-shrink-0">
                                    {React.cloneElement(Icon, { className: 'w-3 h-3' })}
                                  </div>
                                  <span className="truncate font-medium flex items-center gap-1">
                                    {event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                                    {event.completed && (
                                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                            
                            {/* Show +N more if there are more events */}
                            {eventsForDay.length > 3 && (
                              <div className="text-xs text-gray-500 font-medium text-center">
                                +{eventsForDay.length - 3} altri
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Prossimi Eventi</h2>
              <div className="space-y-3">
                {calendarEvents
                  .filter(event => {
                    if (filterType !== 'all' && event.type !== filterType) return false;
                    if (filterSubject !== 'all' && event.subject !== filterSubject) return false;
                    return event.date >= today;
                  })
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 20)
                  .map(event => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border-2 hover:shadow-md transition-all ${
                        getEventTypeStyle(event.type)
                      } ${event.completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Checkbox for completable events */}
                          {(event.type === 'exam' || event.type === 'homework') && (
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={event.completed}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleEventComplete(event);
                                }}
                                className="w-5 h-5 text-green-600 rounded cursor-pointer"
                              />
                            </div>
                          )}
                          <div 
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventDetail(true);
                            }}
                          >
                            {getEventIcon(event.type)}
                          </div>
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEventDetail(true);
                            }}
                          >
                            <h3 className={`font-semibold text-gray-900 ${
                              event.completed ? 'line-through' : ''
                            }`}>
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                              <span>{event.subject}</span>
                              <span>•</span>
                              <span>{event.date.toLocaleDateString('it-IT')}</span>
                              {event.estimatedHours && (
                                <>
                                  <span>•</span>
                                  <span>{event.estimatedHours}h</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.priority === 'high' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Alta priorità
                            </span>
                          )}
                          {event.difficulty && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                              event.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {event.difficulty === 'hard' ? 'Difficile' :
                               event.difficulty === 'medium' ? 'Medio' : 'Facile'}
                            </span>
                          )}
                          {/* Quick action buttons */}
                          {(event.type === 'exam' || event.type === 'homework') && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventEdit(event);
                                }}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                title="Modifica"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                                    handleEventDelete(event);
                                  }
                                }}
                                className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                title="Elimina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Day Events Panel - Shows all events for selected day */}
        {showDayPanel && selectedDate && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {getEventsForDate(selectedDate).length} eventi programmati
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDayPanel(false);
                      setSelectedDate(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Events List */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-4">
                    {/* Group events by type */}
                    {['exam', 'homework', 'exam-prep', 'review', 'study'].map(type => {
                      const eventsOfType = getEventsForDate(selectedDate).filter(e => e.type === type);
                      if (eventsOfType.length === 0) return null;
                      
                      return (
                        <div key={type} className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            {getEventIcon(type as CalendarEvent['type'])}
                            <span>
                              {type === 'exam' ? 'Verifiche' :
                               type === 'homework' ? 'Compiti' :
                               type === 'exam-prep' ? 'Preparazione Verifiche' :
                               type === 'review' ? 'Ripasso' : 'Studio'}
                            </span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              {eventsOfType.length}
                            </span>
                          </h3>
                          
                          <div className="space-y-3">
                            {eventsOfType.map(event => (
                              <div
                                key={event.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${
                                  getEventTypeStyle(event.type)
                                } ${event.completed ? 'opacity-60' : ''}`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventDetail(true);
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className={`font-semibold text-gray-900 mb-1 ${
                                      event.completed ? 'line-through' : ''
                                    }`}>
                                      {event.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        {event.subject}
                                      </span>
                                      {event.estimatedHours && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {event.estimatedHours}h
                                        </span>
                                      )}
                                      {event.description && (
                                        <span className="text-gray-500 italic">
                                          {event.description}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 mt-3">
                                      {!event.completed && (event.type === 'exam' || event.type === 'homework') && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventComplete(event);
                                          }}
                                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                          Completa
                                        </button>
                                      )}
                                      {(event.type === 'exam' || event.type === 'homework') && (
                                        <>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEventEdit(event);
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                            Modifica
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                                                handleEventDelete(event);
                                              }
                                            }}
                                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-1"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            Elimina
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    {event.priority === 'high' && (
                                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                        Alta priorità
                                      </span>
                                    )}
                                    {event.difficulty && (
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        event.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                        event.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {event.difficulty === 'hard' ? 'Difficile' :
                                         event.difficulty === 'medium' ? 'Media' : 'Facile'}
                                      </span>
                                    )}
                                    {event.completed && (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun evento programmato per questo giorno</p>
                  </div>
                )}
              </div>
              
              {/* Footer with actions */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {getEventsForDate(selectedDate).filter(e => e.completed).length} di {getEventsForDate(selectedDate).length} completati
                  </div>
                  <button
                    onClick={() => {
                      setShowDayPanel(false);
                      setSelectedDate(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Detail Modal */}
        {showEventDetail && selectedEvent && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dettagli Evento</h3>
                <button
                  onClick={() => {
                    setShowEventDetail(false);
                    setSelectedEvent(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Titolo</p>
                  <p className="font-medium text-gray-900">{selectedEvent.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tipo</p>
                    <div className="flex items-center gap-2">
                      {getEventIcon(selectedEvent.type)}
                      <span className="text-gray-900">
                        {selectedEvent.type === 'exam' ? 'Verifica' :
                         selectedEvent.type === 'homework' ? 'Compito' :
                         selectedEvent.type === 'exam-prep' ? 'Preparazione' :
                         selectedEvent.type === 'review' ? 'Ripasso' : 'Studio'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Materia</p>
                    <p className="text-gray-900">{selectedEvent.subject}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data</p>
                    <p className="text-gray-900">
                      {selectedEvent.date.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Priorità</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.priority === 'high' ? 'bg-red-100 text-red-700' :
                      selectedEvent.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedEvent.priority === 'high' ? 'Alta' :
                       selectedEvent.priority === 'medium' ? 'Media' : 'Bassa'}
                    </span>
                  </div>
                </div>

                {selectedEvent.estimatedHours && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tempo stimato</p>
                    <p className="text-gray-900">{selectedEvent.estimatedHours} ore</p>
                  </div>
                )}

                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Descrizione</p>
                    <p className="text-gray-900">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.difficulty && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Difficoltà</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                      selectedEvent.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedEvent.difficulty === 'hard' ? 'Difficile' :
                       selectedEvent.difficulty === 'medium' ? 'Media' : 'Facile'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {/* Action buttons based on event type */}
                {(selectedEvent.type === 'exam' || selectedEvent.type === 'homework') && (
                  <div className="flex gap-3">
                    {!selectedEvent.completed && (
                      <button
                        onClick={() => {
                          handleEventComplete(selectedEvent);
                          setShowEventDetail(false);
                          setSelectedEvent(null);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Segna come Completato
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleEventEdit(selectedEvent);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-5 h-5" />
                      Modifica
                    </button>
                  </div>
                )}
                
                <div className="flex gap-3">
                  {(selectedEvent.type === 'exam' || selectedEvent.type === 'homework') && (
                    <button
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                          handleEventDelete(selectedEvent);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Elimina
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEventDetail(false);
                      setSelectedEvent(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Verifica</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Compito</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Preparazione</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Ripasso</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Studio</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Alta priorità</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}