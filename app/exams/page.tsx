'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Plus, Calendar, Clock, AlertCircle, Edit2, Trash2, CheckCircle, ChevronDown, Check, X, Target, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { getExams, saveExam, deleteExam, getSubjects, getTopicsBySubject, markTopicsForExam, unmarkTopicsForExam, getTopics } from '@/lib/storage';
import { getDaysUntilExam, getPriorityColor, parseGradeToNumber } from '@/lib/utils';
import { Exam, Subject, Topic } from '@/lib/types';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    date: '',
    type: 'written' as 'written' | 'oral',
    topics: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  useEffect(() => {
    loadExams();
    setSubjects(getSubjects());
  }, []);

  useEffect(() => {
    if (formData.subject) {
      const topics = getTopicsBySubject(formData.subject);
      setAvailableTopics(topics);
    } else {
      setAvailableTopics([]);
    }
  }, [formData.subject]);

  const loadExams = () => {
    const allExams = getExams();
    setExams(allExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.date) {
      toast.error('Compila tutti i campi richiesti');
      return;
    }

    if (selectedTopics.length === 0) {
      toast.error('Seleziona almeno un argomento per la verifica');
      return;
    }

    const exam: Exam = {
      id: editingExam?.id || Date.now().toString(),
      subject: formData.subject,
      date: formData.date,
      type: formData.type,
      topics: selectedTopics, // Now storing topic IDs
      priority: formData.priority,
      status: editingExam?.status || 'pending',
      grade: editingExam?.grade,
      notes: editingExam?.notes,
    };

    // Mark selected topics for this exam
    if (!editingExam) {
      markTopicsForExam(selectedTopics, exam.id);
    } else if (editingExam) {
      // Unmark old topics and mark new ones
      unmarkTopicsForExam(editingExam.topics, editingExam.id);
      markTopicsForExam(selectedTopics, exam.id);
    }

    saveExam(exam);
    loadExams();
    
    if (editingExam) {
      toast.success('Verifica aggiornata con successo');
    } else {
      toast.success('Verifica aggiunta con successo');
    }

    setShowAddModal(false);
    setEditingExam(null);
    setSelectedTopics([]);
    setFormData({
      subject: '',
      date: '',
      type: 'written',
      topics: '',
      priority: 'medium',
    });
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setSelectedTopics(exam.topics); // Topics are now IDs
    setFormData({
      subject: exam.subject,
      date: exam.date,
      type: exam.type,
      topics: '', // Not used anymore, using selectedTopics instead
      priority: exam.priority,
    });
    setShowAddModal(true);
  };

  const handleDelete = (examId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa verifica?')) {
      deleteExam(examId);
      loadExams();
      toast.success('Verifica eliminata');
    }
  };

  const handleMarkComplete = (exam: Exam, grade: string) => {
    const updatedExam = {
      ...exam,
      status: 'completed' as const,
      grade
    };
    saveExam(updatedExam);
    loadExams();
    toast.success('Verifica completata!');
  };

  const pendingExams = exams.filter(e => e.status === 'pending');
  const completedExams = exams.filter(e => e.status === 'completed');

  // Helper function to get topic titles from IDs
  const getTopicTitles = (topicIds: string[]) => {
    const allTopics = getTopics();
    return topicIds.map(id => {
      const topic = allTopics.find(t => t.id === id);
      return topic ? topic.title : id; // Fallback to ID if not found (for old data)
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verifiche ed Esami</h1>
            <p className="text-gray-600">Gestisci le tue verifiche e tieni traccia dei risultati</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Verifica
          </button>
        </div>

        {/* Upcoming Exams */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prossime Verifiche</h2>
          {pendingExams.length > 0 ? (
            <div className="grid gap-4">
              {pendingExams.map(exam => {
                const daysUntil = getDaysUntilExam(exam.date);
                const isUrgent = daysUntil <= 3;
                
                return (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${
                      isUrgent ? 'border-red-500' : 'border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{exam.subject}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(exam.priority)}`}>
                            {exam.priority === 'high' ? 'Alta' : exam.priority === 'medium' ? 'Media' : 'Bassa'}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {exam.type === 'written' ? 'Scritto' : 'Orale'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(exam.date).toLocaleDateString('it-IT', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {daysUntil === 0 ? (
                              <span className="text-red-600 font-semibold">Oggi!</span>
                            ) : daysUntil === 1 ? (
                              <span className="text-orange-600 font-semibold">Domani</span>
                            ) : (
                              <span>{daysUntil} giorni</span>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-700" title={getTopicTitles(exam.topics).join(', ')}>
                            <strong>Argomenti ({exam.topics.length}):</strong> 
                            <span className="cursor-help">
                              {(() => {
                                const titles = getTopicTitles(exam.topics);
                                if (titles.length > 3) {
                                  return `${titles.slice(0, 3).join(', ')}... e altri ${titles.length - 3}`;
                                }
                                return titles.join(', ');
                              })()}
                            </span>
                          </p>
                        </div>

                        {isUrgent && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Verifica imminente! Assicurati di essere preparato.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Grade Entry for Today's Exams */}
                    {daysUntil <= 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Verifica completata? Inserisci il voto:</p>
                        <div className="space-y-2">
                          <div className="flex gap-2 flex-wrap">
                            {['4', '4.5', '5', '5.5', '6', '6+', '6.5', '7', '7+', '7.5', '8', '8.5', '9', '9.5', '10'].map(grade => (
                              <button
                                key={grade}
                                onClick={() => handleMarkComplete(exam, grade)}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm"
                              >
                                {grade}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Voto personalizzato (es. 7+, 6.5)"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.currentTarget;
                                  if (input.value) {
                                    handleMarkComplete(exam, input.value);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nessuna verifica programmata</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aggiungi la tua prima verifica
              </button>
            </div>
          )}
        </div>

        {/* Completed Exams */}
        {completedExams.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verifiche Completate</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {completedExams.map(exam => (
                    <tr key={exam.id}>
                      <td className="px-6 py-4 max-w-xs">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{exam.subject}</div>
                          <div className="text-xs text-gray-500 break-words line-clamp-2">
                            {exam.topics.length > 3 
                              ? `${exam.topics.slice(0, 3).join(', ')}... (${exam.topics.length} argomenti)`
                              : exam.topics.join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(exam.date).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          {exam.type === 'written' ? 'Scritto' : 'Orale'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-semibold ${
                          exam.grade && parseGradeToNumber(exam.grade) >= 6 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {exam.grade || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Elimina verifica"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingExam ? 'Modifica Verifica' : 'Nuova Verifica'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Materia *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleziona materia</option>
                    {subjects.map(subject => (
                      <option key={subject.name} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="written"
                        checked={formData.type === 'written'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'written' | 'oral' })}
                        className="mr-2"
                      />
                      Scritto
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="oral"
                        checked={formData.type === 'oral'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'written' | 'oral' })}
                        className="mr-2"
                      />
                      Orale
                    </label>
                  </div>
                </div>

                {/* Topic Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Argomenti della Verifica *
                  </label>
                  
                  {formData.subject ? (
                    <div>
                      {availableTopics.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                          {availableTopics.map(topic => (
                            <label
                              key={topic.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTopics.includes(topic.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTopics([...selectedTopics, topic.id]);
                                  } else {
                                    setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{topic.title}</span>
                                  {topic.difficulty === 'hard' && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Difficile</span>}
                                  {topic.difficulty === 'medium' && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Medio</span>}
                                  {topic.difficulty === 'easy' && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Facile</span>}
                                  {topic.markedForExam && <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Già in verifica</span>}
                                </div>
                                {topic.description && (
                                  <p className="text-xs text-gray-600 mt-1">{topic.description}</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Nessun argomento registrato per questa materia</p>
                          <p className="text-xs mt-1">Vai nella sezione Materie per aggiungere argomenti</p>
                        </div>
                      )}
                      
                      {selectedTopics.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {selectedTopics.length} argomenti selezionati
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Seleziona prima una materia</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorità
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingExam ? 'Aggiorna' : 'Aggiungi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingExam(null);
                      setFormData({
                        subject: '',
                        date: '',
                        type: 'written',
                        topics: '',
                        priority: 'medium',
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}