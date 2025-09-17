'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { getSubjects, savePomodoroSession, updateStudyStats, getPreferences, savePreferences } from '@/lib/storage';
import { Subject } from '@/lib/types';

export default function PomodoroTimer() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMode, setCurrentMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [preferences, setPreferences] = useState({
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // Load subjects and preferences
    setSubjects(getSubjects());
    const prefs = getPreferences();
    setPreferences({
      pomodoroMinutes: prefs.pomodoroMinutes,
      shortBreakMinutes: prefs.shortBreakMinutes,
      longBreakMinutes: prefs.longBreakMinutes,
    });
    setSoundEnabled(prefs.soundEnabled);
    setTimeLeft(prefs.pomodoroMinutes * 60);

    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    
    // Play sound if enabled
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Fallback if audio fails
        console.log('Audio playback failed');
      });
    }

    if (currentMode === 'pomodoro') {
      // Save session
      if (selectedSubject && startTimeRef.current) {
        const session = {
          id: Date.now().toString(),
          subject: selectedSubject,
          startTime: startTimeRef.current.toISOString(),
          duration: preferences.pomodoroMinutes,
          completed: true,
        };
        savePomodoroSession(session);
        
        // Update stats
        const stats = {
          totalHours: preferences.pomodoroMinutes / 60,
          completedTasks: 1,
        };
        updateStudyStats(stats);
      }

      setPomodoroCount((prev) => prev + 1);
      
      // Decide next mode
      if (pomodoroCount > 0 && (pomodoroCount + 1) % 4 === 0) {
        // Long break after 4 pomodoros
        setCurrentMode('longBreak');
        setTimeLeft(preferences.longBreakMinutes * 60);
        toast.success('🎉 Grande! Hai completato 4 pomodori! Prenditi una pausa lunga.');
      } else {
        // Short break
        setCurrentMode('shortBreak');
        setTimeLeft(preferences.shortBreakMinutes * 60);
        toast.success('✅ Pomodoro completato! Prenditi una pausa.');
      }
    } else {
      // Break completed, back to pomodoro
      setCurrentMode('pomodoro');
      setTimeLeft(preferences.pomodoroMinutes * 60);
      toast.info('⏰ Pausa finita! Pronto per un altro pomodoro?');
    }
  }, [currentMode, pomodoroCount, preferences, selectedSubject, soundEnabled]);

  const startTimer = () => {
    if (currentMode === 'pomodoro' && !selectedSubject) {
      toast.error('Seleziona una materia prima di iniziare!');
      return;
    }
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = new Date();
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    switch (currentMode) {
      case 'pomodoro':
        setTimeLeft(preferences.pomodoroMinutes * 60);
        break;
      case 'shortBreak':
        setTimeLeft(preferences.shortBreakMinutes * 60);
        break;
      case 'longBreak':
        setTimeLeft(preferences.longBreakMinutes * 60);
        break;
    }
  };

  const switchMode = (mode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    if (isRunning) {
      const confirm = window.confirm('Sei sicuro di voler cambiare modalità? Il timer corrente verrà resettato.');
      if (!confirm) return;
    }
    
    setCurrentMode(mode);
    setIsRunning(false);
    setIsPaused(false);
    
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(preferences.pomodoroMinutes * 60);
        break;
      case 'shortBreak':
        setTimeLeft(preferences.shortBreakMinutes * 60);
        break;
      case 'longBreak':
        setTimeLeft(preferences.longBreakMinutes * 60);
        break;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (() => {
    const total = currentMode === 'pomodoro' 
      ? preferences.pomodoroMinutes * 60
      : currentMode === 'shortBreak'
      ? preferences.shortBreakMinutes * 60
      : preferences.longBreakMinutes * 60;
    return ((total - timeLeft) / total) * 100;
  })();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timer Pomodoro</h1>
          <p className="text-gray-600">Studia con focus usando la tecnica del pomodoro</p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => switchMode('pomodoro')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                currentMode === 'pomodoro'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Pomodoro
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                currentMode === 'shortBreak'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Coffee className="w-4 h-4 inline mr-2" />
              Pausa Breve
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                currentMode === 'longBreak'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Coffee className="w-4 h-4 inline mr-2" />
              Pausa Lunga
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* Subject Selector */}
          {currentMode === 'pomodoro' && !isRunning && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Materia
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Seleziona --</option>
                {subjects.map((subject) => (
                  <option key={subject.name} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timer */}
          <div className="text-center">
            <div className="relative inline-block">
              {/* Progress Ring */}
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke={
                    currentMode === 'pomodoro' 
                      ? '#3B82F6' 
                      : currentMode === 'shortBreak'
                      ? '#10B981'
                      : '#8B5CF6'
                  }
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              
              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-bold text-gray-900">
                  {formatTime(timeLeft)}
                </div>
                {isRunning && selectedSubject && (
                  <div className="text-sm text-gray-600 mt-2">{selectedSubject}</div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg font-medium"
              >
                <Play className="w-5 h-5" />
                Inizia
              </button>
            ) : isPaused ? (
              <button
                onClick={resumeTimer}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-lg font-medium"
              >
                <Play className="w-5 h-5" />
                Riprendi
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-lg font-medium"
              >
                <Pause className="w-5 h-5" />
                Pausa
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-lg font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Stats and Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessione di Oggi</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pomodori Completati</span>
                <span className="font-semibold text-gray-900">{pomodoroCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo di Focus</span>
                <span className="font-semibold text-gray-900">
                  {Math.floor((pomodoroCount * preferences.pomodoroMinutes) / 60)}h {(pomodoroCount * preferences.pomodoroMinutes) % 60}min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modalità Attuale</span>
                <span className="font-semibold text-gray-900">
                  {currentMode === 'pomodoro' ? 'Studio' : 'Pausa'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Rapide</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Suoni</span>
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    savePreferences({ ...getPreferences(), soundEnabled: !soundEnabled });
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    soundEnabled 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Pomodoro: {preferences.pomodoroMinutes} min</p>
                <p>Pausa breve: {preferences.shortBreakMinutes} min</p>
                <p>Pausa lunga: {preferences.longBreakMinutes} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Consigli per il Pomodoro</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Elimina tutte le distrazioni prima di iniziare</li>
            <li>• Non saltare le pause, sono importanti per il recupero</li>
            <li>• Dopo 4 pomodori, prenditi una pausa lunga di 15-30 minuti</li>
            <li>• Se finisci un'attività prima del timer, ripassala fino alla fine</li>
            <li>• Tieni un foglio per annotare le distrazioni che ti vengono in mente</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}