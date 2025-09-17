'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Filter,
  Search,
  SortAsc,
  Flag,
  Target,
  FileText,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  Archive,
  RefreshCw,
  Download,
  Upload,
  Star,
  Timer,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Square,
  List,
  Grid3x3,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getHomework, 
  saveHomework, 
  deleteHomework,
  getSubjects,
  getTopicsBySubject
} from '@/lib/storage';
import { Homework, Subject, Topic } from '@/lib/types';

type ViewMode = 'list' | 'grid' | 'calendar';
type FilterStatus = 'all' | 'pending' | 'completed' | 'overdue';
type SortBy = 'dueDate' | 'priority' | 'subject' | 'status';

export default function HomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState<Partial<Homework>>({
    subject: '',
    description: '',
    dueDate: '',
    assignedDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
    estimatedHours: 1,
    notes: '',
    topics: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedHomework = getHomework();
    // Update overdue status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const updatedHomework = loadedHomework.map(hw => {
      const dueDate = new Date(hw.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (hw.status === 'pending' && dueDate < today) {
        return { ...hw, status: 'overdue' as const };
      }
      return hw;
    });
    
    setHomework(updatedHomework);
    setSubjects(getSubjects());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description || !formData.dueDate) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    const homeworkData: Homework = {
      id: editingHomework?.id || `homework-${Date.now()}`,
      subject: formData.subject,
      description: formData.description,
      dueDate: formData.dueDate,
      assignedDate: formData.assignedDate || new Date().toISOString().split('T')[0],
      priority: formData.priority || 'medium',
      status: formData.status || 'pending',
      estimatedHours: formData.estimatedHours || 1,
      notes: formData.notes,
      topics: formData.topics,
      completedDate: formData.status === 'completed' ? new Date().toISOString().split('T')[0] : undefined
    };

    saveHomework(homeworkData);
    loadData();
    
    toast.success(editingHomework ? 'Compito aggiornato' : 'Compito aggiunto');
    
    setShowAddModal(false);
    setEditingHomework(null);
    resetForm();
  };

  const handleEdit = (hw: Homework) => {
    setEditingHomework(hw);
    setFormData({
      subject: hw.subject,
      description: hw.description,
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate,
      priority: hw.priority,
      status: hw.status,
      estimatedHours: hw.estimatedHours,
      notes: hw.notes,
      topics: hw.topics
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo compito?')) {
      deleteHomework(id);
      loadData();
      toast.success('Compito eliminato');
    }
  };

  const handleToggleComplete = (hw: Homework) => {
    const updatedHomework: Homework = {
      ...hw,
      status: hw.status === 'completed' ? 'pending' : 'completed',
      completedDate: hw.status === 'pending' ? new Date().toISOString().split('T')[0] : undefined
    };
    
    saveHomework(updatedHomework);
    loadData();
    toast.success(updatedHomework.status === 'completed' ? 'Compito completato!' : 'Compito riaperto');
  };

  const handleQuickAdd = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      subject: '',
      description: '',
      dueDate: tomorrow.toISOString().split('T')[0],
      assignedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      estimatedHours: 1,
      notes: '',
      topics: []
    });
    setEditingHomework(null);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      dueDate: '',
      assignedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      estimatedHours: 1,
      notes: '',
      topics: []
    });
  };

  // Filtering and sorting logic
  const filteredHomework = useMemo(() => {
    let filtered = [...homework];
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(hw => hw.status === filterStatus);
    }
    
    // Subject filter
    if (filterSubject !== 'all') {
      filtered = filtered.filter(hw => hw.subject === filterSubject);
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(hw => 
        hw.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Date filter (for calendar view)
    if (selectedDate && viewMode === 'calendar') {
      filtered = filtered.filter(hw => {
        const hwDate = new Date(hw.dueDate);
        return hwDate.toDateString() === selectedDate.toDateString();
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortAscending ? comparison : -comparison;
    });
    
    return filtered;
  }, [homework, filterStatus, filterSubject, searchQuery, sortBy, sortAscending, selectedDate, viewMode]);

  const stats = useMemo(() => {
    const total = homework.length;
    const pending = homework.filter(hw => hw.status === 'pending').length;
    const completed = homework.filter(hw => hw.status === 'completed').length;
    const overdue = homework.filter(hw => hw.status === 'overdue').length;
    const totalHours = homework.reduce((acc, hw) => acc + (hw.estimatedHours || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, pending, completed, overdue, totalHours, completionRate };
  }, [homework]);

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Flag className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const exportHomework = () => {
    const dataStr = JSON.stringify(homework, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `homework_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Compiti esportati');
  };

  const CalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks = [];
    let currentWeek = [];
    const date = new Date(startDate);
    
    while (date <= lastDay || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      const currentDate = new Date(date);
      const homeworkForDay = homework.filter(hw => {
        const hwDate = new Date(hw.dueDate);
        return hwDate.toDateString() === currentDate.toDateString();
      });
      
      currentWeek.push({
        date: currentDate,
        homework: homeworkForDay,
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        isToday: currentDate.toDateString() === today.toDateString()
      });
      
      date.setDate(date.getDate() + 1);
      
      if (date.getMonth() > currentMonth && currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          const nextDate = new Date(date);
          const hwForDay = homework.filter(hw => {
            const hwDate = new Date(hw.dueDate);
            return hwDate.toDateString() === nextDate.toDateString();
          });
          
          currentWeek.push({
            date: nextDate,
            homework: hwForDay,
            isCurrentMonth: false,
            isToday: false
          });
          date.setDate(date.getDate() + 1);
        }
      }
    }
    
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weeks.map((week, weekIndex) => 
            week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`bg-white p-2 min-h-[100px] ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${day.isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer transition-colors`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className={`text-sm font-medium ${
                  day.isToday ? 'text-blue-600' : 
                  !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {day.homework.slice(0, 3).map((hw, index) => (
                    <div
                      key={hw.id}
                      className={`text-xs p-1 rounded truncate ${
                        hw.status === 'completed' ? 'bg-green-100 text-green-700' :
                        hw.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                      title={hw.description}
                    >
                      {hw.subject.substring(0, 3)}
                    </div>
                  ))}
                  {day.homework.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{day.homework.length - 3} altri
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Compiti</h1>
              <p className="text-gray-600">Organizza e monitora tutti i tuoi compiti</p>
            </div>
            <button
              onClick={handleQuickAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Aggiungi Compito
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Totali</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Da fare</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completati</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Scaduti</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalHours}h</p>
                <p className="text-sm text-gray-600">Tempo totale</p>
              </div>
              <Timer className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Vista lista"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Vista griglia"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Vista calendario"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca compiti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">Da fare</option>
              <option value="completed">Completati</option>
              <option value="overdue">Scaduti</option>
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutte le materie</option>
              {subjects.map(subject => (
                <option key={subject.name} value={subject.name}>
                  {subject.displayName || subject.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dueDate">Data scadenza</option>
                <option value="priority">Priorità</option>
                <option value="subject">Materia</option>
                <option value="status">Stato</option>
              </select>
              <button
                onClick={() => setSortAscending(!sortAscending)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SortAsc className={`w-4 h-4 transition-transform ${!sortAscending ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Export */}
            <button
              onClick={exportHomework}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Esporta compiti"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <CalendarView />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredHomework.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center col-span-full">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun compito trovato</p>
                <button
                  onClick={handleQuickAdd}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aggiungi il primo compito
                </button>
              </div>
            ) : (
              filteredHomework.map(hw => {
                const daysUntil = getDaysUntilDue(hw.dueDate);
                const subject = subjects.find(s => s.name === hw.subject);
                
                if (viewMode === 'grid') {
                  return (
                    <div
                      key={hw.id}
                      className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                        hw.status === 'completed' ? 'border-green-500' :
                        hw.status === 'overdue' ? 'border-red-500' :
                        daysUntil <= 1 ? 'border-orange-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: subject?.color + '20' }}
                        >
                          <BookOpen className="w-5 h-5" style={{ color: subject?.color }} />
                        </div>
                        <button
                          onClick={() => handleToggleComplete(hw)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            hw.status === 'completed' 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          {hw.status === 'completed' ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </button>
                      </div>

                      <h3 className={`font-semibold text-gray-900 mb-1 ${
                        hw.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {hw.subject}
                      </h3>
                      <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${
                        hw.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {hw.description}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span className={
                            hw.status === 'overdue' ? 'text-red-600 font-medium' :
                            daysUntil === 0 ? 'text-orange-600 font-medium' :
                            daysUntil === 1 ? 'text-yellow-600' :
                            'text-gray-600'
                          }>
                            {hw.status === 'overdue' ? 'Scaduto' :
                             daysUntil === 0 ? 'Oggi!' :
                             daysUntil === 1 ? 'Domani' :
                             `${daysUntil} giorni`}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(hw.priority)}`}>
                          {hw.priority === 'high' ? 'Alta' : hw.priority === 'medium' ? 'Media' : 'Bassa'}
                        </span>
                      </div>

                      <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(hw)}
                          className="flex-1 p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => setSelectedHomework(hw)}
                          className="flex-1 p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <FileText className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDelete(hw.id)}
                          className="flex-1 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // List view
                  return (
                    <div
                      key={hw.id}
                      className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                        hw.status === 'completed' ? 'border-green-500' :
                        hw.status === 'overdue' ? 'border-red-500' :
                        daysUntil <= 1 ? 'border-orange-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleComplete(hw)}
                          className={`mt-1 p-1 rounded transition-colors ${
                            hw.status === 'completed' 
                              ? 'text-green-600' 
                              : 'text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          {hw.status === 'completed' ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className={`font-semibold text-gray-900 ${
                                  hw.status === 'completed' ? 'line-through' : ''
                                }`}>
                                  {hw.subject}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getPriorityColor(hw.priority)}`}>
                                  {getPriorityIcon(hw.priority)}
                                  {hw.priority === 'high' ? 'Alta' : hw.priority === 'medium' ? 'Media' : 'Bassa'}
                                </span>
                                {hw.estimatedHours && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {hw.estimatedHours}h
                                  </span>
                                )}
                              </div>
                              <p className={`text-gray-600 mb-2 ${
                                hw.status === 'completed' ? 'line-through' : ''
                              }`}>
                                {hw.description}
                              </p>
                              {hw.notes && (
                                <p className="text-sm text-gray-500 italic mb-2">
                                  📝 {hw.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Assegnato: {new Date(hw.assignedDate).toLocaleDateString('it-IT')}
                                </span>
                                <span className={`flex items-center gap-1 font-medium ${
                                  hw.status === 'overdue' ? 'text-red-600' :
                                  daysUntil === 0 ? 'text-orange-600' :
                                  daysUntil === 1 ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  <Clock className="w-4 h-4" />
                                  Scadenza: {new Date(hw.dueDate).toLocaleDateString('it-IT')}
                                  {hw.status !== 'completed' && (
                                    <span className="ml-1">
                                      ({hw.status === 'overdue' ? 'Scaduto' :
                                        daysUntil === 0 ? 'Oggi!' :
                                        daysUntil === 1 ? 'Domani' :
                                        `${daysUntil} giorni`})
                                    </span>
                                  )}
                                </span>
                                {hw.status === 'completed' && hw.completedDate && (
                                  <span className="text-green-600">
                                    ✓ Completato: {new Date(hw.completedDate).toLocaleDateString('it-IT')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(hw)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(hw.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingHomework ? 'Modifica Compito' : 'Nuovo Compito'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingHomework(null);
                    resetForm();
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {subject.displayName || subject.name}
                        </option>
                      ))}
                    </select>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descrivi il compito da svolgere..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Assegnazione
                    </label>
                    <input
                      type="date"
                      value={formData.assignedDate}
                      onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Scadenza *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo stimato (ore)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note aggiuntive
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Note, suggerimenti, materiale necessario..."
                  />
                </div>

                {editingHomework && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stato
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' | 'overdue' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Da fare</option>
                      <option value="completed">Completato</option>
                      <option value="overdue">Scaduto</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingHomework(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingHomework ? 'Salva Modifiche' : 'Aggiungi Compito'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedHomework && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dettagli Compito</h3>
                <button
                  onClick={() => setSelectedHomework(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Materia</p>
                  <p className="font-medium text-gray-900">{selectedHomework.subject}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Descrizione</p>
                  <p className="text-gray-900">{selectedHomework.description}</p>
                </div>

                {selectedHomework.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="text-gray-900">{selectedHomework.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Priorità</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedHomework.priority)}`}>
                      {selectedHomework.priority === 'high' ? 'Alta' : 
                       selectedHomework.priority === 'medium' ? 'Media' : 'Bassa'}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Stato</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedHomework.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedHomework.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedHomework.status === 'completed' ? 'Completato' :
                       selectedHomework.status === 'overdue' ? 'Scaduto' : 'Da fare'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Data assegnazione</p>
                    <p className="text-gray-900">
                      {new Date(selectedHomework.assignedDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Data scadenza</p>
                    <p className="text-gray-900">
                      {new Date(selectedHomework.dueDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>

                {selectedHomework.estimatedHours && (
                  <div>
                    <p className="text-sm text-gray-600">Tempo stimato</p>
                    <p className="text-gray-900">{selectedHomework.estimatedHours} ore</p>
                  </div>
                )}

                {selectedHomework.completedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Data completamento</p>
                    <p className="text-green-600 font-medium">
                      {new Date(selectedHomework.completedDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedHomework(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}