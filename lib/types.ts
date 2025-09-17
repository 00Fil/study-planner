export interface WeeklyPlan {
  id: string;
  weekStartDate: string;
  goals: string[];
  days: DayPlan[];
}

export interface DayPlan {
  date: string;
  dayName: string;
  schoolSubjects: string[];
  topicsLearned: string[];
  afternoon: StudySession;
  evening: StudySession;
  completed: boolean;
}

export interface StudySession {
  immediateReview: Task;
  mainSubject: Task;
  secondarySubject: Task;
  exercises: Task;
}

export interface Task {
  name: string;
  duration: number; // in minutes
  completed: boolean;
}

export interface Exam {
  id: string;
  date: string;
  subject: string;
  type: string;
  topics: string[];  // Topic IDs that will be in the exam
  difficulty?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  grade?: number;
  notes?: string;
}

export interface StudyStats {
  totalHours: number;
  completedTasks: number;
  totalTasks: number;
  averageGrade: number;
  studyStreak: number;
  subjectHours: Record<string, number>;
}

export interface PomodoroSession {
  id: string;
  subject: string;
  topic?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  notes?: string;
}

export interface Subject {
  name: string;  // Nome originale (es. da ClasseViva)
  displayName?: string;  // Nome personalizzato mostrato all'utente
  professor?: string;  // Nome del professore
  color: string;
  currentTopic: string;
  lastStudied: string;
  totalHours: number;
  averageGrade: number;
  topics?: Topic[];
  examGrades?: string[];  // Changed to string to support half grades and + notation
}

export interface Topic {
  id: string;
  subjectName: string;  // Reference to the subject
  name: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  difficulty: number;
  estimatedHours: number;
  actualHours: number;
  markedForExam?: boolean;  // If this topic is selected for upcoming exam
  examIds?: string[];  // Which exams include this topic
  notes?: string;
  resources?: string[];
  completedDate?: string;
  
  // Legacy fields for compatibility
  title?: string;
  dateAdded?: string;
  dateStudied?: string;
  completed?: boolean;
  importance?: 'low' | 'medium' | 'high';
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  estimatedHours: number;
  actualHours: number;
  attachments?: string[];
  notes?: string;
  completedDate?: string;
  
  // Legacy fields for compatibility
  due_date?: string;
  assignedDate?: string;
  topics?: string[];
}
