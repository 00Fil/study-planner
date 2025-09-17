'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Clock, 
  MapPin, 
  BookOpen, 
  Calculator,
  Globe,
  Monitor,
  Network,
  Cpu,
  Activity,
  Book,
  FolderOpen,
  Church,
  Calendar,
  ChevronRight,
  User,
  Building
} from 'lucide-react';

interface Lesson {
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  duration?: number; // in hours
  color: string;
  bgColor: string;
  icon?: any;
}

interface DaySchedule {
  [key: string]: Lesson | null;
}

// Mappa icone per materie
const subjectIcons: { [key: string]: any } = {
  'MATEMATICA': Calculator,
  'ITALIANO E STORIA': Book,
  'SISTEMI E RETI': Network,
  'LINGUA INGLESE': Globe,
  'INFORMATICA': Monitor,
  'TECNOLOGIE E PROGETTAZIONE DI SISTEMI INFORMATICI E DI TELECOMUNICAZIONI': Cpu,
  'GESTIONE PROGETTO, ORGANIZZAZIONE D\'IMPRESA': FolderOpen,
  'SCIENZE MOTORIE E SPORTIVE': Activity,
  'RELIGIONE CATTOLICA/ATTIVITA\' ALTERNATIVA': Church
};

const schedule: { [key: string]: DaySchedule } = {
  LUN: {
    '7:50': { 
      subject: 'MATEMATICA', 
      room: 'Aula PP07-stem', 
      startTime: '7:50', 
      endTime: '8:50', 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border border-emerald-300',
      icon: Calculator
    },
    '8:50': { 
      subject: 'ITALIANO E STORIA', 
      room: 'Aula PP07-stem', 
      startTime: '8:50', 
      endTime: '9:50', 
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border border-amber-300',
      icon: Book
    },
    '9:50': { 
      subject: 'SISTEMI E RETI', 
      room: 'Aula PS16 - ADA1', 
      startTime: '9:50', 
      endTime: '10:50', 
      color: 'text-violet-700',
      bgColor: 'bg-violet-50 border border-violet-300',
      icon: Network
    },
    '10:50': { 
      subject: 'LINGUA INGLESE', 
      room: 'Aula PS11', 
      startTime: '10:50', 
      endTime: '11:50', 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border border-blue-300',
      icon: Globe
    },
    '11:50': { 
      subject: 'INFORMATICA', 
      room: 'LAB. INFORMATICA 3', 
      startTime: '11:50', 
      endTime: '12:50', 
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border border-orange-300',
      icon: Monitor
    }
  },
  MAR: {
    '7:50': { 
      subject: 'INFORMATICA', 
      room: 'Aula PS16 - ADA1', 
      startTime: '7:50', 
      endTime: '8:50', 
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border border-orange-300',
      icon: Monitor
    },
    '8:50': { 
      subject: 'RELIGIONE CATTOLICA/ATTIVITA\' ALTERNATIVA', 
      room: 'Aula PP20-STEM / RELIGIONE-03', 
      startTime: '8:50', 
      endTime: '9:50', 
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border border-gray-300',
      icon: Church
    },
    '9:50': { 
      subject: 'TECNOLOGIE E PROGETTAZIONE DI SISTEMI INFORMATICI E DI TELECOMUNICAZIONI', 
      room: 'LAB. INFORMATICA 3', 
      startTime: '9:50', 
      endTime: '11:50', 
      duration: 2,
      color: 'text-pink-700',
      bgColor: 'bg-pink-50 border border-pink-300',
      icon: Cpu
    },
    '10:50': null, // Occupato da TPSIT 2 ore
    '11:50': { 
      subject: 'SCIENZE MOTORIE E SPORTIVE', 
      room: 'PALESTRA ORATORIO', 
      startTime: '11:50', 
      endTime: '12:50', 
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50 border border-cyan-300',
      icon: Activity
    }
  },
  MER: {
    '7:50': { 
      subject: 'MATEMATICA', 
      room: 'Aula PP20-STEM', 
      startTime: '7:50', 
      endTime: '8:50', 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border border-emerald-300',
      icon: Calculator
    },
    '8:50': { 
      subject: 'SISTEMI E RETI', 
      room: 'LAB. INFORMATICA 2', 
      startTime: '8:50', 
      endTime: '9:50', 
      color: 'text-violet-700',
      bgColor: 'bg-violet-50 border border-violet-300',
      icon: Network
    },
    '9:50': { 
      subject: 'ITALIANO E STORIA', 
      room: 'Aula PS15', 
      startTime: '9:50', 
      endTime: '10:50', 
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border border-amber-300',
      icon: Book
    },
    '10:50': { 
      subject: 'INFORMATICA', 
      room: 'LAB. INFORMATICA 3', 
      startTime: '10:50', 
      endTime: '12:50', 
      duration: 2,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border border-orange-300',
      icon: Monitor
    },
    '11:50': null // Occupato da Informatica 2 ore
  },
  GIO: {
    '7:50': { 
      subject: 'SISTEMI E RETI', 
      room: 'LAB. INFORMATICA 2', 
      startTime: '7:50', 
      endTime: '9:50', 
      duration: 2,
      color: 'text-violet-700',
      bgColor: 'bg-violet-50 border border-violet-300',
      icon: Network
    },
    '8:50': null, // Occupato da Sistemi e Reti 2 ore
    '9:50': { 
      subject: 'GESTIONE PROGETTO, ORGANIZZAZIONE D\'IMPRESA', 
      room: 'Aula PS22', 
      startTime: '9:50', 
      endTime: '10:50', 
      color: 'text-red-700',
      bgColor: 'bg-red-50 border border-red-300',
      icon: FolderOpen
    },
    '10:50': { 
      subject: 'LINGUA INGLESE', 
      room: 'Aula PS10', 
      startTime: '10:50', 
      endTime: '11:50', 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border border-blue-300',
      icon: Globe
    },
    '11:50': { 
      subject: 'TECNOLOGIE E PROGETTAZIONE DI SISTEMI INFORMATICI E DI TELECOMUNICAZIONI', 
      room: 'LAB. INFORMATICA 3', 
      startTime: '11:50', 
      endTime: '12:50', 
      color: 'text-pink-700',
      bgColor: 'bg-pink-50 border border-pink-300',
      icon: Cpu
    }
  },
  VEN: {
    '7:50': { 
      subject: 'LINGUA INGLESE', 
      room: 'Aula PS02', 
      startTime: '7:50', 
      endTime: '8:50', 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border border-blue-300',
      icon: Globe
    },
    '8:50': { 
      subject: 'ITALIANO E STORIA', 
      room: 'Aula PS23', 
      startTime: '8:50', 
      endTime: '9:50', 
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border border-amber-300',
      icon: Book
    },
    '9:50': { 
      subject: 'TECNOLOGIE E PROGETTAZIONE DI SISTEMI INFORMATICI E DI TELECOMUNICAZIONI', 
      room: 'Aula PS23', 
      startTime: '9:50', 
      endTime: '10:50', 
      color: 'text-pink-700',
      bgColor: 'bg-pink-50 border border-pink-300',
      icon: Cpu
    },
    '10:50': { 
      subject: 'GESTIONE PROGETTO, ORGANIZZAZIONE D\'IMPRESA', 
      room: 'Aula PS23', 
      startTime: '10:50', 
      endTime: '11:50', 
      color: 'text-red-700',
      bgColor: 'bg-red-50 border border-red-300',
      icon: FolderOpen
    },
    '11:50': { 
      subject: 'INFORMATICA', 
      room: 'Aula PS16 - ADA1', 
      startTime: '11:50', 
      endTime: '12:50', 
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border border-orange-300',
      icon: Monitor
    }
  },
  SAB: {
    '7:50': { 
      subject: 'ITALIANO E STORIA', 
      room: 'Aula PS10', 
      startTime: '7:50', 
      endTime: '9:50', 
      duration: 2,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border border-amber-300',
      icon: Book
    },
    '8:50': null, // Occupato da Italiano e Storia 2 ore
    '9:50': { 
      subject: 'MATEMATICA', 
      room: 'Aula PS07-stem', 
      startTime: '9:50', 
      endTime: '10:50', 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border border-emerald-300',
      icon: Calculator
    },
    '10:50': { 
      subject: 'GESTIONE PROGETTO, ORGANIZZAZIONE D\'IMPRESA', 
      room: 'Aula PS12-ADA2', 
      startTime: '10:50', 
      endTime: '11:50', 
      color: 'text-red-700',
      bgColor: 'bg-red-50 border border-red-300',
      icon: FolderOpen
    },
    '11:50': { 
      subject: 'INFORMATICA', 
      room: 'LAB. INFORMATICA 3', 
      startTime: '11:50', 
      endTime: '12:50', 
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border border-orange-300',
      icon: Monitor
    }
  }
};

const timeSlots = ['7:50', '8:50', '9:50', '10:50', '11:50'];
const days = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
const daysFull = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function SchedulePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    updateCurrentLesson();

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    updateCurrentLesson();
  }, [currentTime]);

  const updateCurrentLesson = () => {
    const now = new Date();
    const dayIndex = now.getDay() - 1; // 0 = Sunday, so we need -1
    
    if (dayIndex < 0 || dayIndex > 5) {
      setCurrentLesson(null);
      setNextLesson(null);
      return; // Weekend
    }

    const currentDay = days[dayIndex];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    let current: Lesson | null = null;
    let next: Lesson | null = null;

    for (const timeSlot of timeSlots) {
      const lesson = schedule[currentDay][timeSlot];
      if (!lesson) continue;

      const [slotHour, slotMinute] = lesson.startTime.split(':').map(Number);
      const [endHour, endMinute] = lesson.endTime.split(':').map(Number);
      const slotStartInMinutes = slotHour * 60 + slotMinute;
      const slotEndInMinutes = endHour * 60 + endMinute;

      if (currentTimeInMinutes >= slotStartInMinutes && currentTimeInMinutes < slotEndInMinutes) {
        current = lesson;
      } else if (currentTimeInMinutes < slotStartInMinutes && !next) {
        next = lesson;
      }
    }

    setCurrentLesson(current);
    setNextLesson(next);
  };

  const isCurrentSlot = (day: string, time: string) => {
    const now = new Date();
    const dayIndex = now.getDay() - 1;
    
    if (dayIndex < 0 || dayIndex > 5) return false;
    if (days[dayIndex] !== day) return false;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [slotHour, slotMinute] = time.split(':').map(Number);
    const slotStartInMinutes = slotHour * 60 + slotMinute;
    const slotEndInMinutes = slotStartInMinutes + 60; // 1 hour lessons

    return currentTimeInMinutes >= slotStartInMinutes && currentTimeInMinutes < slotEndInMinutes;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  // Funzione per ottenere il nome abbreviato della materia
  const getShortSubjectName = (subject: string) => {
    const shortNames: { [key: string]: string } = {
      'TECNOLOGIE E PROGETTAZIONE DI SISTEMI INFORMATICI E DI TELECOMUNICAZIONI': 'T.P.S.I.T.',
      'GESTIONE PROGETTO, ORGANIZZAZIONE D\'IMPRESA': 'GESTIONE PROGETTO',
      'RELIGIONE CATTOLICA/ATTIVITA\' ALTERNATIVA': 'RELIGIONE',
      'SCIENZE MOTORIE E SPORTIVE': 'SCIENZE MOTORIE'
    };
    return shortNames[subject] || subject;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold mb-1">Orario Scolastico</h1>
              <p className="text-indigo-100">Classe 5ª I • {daysFull[currentTime.getDay() - 1] || 'Weekend'}</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Lesson */}
          <div className={`rounded-2xl shadow-lg p-6 transition-all duration-300 ${
            currentLesson 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 shadow-green-200' 
              : 'bg-white border-2 border-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${currentLesson ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Clock className={`w-5 h-5 ${currentLesson ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lezione Attuale</h2>
                <p className="text-sm text-gray-500">{formatTime(currentTime)}</p>
              </div>
            </div>
            {currentLesson ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {currentLesson.icon && <currentLesson.icon className={`w-6 h-6 ${currentLesson.color}`} />}
                  <p className="text-xl font-bold text-gray-900">{getShortSubjectName(currentLesson.subject)}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{currentLesson.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {currentLesson.startTime} - {currentLesson.endTime}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Nessuna lezione in corso</p>
            )}
          </div>

          {/* Next Lesson */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Prossima Lezione</h2>
                <p className="text-sm text-gray-500">In arrivo</p>
              </div>
            </div>
            {nextLesson ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {nextLesson.icon && <nextLesson.icon className={`w-6 h-6 ${nextLesson.color}`} />}
                  <p className="text-xl font-bold text-gray-900">{getShortSubjectName(nextLesson.subject)}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{nextLesson.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {nextLesson.startTime} - {nextLesson.endTime}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Nessuna lezione programmata</p>
            )}
          </div>
        </div>

        {/* Weekly Schedule Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              <h2 className="text-xl font-bold">Orario Settimanale</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-700 w-24">
                    ORA
                  </th>
                  {days.map((day, index) => (
                    <th key={day} className="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-700 w-1/6">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, timeIndex) => {
                  const nextTime = `${parseInt(time.split(':')[0]) + 1}:${time.split(':')[1]}`;
                  
                  return (
                    <tr key={time} className="h-20">
                      <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 text-center bg-gray-50">
                        <div className="text-sm font-medium">
                          {time}
                        </div>
                        <div className="text-xs text-gray-500">
                          {nextTime}
                        </div>
                      </td>
                      {days.map(day => {
                        const lesson = schedule[day][time];
                        const isCurrent = isCurrentSlot(day, time);
                        
                        // Skip rendering for cells occupied by 2-hour lessons
                        if ((day === 'MAR' && time === '10:50' && schedule[day]['9:50']?.duration === 2) ||
                            (day === 'MER' && time === '11:50' && schedule[day]['10:50']?.duration === 2) ||
                            (day === 'GIO' && time === '8:50' && schedule[day]['7:50']?.duration === 2) ||
                            (day === 'SAB' && time === '8:50' && schedule[day]['7:50']?.duration === 2)) {
                          return null;
                        }
                        
                        const rowSpan = lesson?.duration || 1;
                        
                        return (
                          <td 
                            key={`${day}-${time}`} 
                            className={`border border-gray-300 p-0 relative ${
                              lesson ? lesson.bgColor : 'bg-gray-50'
                            } ${isCurrent ? 'ring-2 ring-green-500 ring-inset' : ''}`}
                            rowSpan={rowSpan}
                          >
                            {lesson ? (
                              <div className="h-full w-full flex flex-col justify-center px-3 py-2.5 relative">
                                {/* Subject Name with Icon */}
                                <div className="flex items-center gap-2">
                                  {lesson.icon && (
                                    <lesson.icon className={`w-4 h-4 ${lesson.color} flex-shrink-0`} />
                                  )}
                                  <p className={`text-sm font-bold ${lesson.color} uppercase`}>
                                    {getShortSubjectName(lesson.subject)}
                                  </p>
                                </div>
                                
                                {/* Room */}
                                <div className="text-xs text-gray-600 mt-1 ml-6">
                                  {lesson.room}
                                </div>
                                
                                {/* Duration for 2-hour lessons */}
                                {lesson.duration === 2 && (
                                  <div className="text-xs text-gray-500 mt-2 ml-6">
                                    {lesson.startTime} - {lesson.endTime}
                                  </div>
                                )}
                                
                                {/* Current Lesson Indicator */}
                                {isCurrent && (
                                  <div className="absolute top-1 right-1">
                                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                                      •
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-gray-300">—</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}