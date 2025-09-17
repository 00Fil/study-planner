'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Plus, 
  Calendar, 
  List, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Book,
  CalendarDays,
  CheckCheck,
  ListTodo
} from 'lucide-react';
import { getHomework, saveHomework, deleteHomework, getSubjects } from '@/lib/storage';
import { Homework, Subject } from '@/lib/types';

type ViewMode = 'list' | 'calendar';
type FilterStatus = 'all' | 'pending' | 'completed' | 'overdue';

export default function TasksPage() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    dueDate: '',
    assignedDate: new Date().toISOString().split('T')[0],
    priority: 'medium' as 'high' | 'medium' | 'low',
    estimatedHours: 1,
    topics: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allHomework = getHomework();
    setHomework(allHomework);
    setSubjects(getSubjects());
    updateOverdueStatus(allHomework);
  };

  const updateOverdueStatus = (homeworkList: Homework[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasUpdates = false;
    const updated = homeworkList.map(hw => {
      const dueDate = new Date(hw.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (hw.status === 'pending' && dueDate < today) {
        hasUpdates = true;
        return { ...hw, status: 'overdue' as const };
      }
      return hw;
    });

    if (hasUpdates) {
      updated.forEach(hw => saveHomework(hw));
      setHomework(updated);
    }
  };

  const handleAddHomework = () => {
    if (!formData.subject || !formData.description || !formData.dueDate) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    const newHomework: Homework = {
      id: editingHomework?.id || `hw-${Date.now()}`,
      subject: formData.subject,
      description: formData.description,
      dueDate: formData.dueDate,
      assignedDate: formData.assignedDate,
      priority: formData.priority,
      status: 'pending',
      estimatedHours: formData.estimatedHours,
      topics: formData.topics
    };

    saveHomework(newHomework);
    loadData();
    resetForm();
  };

  const handleDeleteHomework = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo compito?')) {
      deleteHomework(id);
      loadData();
    }
  };

  const handleToggleStatus = (hw: Homework) => {
    const updated = {
      ...hw,
      status: hw.status === 'completed' ? 'pending' : 'completed',
      completedDate: hw.status === 'completed' ? undefined : new Date().toISOString()
    } as Homework;
    
    saveHomework(updated);
    loadData();
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      dueDate: '',
      assignedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      estimatedHours: 1,
      topics: []
    });
    setEditingHomework(null);
    setShowAddModal(false);
  };

  const editHomework = (hw: Homework) => {
    setEditingHomework(hw);
    setFormData({
      subject: hw.subject,
      description: hw.description,
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate,
      priority: hw.priority,
      estimatedHours: hw.estimatedHours || 1,
      topics: hw.topics || []
    });
    setShowAddModal(true);
  };

  // Filter homework
  const filteredHomework = homework.filter(hw => {
    if (filterStatus !== 'all' && hw.status !== filterStatus) return false;
    if (filterSubject !== 'all' && hw.subject !== filterSubject) return false;
    return true;
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 1; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getHomeworkForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return filteredHomework.filter(hw => hw.dueDate === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Compiti</h1>
              <p className="text-gray-600 mt-1">
                {homework.filter(h => h.status === 'pending').length} compiti da completare
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Aggiungi Compito
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Lista
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'calendar' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendario
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Tutti</option>
                <option value="pending">Da fare</option>
                <option value="completed">Completati</option>
                <option value="overdue">Scaduti</option>
              </select>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Tutte le materie</option>
                {subjects.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          // List View
          <div className="bg-white rounded-xl shadow-sm p-6">
            {filteredHomework.length > 0 ? (
              <div className="space-y-3">
                {filteredHomework.map(hw => {
                  const daysUntil = Math.ceil((new Date(hw.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div
                      key={hw.id}
                      className={`p-4 rounded-lg border ${
                        hw.status === 'completed' 
                          ? 'border-gray-200 bg-gray-50 opacity-60' 
                          : hw.status === 'overdue'
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => handleToggleStatus(hw)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {hw.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-blue-500 transition-colors" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium text-gray-900 ${
                                hw.status === 'completed' ? 'line-through' : ''
                              }`}>
                                {hw.subject}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                getPriorityColor(hw.priority)
                              }`}>
                                {hw.priority === 'high' ? 'Alta' : 
                                 hw.priority === 'medium' ? 'Media' : 'Bassa'}
                              </span>
                              {hw.status === 'overdue' && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                  Scaduto
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{hw.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                Scadenza: {new Date(hw.dueDate).toLocaleDateString('it-IT')}
                                {hw.status !== 'completed' && daysUntil >= 0 && (
                                  <span className={`font-medium ${
                                    daysUntil === 0 ? 'text-red-600' :
                                    daysUntil === 1 ? 'text-orange-600' :
                                    'text-gray-600'
                                  }`}>
                                    ({daysUntil === 0 ? 'Oggi' : 
                                      daysUntil === 1 ? 'Domani' : 
                                      `${daysUntil} giorni`})
                                  </span>
                                )}
                              </span>
                              {hw.estimatedHours && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {hw.estimatedHours}h stimate
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => editHomework(hw)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHomework(hw.id)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nessun compito trovato</p>
                <p className="text-sm text-gray-400 mt-1">
                  Modifica i filtri o aggiungi un nuovo compito
                </p>
              </div>
            )}
          </div>
        ) : (
          // Calendar View
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                  {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Oggi
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Headers */}
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {/* Days */}
              {getDaysInMonth(currentMonth).map((date, index) => {
                const homeworkForDay = date ? getHomeworkForDate(date) : [];
                const isToday = date && date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[100px] ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {homeworkForDay.slice(0, 3).map(hw => (
                            <div
                              key={hw.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                                hw.status === 'completed' 
                                  ? 'bg-gray-100 text-gray-500 line-through'
                                  : hw.status === 'overdue'
                                  ? 'bg-red-100 text-red-700'
                                  : hw.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : hw.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                              title={`${hw.subject}: ${hw.description}`}
                              onClick={() => editHomework(hw)}
                            >
                              {hw.subject.substring(0, 10)}
                            </div>
                          ))}
                          {homeworkForDay.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{homeworkForDay.length - 3}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingHomework ? 'Modifica Compito' : 'Nuovo Compito'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Materia *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleziona materia</option>
                    {subjects.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descrivi il compito..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data scadenza *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorità
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="low">Bassa</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ore stimate
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0.5"
                    step="0.5"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleAddHomework}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingHomework ? 'Salva Modifiche' : 'Aggiungi Compito'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}