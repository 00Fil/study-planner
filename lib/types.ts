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
  type: 'written' | 'oral';
  topics: string[];  // Topic IDs that will be in the exam
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  grade?: string;  // Changed to string to support half grades and + notation
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
  startTime: string;
  duration: number;
  completed: boolean;
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
  title: string;
  description?: string;
  dateAdded: string;  // When the topic was taught/added
  dateStudied?: string;  // Last time it was studied
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 'low' | 'medium' | 'high';
  notes?: string;
  markedForExam?: boolean;  // If this topic is selected for upcoming exam
  examIds?: string[];  // Which exams include this topic
}

export interface Homework {
  id: string;
  subject: string;
  description: string;
  dueDate: string;
  assignedDate: string;
  topics?: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue';
  estimatedHours?: number;
  notes?: string;
  completedDate?: string;
}
