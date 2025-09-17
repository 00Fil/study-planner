'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  BookOpen, 
  Plus, 
  Clock, 
  TrendingUp, 
  Calendar,
  X,
  ChevronRight,
  Award,
  Check,
  Edit2,
  Trash2,
  Star,
  AlertCircle,
  FileText,
  CheckCircle2,
  History,
  Save,
  ChevronDown,
  ChevronUp,
  School,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getSubjects, 
  saveSubject,
  deleteSubject, 
  getTopicsBySubject, 
  saveTopic, 
  deleteTopic,
  getExams,
  getPomodoroSessions 
} from '@/lib/storage';
import { getTodayLessons } from '@/lib/schedule-helpers';
import { Subject, Topic, Exam } from '@/lib/types';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [newTopic, setNewTopic] = useState<Partial<Topic>>({
    title: '',
    description: '',
    difficulty: 'medium',
    importance: 'medium',
    notes: ''
  });
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, any>>({});
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [showManageSubjectsModal, setShowManageSubjectsModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: '',
    displayName: '',
    professor: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject);
    }
  }, [selectedSubject]);

  const loadData = () => {
    const loadedSubjects = getSubjects();
    setSubjects(loadedSubjects);
    
    const exams = getExams().filter(e => e.status === 'pending');
    setUpcomingExams(exams);
    
    calculateStats(loadedSubjects);
  };

  const loadTopics = (subjectName: string) => {
    const subjectTopics = getTopicsBySubject(subjectName);
    setTopics(subjectTopics);
  };

  const calculateStats = (subjectList: Subject[]) => {
    const sessions = getPomodoroSessions();
    const exams = getExams();
    const allTopics = topics;
    const stats: Record<string, any> = {};

    subjectList.forEach(subject => {
      const subjectTopics = getTopicsBySubject(subject.name);
      const subjectSessions = sessions.filter(s => s.subject === subject.name && s.completed);
      const totalMinutes = subjectSessions.reduce((acc, s) => acc + s.duration, 0);
      
      const subjectExams = exams.filter(e => e.subject === subject.name && e.status === 'completed' && e.grade);
      const avgGrade = subjectExams.length > 0 
        ? subjectExams.reduce((acc, e) => {
            const gradeNum = parseFloat((e.grade || '0').replace(',', '.').replace(/[+\-]/g, ''));
            return acc + (isNaN(gradeNum) ? 0 : gradeNum);
          }, 0) / subjectExams.length
        : 0;

      const completedTopics = subjectTopics.filter(t => t.completed).length;
      const totalTopics = subjectTopics.length;
      const markedForExam = subjectTopics.filter(t => t.markedForExam).length;

      stats[subject.name] = {
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        averageGrade: Math.round(avgGrade * 10) / 10,
        totalTopics,
        completedTopics,
        markedForExam,
        completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        upcomingExams: exams.filter(e => e.subject === subject.name && e.status === 'pending').length
      };
    });

    setSubjectStats(stats);
  };

  const handleAddTopic = () => {
    if (!selectedSubject || !newTopic.title) {
      toast.error('Inserisci almeno il titolo dell\'argomento');
      return;
    }

    const topic: Topic = {
      id: Date.now().toString(),
      subjectName: selectedSubject,
      title: newTopic.title,
      description: newTopic.description,
      dateAdded: new Date().toISOString(),
      completed: false,
      difficulty: newTopic.difficulty || 'medium',
      importance: newTopic.importance || 'medium',
      notes: newTopic.notes,
      markedForExam: false
    };

    saveTopic(topic);
    loadTopics(selectedSubject);
    calculateStats(subjects);
    setShowAddTopicModal(false);
    setNewTopic({
      title: '',
      description: '',
      difficulty: 'medium',
      importance: 'medium',
      notes: ''
    });
    toast.success('Argomento aggiunto');
  };

  const handleUpdateTopic = (topic: Topic) => {
    saveTopic(topic);
    loadTopics(selectedSubject!);
    calculateStats(subjects);
    setEditingTopic(null);
    toast.success('Argomento aggiornato');
  };

  const handleDeleteTopic = (topicId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo argomento?')) {
      deleteTopic(topicId);
      loadTopics(selectedSubject!);
      calculateStats(subjects);
      toast.success('Argomento eliminato');
    }
  };

  const handleToggleCompletion = (topic: Topic) => {
    const updated = { 
      ...topic, 
      completed: !topic.completed,
      dateStudied: !topic.completed ? new Date().toISOString() : topic.dateStudied
    };
    saveTopic(updated);
    loadTopics(selectedSubject!);
    calculateStats(subjects);
  };

  const handleToggleExamMark = (topic: Topic) => {
    const updated = { ...topic, markedForExam: !topic.markedForExam };
    saveTopic(updated);
    loadTopics(selectedSubject!);
    calculateStats(subjects);
    toast.success(updated.markedForExam ? 'Argomento marcato per verifica' : 'Argomento rimosso dalla verifica');
  };

  const toggleSubjectExpansion = (subjectName: string) => {
    if (expandedSubjects.includes(subjectName)) {
      setExpandedSubjects(expandedSubjects.filter(s => s !== subjectName));
      if (selectedSubject === subjectName) {
        setSelectedSubject(null);
      }
    } else {
      setExpandedSubjects([...expandedSubjects, subjectName]);
      setSelectedSubject(subjectName);
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.displayName) {
      toast.error('Inserisci il nome della materia');
      return;
    }

    const subject: Subject = {
      name: newSubject.name,
      displayName: newSubject.displayName,
      professor: newSubject.professor || '',
      color: newSubject.color || '#3B82F6',
      currentTopic: '',
      lastStudied: '',
      totalHours: 0,
      averageGrade: 0,
      topics: [],
      examGrades: []
    };

    saveSubject(subject);
    loadData();
    setShowManageSubjectsModal(false);
    setNewSubject({
      name: '',
      displayName: '',
      professor: '',
      color: '#3B82F6'
    });
    toast.success('Materia aggiunta');
  };

  const handleUpdateSubject = (subject: Subject) => {
    saveSubject(subject);
    loadData();
    setEditingSubject(null);
    toast.success('Materia aggiornata');
  };

  const handleDeleteSubject = (subjectName: string) => {
    if (confirm('Sei sicuro di voler eliminare questa materia? Verranno eliminati anche tutti gli argomenti collegati.')) {
      deleteSubject(subjectName);
      loadData();
      toast.success('Materia eliminata');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Materie e Argomenti</h1>
              <p className="text-gray-600">Organizza gli argomenti di studio e prepara le verifiche</p>
            </div>
            <button
              onClick={() => setShowManageSubjectsModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <School className="w-5 h-5" />
              Gestisci Materie
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.length}
                </p>
                <p className="text-sm text-gray-600">Materie Totali</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(subjectStats).reduce((acc, s) => acc + (s.totalTopics || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Argomenti Totali</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(subjectStats).reduce((acc, s) => acc + (s.completedTopics || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Argomenti Completati</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(subjectStats).reduce((acc, s) => acc + (s.markedForExam || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">In Verifica</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects List with Topics */}
        <div className="space-y-4">
          {subjects.map(subject => {
            const isExpanded = expandedSubjects.includes(subject.name);
            const stats = subjectStats[subject.name] || {};
            const subjectTopics = isExpanded ? topics : [];
            const examCount = upcomingExams.filter(e => e.subject === subject.name).length;

            return (
              <div key={subject.name} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Subject Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSubjectExpansion(subject.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${subject.color}20` }}
                      >
                        <BookOpen className="w-6 h-6" style={{ color: subject.color }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.displayName || subject.name}</h3>
                        {subject.professor && (
                          <p className="text-sm text-gray-500">Prof. {subject.professor}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{stats.totalTopics || 0} argomenti</span>
                          <span>{stats.completedTopics || 0} completati</span>
                          {examCount > 0 && (
                            <span className="text-orange-600 font-medium">
                              {examCount} {examCount === 1 ? 'verifica' : 'verifiche'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Progress Bar */}
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Completamento</span>
                          <span>{stats.completionRate || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.completionRate || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Average Grade */}
                      {stats.averageGrade > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Media</p>
                          <p className={`text-lg font-bold ${
                            stats.averageGrade >= 8 ? 'text-green-600' :
                            stats.averageGrade >= 6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {stats.averageGrade}
                          </p>
                        </div>
                      )}
                      
                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Topics Section (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Storico Argomenti</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubject(subject.name);
                            setShowAddTopicModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Aggiungi Argomento
                        </button>
                      </div>

                      {subjectTopics.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Nessun argomento registrato</p>
                          <p className="text-sm mt-1">Inizia ad aggiungere gli argomenti studiati</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {subjectTopics.map(topic => (
                            <div 
                              key={topic.id}
                              className={`p-3 rounded-lg border transition-all ${
                                topic.completed 
                                  ? 'bg-green-50 border-green-200' 
                                  : topic.markedForExam
                                  ? 'bg-orange-50 border-orange-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <button
                                      onClick={() => handleToggleCompletion(topic)}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        topic.completed 
                                          ? 'bg-green-500 border-green-500' 
                                          : 'border-gray-300 hover:border-blue-500'
                                      }`}
                                    >
                                      {topic.completed && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                    
                                    <span className={`font-medium ${topic.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {topic.title}
                                    </span>
                                    
                                    <span className="text-lg">{getImportanceIcon(topic.importance)}</span>
                                    
                                    <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(topic.difficulty)}`}>
                                      {topic.difficulty === 'easy' ? 'Facile' : 
                                       topic.difficulty === 'medium' ? 'Medio' : 'Difficile'}
                                    </span>
                                    
                                    {topic.markedForExam && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-medium">
                                        📝 In Verifica
                                      </span>
                                    )}
                                  </div>
                                  
                                  {topic.description && (
                                    <p className="text-sm text-gray-600 ml-7">{topic.description}</p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-7">
                                    <span>📅 Aggiunto: {new Date(topic.dateAdded).toLocaleDateString('it-IT')}</span>
                                    {topic.dateStudied && (
                                      <span>✅ Studiato: {new Date(topic.dateStudied).toLocaleDateString('it-IT')}</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-4">
                                  <button
                                    onClick={() => handleToggleExamMark(topic)}
                                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                                      topic.markedForExam ? 'text-orange-600' : 'text-gray-400'
                                    }`}
                                    title="Marca per verifica"
                                  >
                                    <Target className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => setEditingTopic(topic)}
                                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4 text-gray-600" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    className="p-1.5 rounded hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                              
                              {topic.notes && (
                                <div className="mt-2 ml-7 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                                  📝 {topic.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add/Edit Topic Modal */}
        {(showAddTopicModal || editingTopic) && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTopic ? 'Modifica Argomento' : 'Aggiungi Nuovo Argomento'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddTopicModal(false);
                    setEditingTopic(null);
                    setNewTopic({
                      title: '',
                      description: '',
                      difficulty: 'medium',
                      importance: 'medium',
                      notes: ''
                    });
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titolo Argomento *
                  </label>
                  <input
                    type="text"
                    value={editingTopic ? editingTopic.title : newTopic.title}
                    onChange={(e) => {
                      if (editingTopic) {
                        setEditingTopic({ ...editingTopic, title: e.target.value });
                      } else {
                        setNewTopic({ ...newTopic, title: e.target.value });
                      }
                    }}
                    placeholder="Es: Equazioni di secondo grado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={editingTopic ? editingTopic.description : newTopic.description}
                    onChange={(e) => {
                      if (editingTopic) {
                        setEditingTopic({ ...editingTopic, description: e.target.value });
                      } else {
                        setNewTopic({ ...newTopic, description: e.target.value });
                      }
                    }}
                    placeholder="Dettagli sull'argomento..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficoltà
                    </label>
                    <select
                      value={editingTopic ? editingTopic.difficulty : newTopic.difficulty}
                      onChange={(e) => {
                        const value = e.target.value as 'easy' | 'medium' | 'hard';
                        if (editingTopic) {
                          setEditingTopic({ ...editingTopic, difficulty: value });
                        } else {
                          setNewTopic({ ...newTopic, difficulty: value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="easy">Facile</option>
                      <option value="medium">Medio</option>
                      <option value="hard">Difficile</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importanza
                    </label>
                    <select
                      value={editingTopic ? editingTopic.importance : newTopic.importance}
                      onChange={(e) => {
                        const value = e.target.value as 'low' | 'medium' | 'high';
                        if (editingTopic) {
                          setEditingTopic({ ...editingTopic, importance: value });
                        } else {
                          setNewTopic({ ...newTopic, importance: value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Bassa 🔵</option>
                      <option value="medium">Media 🟡</option>
                      <option value="high">Alta 🔴</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={editingTopic ? editingTopic.notes : newTopic.notes}
                    onChange={(e) => {
                      if (editingTopic) {
                        setEditingTopic({ ...editingTopic, notes: e.target.value });
                      } else {
                        setNewTopic({ ...newTopic, notes: e.target.value });
                      }
                    }}
                    placeholder="Note aggiuntive..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {editingTopic && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="markedForExam"
                      checked={editingTopic.markedForExam || false}
                      onChange={(e) => setEditingTopic({ ...editingTopic, markedForExam: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="markedForExam" className="text-sm text-gray-700">
                      Marca questo argomento per la prossima verifica
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddTopicModal(false);
                    setEditingTopic(null);
                    setNewTopic({
                      title: '',
                      description: '',
                      difficulty: 'medium',
                      importance: 'medium',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    if (editingTopic) {
                      handleUpdateTopic(editingTopic);
                    } else {
                      handleAddTopic();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingTopic ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Subjects Modal */}
        {showManageSubjectsModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Gestione Materie</h3>
                <button
                  onClick={() => {
                    setShowManageSubjectsModal(false);
                    setEditingSubject(null);
                    setNewSubject({
                      name: '',
                      displayName: '',
                      professor: '',
                      color: '#3B82F6'
                    });
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Add New Subject Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Aggiungi Nuova Materia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Materia (Interno) *
                    </label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      placeholder="Es: MATEMATICA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Visualizzato *
                    </label>
                    <input
                      type="text"
                      value={newSubject.displayName}
                      onChange={(e) => setNewSubject({ ...newSubject, displayName: e.target.value })}
                      placeholder="Es: Matematica"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Professore
                    </label>
                    <input
                      type="text"
                      value={newSubject.professor}
                      onChange={(e) => setNewSubject({ ...newSubject, professor: e.target.value })}
                      placeholder="Es: Mario Rossi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colore
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={newSubject.color}
                        onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newSubject.color}
                        onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleAddSubject}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Materia
                </button>
              </div>

              {/* Existing Subjects List */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Materie Esistenti</h4>
                <div className="space-y-2">
                  {subjects.map(subject => (
                    <div key={subject.name} className="bg-white border border-gray-200 rounded-lg p-4">
                      {editingSubject?.name === subject.name ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Visualizzato
                              </label>
                              <input
                                type="text"
                                value={editingSubject.displayName || editingSubject.name}
                                onChange={(e) => setEditingSubject({ ...editingSubject, displayName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Professore
                              </label>
                              <input
                                type="text"
                                value={editingSubject.professor || ''}
                                onChange={(e) => setEditingSubject({ ...editingSubject, professor: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Colore
                              </label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={editingSubject.color}
                                  onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={editingSubject.color}
                                  onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateSubject(editingSubject)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Salva
                            </button>
                            <button
                              onClick={() => setEditingSubject(null)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${subject.color}20` }}
                            >
                              <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{subject.displayName || subject.name}</p>
                              {subject.professor && (
                                <p className="text-sm text-gray-500">Prof. {subject.professor}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">ID: {subject.name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingSubject(subject)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject.name)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Il "Nome Materia (Interno)" è utilizzato dal sistema per identificare univocamente la materia.
                  Se stai importando dati da ClasseViva, usa lo stesso nome che appare nel registro elettronico.
                  Il "Nome Visualizzato" è quello che vedrai nell'applicazione e può essere personalizzato.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
