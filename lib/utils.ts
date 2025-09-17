import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}

export function getWeekDates(startDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

export function getDaysUntilExam(examDate: string): number {
  const today = new Date();
  const exam = new Date(examDate);
  const diffTime = exam.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getGradeColor(grade: string | number): string {
  // Convert grade string to number for comparison
  const numericGrade = parseGradeToNumber(grade);
  if (numericGrade >= 8) return 'text-green-600';
  if (numericGrade >= 6) return 'text-yellow-600';
  return 'text-red-600';
}

export function parseGradeToNumber(grade: string | number): number {
  if (typeof grade === 'number') return grade;
  
  // Remove any '+' and convert to number
  const cleanGrade = grade.replace('+', '.5');
  
  // Handle special cases like "6+" -> 6.5, "7½" -> 7.5
  if (cleanGrade.includes('½')) {
    return parseFloat(cleanGrade.replace('½', '.5'));
  }
  
  return parseFloat(cleanGrade) || 0;
}

export function calculateAverageGrade(grades: (string | number)[]): number {
  if (!grades || grades.length === 0) return 0;
  
  const numericGrades = grades.map(g => parseGradeToNumber(g));
  const sum = numericGrades.reduce((acc, grade) => acc + grade, 0);
  
  return Math.round((sum / numericGrades.length) * 10) / 10; // Round to 1 decimal
}

export function calculateCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}