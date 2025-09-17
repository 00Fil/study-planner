'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Settings, Bell, Clock, Volume2, Trash2, Download, Upload, Target } from 'lucide-react';
import { toast } from 'sonner';
import { getPreferences, savePreferences, clearAllData } from '@/lib/storage';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    dailyGoalHours: 3,
    notifications: true,
    soundEnabled: true,
  });

  useEffect(() => {
    setPreferences(getPreferences());
  }, []);

  const handleSave = () => {
    savePreferences(preferences);
    toast.success('Impostazioni salvate!');
  };

  const handleReset = () => {
    if (window.confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
      clearAllData();
      toast.success('Tutti i dati sono stati cancellati');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Impostazioni</h1>
          <p className="text-gray-600">Personalizza l\'app secondo le tue preferenze</p>
        </div>

        {/* Timer Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Impostazioni Timer
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durata Pomodoro (minuti)
              </label>
              <input
                type="number"
                value={preferences.pomodoroMinutes}
                onChange={(e) => setPreferences({ ...preferences, pomodoroMinutes: parseInt(e.target.value) || 25 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pausa Breve (minuti)
              </label>
              <input
                type="number"
                value={preferences.shortBreakMinutes}
                onChange={(e) => setPreferences({ ...preferences, shortBreakMinutes: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pausa Lunga (minuti)
              </label>
              <input
                type="number"
                value={preferences.longBreakMinutes}
                onChange={(e) => setPreferences({ ...preferences, longBreakMinutes: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="60"
              />
            </div>
          </div>
        </div>

        {/* Study Goals */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Obiettivi di Studio
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obiettivo Giornaliero (ore)
            </label>
            <input
              type="number"
              value={preferences.dailyGoalHours}
              onChange={(e) => setPreferences({ ...preferences, dailyGoalHours: parseInt(e.target.value) || 3 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="12"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifiche e Suoni
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Notifiche Browser</span>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Suoni</span>
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => setPreferences({ ...preferences, soundEnabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Azioni</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salva Impostazioni
            </button>
            
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cancella Tutti i Dati
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}