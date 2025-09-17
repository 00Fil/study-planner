'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Target, 
  Trophy, 
  Star, 
  TrendingUp,
  Plus,
  Check,
  Clock,
  Calendar,
  Award,
  Zap,
  Gift,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  category: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  unit: string;
  reward: string;
  icon: string;
  completed: boolean;
  createdAt: string;
}

const defaultGoals: Goal[] = [
  {
    id: '1',
    title: 'Studio Giornaliero',
    category: 'daily',
    target: 2,
    current: 0,
    unit: 'ore',
    reward: '30 min gaming',
    icon: '📚',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Pomodori Settimanali',
    category: 'weekly',
    target: 20,
    current: 0,
    unit: 'pomodori',
    reward: 'Cinema weekend',
    icon: '🍅',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Media Voti',
    category: 'monthly',
    target: 7,
    current: 0,
    unit: 'media',
    reward: 'Regalo speciale',
    icon: '🎯',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

const achievements = [
  { id: '1', title: 'Prima Settimana', description: 'Completa 7 giorni di studio', icon: '🌟', unlocked: false, progress: 0, target: 7 },
  { id: '2', title: 'Studente Costante', description: '30 giorni di streak', icon: '🔥', unlocked: false, progress: 0, target: 30 },
  { id: '3', title: 'Master Pomodoro', description: '100 pomodori completati', icon: '🍅', unlocked: false, progress: 0, target: 100 },
  { id: '4', title: 'Eccellenza', description: 'Media voti sopra 8', icon: '🏆', unlocked: false, progress: 0, target: 8 },
  { id: '5', title: 'Tutte le Materie', description: 'Studia ogni materia in una settimana', icon: '📖', unlocked: false, progress: 0, target: 8 },
  { id: '6', title: 'Weekend Warrior', description: 'Studia anche nel weekend per 4 settimane', icon: '⚔️', unlocked: false, progress: 0, target: 4 }
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'daily' as 'daily' | 'weekly' | 'monthly',
    target: 1,
    unit: '',
    reward: ''
  });
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number[]>([]);

  useEffect(() => {
    // Load goals from localStorage
    const savedGoals = localStorage.getItem('study_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }

    // Calculate user level and XP
    const savedXP = localStorage.getItem('study_xp');
    if (savedXP) {
      const xp = parseInt(savedXP);
      setUserXP(xp);
      setUserLevel(Math.floor(xp / 100) + 1);
    }

    // Load weekly progress data
    const savedProgress = localStorage.getItem('weekly_progress');
    if (savedProgress) {
      setWeeklyProgress(JSON.parse(savedProgress));
    } else {
      // Initialize with mock data for demonstration
      const mockProgress = [65, 72, 68, 80, 75, 85, 90];
      setWeeklyProgress(mockProgress);
    }
  }, []);

  const updateGoalProgress = (goalId: string, newProgress: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updated = { ...goal, current: newProgress };
        if (newProgress >= goal.target && !goal.completed) {
          updated.completed = true;
          const xpGained = goal.category === 'daily' ? 10 : goal.category === 'weekly' ? 25 : 50;
          const newXP = userXP + xpGained;
          setUserXP(newXP);
          setUserLevel(Math.floor(newXP / 100) + 1);
          localStorage.setItem('study_xp', newXP.toString());
          toast.success(`🎉 Obiettivo completato! +${xpGained} XP`);
          
          // Update daily progress for chart
          updateDailyProgress(updatedGoals);
        }
        return updated;
      }
      return goal;
    });
    setGoals(updatedGoals);
    localStorage.setItem('study_goals', JSON.stringify(updatedGoals));
  };

  const updateDailyProgress = (currentGoals: Goal[]) => {
    const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Convert Sunday from 0 to 6
    const dailyGoals = currentGoals.filter(g => g.category === 'daily');
    const completedDaily = dailyGoals.filter(g => g.completed).length;
    const totalDaily = dailyGoals.length;
    
    if (totalDaily > 0) {
      const progressPercentage = Math.round((completedDaily / totalDaily) * 100);
      const newProgress = [...weeklyProgress];
      newProgress[today] = progressPercentage;
      setWeeklyProgress(newProgress);
      localStorage.setItem('weekly_progress', JSON.stringify(newProgress));
    }
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.unit || !newGoal.reward) {
      toast.error('Compila tutti i campi');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      category: newGoal.category,
      target: newGoal.target,
      current: 0,
      unit: newGoal.unit,
      reward: newGoal.reward,
      icon: newGoal.category === 'daily' ? '📅' : newGoal.category === 'weekly' ? '📆' : '📊',
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem('study_goals', JSON.stringify(updatedGoals));
    
    setShowAddModal(false);
    setNewGoal({
      title: '',
      category: 'daily',
      target: 1,
      unit: '',
      reward: ''
    });
    
    toast.success('Obiettivo aggiunto!');
  };

  const xpForNextLevel = (userLevel * 100);
  const xpProgress = (userXP % 100);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Obiettivi e Ricompense</h1>
          <p className="text-gray-600">Trasforma lo studio in un\'avventura con obiettivi e premi!</p>
        </div>

        {/* User Stats */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Livello {userLevel}</h2>
              <p className="text-purple-100">Studente Motivato</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{userXP} XP</p>
              <p className="text-purple-100 text-sm">Punti esperienza totali</p>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Progresso livello</span>
              <span>{xpProgress}/{xpForNextLevel} XP</span>
            </div>
            <div className="w-full bg-purple-800 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${(xpProgress / xpForNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Progressi Settimanali
            </h2>
            <span className="text-sm text-gray-500">Completamento obiettivi (%)</span>
          </div>
          
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between gap-2">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => {
                const height = weeklyProgress[index] || 0;
                const isToday = index === new Date().getDay() - 1;
                
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full flex flex-col items-center">
                      <span className="text-xs font-medium text-gray-700 mb-1">
                        {height}%
                      </span>
                      <div 
                        className={`w-full rounded-t transition-all duration-500 ${
                          isToday ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 
                          height >= 80 ? 'bg-gradient-to-t from-green-600 to-green-400' :
                          height >= 60 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' :
                          'bg-gradient-to-t from-gray-400 to-gray-300'
                        }`}
                        style={{ height: `${(height / 100) * 200}px` }}
                      />
                    </div>
                    <span className={`text-xs mt-2 ${isToday ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">
                {weeklyProgress.filter(p => p >= 80).length}
              </p>
              <p className="text-xs text-gray-600">Giorni Eccellenti</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(weeklyProgress.reduce((a, b) => a + b, 0) / weeklyProgress.length)}%
              </p>
              <p className="text-xs text-gray-600">Media Settimanale</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(...weeklyProgress)}%
              </p>
              <p className="text-xs text-gray-600">Record Settimana</p>
            </div>
          </div>
        </div>

        {/* Goals Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">I Tuoi Obiettivi</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuovo Obiettivo
            </button>
          </div>

          {/* Daily Goals */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              OBIETTIVI GIORNALIERI
            </h3>
            <div className="space-y-3">
              {goals.filter(g => g.category === 'daily').map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoalProgress} />
              ))}
            </div>
          </div>

          {/* Weekly Goals */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              OBIETTIVI SETTIMANALI
            </h3>
            <div className="space-y-3">
              {goals.filter(g => g.category === 'weekly').map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoalProgress} />
              ))}
            </div>
          </div>

          {/* Monthly Goals */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              OBIETTIVI MENSILI
            </h3>
            <div className="space-y-3">
              {goals.filter(g => g.category === 'monthly').map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoalProgress} />
              ))}
            </div>
          </div>
        </div>

        {/* XP History Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Crescita XP
            </h2>
            <span className="text-sm text-gray-500">Ultimi 30 giorni</span>
          </div>
          
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-end justify-between">
              {Array.from({ length: 30 }, (_, i) => {
                // Generate a smooth growth curve for demonstration
                const dayProgress = Math.min(100, (i / 30) * 100 + Math.random() * 20);
                const isToday = i === 29;
                
                return (
                  <div 
                    key={i}
                    className={`flex-1 mx-0.5 rounded-t transition-all duration-300 hover:opacity-80 ${
                      isToday ? 'bg-gradient-to-t from-purple-600 to-purple-400' : 
                      'bg-gradient-to-t from-gray-400 to-gray-300'
                    }`}
                    style={{ height: `${dayProgress}%` }}
                    title={`Giorno ${i + 1}: ${Math.round(dayProgress)} XP`}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>1 mese fa</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">+{Math.round(userXP * 0.3)} XP questo mese</span>
            </div>
            <span>Oggi</span>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🏆 Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlocked 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-400'}`}
                        style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {achievement.progress}/{achievement.target}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Shop Preview */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mt-8 text-white">
          <h3 className="text-xl font-semibold mb-4">🎁 Prossime Ricompense</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-semibold">Livello 5</p>
              <p className="text-sm text-yellow-100">Badge "Studente Dedicato"</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-semibold">Livello 10</p>
              <p className="text-sm text-yellow-100">Tema personalizzato app</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-semibold">Livello 20</p>
              <p className="text-sm text-yellow-100">Certificato di eccellenza</p>
            </div>
          </div>
        </div>

        {/* Add Goal Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nuovo Obiettivo</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: Completare tutti i compiti"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Giornaliero</option>
                    <option value="weekly">Settimanale</option>
                    <option value="monthly">Mensile</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obiettivo
                    </label>
                    <input
                      type="number"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unità
                    </label>
                    <input
                      type="text"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Es: ore, pagine"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ricompensa
                  </label>
                  <input
                    type="text"
                    value={newGoal.reward}
                    onChange={(e) => setNewGoal({ ...newGoal, reward: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: 1 ora di gaming"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addGoal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aggiungi
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Goal Card Component
function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: (id: string, progress: number) => void }) {
  const progress = Math.min(100, (goal.current / goal.target) * 100);
  
  return (
    <div className={`p-4 rounded-lg border ${goal.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{goal.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{goal.title}</h4>
            <p className="text-sm text-gray-500">
              {goal.current}/{goal.target} {goal.unit}
            </p>
          </div>
        </div>
        {goal.completed && <Check className="w-5 h-5 text-green-500" />}
      </div>
      
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              goal.completed ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          🎁 {goal.reward}
        </p>
        {!goal.completed && (
          <div className="flex gap-1">
            <button
              onClick={() => onUpdate(goal.id, Math.max(0, goal.current - 1))}
              className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              -
            </button>
            <button
              onClick={() => onUpdate(goal.id, goal.current + 1)}
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}