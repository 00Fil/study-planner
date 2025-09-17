import { WeeklyPlan, Exam, Subject, PomodoroSession, StudyStats, Topic, Homework } from './types';

const STORAGE_KEYS = {
  WEEKLY_PLANS: 'study_weekly_plans',
  EXAMS: 'study_exams',
  SUBJECTS: 'study_subjects',
  TOPICS: 'study_topics',
  HOMEWORK: 'study_homework',
  POMODORO_SESSIONS: 'study_pomodoro_sessions',
  STATS: 'study_stats',
  PREFERENCES: 'study_preferences',
};

// Funzione helper per verificare se siamo nel browser
const isBrowser = typeof window !== 'undefined';

// Weekly Plans
export const getWeeklyPlans = (): WeeklyPlan[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANS);
  return data ? JSON.parse(data) : [];
};

export const saveWeeklyPlan = (plan: WeeklyPlan): void => {
  if (!isBrowser) return;
  const plans = getWeeklyPlans();
  const existingIndex = plans.findIndex(p => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  localStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, JSON.stringify(plans));
};

export const getCurrentWeekPlan = (): WeeklyPlan | null => {
  const plans = getWeeklyPlans();
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  return plans.find(p => {
    const planDate = new Date(p.weekStartDate);
    return planDate.toDateString() === currentWeekStart.toDateString();
  }) || null;
};

// Exams
export const getExams = (): Exam[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
  return data ? JSON.parse(data) : [];
};

export const saveExam = (exam: Exam): void => {
  if (!isBrowser) return;
  const exams = getExams();
  const existingIndex = exams.findIndex(e => e.id === exam.id);
  
  if (existingIndex >= 0) {
    exams[existingIndex] = exam;
  } else {
    exams.push(exam);
  }
  
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
};

export const deleteExam = (examId: string): void => {
  if (!isBrowser) return;
  const exams = getExams().filter(e => e.id !== examId);
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
};

// Subjects
export const getSubjects = (): Subject[] => {
  if (!isBrowser) return getDefaultSubjects();
  const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  return data ? JSON.parse(data) : getDefaultSubjects();
};

export const saveSubject = (subject: Subject): void => {
  if (!isBrowser) return;
  const subjects = getSubjects();
  const existingIndex = subjects.findIndex(s => s.name === subject.name);
  
  if (existingIndex >= 0) {
    subjects[existingIndex] = subject;
  } else {
    subjects.push(subject);
  }
  
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
};

export const deleteSubject = (subjectName: string): void => {
  if (!isBrowser) return;
  const subjects = getSubjects().filter(s => s.name !== subjectName);
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  
  // Also delete all topics for this subject
  const topics = getTopics().filter(t => t.subjectName !== subjectName);
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
};

// Topics
export const getTopics = (): Topic[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(STORAGE_KEYS.TOPICS);
  return data ? JSON.parse(data) : [];
};

export const getTopicsBySubject = (subjectName: string): Topic[] => {
  return getTopics().filter(t => t.subjectName === subjectName);
};

export const saveTopic = (topic: Topic): void => {
  if (!isBrowser) return;
  const topics = getTopics();
  const existingIndex = topics.findIndex(t => t.id === topic.id);
  
  if (existingIndex >= 0) {
    topics[existingIndex] = topic;
  } else {
    topics.push(topic);
  }
  
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  
  // Also update the subject's topics array
  const subjects = getSubjects();
  const subjectIndex = subjects.findIndex(s => s.name === topic.subjectName);
  if (subjectIndex >= 0) {
    const subjectTopics = getTopicsBySubject(topic.subjectName);
    subjects[subjectIndex].topics = subjectTopics;
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }
};

export const deleteTopic = (topicId: string): void => {
  if (!isBrowser) return;
  const topics = getTopics().filter(t => t.id !== topicId);
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
};

export const markTopicsForExam = (topicIds: string[], examId: string): void => {
  if (!isBrowser) return;
  const topics = getTopics();
  
  topics.forEach(topic => {
    if (topicIds.includes(topic.id)) {
      topic.markedForExam = true;
      if (!topic.examIds) topic.examIds = [];
      if (!topic.examIds.includes(examId)) {
        topic.examIds.push(examId);
      }
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
};

export const unmarkTopicsForExam = (topicIds: string[], examId: string): void => {
  if (!isBrowser) return;
  const topics = getTopics();
  
  topics.forEach(topic => {
    if (topicIds.includes(topic.id) && topic.examIds) {
      topic.examIds = topic.examIds.filter(id => id !== examId);
      if (topic.examIds.length === 0) {
        topic.markedForExam = false;
      }
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
};

export const getDefaultSubjects = (): Subject[] => [
  { name: 'Matematica', displayName: 'Matematica', professor: '', color: '#10B981', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Italiano', displayName: 'Italiano', professor: '', color: '#F59E0B', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Storia', displayName: 'Storia', professor: '', color: '#D97706', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Sistemi e Reti', displayName: 'Sistemi e Reti', professor: '', color: '#8B5CF6', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Lingua Inglese', displayName: 'Lingua Inglese', professor: '', color: '#3B82F6', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Informatica', displayName: 'Informatica', professor: '', color: '#F97316', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'TPSIT', displayName: 'TPSIT', professor: '', color: '#EC4899', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Gestione Progetto', displayName: 'Gestione Progetto', professor: '', color: '#EF4444', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Scienze Motorie', displayName: 'Scienze Motorie', professor: '', color: '#06B6D4', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Religione', displayName: 'Religione', professor: '', color: '#6B7280', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
];

// Pomodoro Sessions
export const getPomodoroSessions = (): PomodoroSession[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(STORAGE_KEYS.POMODORO_SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const savePomodoroSession = (session: PomodoroSession): void => {
  if (!isBrowser) return;
  const sessions = getPomodoroSessions();
  sessions.push(session);
  
  // Keep only last 100 sessions
  if (sessions.length > 100) {
    sessions.shift();
  }
  
  localStorage.setItem(STORAGE_KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
};

// Study Stats
export const getStudyStats = (): StudyStats => {
  if (!isBrowser) return getDefaultStats();
  const data = localStorage.getItem(STORAGE_KEYS.STATS);
  const stats = data ? JSON.parse(data) : getDefaultStats();
  
  // Calculate average grade from completed exams
  const exams = getExams();
  const completedExams = exams.filter(e => e.status === 'completed' && e.grade);
  
  if (completedExams.length > 0) {
    const grades = completedExams.map(e => e.grade as string);
    // Import calculateAverageGrade function
    const { calculateAverageGrade } = require('./utils');
    stats.averageGrade = calculateAverageGrade(grades);
  }
  
  return stats;
};

export const updateStudyStats = (stats: Partial<StudyStats>): void => {
  if (!isBrowser) return;
  const currentStats = getStudyStats();
  const newStats = { ...currentStats, ...stats };
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
};

export const getDefaultStats = (): StudyStats => ({
  totalHours: 0,
  completedTasks: 0,
  totalTasks: 0,
  averageGrade: 0,
  studyStreak: 0,
  subjectHours: {},
});

// Preferences
export const getPreferences = () => {
  if (!isBrowser) return getDefaultPreferences();
  const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  return data ? JSON.parse(data) : getDefaultPreferences();
};

export const savePreferences = (preferences: any): void => {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
};

export const getDefaultPreferences = () => ({
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  dailyGoalHours: 3,
  notifications: true,
  soundEnabled: true,
  theme: 'light',
});

// Homework
export const getHomework = (): Homework[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(STORAGE_KEYS.HOMEWORK);
  return data ? JSON.parse(data) : [];
};

export const saveHomework = (homework: Homework): void => {
  if (!isBrowser) return;
  const homeworkList = getHomework();
  const existingIndex = homeworkList.findIndex(h => h.id === homework.id);
  
  if (existingIndex >= 0) {
    homeworkList[existingIndex] = homework;
  } else {
    homeworkList.push(homework);
  }
  
  localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(homeworkList));
};

export const deleteHomework = (homeworkId: string): void => {
  if (!isBrowser) return;
  const homeworkList = getHomework().filter(h => h.id !== homeworkId);
  localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(homeworkList));
};

export const getHomeworkBySubject = (subjectName: string): Homework[] => {
  return getHomework().filter(h => h.subject === subjectName);
};

export const updateHomeworkStatus = (): void => {
  if (!isBrowser) return;
  const homeworkList = getHomework();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let updated = false;
  homeworkList.forEach(homework => {
    const dueDate = new Date(homework.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (homework.status === 'pending' && dueDate < today) {
      homework.status = 'overdue';
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(homeworkList));
  }
};

// Clear all data
export const clearAllData = (): void => {
  if (!isBrowser) return;
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
