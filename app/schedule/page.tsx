'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Clock, MapPin, BookOpen } from 'lucide-react';

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

const schedule: { [key: string]: DaySchedule } = {
  LUN: {
    '7:50': { subject: 'MATEMATICA', room: 'PP07-stem', startTime: '7:50', endTime: '8:50', color: 'bg-green-200' },
    '8:50': { subject: 'ITALIANO E STORIA', room: 'PP07-stem', startTime: '8:50', endTime: '9:50', color: 'bg-yellow-200' },
    '9:50': { subject: 'SISTEMI E RETI', room: 'PS16-ADA1', startTime: '9:50', endTime: '10:50', color: 'bg-purple-200' },
    '10:50': { subject: 'LINGUA INGLESE', room: 'PS11', startTime: '10:50', endTime: '11:50', color: 'bg-blue-200' },
    '11:50': { subject: 'INFORMATICA', room: 'LAB INF 3', startTime: '11:50', endTime: '12:50', color: 'bg-orange-200' }
  },
  MAR: {
    '7:50': { subject: 'INFORMATICA', room: 'PS16-ADA1', startTime: '7:50', endTime: '8:50', color: 'bg-orange-200' },
    '8:50': { subject: 'RELIGIONE', room: 'PP20-STEM', startTime: '8:50', endTime: '9:50', color: 'bg-gray-200' },
    '9:50': { subject: 'TPSIT', room: 'LAB INF 3', startTime: '9:50', endTime: '10:50', color: 'bg-pink-200' },
    '10:50': { subject: 'ITALIANO E STORIA', room: 'PS05', startTime: '10:50', endTime: '11:50', color: 'bg-yellow-200' },
    '11:50': { subject: 'SCIENZE MOTORIE', room: 'PALESTRA', startTime: '11:50', endTime: '12:50', color: 'bg-cyan-200' }
  },
  MER: {
    '7:50': { subject: 'MATEMATICA', room: 'PP20-STEM', startTime: '7:50', endTime: '8:50', color: 'bg-green-200' },
    '8:50': { subject: 'SISTEMI E RETI', room: 'LAB INF 2', startTime: '8:50', endTime: '9:50', color: 'bg-purple-200' },
    '9:50': { subject: 'ITALIANO E STORIA', room: 'PS15', startTime: '9:50', endTime: '10:50', color: 'bg-yellow-200' },
    '10:50': null,
    '11:50': { subject: 'INFORMATICA', room: 'LAB INF 3', startTime: '11:50', endTime: '12:50', color: 'bg-orange-200' }
  },
  GIO: {
    '7:50': null,
    '8:50': { subject: 'SISTEMI E RETI', room: 'LAB INF 2', startTime: '8:50', endTime: '10:50', color: 'bg-purple-200' },
    '9:50': null,
    '10:50': { subject: 'LINGUA INGLESE', room: 'PS10', startTime: '10:50', endTime: '11:50', color: 'bg-blue-200' },
    '11:50': { subject: 'TPSIT', room: 'LAB INF 3', startTime: '11:50', endTime: '12:50', color: 'bg-pink-200' }
  },
  VEN: {
    '7:50': { subject: 'LINGUA INGLESE', room: 'PS02', startTime: '7:50', endTime: '8:50', color: 'bg-blue-200' },
    '8:50': { subject: 'ITALIANO E STORIA', room: 'PS23', startTime: '8:50', endTime: '9:50', color: 'bg-yellow-200' },
    '9:50': { subject: 'TPSIT', room: 'PS23', startTime: '9:50', endTime: '10:50', color: 'bg-pink-200' },
    '10:50': { subject: 'GESTIONE PROGETTO', room: 'PS23', startTime: '10:50', endTime: '11:50', color: 'bg-red-200' },
    '11:50': { subject: 'INFORMATICA', room: 'PS16-ADA1', startTime: '11:50', endTime: '12:50', color: 'bg-orange-200' }
  },
  SAB: {
    '7:50': null,
    '8:50': { subject: 'ITALIANO E STORIA', room: 'PS10', startTime: '8:50', endTime: '9:50', color: 'bg-yellow-200' },
    '9:50': { subject: 'MATEMATICA', room: 'PS07-stem', startTime: '9:50', endTime: '10:50', color: 'bg-green-200' },
    '10:50': { subject: 'GESTIONE PROGETTO', room: 'PS12-ADA2', startTime: '10:50', endTime: '11:50', color: 'bg-red-200' },
    '11:50': { subject: 'INFORMATICA', room: 'LAB INF 3', startTime: '11:50', endTime: '12:50', color: 'bg-orange-200' }
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orario Scolastico</h1>
          <p className="text-gray-600">Classe 5ª I - {daysFull[currentTime.getDay() - 1] || 'Weekend'}</p>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Lesson */}
          <div className={`rounded-xl shadow-sm p-6 ${currentLesson ? 'bg-green-50 border-2 border-green-300' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Ora Attuale - {formatTime(currentTime)}</h2>
            </div>
            {currentLesson ? (
              <div>
                <p className="text-xl font-bold text-gray-900 mb-2">{currentLesson.subject}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{currentLesson.room}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {currentLesson.startTime} - {currentLesson.endTime}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Nessuna lezione in corso</p>
            )}
          </div>

          {/* Next Lesson */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Prossima Lezione</h2>
            </div>
            {nextLesson ? (
              <div>
                <p className="text-xl font-bold text-gray-900 mb-2">{nextLesson.subject}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{nextLesson.room}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {nextLesson.startTime} - {nextLesson.endTime}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Nessuna lezione programmata</p>
            )}
          </div>
        </div>

        {/* Weekly Schedule Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Orario Settimanale</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ora
                  </th>
                  {days.map((day, index) => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      {daysFull[index]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeSlots.map((time, timeIndex) => (
                  <tr key={time}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {time} - {parseInt(time.split(':')[0]) + 1}:{time.split(':')[1]}
                    </td>
                    {days.map(day => {
                      const lesson = schedule[day][time];
                      const isCurrent = isCurrentSlot(day, time);
                      
                      // Check if this is a continuation of the previous lesson
                      if (day === 'GIO' && time === '9:50') {
                        return <td key={`${day}-${time}`} className="px-4 py-3"></td>;
                      }
                      
                      return (
                        <td key={`${day}-${time}`} className="px-4 py-3">
                          {lesson ? (
                            <div className={`p-3 rounded-lg border-2 ${lesson.color} ${
                              isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''
                            } ${day === 'GIO' && time === '8:50' ? 'row-span-2' : ''}`}>
                              <p className="text-xs font-semibold text-gray-900 mb-1">
                                {lesson.subject}
                              </p>
                              <p className="text-xs text-gray-600">
                                📍 {lesson.room}
                              </p>
                              {isCurrent && (
                                <span className="inline-block mt-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                  IN CORSO
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-gray-400">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legenda Materie</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm">Matematica</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
              <span className="text-sm">Italiano e Storia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-2 border-purple-300 rounded"></div>
              <span className="text-sm">Sistemi e Reti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-sm">Inglese</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
              <span className="text-sm">Informatica</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-100 border-2 border-pink-300 rounded"></div>
              <span className="text-sm">TPSIT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-sm">Gestione Progetto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-100 border-2 border-cyan-300 rounded"></div>
              <span className="text-sm">Scienze Motorie</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}