'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { BarChart3, TrendingUp, Clock, Award, Calendar, Target } from 'lucide-react';
import { getStudyStats, getPomodoroSessions, getExams } from '@/lib/storage';

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStats(getStudyStats());
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiche</h1>
          <p className="text-gray-600">Monitora i tuoi progressi nel tempo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Ore Totali</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalHours || 0}h</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Task Completati</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.completedTasks || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Media Voti</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.averageGrade?.toFixed(1) || '-'}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Streak</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.studyStreak || 0} giorni</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Grafici in arrivo!</h2>
          <p className="text-gray-600">Presto potrai visualizzare grafici dettagliati dei tuoi progressi.</p>
        </div>
      </div>
    </AppLayout>
  );
}