'use client';

import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '@/components/AppLayout';
import './calendar-animations.css';
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
  ChevronLeft,
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
  CalendarDays,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getHomework, 
  saveHomework, 
  deleteHomework,
  getSubjects,
  getTopicsBySubject,
  getExams
} from '@/lib/supabase-storage';
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
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [clickedRect, setClickedRect] = useState<DOMRect | null>(null);
  const [carouselIndexes, setCarouselIndexes] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedHomework, loadedSubjects] = await Promise.all([
        getHomework(),
        getSubjects()
      ]);
      
      // Update overdue status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const updatedHomework = loadedHomework.map(hw => {
        const dueDate = new Date(hw.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        if (hw.status === 'pending' && dueDate < today) {
          return { ...hw, status: 'pending' as const }; // Keep as pending, we'll show overdue visually
        }
        return hw;
      });
      
      setHomework(updatedHomework);
      setSubjects(loadedSubjects);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description || !formData.dueDate) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    setSaving(true);
    try {
      const homeworkData: Homework = {
        id: editingHomework?.id || uuidv4(),
        subject: formData.subject!,
        title: formData.description!,
        description: formData.notes,
        dueDate: formData.dueDate!,
        priority: formData.priority || 'medium',
        status: formData.status || 'pending',
        estimatedHours: formData.estimatedHours || 1,
        actualHours: 0,
        attachments: [],
        notes: formData.notes,
        completedDate: formData.status === 'completed' ? new Date().toISOString() : undefined
      };

      await saveHomework(homeworkData);
      await loadData();
      
      toast.success(editingHomework ? 'Compito aggiornato' : 'Compito aggiunto');
      
      setShowAddModal(false);
      setEditingHomework(null);
      resetForm();
    } catch (error) {
      console.error('Error saving homework:', error);
      toast.error('Errore nel salvataggio del compito');
    } finally {
      setSaving(false);
    }
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo compito?')) {
      setSaving(true);
      try {
        await deleteHomework(id);
        await loadData();
        toast.success('Compito eliminato');
      } catch (error) {
        console.error('Error deleting homework:', error);
        toast.error('Errore nell\'eliminazione del compito');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleToggleComplete = async (hw: Homework) => {
    setSaving(true);
    try {
      const updatedHomework: Homework = {
        ...hw,
        status: hw.status === 'completed' ? 'pending' : 'completed',
        completedDate: hw.status === 'pending' ? new Date().toISOString() : undefined
      };
      
      await saveHomework(updatedHomework);
      await loadData();
      toast.success(updatedHomework.status === 'completed' ? 'Compito completato!' : 'Compito riaperto');
    } catch (error) {
      console.error('Error toggling complete:', error);
      toast.error('Errore nell\'aggiornamento del compito');
    } finally {
      setSaving(false);
    }
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

  // Popup handlers - moved to component level
  const closePopup = () => {
    setClickedDate(null);
    setClickedRect(null);
  };

  const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = new Date();
    
    // Auto-play carousel
    useEffect(() => {
      const interval = setInterval(() => {
        // Auto-advance all carousels
        const allDates = getDaysInMonth().filter(d => d !== null) as Date[];
        allDates.forEach(date => {
          const homeworkCount = getHomeworkForDate(date).length;
          if (homeworkCount > 1) {
            nextSlide(date.toISOString(), homeworkCount);
          }
        });
      }, 4000); // Change slide every 4 seconds
      
      return () => clearInterval(interval);
    }, [currentMonth]);
    
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
    
    const handleDayClick = (date: Date | null, event: React.MouseEvent) => {
      if (date) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setClickedRect(rect);
        setClickedDate(date);
      }
    };
    
    const getDaysInMonth = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
      
      const days = [];
      
      // Add empty cells for days before month starts (starting from Sunday)
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add all days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
      
      // Fill remaining cells to complete the grid
      while (days.length % 7 !== 0) {
        days.push(null);
      }
      
      return days;
    };
    
    const getHomeworkForDate = (date: Date | null) => {
      if (!date) return [];
      const homeworkForDay = homework.filter(hw => {
        const hwDate = new Date(hw.dueDate);
        return hwDate.toDateString() === date.toDateString();
      });
      
      // Sort by urgency (overdue first, then by priority) and time required
      return homeworkForDay.sort((a, b) => {
        // First sort by status (overdue first)
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        
        // Then by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Finally by estimated hours (more time required first)
        return (b.estimatedHours || 0) - (a.estimatedHours || 0);
      });
    };
    
    const nextSlide = (dateKey: string, maxSlides: number) => {
      setCarouselIndexes(prev => ({
        ...prev,
        [dateKey]: ((prev[dateKey] || 0) + 1) % maxSlides
      }));
    };
    
    const prevSlide = (dateKey: string, maxSlides: number) => {
      setCarouselIndexes(prev => ({
        ...prev,
        [dateKey]: ((prev[dateKey] || 0) - 1 + maxSlides) % maxSlides
      }));
    };
    
    const daysInMonth = getDaysInMonth();
    
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Calendar Header with Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Day Headers */}
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {daysInMonth.map((date, index) => {
            const homeworkForDay = date ? getHomeworkForDate(date) : [];
            const isToday = date && date.toDateString() === today.toDateString();
            const isCurrentMonth = date && date.getMonth() === currentMonth.getMonth();
            const isClicked = date && clickedDate && date.toDateString() === clickedDate.toDateString();
            const hasHomework = homeworkForDay.length > 0;
            
            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-[100px] relative ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''} 
                ${isClicked ? 'calendar-day-active' : ''}
                ${hasHomework ? 'calendar-day-with-tasks' : ''}
                ${date ? 'hover:bg-gray-50 cursor-pointer calendar-day-hover' : ''} transition-all duration-200`}
                onClick={(e) => handleDayClick(date, e)}
              >
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : 
                        !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      {homeworkForDay.length > 0 && (
                        <span className="task-badge">
                          {homeworkForDay.length}
                        </span>
                      )}
                    </div>
                    {/* Carousel of homework cards */}
                    {homeworkForDay.length > 0 && (
                      <div className="relative h-[60px]">
                        {homeworkForDay.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                prevSlide(date.toISOString(), homeworkForDay.length);
                              }}
                              className="carousel-nav-button absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur rounded-full p-0.5 shadow-md hover:bg-white transition-all hover:scale-110"
                            >
                              <ChevronLeft className="w-3 h-3 text-gray-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nextSlide(date.toISOString(), homeworkForDay.length);
                              }}
                              className="carousel-nav-button absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur rounded-full p-0.5 shadow-md hover:bg-white transition-all hover:scale-110"
                            >
                              <ChevronRight className="w-3 h-3 text-gray-700" />
                            </button>
                          </>
                        )}
                        
                        <div className="overflow-hidden h-full">
                          <div 
                            className="flex transition-transform duration-300 h-full"
                            style={{ 
                              transform: `translateX(-${(carouselIndexes[date.toISOString()] || 0) * 100}%)`
                            }}
                          >
                            {homeworkForDay.map(hw => {
                              const priorityColors = {
                                completed: 'bg-green-50 border-green-300',
                                overdue: 'bg-red-50 border-red-300',
                                high: 'bg-orange-50 border-orange-300',
                                medium: 'bg-yellow-50 border-yellow-300',
                                low: 'bg-blue-50 border-blue-300'
                              };
                              
                              const cardColor = hw.status === 'completed' ? priorityColors.completed :
                                              hw.status === 'overdue' ? priorityColors.overdue :
                                              priorityColors[hw.priority] || priorityColors.low;
                              
                              return (
                                <div
                                  key={hw.id}
                                  className="w-full flex-shrink-0 px-1"
                                >
                                  <div
                                    className={`p-1.5 rounded-lg border ${cardColor} cursor-pointer hover:shadow-sm transition-all`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(hw);
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold text-gray-900 truncate ${
                                          hw.status === 'completed' ? 'line-through' : ''
                                        }`}>
                                          {hw.subject}
                                        </p>
                                        <p className={`text-xs text-gray-600 line-clamp-1 mt-0.5 ${
                                          hw.status === 'completed' ? 'line-through opacity-60' : ''
                                        }`}>
                                          {hw.description}
                                        </p>
                                      </div>
                                      {(hw.estimatedHours && hw.estimatedHours >= 2) && (
                                        <span className="flex-shrink-0 text-xs font-medium text-gray-500">
                                          {hw.estimatedHours}h
                                        </span>
                                      )}
                                    </div>
                                    {hw.status === 'overdue' && (
                                      <div className="mt-0.5">
                                        <span className="text-xs font-medium text-red-600">⚠ Scaduto</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Carousel indicators */}
                        {homeworkForDay.length > 1 && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            {homeworkForDay.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-1 h-1 rounded-full transition-colors ${
                                  (carouselIndexes[date.toISOString()] || 0) === idx
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300'
                                }`}
                              />
                            ))}
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
          <>
            <CalendarView />
            {/* Expanded Day Details Modal */}
            {clickedDate && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={closePopup}
                  style={{
                    animation: 'fadeIn 0.3s ease-out'
                  }}
                />
                
                {/* Modal Card */}
                <div
                  className="fixed z-50 bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transformOrigin: clickedRect ? `${clickedRect.left + clickedRect.width/2}px ${clickedRect.top + clickedRect.height/2}px` : 'center',
                    animation: 'expandFromDay 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {clickedDate?.toLocaleDateString('it-IT', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {clickedDate?.getFullYear()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {clickedDate?.toDateString() === new Date().toDateString() && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          Oggi
                        </span>
                      )}
                      <button
                        onClick={closePopup}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                    
                  {/* Content List */}
                  {(() => {
                    const homeworkForDay = homework.filter(hw => {
                      const hwDate = new Date(hw.dueDate);
                      return hwDate.toDateString() === clickedDate?.toDateString();
                    });
                    
                    const examsForDay = getExams().filter(exam => {
                      const examDate = new Date(exam.date);
                      return examDate.toDateString() === clickedDate?.toDateString();
                    });
                    
                    return (
                      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                        {/* Exams */}
                        {examsForDay.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Verifiche ({examsForDay.length})
                            </h3>
                            {examsForDay.map(exam => (
                              <div key={exam.id} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                                <p className="font-medium text-gray-900">{exam.subject}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {exam.type === 'written' ? 'Scritto' : 'Orale'} • {exam.topics.length} argomenti
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                          
                        {/* Homework */}
                        {homeworkForDay.length > 0 ? (
                          <>
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Compiti ({homeworkForDay.length})
                            </h3>
                            {homeworkForDay.map(hw => (
                              <div 
                                key={hw.id} 
                                className={`p-3 rounded-lg border-l-4 ${
                                  hw.status === 'completed' 
                                    ? 'bg-green-50 border-green-400' 
                                    : hw.status === 'overdue'
                                    ? 'bg-red-50 border-red-400'
                                    : hw.priority === 'high'
                                    ? 'bg-orange-50 border-orange-400'
                                    : 'bg-blue-50 border-blue-400'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className={`font-medium text-gray-900 ${
                                        hw.status === 'completed' ? 'line-through' : ''
                                      }`}>
                                        {hw.subject}
                                      </p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        hw.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        hw.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {hw.priority === 'high' ? 'Alta' : hw.priority === 'medium' ? 'Media' : 'Bassa'}
                                      </span>
                                    </div>
                                    <p className={`text-sm text-gray-600 mt-1 ${
                                      hw.status === 'completed' ? 'line-through' : ''
                                    }`}>
                                      {hw.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      {hw.estimatedHours && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Timer className="w-3 h-3" />
                                          {hw.estimatedHours}h
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(hw);
                                          closePopup();
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Modifica
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleComplete(hw);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    {hw.status === 'completed' ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                                    )}
                                  </button>
                                </div>
                                </div>
                              ))}
                            </>
                          ) : examsForDay.length === 0 ? (
                            <div className="text-center py-12">
                              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500 mb-4">Nessun compito per questo giorno</p>
                              <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    dueDate: clickedDate?.toISOString().split('T')[0] || ''
                                  });
                                  setShowAddModal(true);
                                  closePopup();
                                }}
                              >
                                + Aggiungi compito
                              </button>
                            </div>
                          ) : null}
                        
                        {/* Summary Stats */}
                        {(homeworkForDay.length > 0 || examsForDay.length > 0) && (
                          <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Totale: {homeworkForDay.length + examsForDay.length} elementi
                            </span>
                            {homeworkForDay.some(hw => hw.estimatedHours) && (
                              <span className="text-gray-700 font-medium">
                                {homeworkForDay.reduce((acc, hw) => acc + (hw.estimatedHours || 0), 0)}h di studio stimato
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </>
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