'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Brain, 
  Calendar, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Sparkles,
  BookOpen,
  School,
  Plus,
  X,
  Edit2,
  Save,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { getExams, saveWeeklyPlan, getSubjects, getTopics, getTopicsBySubject } from '@/lib/storage';
import { getOptimalStudyPlan, getTodayLessons, getWeeklyHoursBySubject } from '@/lib/schedule-helpers';
import { formatDate } from '@/lib/utils';

interface StudySlot {
  time: string;
  subject: string;
  topic: string;
  topicId?: string; // ID of the selected topic from the database
  duration: number;
  priority: 'high' | 'medium' | 'low';
  type: 'review' | 'exercise' | 'study' | 'preparation';
}

interface DayPlan {
  date: Date;
  dayName: string;
  lessons: any[];
  studySlots: StudySlot[];
  freeTime: number;
}

export default function SmartPlanPage() {
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [studyGoals, setStudyGoals] = useState<{ [subject: string]: number }>({});
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [customTask, setCustomTask] = useState<StudySlot>({
    time: '',
    subject: '',
    topic: '',
    topicId: '',
    duration: 30,
    priority: 'medium',
    type: 'study'
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  useEffect(() => {
    generateSmartPlan();
    setSubjects(getSubjects());
    setAllTopics(getTopics()); // Load all topics for display
  }, []);

  useEffect(() => {
    if (customTask.subject) {
      const topics = getTopicsBySubject(customTask.subject);
      setAvailableTopics(topics);
    } else {
      setAvailableTopics([]);
    }
  }, [customTask.subject]);

  const generateSmartPlan = () => {
    const exams = getExams().filter(e => e.status === 'pending');
    setUpcomingExams(exams);

    // Get optimal study time for each subject
    const optimalPlan = getOptimalStudyPlan(exams);
    setStudyGoals(optimalPlan);

    // Generate weekly plan
    const plan: DayPlan[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayPlan = generateDayPlan(date, exams, optimalPlan);
      plan.push(dayPlan);
    }

    setWeekPlan(plan);
  };

  const generateDayPlan = (date: Date, exams: any[], studyGoals: { [subject: string]: number }): DayPlan => {
    const dayIndex = date.getDay();
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    
    // Get today's lessons (mock for now, should come from schedule)
    const lessons = getTodayLessons();
    
    // Calculate available study time
    let freeTime = 0;
    const studySlots: StudySlot[] = [];
    
    if (dayIndex === 0) {
      // Sunday - more free time
      freeTime = 240; // 4 hours
      
      // Morning study session
      studySlots.push({
        time: '9:00-11:00',
        subject: 'Varie',
        topic: 'Ripasso settimanale e preparazione',
        duration: 120,
        priority: 'high',
        type: 'preparation'
      });
      
      // Afternoon session
      studySlots.push({
        time: '15:00-17:00',
        subject: 'Focus materia principale',
        topic: 'Studio approfondito',
        duration: 120,
        priority: 'medium',
        type: 'study'
      });
    } else if (dayIndex === 6) {
      // Saturday - moderate free time
      freeTime = 180; // 3 hours
      
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
    } else {
      // Weekdays - after school
      freeTime = 150; // 2.5 hours
      
      // Immediate review of today's lessons
      studySlots.push({
        time: '14:30-15:30',
        subject: 'Ripasso del giorno',
        topic: 'Ripasso lezioni mattutine',
        duration: 60,
        priority: 'high',
        type: 'review'
      });
      
      // Main study session
      const prioritySubject = getPrioritySubject(date, exams);
      studySlots.push({
        time: '16:00-17:30',
        subject: prioritySubject,
        topic: 'Studio/Esercizi',
        duration: 90,
        priority: getExamPriority(prioritySubject, exams),
        type: 'study'
      });
    }
    
    return {
      date,
      dayName: dayNames[dayIndex],
      lessons,
      studySlots,
      freeTime
    };
  };

  const getPrioritySubject = (date: Date, exams: any[]): string => {
    // Find exams within 7 days
    const urgentExams = exams.filter(e => {
      const daysUntil = Math.ceil((new Date(e.date).getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 7;
    });
    
    if (urgentExams.length > 0) {
      // Get topics for the most urgent exam
      const exam = urgentExams[0];
      const allTopics = getTopics();
      const examTopics = exam.topics.map((topicId: string) => {
        const topic = allTopics.find(t => t.id === topicId);
        return topic;
      }).filter(Boolean);
      
      // Prioritize subjects with difficult topics
      const hasDifficultTopics = examTopics.some((t: any) => t.difficulty === 'hard');
      const subjectPrefix = hasDifficultTopics ? '🔴 ' : '';
      
      return `${subjectPrefix}${exam.subject}`;
    }
    
    // Default rotation based on day
    const subjects = ['Matematica', 'Informatica', 'Sistemi e Reti', 'TPSIT', 'Italiano e Storia'];
    return subjects[date.getDay() % subjects.length];
  };

  const getExamPriority = (subject: string, exams: any[]): 'high' | 'medium' | 'low' => {
    const exam = exams.find(e => e.subject === subject);
    if (!exam) return 'low';
    
    const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 3) return 'high';
    if (daysUntil <= 7) return 'medium';
    return 'low';
  };

  const handleAddCustomTask = () => {
    if (!customTask.time || !customTask.subject) {
      toast.error('Inserisci almeno orario e materia');
      return;
    }

    const updatedPlan = [...weekPlan];
    if (currentDayPlan) {
      const dayIndex = selectedDay - 1;
      if (editingSlot !== null) {
        // Edit existing slot
        updatedPlan[dayIndex].studySlots[editingSlot] = { ...customTask };
        toast.success('✏️ Attività modificata');
      } else {
        // Add new slot
        updatedPlan[dayIndex].studySlots.push({ ...customTask });
        toast.success('✅ Attività personalizzata aggiunta');
      }
      
      // Sort slots by time
      updatedPlan[dayIndex].studySlots.sort((a, b) => {
        const timeA = a.time.split('-')[0];
        const timeB = b.time.split('-')[0];
        return timeA.localeCompare(timeB);
      });
      
      setWeekPlan(updatedPlan);
    }

    // Reset form
    setShowAddTaskModal(false);
    setEditingSlot(null);
    setCustomTask({
      time: '',
      subject: '',
      topic: '',
      topicId: '',
      duration: 30,
      priority: 'medium',
      type: 'study'
    });
  };

  const handleEditSlot = (index: number) => {
    if (currentDayPlan) {
      const slot = currentDayPlan.studySlots[index];
      setCustomTask({ ...slot });
      setEditingSlot(index);
      setShowAddTaskModal(true);
    }
  };

  const handleDeleteSlot = (index: number) => {
    const updatedPlan = [...weekPlan];
    const dayIndex = selectedDay - 1;
    updatedPlan[dayIndex].studySlots.splice(index, 1);
    setWeekPlan(updatedPlan);
    toast.success('🗑️ Attività rimossa');
  };

  const currentDayPlan = weekPlan[selectedDay - 1];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Piano Studio Intelligente</h1>
          </div>
          <p className="text-gray-600">
            Piano personalizzato basato sul tuo orario, verifiche imminenti e tempo disponibile
          </p>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Analisi Intelligente</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-purple-100 text-sm mb-1">Verifiche prossime</p>
              <p className="text-2xl font-bold">{upcomingExams.length}</p>
              {upcomingExams.length > 0 && (
                <p className="text-xs text-purple-100 mt-1">
                  Prossima: {upcomingExams[0]?.subject} ({Math.ceil((new Date(upcomingExams[0]?.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}g)
                </p>
              )}
            </div>
            
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-purple-100 text-sm mb-1">Ore studio consigliate/settimana</p>
              <p className="text-2xl font-bold">
                {Object.values(studyGoals).reduce((a, b) => a + b, 0) / 60 | 0}h
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-purple-100 text-sm mb-1">Focus principale</p>
              <p className="text-xl font-bold">
                {Object.entries(studyGoals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Study Time Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Studio Ottimale</h3>
          <div className="space-y-3">
            {Object.entries(studyGoals)
              .sort((a, b) => b[1] - a[1])
              .map(([subject, minutes]) => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const percentage = (minutes / Math.max(...Object.values(studyGoals))) * 100;
                
                return (
                  <div key={subject} className="flex items-center gap-4">
                    <div className="w-32 font-medium text-gray-700">{subject}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Week Days Selector */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
          <div className="grid grid-cols-7 gap-1">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => {
              const dayPlan = weekPlan[index];
              const hasExam = upcomingExams.some(e => 
                new Date(e.date).toDateString() === dayPlan?.date.toDateString()
              );
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index + 1)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    index + 1 === selectedDay 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100'
                  } ${hasExam ? 'ring-2 ring-red-500' : ''}`}
                >
                  <div className="text-xs font-medium">{day}</div>
                  <div className="text-lg font-bold">{dayPlan?.date.getDate()}</div>
                  {hasExam && (
                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Plan Details */}
        {currentDayPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Morning Lessons */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <School className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Lezioni Mattutine</h3>
              </div>
              
              {currentDayPlan.lessons.length > 0 ? (
                <div className="space-y-2">
                  {currentDayPlan.lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{lesson.subject}</p>
                        <p className="text-sm text-gray-500">{lesson.room}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {lesson.startTime} - {lesson.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nessuna lezione</p>
              )}
            </div>

            {/* Afternoon Study Plan */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Piano Studio Pomeridiano</h3>
                </div>
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
              
              <div className="space-y-3">
                {currentDayPlan.studySlots.map((slot, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border-l-4 relative group ${
                      slot.priority === 'high' 
                        ? 'bg-red-50 border-red-500' 
                        : slot.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-green-50 border-green-500'
                    }`}
                  >
                    {/* Edit/Delete buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditSlot(idx)}
                        className="p-1.5 bg-white rounded hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(idx)}
                        className="p-1.5 bg-white rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                    
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{slot.subject}</p>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">{slot.topic}</p>
                          {slot.topicId && (() => {
                            const topic = allTopics.find(t => t.id === slot.topicId);
                            return topic ? (
                              <div className="flex items-center gap-2 mt-1">
                                {topic.difficulty === 'hard' && (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Difficile</span>
                                )}
                                {topic.difficulty === 'medium' && (
                                  <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Medio</span>
                                )}
                                {topic.difficulty === 'easy' && (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Facile</span>
                                )}
                                {topic.markedForExam && (
                                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">In verifica</span>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {slot.time}
                      </div>
                      <div>
                        {slot.duration} minuti
                      </div>
                    </div>
                  </div>
                ))}
                
                {currentDayPlan.studySlots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nessuna attività pianificata</p>
                    <p className="text-sm mt-1">Clicca "Aggiungi" per creare il tuo piano personalizzato</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Suggerimento:</strong> Questo piano è ottimizzato per le tue verifiche e il tuo orario. 
                  Adattalo secondo le tue esigenze!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Consigli Personalizzati per Questa Settimana
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.slice(0, 2).map(exam => {
              const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const allTopics = getTopics();
              const examTopicTitles = exam.topics.map((topicId: string) => {
                const topic = allTopics.find(t => t.id === topicId);
                return topic ? topic.title : topicId;
              });
              
              return (
                <div key={exam.id} className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {exam.subject} tra {daysUntil} giorni
                    </p>
                    <p className="text-sm text-gray-600">
                      Dedica almeno {Math.round(studyGoals[exam.subject] / 60) || 1} ore questa settimana.
                      Focus su: {examTopicTitles.join(', ')}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {upcomingExams.length === 0 && (
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Nessuna verifica imminente</p>
                  <p className="text-sm text-gray-600">
                    Ottimo momento per consolidare gli argomenti e fare esercizi extra!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSlot !== null ? 'Modifica Attività' : 'Aggiungi Attività Personalizzata'}
              </h3>
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setEditingSlot(null);
                  setCustomTask({
                    time: '',
                    subject: '',
                    topic: '',
                    topicId: '',
                    duration: 30,
                    priority: 'medium',
                    type: 'study'
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orario (es. 15:00-16:00)
                </label>
                <input
                  type="text"
                  value={customTask.time}
                  onChange={(e) => setCustomTask({ ...customTask, time: e.target.value })}
                  placeholder="15:00-16:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materia *
                </label>
                <select
                  value={customTask.subject}
                  onChange={(e) => {
                    setCustomTask({ 
                      ...customTask, 
                      subject: e.target.value,
                      topic: '', // Reset topic when subject changes
                      topicId: ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleziona materia...</option>
                  {subjects.map(subject => (
                    <option key={subject.name} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Argomento/Descrizione
                </label>
                
                {customTask.subject ? (
                  <div className="space-y-2">
                    {/* Predefined topics from database */}
                    {availableTopics.length > 0 && (
                      <div>
                        <select
                          value={customTask.topicId || ''}
                          onChange={(e) => {
                            const selectedTopic = availableTopics.find(t => t.id === e.target.value);
                            setCustomTask({ 
                              ...customTask, 
                              topicId: e.target.value,
                              topic: selectedTopic ? selectedTopic.title : customTask.topic
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleziona un argomento registrato...</option>
                          {availableTopics.map(topic => (
                            <option key={topic.id} value={topic.id}>
                              {topic.title}
                              {topic.difficulty === 'hard' && ' 🔴'}
                              {topic.difficulty === 'medium' && ' 🟡'}
                              {topic.difficulty === 'easy' && ' 🟢'}
                              {topic.markedForExam && ' 📝'}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500">oppure</p>
                      </div>
                    )}
                    
                    {/* Custom topic input */}
                    <input
                      type="text"
                      value={customTask.topicId ? '' : customTask.topic}
                      onChange={(e) => setCustomTask({ 
                        ...customTask, 
                        topic: e.target.value,
                        topicId: '' // Clear topicId if user types custom topic
                      })}
                      placeholder="Descrizione personalizzata (es. Ripasso capitolo 5, Esercizi pag. 120...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!!customTask.topicId}
                    />
                    
                    {availableTopics.length === 0 && (
                      <p className="text-xs text-gray-500 italic">
                        Nessun argomento registrato per questa materia. 
                        Vai nella sezione Materie per aggiungere argomenti.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Seleziona prima una materia</p>
                )}
              </div>

              {/* Duration Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durata (minuti)
                </label>
                <input
                  type="number"
                  value={customTask.duration}
                  onChange={(e) => setCustomTask({ ...customTask, duration: parseInt(e.target.value) || 30 })}
                  min="15"
                  max="180"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo di Attività
                </label>
                <select
                  value={customTask.type}
                  onChange={(e) => setCustomTask({ ...customTask, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="study">Studio</option>
                  <option value="review">Ripasso</option>
                  <option value="exercise">Esercizi</option>
                  <option value="preparation">Preparazione</option>
                </select>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorità
                </label>
                <select
                  value={customTask.priority}
                  onChange={(e) => setCustomTask({ ...customTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Bassa 🔵</option>
                  <option value="medium">Media 🟡</option>
                  <option value="high">Alta 🔴</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setEditingSlot(null);
                  setCustomTask({
                    time: '',
                    subject: '',
                    topic: '',
                    topicId: '',
                    duration: 30,
                    priority: 'medium',
                    type: 'study'
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleAddCustomTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingSlot !== null ? 'Salva Modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
