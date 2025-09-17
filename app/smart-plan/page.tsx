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
  BookOpen,
  School,
  Plus,
  X,
  Edit2,
  Save,
  Trash2,
  Coffee,
  Activity,
  Timer,
  ChevronRight,
  ArrowRight,
  Bell,
  Users,
  MapPin,
  CheckSquare,
  Square,
  Zap,
  Star,
  Award,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Circle,
  Flag,
  Sparkles,
  ListChecks,
  BarChart3,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  BookMarked,
  FileText,
  PenTool,
  Calculator,
  Headphones,
  Eye,
  EyeOff,
  Maximize2,
  Settings,
  Cloud,
  Trees
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { getExams, getHomework, getSubjects, getTopics, getTopicsBySubject } from '@/lib/storage';
import { getCurrentLesson, getTodayLessons, getOptimalStudyPlan } from '@/lib/schedule-helpers';
import { formatDate, getDaysUntilExam } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  subject?: string;
  type: 'review' | 'study' | 'homework' | 'exercise' | 'prepare' | 'break';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
  actualTime?: number;
  completed: boolean;
  completedAt?: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
  subtasks?: SubTask[];
  relatedExam?: any;
  relatedHomework?: any;
  difficulty?: 'easy' | 'medium' | 'hard';
  energyLevel?: 'high' | 'medium' | 'low'; // Required energy level
  icon?: any;
  color?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: number;
}

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'study' | 'break' | 'meal' | 'exercise';
  energyLevel: 'high' | 'medium' | 'low';
  tasks: Task[];
}

interface FocusSession {
  id: string;
  subject: string;
  topic: string;
  type: 'deep-work' | 'review' | 'practice' | 'memorization';
  duration: number;
  technique: 'pomodoro' | 'timeboxing' | 'flowtime' | 'deep-focus';
  environment: {
    music: boolean;
    notifications: boolean;
    fullscreen: boolean;
    ambientSound?: 'rain' | 'whitenoise' | 'nature' | 'coffee-shop' | 'none';
  };
  goals: string[];
  materials: string[];
  progress: number;
  breaks: {
    frequency: number; // minutes between breaks
    duration: number; // break duration in minutes
  };
}

export default function SmartPlanProPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayLessons, setTodayLessons] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'timeline' | 'focus' | 'analytics'>('dashboard');
  const [currentEnergyLevel, setCurrentEnergyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [focusActive, setFocusActive] = useState(false);
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [customSessionSettings, setCustomSessionSettings] = useState({
    duration: 25,
    technique: 'pomodoro' as 'pomodoro' | 'timeboxing' | 'flowtime' | 'deep-focus',
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  });
  const [showCustomSessionModal, setShowCustomSessionModal] = useState(false);
  const [showAmbientSoundMenu, setShowAmbientSoundMenu] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'rain' | 'whitenoise' | 'nature' | 'coffee-shop' | 'none'>('none');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set());
  const [showAddGoalInput, setShowAddGoalInput] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [totalFocusTime, setTotalFocusTime] = useState(0); // Total focus time in seconds
  const [sessionFocusTime, setSessionFocusTime] = useState(0); // Current session focus time
  const [yesterdayFocusTime, setYesterdayFocusTime] = useState(0); // Yesterday's total for reference

  useEffect(() => {
    // Load data
    const lessons = getTodayLessons();
    setTodayLessons(lessons);
    
    const exams = getExams().filter(e => e.status === 'pending');
    setUpcomingExams(exams);
    
    const hw = getHomework().filter(h => h.status === 'pending');
    setHomework(hw);
    
    // Load saved focus time
    const savedTime = localStorage.getItem('todayFocusTime') || '0';
    const savedDate = localStorage.getItem('focusTimeDate');
    const today = new Date().toDateString();
    
    if (savedDate === today) {
      // Same day, load the saved time
      setTotalFocusTime(parseInt(savedTime));
    } else if (savedDate) {
      // New day, but keep yesterday's time visible until first session
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (savedDate === yesterday.toDateString()) {
        // Show yesterday's total as reference
        setYesterdayFocusTime(parseInt(savedTime));
        setTotalFocusTime(0); // Start fresh for today
        // Save the new day
        localStorage.setItem('focusTimeDate', today);
        localStorage.setItem('yesterdayFocusTime', savedTime);
        localStorage.setItem('todayFocusTime', '0');
      } else {
        // Older than yesterday, reset completely
        setTotalFocusTime(0);
        localStorage.setItem('focusTimeDate', today);
        localStorage.setItem('todayFocusTime', '0');
      }
    } else {
      // First time using the app
      localStorage.setItem('focusTimeDate', today);
      localStorage.setItem('todayFocusTime', '0');
    }
    
    // Load yesterday's time if available
    const yesterdayTime = localStorage.getItem('yesterdayFocusTime');
    if (yesterdayTime) {
      setYesterdayFocusTime(parseInt(yesterdayTime));
    }
    
    // Generate smart schedule
    generateSmartSchedule(lessons, exams, hw);
    
    // Update time
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateEnergyLevel();
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle break timer
  useEffect(() => {
    if (isBreakTime && breakTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setBreakTimeRemaining(breakTimeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (breakTimeRemaining === 0 && isBreakTime) {
      handleBreakComplete();
    }
  }, [isBreakTime, breakTimeRemaining]);

  useEffect(() => {
    if (focusActive && focusTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setFocusTimeRemaining(focusTimeRemaining - 1);
        // Update focus time counters when not in break
        if (!isBreakTime) {
          setSessionFocusTime(prev => prev + 1);
          setTotalFocusTime(prev => {
            const newTime = prev + 1;
            // Save to localStorage every 10 seconds
            if (newTime % 10 === 0) {
              localStorage.setItem('todayFocusTime', newTime.toString());
            }
            return newTime;
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (focusTimeRemaining === 0 && focusActive) {
      handleFocusComplete();
    }
  }, [focusActive, focusTimeRemaining, isBreakTime]);

  const updateEnergyLevel = () => {
    const hour = new Date().getHours();
    if (hour >= 14 && hour < 15) setCurrentEnergyLevel('low'); // Post-lunch dip
    else if (hour >= 15 && hour < 17) setCurrentEnergyLevel('high'); // Peak afternoon
    else if (hour >= 17 && hour < 19) setCurrentEnergyLevel('medium'); // Late afternoon
    else setCurrentEnergyLevel('low'); // Evening
  };

  const generateSmartSchedule = (lessons: any[], exams: any[], homework: any[]) => {
    const generatedTasks: Task[] = [];
    const blocks: TimeBlock[] = [];
    
    // Analyze priorities
    const urgentExams = exams.filter(e => getDaysUntilExam(e.date) <= 3);
    const importantExams = exams.filter(e => getDaysUntilExam(e.date) <= 7 && getDaysUntilExam(e.date) > 3);
    const urgentHomework = homework.filter(h => {
      const daysUntil = Math.ceil((new Date(h.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 1;
    });

    // Create tasks based on priorities
    
    // 1. Review today's lessons (always high priority)
    if (lessons.length > 0) {
      lessons.forEach(lesson => {
        generatedTasks.push({
          id: `review-${lesson.subject}`,
          title: `Ripasso ${lesson.subject}`,
          subject: lesson.subject,
          type: 'review',
          priority: 'high',
          estimatedTime: 20,
          completed: false,
          description: `Ripassa la lezione di oggi: argomenti trattati, appunti, esempi`,
          subtasks: [
            { id: '1', title: 'Rileggi appunti della lezione', completed: false, estimatedTime: 10 },
            { id: '2', title: 'Evidenzia concetti chiave', completed: false, estimatedTime: 5 },
            { id: '3', title: 'Prepara domande da chiarire', completed: false, estimatedTime: 5 }
          ],
          difficulty: 'easy',
          energyLevel: 'low',
          icon: BookOpen,
          color: 'blue'
        });
      });
    }

    // 2. Urgent exam preparation
    urgentExams.forEach(exam => {
      generatedTasks.push({
        id: `exam-urgent-${exam.id}`,
        title: `⚠️ Preparazione ${exam.subject}`,
        subject: exam.subject,
        type: 'study',
        priority: 'urgent',
        estimatedTime: 90,
        completed: false,
        description: `VERIFICA TRA ${getDaysUntilExam(exam.date)} GIORNI! Focus massimo richiesto.`,
        subtasks: [
          { id: '1', title: 'Ripasso teoria completo', completed: false, estimatedTime: 40 },
          { id: '2', title: 'Esercizi di pratica', completed: false, estimatedTime: 30 },
          { id: '3', title: 'Simulazione verifica', completed: false, estimatedTime: 20 }
        ],
        relatedExam: exam,
        difficulty: 'hard',
        energyLevel: 'high',
        icon: AlertTriangle,
        color: 'red'
      });
    });

    // 3. Urgent homework
    urgentHomework.forEach(hw => {
      generatedTasks.push({
        id: `homework-urgent-${hw.id}`,
        title: `📝 ${hw.subject}: ${hw.description}`,
        subject: hw.subject,
        type: 'homework',
        priority: 'urgent',
        estimatedTime: hw.estimatedTime || 45,
        completed: false,
        description: `Da consegnare ${hw.dueDate === new Date().toDateString() ? 'OGGI' : 'DOMANI'}!`,
        relatedHomework: hw,
        difficulty: 'medium',
        energyLevel: 'medium',
        icon: FileText,
        color: 'orange'
      });
    });

    // 4. Important exam preparation
    importantExams.forEach(exam => {
      generatedTasks.push({
        id: `exam-important-${exam.id}`,
        title: `Studio ${exam.subject}`,
        subject: exam.subject,
        type: 'study',
        priority: 'high',
        estimatedTime: 60,
        completed: false,
        description: `Verifica tra ${getDaysUntilExam(exam.date)} giorni. Preparazione progressiva.`,
        subtasks: [
          { id: '1', title: 'Studio argomenti nuovi', completed: false, estimatedTime: 30 },
          { id: '2', title: 'Ripasso argomenti precedenti', completed: false, estimatedTime: 20 },
          { id: '3', title: 'Annotare dubbi', completed: false, estimatedTime: 10 }
        ],
        relatedExam: exam,
        difficulty: 'medium',
        energyLevel: 'high',
        icon: GraduationCap,
        color: 'purple'
      });
    });

    // 5. Regular homework
    homework.filter(h => !urgentHomework.includes(h)).forEach(hw => {
      generatedTasks.push({
        id: `homework-${hw.id}`,
        title: `${hw.subject}: ${hw.description}`,
        subject: hw.subject,
        type: 'homework',
        priority: 'medium',
        estimatedTime: hw.estimatedTime || 30,
        completed: false,
        description: `Scadenza: ${new Date(hw.dueDate).toLocaleDateString('it-IT')}`,
        relatedHomework: hw,
        difficulty: 'medium',
        energyLevel: 'medium',
        icon: PenTool,
        color: 'green'
      });
    });

    // 6. Practice and consolidation
    const subjectsNeedingPractice = [...new Set([...lessons.map(l => l.subject), ...exams.map(e => e.subject)])];
    subjectsNeedingPractice.slice(0, 2).forEach(subject => {
      if (!generatedTasks.some(t => t.subject === subject && t.type === 'exercise')) {
        generatedTasks.push({
          id: `practice-${subject}`,
          title: `Esercizi ${subject}`,
          subject,
          type: 'exercise',
          priority: 'low',
          estimatedTime: 30,
          completed: false,
          description: 'Consolidamento attraverso la pratica',
          subtasks: [
            { id: '1', title: 'Esercizi base', completed: false, estimatedTime: 10 },
            { id: '2', title: 'Esercizi intermedi', completed: false, estimatedTime: 15 },
            { id: '3', title: 'Problema avanzato', completed: false, estimatedTime: 5 }
          ],
          difficulty: 'medium',
          energyLevel: 'medium',
          icon: Calculator,
          color: 'indigo'
        });
      }
    });

    // Sort tasks by priority and energy requirements
    generatedTasks.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const energyOrder = { high: 0, medium: 1, low: 2 };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return energyOrder[a.energyLevel || 'medium'] - energyOrder[b.energyLevel || 'medium'];
    });

    // Create time blocks
    blocks.push({
      id: 'block-1',
      startTime: '14:30',
      endTime: '15:00',
      duration: 30,
      type: 'break',
      energyLevel: 'low',
      tasks: []
    });

    blocks.push({
      id: 'block-2',
      startTime: '15:00',
      endTime: '16:30',
      duration: 90,
      type: 'study',
      energyLevel: 'high',
      tasks: generatedTasks.filter(t => t.energyLevel === 'high').slice(0, 2)
    });

    blocks.push({
      id: 'block-3',
      startTime: '16:30',
      endTime: '16:45',
      duration: 15,
      type: 'break',
      energyLevel: 'low',
      tasks: []
    });

    blocks.push({
      id: 'block-4',
      startTime: '16:45',
      endTime: '18:00',
      duration: 75,
      type: 'study',
      energyLevel: 'medium',
      tasks: generatedTasks.filter(t => t.energyLevel === 'medium').slice(0, 2)
    });

    blocks.push({
      id: 'block-5',
      startTime: '18:00',
      endTime: '18:30',
      duration: 30,
      type: 'study',
      energyLevel: 'low',
      tasks: generatedTasks.filter(t => t.energyLevel === 'low').slice(0, 2)
    });

    setTasks(generatedTasks);
    setTimeBlocks(blocks);
  };

  const handleBreakComplete = () => {
    setIsBreakTime(false);
    toast.info('💪 Pausa terminata! Pronto per una nuova sessione?');
    
    // Play notification sound
    playNotificationSound();
  };

  const playNotificationSound = () => {
    if (musicEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAAwA=');
      audio.play().catch(() => {});
    }
  };

  const handleFocusComplete = () => {
    setFocusActive(false);
    const count = sessionCount + 1;
    setSessionCount(count);
    
    // Save the final time to localStorage
    localStorage.setItem('todayFocusTime', totalFocusTime.toString());
    
    // Play notification sound
    playNotificationSound();
    
    // Handle breaks based on technique
    if (focusSession?.technique === 'pomodoro') {
      const isLongBreak = count % customSessionSettings.sessionsUntilLongBreak === 0;
      const breakDuration = isLongBreak ? customSessionSettings.longBreakDuration : customSessionSettings.breakDuration;
      
      setBreakTimeRemaining(breakDuration * 60);
      setIsBreakTime(true);
      
      toast.success(isLongBreak 
        ? `🎉 ${customSessionSettings.sessionsUntilLongBreak} sessioni completate! Pausa lunga di ${breakDuration} minuti.`
        : `✅ Sessione completata! Pausa di ${breakDuration} minuti.`
      );
    } else if (focusSession?.technique === 'timeboxing' && focusSession.breaks.frequency > 0) {
      setBreakTimeRemaining(focusSession.breaks.duration * 60);
      setIsBreakTime(true);
      toast.success(`📦 Timebox completato! Pausa di ${focusSession.breaks.duration} minuti.`);
    } else {
      toast.success('🎯 Sessione Focus completata con successo!');
    }
    
    // Mark related task progress (skip notification to avoid duplicate)
    if (focusSession) {
      const task = tasks.find(t => t.subject === focusSession.subject);
      if (task && focusSession.progress >= 100) {
        toggleTaskComplete(task.id, true); // Skip notification here
      }
    }
  };

  const toggleTaskComplete = (taskId: string, skipNotification?: boolean) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const completed = !task.completed;
        if (completed && !skipNotification) {
          toast.success(`✅ ${task.title} completato!`);
        }
        return {
          ...task,
          completed,
          completedAt: completed ? new Date() : undefined,
          actualTime: completed ? task.estimatedTime : undefined
        };
      }
      return task;
    }));
  };

  const toggleSubtaskComplete = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.subtasks) {
        const subtasks = task.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        
        // Check if all subtasks are completed
        const allCompleted = subtasks.every(st => st.completed);
        
        return {
          ...task,
          subtasks,
          completed: allCompleted,
          completedAt: allCompleted ? new Date() : undefined
        };
      }
      return task;
    }));
  };

  const startFocusSession = (task: Task, customTechnique?: string, customDuration?: number, goals?: string[]) => {
    let technique = customTechnique || (task.estimatedTime >= 60 ? 'deep-focus' : 'pomodoro');
    let duration = customDuration || task.estimatedTime;
    
    // Set break settings based on technique
    let breaks = { frequency: 0, duration: 0 };
    if (technique === 'pomodoro') {
      duration = customSessionSettings.duration;
      breaks = { frequency: duration, duration: customSessionSettings.breakDuration };
    } else if (technique === 'timeboxing') {
      breaks = { frequency: 45, duration: 10 };
    } else if (technique === 'flowtime') {
      breaks = { frequency: 0, duration: 0 }; // No forced breaks
    } else if (technique === 'deep-focus') {
      breaks = { frequency: 90, duration: 15 };
    }
    
    // Use custom goals if provided, otherwise use task subtasks or defaults
    const sessionGoals = goals && goals.length > 0 
      ? goals 
      : task.subtasks 
        ? task.subtasks.map(st => st.title) 
        : [task.description || 'Completare la sessione di studio'];
    
    const session: FocusSession = {
      id: `focus-${Date.now()}`,
      subject: task.subject || 'Studio',
      topic: task.title,
      type: task.type === 'review' ? 'review' : 
            task.type === 'exercise' ? 'practice' : 
            task.difficulty === 'hard' ? 'deep-work' : 'practice',
      duration,
      technique: technique as any,
      environment: {
        music: musicEnabled,
        notifications: notificationsBlocked,
        fullscreen: isFullscreen,
        ambientSound
      },
      goals: sessionGoals,
      materials: [],
      progress: 0,
      breaks
    };
    
    setFocusSession(session);
    setFocusTimeRemaining(session.duration * 60);
    setFocusActive(true);
    setSelectedView('focus');
    setIsBreakTime(false);
    setCompletedGoals(new Set());
    setSessionFocusTime(0); // Reset session focus time for new session
    
    // Enter fullscreen if enabled
    if (session.environment.fullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const startCustomSession = (technique: string, duration: number, goals?: string[]) => {
    const customTask: Task = {
      id: 'custom',
      title: 'Sessione Personalizzata',
      type: 'study',
      priority: 'medium',
      estimatedTime: duration,
      completed: false,
      difficulty: 'medium',
      energyLevel: 'high',
      icon: Zap,
      color: 'purple'
    };
    
    startFocusSession(customTask, technique, duration, goals);
    setShowCustomSessionModal(false);
    setCustomGoals([]); // Reset custom goals
  };

  const toggleGoalComplete = (goalIndex: number) => {
    const newCompleted = new Set(completedGoals);
    if (newCompleted.has(goalIndex)) {
      newCompleted.delete(goalIndex);
    } else {
      newCompleted.add(goalIndex);
      // Check if all goals are completed
      if (focusSession && newCompleted.size === focusSession.goals.length) {
        toast.success('🎯 Tutti gli obiettivi completati! Ottimo lavoro!');
      }
    }
    setCompletedGoals(newCompleted);
  };

  const addNewGoal = () => {
    if (newGoalText.trim() && focusSession) {
      setFocusSession({
        ...focusSession,
        goals: [...focusSession.goals, newGoalText.trim()]
      });
      setNewGoalText('');
      setShowAddGoalInput(false);
      toast.success('✨ Nuovo obiettivo aggiunto!');
    }
  };

  const removeGoal = (goalIndex: number) => {
    if (focusSession && focusSession.goals.length > 1) {
      const newGoals = focusSession.goals.filter((_, index) => index !== goalIndex);
      setFocusSession({
        ...focusSession,
        goals: newGoals
      });
      
      // Update completed goals set
      const newCompleted = new Set<number>();
      completedGoals.forEach(index => {
        if (index < goalIndex) {
          newCompleted.add(index);
        } else if (index > goalIndex) {
          newCompleted.add(index - 1);
        }
      });
      setCompletedGoals(newCompleted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getCurrentTimeBlock = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    return timeBlocks.find(block => {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);
      const blockStart = startHour * 60 + startMin;
      const blockEnd = endHour * 60 + endMin;
      return now >= blockStart && now < blockEnd;
    });
  };

  const getProgress = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getTotalStudyTime = () => {
    // Always use totalFocusTime if available, otherwise estimated time
    if (totalFocusTime > 0) {
      return Math.floor(totalFocusTime / 60);
    }
    // Fallback to estimated time from completed tasks
    return tasks.filter(t => t.completed).reduce((acc, task) => acc + (task.actualTime || task.estimatedTime), 0);
  };

  const formatStudyTime = () => {
    const totalMinutes = getTotalStudyTime();
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = focusActive ? totalFocusTime % 60 : 0;
    
    if (focusActive && !isBreakTime) {
      // Show seconds when actively studying
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '0m';
    }
  };

  const getUrgentTasks = () => tasks.filter(t => t.priority === 'urgent' && !t.completed);
  const getHighPriorityTasks = () => tasks.filter(t => t.priority === 'high' && !t.completed);
  const currentBlock = getCurrentTimeBlock();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Piano Studio Intelligente</h1>
                <p className="text-indigo-100">
                  {currentTime.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              {/* Energy Level */}
              <div className="text-center">
                <p className="text-xs text-indigo-200 mb-1">Energia</p>
                <div className="flex items-center gap-1">
                  {['high', 'medium', 'low'].map(level => (
                    <div
                      key={level}
                      className={`h-6 w-2 rounded transition-all ${
                        currentEnergyLevel === 'high' ? 'bg-white' :
                        currentEnergyLevel === 'medium' && level !== 'high' ? 'bg-white' :
                        currentEnergyLevel === 'low' && level === 'low' ? 'bg-white' :
                        'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Progress */}
              <div className="text-center">
                <p className="text-xs text-indigo-200 mb-1">Progresso</p>
                <div className="relative w-16 h-16">
                  <svg className="transform -rotate-90 w-16 h-16">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="white"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${getProgress() * 1.76} 176`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{Math.round(getProgress())}%</span>
                  </div>
                </div>
              </div>
              
              {/* Study Time with Daily Total */}
              <div className="text-center relative">
                <p className="text-xs text-indigo-200 mb-1">
                  Tempo Studio Oggi
                  {focusActive && !isBreakTime && (
                    <span className="ml-1 inline-flex">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </p>
                <div className="relative">
                  <p className={`text-2xl font-bold transition-all ${
                    focusActive && !isBreakTime 
                      ? 'text-white drop-shadow-lg' 
                      : 'text-white/95'
                  }`}>
                    {formatStudyTime()}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {focusActive && sessionFocusTime > 0 && (
                      <p className="text-xs text-green-300">
                        🎯 Sessione: {Math.floor(sessionFocusTime / 60)}:{(sessionFocusTime % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                    {totalFocusTime > 0 && (
                      <p className="text-xs text-indigo-300">
                        📈 Totale: {Math.floor(totalFocusTime / 3600)}h {Math.floor((totalFocusTime % 3600) / 60)}m
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'focus', label: 'Focus Mode', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedView === view.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <view.icon className="w-4 h-4" />
              {view.label}
            </button>
          ))}
        </div>

        {/* Dashboard View */}
        {selectedView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Task List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Current Block */}
              {currentBlock && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Blocco Attuale ({currentBlock.startTime} - {currentBlock.endTime})
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentBlock.energyLevel === 'high' ? 'bg-red-100 text-red-700' :
                      currentBlock.energyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Energia {currentBlock.energyLevel === 'high' ? 'Alta' : 
                               currentBlock.energyLevel === 'medium' ? 'Media' : 'Bassa'}
                    </span>
                  </div>
                  
                  {currentBlock.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {currentBlock.tasks.map(task => (
                        <div 
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg"
                        >
                          <button
                            onClick={() => toggleTaskComplete(task.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              task.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-indigo-500'
                            }`}
                          >
                            {task.completed && <CheckCircle className="w-4 h-4" />}
                          </button>
                          <task.icon className={`w-5 h-5 text-${task.color}-600`} />
                          <div className="flex-1">
                            <p className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                          </div>
                          <button
                            onClick={() => startFocusSession(task)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                          >
                            Focus
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Tempo di pausa - Ricarica le energie! ☕
                    </p>
                  )}
                </div>
              )}

              {/* Urgent Tasks */}
              {getUrgentTasks().length > 0 && (
                <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">⚠️ Urgente - Da fare oggi</h3>
                  </div>
                  <div className="space-y-3">
                    {getUrgentTasks().map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTaskComplete(task.id)}
                        onSubtaskToggle={(subtaskId) => toggleSubtaskComplete(task.id, subtaskId)}
                        onStartFocus={() => startFocusSession(task)}
                        onShowDetail={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* High Priority Tasks */}
              {getHighPriorityTasks().length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📚 Priorità Alta
                  </h3>
                  <div className="space-y-3">
                    {getHighPriorityTasks().map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTaskComplete(task.id)}
                        onSubtaskToggle={(subtaskId) => toggleSubtaskComplete(task.id, subtaskId)}
                        onStartFocus={() => startFocusSession(task)}
                        onShowDetail={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Tasks */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📝 Altre Attività
                </h3>
                <div className="space-y-3">
                  {tasks
                    .filter(t => t.priority === 'medium' || t.priority === 'low')
                    .filter(t => !t.completed)
                    .map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTaskComplete(task.id)}
                        onSubtaskToggle={(subtaskId) => toggleSubtaskComplete(task.id, subtaskId)}
                        onStartFocus={() => startFocusSession(task)}
                        onShowDetail={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Focus Mode Status */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Focus Mode
                </h3>
                
                {focusSession ? (
                  <div>
                    <div className="text-center mb-4">
                      <div className="relative w-32 h-32 mx-auto">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke={isBreakTime ? "#10b981" : "#fbbf24"}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${((isBreakTime ? breakTimeRemaining : focusTimeRemaining) / 
                              (isBreakTime ? breakTimeRemaining + 1 : (focusSession.duration * 60))) * 352} 352`}
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatTime(isBreakTime ? breakTimeRemaining : focusTimeRemaining)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {isBreakTime ? 'Pausa' : focusSession.technique}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Materia:</span>
                        <span className="font-medium">{focusSession.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attività:</span>
                        <span className="font-medium truncate ml-2">{focusSession.topic}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sessioni:</span>
                        <span className="font-medium">{sessionCount}</span>
                      </div>
                      {sessionFocusTime > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tempo:</span>
                          <span className="font-medium text-indigo-600">
                            {Math.floor(sessionFocusTime / 60)}:{(sessionFocusTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setFocusActive(!focusActive)}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                          focusActive
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {focusActive ? <Pause className="w-4 h-4 inline" /> : <Play className="w-4 h-4 inline" />}
                      </button>
                      <button
                        onClick={() => setSelectedView('focus')}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Nessuna sessione attiva</p>
                    <button
                      onClick={() => setSelectedView('focus')}
                      className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
                    >
                      Avvia Focus Mode
                    </button>
                  </div>
                )}
                
                {/* Quick techniques */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowCustomSessionModal(true)}
                    className="flex items-center justify-center gap-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-xs"
                  >
                    <Timer className="w-3 h-3" />
                    Pomodoro
                  </button>
                  <button
                    onClick={() => setShowCustomSessionModal(true)}
                    className="flex items-center justify-center gap-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-xs"
                  >
                    <Clock className="w-3 h-3" />
                    Timeboxing
                  </button>
                </div>
              </div>

              {/* Study Stats Widget */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Statistiche Studio
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Oggi</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">
                        {Math.floor(totalFocusTime / 3600)}h {Math.floor((totalFocusTime % 3600) / 60)}m
                      </p>
                      {sessionFocusTime > 0 && (
                        <p className="text-xs text-indigo-500">
                          +{Math.floor(sessionFocusTime / 60)}m in corso
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {yesterdayFocusTime > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Ieri</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-600">
                        {Math.floor(yesterdayFocusTime / 3600)}h {Math.floor((yesterdayFocusTime % 3600) / 60)}m
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Obiettivo Giornaliero</span>
                      <span className="text-xs font-medium text-gray-700">4h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalFocusTime / 14400) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((totalFocusTime / 14400) * 100)}% completato
                    </p>
                  </div>
                </div>
              </div>

              {/* Study Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Suggerimenti Smart
                </h3>
                
                <div className="space-y-3 text-sm">
                  {currentEnergyLevel === 'high' && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <p className="text-gray-700">
                        Energia alta! Perfetto per argomenti difficili e studio intensivo.
                      </p>
                    </div>
                  )}
                  {currentEnergyLevel === 'medium' && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                      <p className="text-gray-700">
                        Energia media: ideale per esercizi e ripasso.
                      </p>
                    </div>
                  )}
                  {currentEnergyLevel === 'low' && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                      <p className="text-gray-700">
                        Energia bassa: tempo per rilettura leggera o pausa.
                      </p>
                    </div>
                  )}
                  
                  {getUrgentTasks().length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                      <p className="text-gray-700">
                        Hai {getUrgentTasks().length} task urgenti! Concentrati su questi prima.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <p className="text-gray-700">
                      Usa la tecnica Pomodoro per mantenere alta la concentrazione.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ⚡ Azioni Rapide
                </h3>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => setSelectedView('focus')}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">Avvia Focus Mode</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                  
                  <Link 
                    href="/homework"
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Tutti i Compiti</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </Link>
                  
                  <Link 
                    href="/exams"
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Verifiche</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {selectedView === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline del Pomeriggio</h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Time blocks */}
              <div className="space-y-6">
                {timeBlocks.map((block, index) => {
                  const isCurrent = currentBlock?.id === block.id;
                  const isPast = currentTime.getHours() * 60 + currentTime.getMinutes() > 
                                 parseInt(block.endTime.split(':')[0]) * 60 + parseInt(block.endTime.split(':')[1]);
                  
                  return (
                    <div key={block.id} className="relative flex items-start gap-6">
                      {/* Time */}
                      <div className="w-20 text-right">
                        <p className="font-semibold text-gray-900">{block.startTime}</p>
                        <p className="text-sm text-gray-500">{block.endTime}</p>
                      </div>
                      
                      {/* Dot */}
                      <div className={`absolute left-[88px] w-4 h-4 rounded-full border-2 ${
                        isCurrent ? 'bg-indigo-600 border-indigo-600 animate-pulse' :
                        isPast ? 'bg-gray-400 border-gray-400' :
                        'bg-white border-gray-300'
                      }`}></div>
                      
                      {/* Content */}
                      <div className={`flex-1 p-4 rounded-xl border-2 ${
                        isCurrent ? 'border-indigo-500 bg-indigo-50' :
                        isPast ? 'border-gray-200 bg-gray-50 opacity-60' :
                        'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {block.type === 'break' ? '☕ Pausa' :
                             block.type === 'meal' ? '🍽️ Pranzo' :
                             block.type === 'exercise' ? '🏃 Esercizio' :
                             '📚 Studio'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            block.energyLevel === 'high' ? 'bg-red-100 text-red-700' :
                            block.energyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {block.duration} min
                          </span>
                        </div>
                        
                        {block.tasks.length > 0 ? (
                          <div className="space-y-2">
                            {block.tasks.map(task => (
                              <div key={task.id} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.completed ? 'bg-green-500' :
                                  task.priority === 'urgent' ? 'bg-red-500' :
                                  task.priority === 'high' ? 'bg-orange-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {task.title}
                                </span>
                                {!task.completed && !isPast && (
                                  <button
                                    onClick={() => startFocusSession(task)}
                                    className="ml-auto px-2 py-0.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                                  >
                                    Start
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            {block.type === 'break' ? 'Ricarica le energie' : 'Nessuna attività pianificata'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Focus Mode View */}
        {selectedView === 'focus' && (
          <div className="min-h-[600px] bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 text-white">
            {!focusActive && !focusSession ? (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Focus Mode</h2>
                  <p className="text-gray-400">Elimina le distrazioni e raggiungi il flow state</p>
                </div>

                <div className="space-y-8">
                  {/* Template Goals - Better Spacing */}
                  <div className="bg-gray-800/50 rounded-xl p-8">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-yellow-500" />
                      Template Obiettivi Rapidi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => startCustomSession('pomodoro', 25, [
                          'Leggere e sottolineare concetti chiave',
                          'Prendere appunti strutturati',
                          'Rivedere e riassumere'
                        ])}
                        className="p-5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all text-left hover:scale-[1.02] transform">
                        <BookOpen className="w-6 h-6 text-blue-400 mb-2" />
                        <p className="font-medium text-white">Studio Capitolo</p>
                        <p className="text-xs text-gray-400 mt-1">Lettura, appunti, riassunto</p>
                      </button>
                      
                      <button
                        onClick={() => startCustomSession('pomodoro', 25, [
                          'Ripassare formule e definizioni',
                          'Fare esercizi di pratica',
                          'Controllare soluzioni e correggere errori'
                        ])}
                        className="p-5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all text-left hover:scale-[1.02] transform">
                        <Calculator className="w-6 h-6 text-green-400 mb-2" />
                        <p className="font-medium text-white">Esercizi Matematica</p>
                        <p className="text-xs text-gray-400 mt-1">Ripasso, pratica, verifica</p>
                      </button>
                      
                      <button
                        onClick={() => startCustomSession('deep-focus', 90, [
                          'Identificare argomenti chiave',
                          'Creare mappe concettuali',
                          'Memorizzare date e fatti importanti',
                          'Fare quiz di autovalutazione'
                        ])}
                        className="p-5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all text-left hover:scale-[1.02] transform">
                        <GraduationCap className="w-6 h-6 text-purple-400 mb-2" />
                        <p className="font-medium text-white">Preparazione Esame</p>
                        <p className="text-xs text-gray-400 mt-1">Ripasso completo per verifica</p>
                      </button>
                      
                      <button
                        onClick={() => startCustomSession('timeboxing', 45, [
                          'Brainstorming idee principali',
                          'Strutturare il contenuto',
                          'Scrivere bozza',
                          'Revisione e correzioni'
                        ])}
                        className="p-5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all text-left hover:scale-[1.02] transform">
                        <PenTool className="w-6 h-6 text-orange-400 mb-2" />
                        <p className="font-medium text-white">Scrittura Testo</p>
                        <p className="text-xs text-gray-400 mt-1">Tema, relazione, saggio</p>
                      </button>
                    </div>
                  </div>

                  {/* Quick Start Options - Improved Spacing */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-white mb-6">Attività Prioritarie</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tasks.filter(t => !t.completed && (t.priority === 'urgent' || t.priority === 'high')).slice(0, 4).map(task => (
                        <button
                          key={task.id}
                          onClick={() => startFocusSession(task)}
                          className="p-8 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all text-left group hover:scale-[1.02] transform">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg bg-gray-700 group-hover:bg-gray-600`}>
                              <task.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{task.title}</h3>
                              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.estimatedTime} min
                                </span>
                                <span className={`px-2 py-0.5 rounded-full ${
                                  task.priority === 'urgent' ? 'bg-red-900 text-red-300' :
                                  task.priority === 'high' ? 'bg-orange-900 text-orange-300' :
                                  'bg-blue-900 text-blue-300'
                                }`}>
                                  {task.priority === 'urgent' ? 'Urgente' :
                                   task.priority === 'high' ? 'Alta' : 'Media'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Session - Improved Spacing */}
                <div className="bg-gray-800 rounded-xl p-8 mb-8">
                  <h3 className="text-xl font-semibold mb-6">Sessione Personalizzata</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <button 
                      onClick={() => startCustomSession('pomodoro', 25)}
                      className="p-6 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all group hover:scale-105 transform">
                      <Timer className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-base font-medium mb-1">Pomodoro</p>
                      <p className="text-xs text-gray-400">25 min + pause</p>
                    </button>
                    <button 
                      onClick={() => startCustomSession('timeboxing', 45)}
                      className="p-6 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all group hover:scale-105 transform">
                      <Clock className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-base font-medium mb-1">Timeboxing</p>
                      <p className="text-xs text-gray-400">45 min blocchi</p>
                    </button>
                    <button 
                      onClick={() => startCustomSession('flowtime', 60)}
                      className="p-6 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all group hover:scale-105 transform">
                      <Activity className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-base font-medium mb-1">Flowtime</p>
                      <p className="text-xs text-gray-400">Flusso libero</p>
                    </button>
                    <button 
                      onClick={() => startCustomSession('deep-focus', 90)}
                      className="p-6 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all group hover:scale-105 transform">
                      <Zap className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-base font-medium mb-1">Deep Focus</p>
                      <p className="text-xs text-gray-400">90 min intensi</p>
                    </button>
                  </div>
                  
                  {/* Advanced Settings */}
                  <button
                    onClick={() => setShowCustomSessionModal(true)}
                    className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    Configurazione Avanzata
                  </button>
                </div>
              </div>
            ) : focusSession && (
              <div className="max-w-4xl mx-auto">
                {/* Focus Session Active */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{focusSession.subject}</h2>
                    <button
                      onClick={() => {
                        setFocusActive(false);
                        setFocusSession(null);
                      }}
                      className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-400">{focusSession.topic}</p>
                </div>

                {/* Timer */}
                <div className="text-center mb-12">
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#fbbf24"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(focusTimeRemaining / (focusSession.duration * 60)) * 553} 553`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl font-bold">
                        {formatTime(focusTimeRemaining)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-center mb-8">
                    <button
                      onClick={() => setFocusActive(!focusActive)}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        focusActive
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {focusActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {/* Goals */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Obiettivi Sessione</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">
                        {completedGoals.size}/{focusSession.goals.length} completati
                      </span>
                      <button
                        onClick={() => setShowAddGoalInput(true)}
                        className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="Aggiungi obiettivo"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {focusSession.goals.map((goal, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <input 
                          type="checkbox" 
                          checked={completedGoals.has(index)}
                          onChange={() => toggleGoalComplete(index)}
                          className="w-5 h-5 text-indigo-600 rounded cursor-pointer" 
                        />
                        <span className={`flex-1 ${completedGoals.has(index) ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                          {goal}
                        </span>
                        <button
                          onClick={() => removeGoal(index)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add new goal input */}
                    {showAddGoalInput && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newGoalText}
                          onChange={(e) => setNewGoalText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newGoalText.trim()) {
                              addNewGoal();
                            }
                          }}
                          placeholder="Nuovo obiettivo..."
                          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-gray-600"
                          autoFocus
                        />
                        <button
                          onClick={addNewGoal}
                          disabled={!newGoalText.trim()}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddGoalInput(false);
                            setNewGoalText('');
                          }}
                          className="px-3 py-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Progresso Obiettivi</span>
                      <span className="text-xs text-gray-400">
                        {focusSession.goals.length > 0 
                          ? `${Math.round((completedGoals.size / focusSession.goals.length) * 100)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: focusSession.goals.length > 0 
                            ? `${(completedGoals.size / focusSession.goals.length) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Environment Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setMusicEnabled(!musicEnabled)}
                    className={`p-4 rounded-lg transition-all ${
                      musicEnabled ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}>
                    <Headphones className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs">Musica</p>
                  </button>
                  <button 
                    onClick={() => setNotificationsBlocked(!notificationsBlocked)}
                    className={`p-4 rounded-lg transition-all ${
                      notificationsBlocked ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}>
                    {notificationsBlocked ? <EyeOff className="w-6 h-6 mx-auto mb-2" /> : <Bell className="w-6 h-6 mx-auto mb-2" />}
                    <p className="text-xs">Notifiche {notificationsBlocked ? 'Off' : 'On'}</p>
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className={`p-4 rounded-lg transition-all ${
                      isFullscreen ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}>
                    <Maximize2 className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs">Fullscreen</p>
                  </button>
                  <button 
                    onClick={() => setShowAmbientSoundMenu(true)}
                    className={`p-4 rounded-lg transition-all ${
                      ambientSound !== 'none' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}>
                    <Volume2 className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs">Suoni Ambiente</p>
                  </button>
                </div>
                
                {/* Break Timer Display if active */}
                {isBreakTime && (
                  <div className="mt-6 p-4 bg-green-900/50 rounded-xl text-center">
                    <h4 className="text-lg font-semibold text-green-400 mb-2">☕ Tempo di Pausa</h4>
                    <p className="text-3xl font-bold text-white">{formatTime(breakTimeRemaining)}</p>
                    <p className="text-sm text-gray-400 mt-2">Rilassati e ricarica le energie!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {selectedView === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Tempo</h3>
              <div className="space-y-4">
                {Object.entries(
                  tasks.reduce((acc, task) => {
                    const subject = task.subject || 'Altro';
                    acc[subject] = (acc[subject] || 0) + task.estimatedTime;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([subject, time]) => (
                  <div key={subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{subject}</span>
                      <span className="text-gray-500">{time} min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(time / getTotalStudyTime()) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Oggi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                  <p className="text-sm text-gray-500">Task Totali</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {tasks.filter(t => t.completed).length}
                  </p>
                  <p className="text-sm text-gray-500">Completati</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {getUrgentTasks().length}
                  </p>
                  <p className="text-sm text-gray-500">Urgenti</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(getProgress())}%
                  </p>
                  <p className="text-sm text-gray-500">Progresso</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowTaskDetail(false)}
          onToggle={() => toggleTaskComplete(selectedTask.id)}
          onSubtaskToggle={(subtaskId) => toggleSubtaskComplete(selectedTask.id, subtaskId)}
          onStartFocus={() => {
            startFocusSession(selectedTask);
            setShowTaskDetail(false);
          }}
        />
      )}
      
      {/* Custom Session Modal */}
      {showCustomSessionModal && (
        <CustomSessionModal
          onClose={() => setShowCustomSessionModal(false)}
          onStart={(technique, duration) => startCustomSession(technique, duration)}
          settings={customSessionSettings}
          onUpdateSettings={setCustomSessionSettings}
        />
      )}
      
      {/* Ambient Sound Menu */}
      {showAmbientSoundMenu && (
        <AmbientSoundMenu
          currentSound={ambientSound}
          onSelectSound={(sound) => {
            setAmbientSound(sound);
            setShowAmbientSoundMenu(false);
          }}
          onClose={() => setShowAmbientSoundMenu(false)}
        />
      )}
    </AppLayout>
  );
}

// Task Card Component
function TaskCard({ task, onToggle, onSubtaskToggle, onStartFocus, onShowDetail }: any) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      task.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 
      task.priority === 'urgent' ? 'bg-red-50 border-red-200' :
      task.priority === 'high' ? 'bg-orange-50 border-orange-200' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : task.priority === 'urgent' ? 'border-red-500 hover:bg-red-100' :
                task.priority === 'high' ? 'border-orange-500 hover:bg-orange-100' :
                'border-gray-300 hover:border-indigo-500'
          }`}
        >
          {task.completed && <CheckCircle className="w-4 h-4" />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {task.estimatedTime} min
                </span>
                {task.difficulty && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                    task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.difficulty === 'hard' ? 'Difficile' :
                     task.difficulty === 'medium' ? 'Medio' : 'Facile'}
                  </span>
                )}
                {task.energyLevel && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.energyLevel === 'high' ? 'bg-purple-100 text-purple-700' :
                    task.energyLevel === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    Energia {task.energyLevel === 'high' ? 'Alta' :
                            task.energyLevel === 'medium' ? 'Media' : 'Bassa'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!task.completed && (
                <button
                  onClick={onStartFocus}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                >
                  Focus
                </button>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
          
          {expanded && task.subtasks && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
              {task.subtasks.map((subtask: any) => (
                <label key={subtask.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => onSubtaskToggle(subtask.id)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {subtask.title}
                  </span>
                  {subtask.estimatedTime && (
                    <span className="text-xs text-gray-400">({subtask.estimatedTime} min)</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Task Detail Modal Component
function TaskDetailModal({ task, onClose, onToggle, onSubtaskToggle, onStartFocus }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Task details content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Descrizione</h3>
              <p className="text-gray-700">{task.description}</p>
            </div>
            
            {task.subtasks && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Checklist</h3>
                <div className="space-y-2">
                  {task.subtasks.map((subtask: any) => (
                    <label key={subtask.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => onSubtaskToggle(subtask.id)}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <span className={`${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {subtask.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onStartFocus}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Inizia Focus Session
              </button>
              <button
                onClick={onToggle}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {task.completed ? 'Segna come da fare' : 'Segna come completato'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Session Modal Component
function CustomSessionModal({ onClose, onStart, settings, onUpdateSettings }: any) {
  const [duration, setDuration] = useState(settings.duration);
  const [technique, setTechnique] = useState(settings.technique);
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(settings.longBreakDuration);
  const [goals, setGoals] = useState<string[]>(['']);
  const [currentGoal, setCurrentGoal] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Configura Sessione Personalizzata</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Technique Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tecnica</label>
            <select
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pomodoro">Pomodoro</option>
              <option value="timeboxing">Timeboxing</option>
              <option value="flowtime">Flowtime</option>
              <option value="deep-focus">Deep Focus</option>
            </select>
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durata Sessione (minuti)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="5"
              max="180"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {technique === 'pomodoro' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pausa Breve (minuti)
                </label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                  min="1"
                  max="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pausa Lunga (minuti)
                </label>
                <input
                  type="number"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(parseInt(e.target.value))}
                  min="5"
                  max="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}
          
          {/* Custom Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Obiettivi Sessione
            </label>
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[index] = e.target.value;
                      setGoals(newGoals);
                    }}
                    placeholder="Es. Completare capitolo 3"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => {
                      const newGoals = goals.filter((_, i) => i !== index);
                      setGoals(newGoals.length > 0 ? newGoals : ['']);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => setGoals([...goals, ''])}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Obiettivo
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                onUpdateSettings({
                  duration,
                  technique,
                  breakDuration,
                  longBreakDuration,
                  sessionsUntilLongBreak: 4
                });
                const validGoals = goals.filter(g => g.trim() !== '');
                onStart(technique, duration, validGoals.length > 0 ? validGoals : undefined);
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Avvia Sessione
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ambient Sound Menu Component
function AmbientSoundMenu({ currentSound, onSelectSound, onClose }: any) {
  const sounds = [
    { id: 'none', name: 'Nessuno', icon: VolumeX },
    { id: 'rain', name: 'Pioggia', icon: Cloud },
    { id: 'whitenoise', name: 'Rumore Bianco', icon: Activity },
    { id: 'nature', name: 'Natura', icon: Trees },
    { id: 'coffee-shop', name: 'Caffè', icon: Coffee },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Suoni Ambiente</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {sounds.map(sound => (
              <button
                key={sound.id}
                onClick={() => onSelectSound(sound.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  currentSound === sound.id
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent'
                }`}
              >
                <sound.icon className="w-5 h-5" />
                <span className="font-medium">{sound.name}</span>
                {currentSound === sound.id && (
                  <CheckCircle className="w-5 h-5 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
