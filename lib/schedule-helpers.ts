interface Lesson {
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface DaySchedule {
  [key: string]: Lesson | null;
}

export const schedule: { [key: string]: DaySchedule } = {
  LUN: {
    '7:50': { subject: 'Matematica', room: 'Aula PP07-stem', startTime: '7:50', endTime: '8:50', color: 'bg-green-100 border-green-300' },
    '8:50': { subject: 'Italiano', room: 'Aula PP07-stem', startTime: '8:50', endTime: '9:50', color: 'bg-yellow-100 border-yellow-300' },
    '9:50': { subject: 'Sistemi e Reti', room: 'Aula PS16 - ADA1', startTime: '9:50', endTime: '10:50', color: 'bg-purple-100 border-purple-300' },
    '10:50': { subject: 'Lingua Inglese', room: 'Aula PS11', startTime: '10:50', endTime: '11:50', color: 'bg-blue-100 border-blue-300' },
    '11:50': { subject: 'Informatica', room: 'LAB. INFORMATICA 3', startTime: '11:50', endTime: '12:50', color: 'bg-orange-100 border-orange-300' }
  },
  MAR: {
    '7:50': { subject: 'Informatica', room: 'Aula PS16 - ADA1', startTime: '7:50', endTime: '8:50', color: 'bg-orange-100 border-orange-300' },
    '8:50': { subject: 'Religione', room: 'Aula PP20- STEM / RELIGIONE-03', startTime: '8:50', endTime: '9:50', color: 'bg-gray-100 border-gray-300' },
    '9:50': { subject: 'TPSIT', room: 'LAB. INFORMATICA 3', startTime: '9:50', endTime: '10:50', color: 'bg-pink-100 border-pink-300' },
    '10:50': { subject: 'Storia', room: 'Aula PS05', startTime: '10:50', endTime: '11:50', color: 'bg-amber-100 border-amber-300' },
    '11:50': { subject: 'Scienze Motorie', room: 'PALESTRA ORATORIO', startTime: '11:50', endTime: '12:50', color: 'bg-cyan-100 border-cyan-300' }
  },
  MER: {
    '7:50': { subject: 'Matematica', room: 'Aula PP20- STEM', startTime: '7:50', endTime: '8:50', color: 'bg-green-100 border-green-300' },
    '8:50': { subject: 'Sistemi e Reti', room: 'LAB. INFORMATICA 2', startTime: '8:50', endTime: '9:50', color: 'bg-purple-100 border-purple-300' },
    '9:50': { subject: 'Italiano', room: 'Aula PS15', startTime: '9:50', endTime: '10:50', color: 'bg-yellow-100 border-yellow-300' },
    '10:50': null,
    '11:50': { subject: 'Informatica', room: 'LAB. INFORMATICA 3', startTime: '11:50', endTime: '12:50', color: 'bg-orange-100 border-orange-300' }
  },
  GIO: {
    '7:50': null,
    '8:50': { subject: 'Sistemi e Reti', room: 'LAB. INFORMATICA 2', startTime: '8:50', endTime: '10:50', color: 'bg-purple-100 border-purple-300' },
    '9:50': null,
    '10:50': { subject: 'Lingua Inglese', room: 'Aula PS10', startTime: '10:50', endTime: '11:50', color: 'bg-blue-100 border-blue-300' },
    '11:50': { subject: 'TPSIT', room: 'LAB. INFORMATICA 3', startTime: '11:50', endTime: '12:50', color: 'bg-pink-100 border-pink-300' }
  },
  VEN: {
    '7:50': { subject: 'Lingua Inglese', room: 'Aula PS02', startTime: '7:50', endTime: '8:50', color: 'bg-blue-100 border-blue-300' },
    '8:50': { subject: 'Storia', room: 'Aula PS23', startTime: '8:50', endTime: '9:50', color: 'bg-amber-100 border-amber-300' },
    '9:50': { subject: 'TPSIT', room: 'Aula PS23', startTime: '9:50', endTime: '10:50', color: 'bg-pink-100 border-pink-300' },
    '10:50': { subject: 'Gestione Progetto', room: 'Aula PS23', startTime: '10:50', endTime: '11:50', color: 'bg-red-100 border-red-300' },
    '11:50': { subject: 'Informatica', room: 'Aula PS16 - ADA1', startTime: '11:50', endTime: '12:50', color: 'bg-orange-100 border-orange-300' }
  },
  SAB: {
    '7:50': null,
    '8:50': { subject: 'Italiano', room: 'Aula PS10', startTime: '8:50', endTime: '9:50', color: 'bg-yellow-100 border-yellow-300' },
    '9:50': { subject: 'Matematica', room: 'Aula PS07-stem', startTime: '9:50', endTime: '10:50', color: 'bg-green-100 border-green-300' },
    '10:50': { subject: 'Gestione Progetto', room: 'Aula PS12-ADA2', startTime: '10:50', endTime: '11:50', color: 'bg-red-100 border-red-300' },
    '11:50': { subject: 'Informatica', room: 'LAB. INFORMATICA 3', startTime: '11:50', endTime: '12:50', color: 'bg-orange-100 border-orange-300' }
  }
};

const timeSlots = ['7:50', '8:50', '9:50', '10:50', '11:50'];
const days = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];

export function getCurrentLesson(): Lesson | null {
  const now = new Date();
  const dayIndex = now.getDay();
  
  if (dayIndex === 0) return null; // Sunday
  
  const currentDay = days[dayIndex];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  for (const timeSlot of timeSlots) {
    const lesson = schedule[currentDay]?.[timeSlot];
    if (!lesson) continue;

    const [slotHour, slotMinute] = lesson.startTime.split(':').map(Number);
    const [endHour, endMinute] = lesson.endTime.split(':').map(Number);
    const slotStartInMinutes = slotHour * 60 + slotMinute;
    const slotEndInMinutes = endHour * 60 + endMinute;

    if (currentTimeInMinutes >= slotStartInMinutes && currentTimeInMinutes < slotEndInMinutes) {
      return lesson;
    }
  }

  return null;
}

export function getNextLesson(): Lesson | null {
  const now = new Date();
  const dayIndex = now.getDay();
  
  if (dayIndex === 0) {
    // Sunday - return Monday's first lesson
    const mondayLessons = Object.values(schedule.LUN).filter(l => l !== null);
    return mondayLessons[0] as Lesson;
  }
  
  const currentDay = days[dayIndex];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Check today's remaining lessons
  for (const timeSlot of timeSlots) {
    const lesson = schedule[currentDay]?.[timeSlot];
    if (!lesson) continue;

    const [slotHour, slotMinute] = lesson.startTime.split(':').map(Number);
    const slotStartInMinutes = slotHour * 60 + slotMinute;

    if (currentTimeInMinutes < slotStartInMinutes) {
      return lesson;
    }
  }

  // If no more lessons today, get tomorrow's first lesson
  const tomorrowIndex = (dayIndex + 1) % 7;
  if (tomorrowIndex === 0) {
    // Sunday - return Monday's first lesson
    const mondayLessons = Object.values(schedule.LUN).filter(l => l !== null);
    return mondayLessons[0] as Lesson;
  }
  
  const tomorrowDay = days[tomorrowIndex];
  const tomorrowLessons = Object.values(schedule[tomorrowDay] || {}).filter(l => l !== null);
  return tomorrowLessons[0] as Lesson;
}

export function getTodayLessons(): Lesson[] {
  const now = new Date();
  const dayIndex = now.getDay();
  
  if (dayIndex === 0) return []; // Sunday
  
  const currentDay = days[dayIndex];
  return Object.values(schedule[currentDay] || {}).filter(l => l !== null) as Lesson[];
}

export function getWeeklyHoursBySubject(): { [subject: string]: number } {
  const hours: { [subject: string]: number } = {};
  
  for (const day of Object.values(schedule)) {
    for (const lesson of Object.values(day)) {
      if (lesson) {
        hours[lesson.subject] = (hours[lesson.subject] || 0) + 1;
      }
    }
  }
  
  return hours;
}

export function getOptimalStudyPlan(upcomingExams: any[]): { [subject: string]: number } {
  const weeklyHours = getWeeklyHoursBySubject();
  const studyPlan: { [subject: string]: number } = {};
  
  // Base study time: 30 minutes for each weekly hour
  for (const [subject, hours] of Object.entries(weeklyHours)) {
    studyPlan[subject] = hours * 30;
  }
  
  // Add extra time for subjects with upcoming exams
  for (const exam of upcomingExams) {
    const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 7) {
      // Exam within a week: add 60 minutes
      studyPlan[exam.subject] = (studyPlan[exam.subject] || 0) + 60;
    } else if (daysUntil <= 14) {
      // Exam within 2 weeks: add 30 minutes
      studyPlan[exam.subject] = (studyPlan[exam.subject] || 0) + 30;
    }
  }
  
  return studyPlan;
}