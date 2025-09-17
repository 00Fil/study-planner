'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppLayout from '@/components/AppLayout';
import { AlertCircle, CheckCircle, Database, RefreshCw, Plus } from 'lucide-react';

export default function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tableStatus, setTableStatus] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const supabase = createClient();

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Auth Error: ${authError.message}`);
        setLoading(false);
        return;
      }
      
      setUser(currentUser);
      
      // Check tables
      const tables = [
        'subjects',
        'topics',
        'exams',
        'homework',
        'weekly_plans',
        'pomodoro_sessions',
        'study_stats',
        'preferences',
        'profiles'
      ];
      
      const status: Record<string, any> = {};
      
      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: false })
            .limit(5);
            
          if (error) {
            status[table] = {
              exists: false,
              error: error.message,
              count: 0,
              sample: null
            };
          } else {
            status[table] = {
              exists: true,
              error: null,
              count: data?.length || 0,
              sample: data && data.length > 0 ? data[0] : null
            };
          }
        } catch (err: any) {
          status[table] = {
            exists: false,
            error: err.message,
            count: 0,
            sample: null
          };
        }
      }
      
      setTableStatus(status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSubjects = async () => {
    setCreating(true);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const defaultSubjects = [
        { name: 'Matematica', display_name: 'Matematica', color: '#10B981' },
        { name: 'Italiano', display_name: 'Italiano', color: '#F59E0B' },
        { name: 'Storia', display_name: 'Storia', color: '#D97706' },
        { name: 'Sistemi e Reti', display_name: 'Sistemi e Reti', color: '#8B5CF6' },
        { name: 'Lingua Inglese', display_name: 'Lingua Inglese', color: '#3B82F6' },
        { name: 'Informatica', display_name: 'Informatica', color: '#F97316' },
        { name: 'TPSIT', display_name: 'TPSIT', color: '#EC4899' },
        { name: 'Gestione Progetto', display_name: 'Gestione Progetto', color: '#EF4444' },
        { name: 'Scienze Motorie', display_name: 'Scienze Motorie', color: '#06B6D4' },
        { name: 'Religione', display_name: 'Religione', color: '#6B7280' }
      ];
      
      for (const subject of defaultSubjects) {
        const { error } = await supabase
          .from('subjects')
          .insert({
            ...subject,
            user_id: user.id,
            professor: '',
            current_topic: '',
            total_hours: 0,
            average_grade: 0,
            exam_grades: []
          });
          
        if (error) {
          console.error(`Failed to create ${subject.name}:`, error);
        }
      }
      
      await checkDatabase();
      alert('Default subjects created!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Database Debug</h1>
          <p className="text-gray-600">Verifica lo stato del database Supabase</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3">Checking database...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Authenticated User</p>
                  <p className="text-blue-700">Email: {user?.email}</p>
                  <p className="text-blue-700 text-xs">ID: {user?.id}</p>
                </div>
              </div>
            </div>

            {/* Tables Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Tables Status
                </h2>
                <button
                  onClick={checkDatabase}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {Object.entries(tableStatus).map(([table, status]) => (
                  <div key={table} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {status.exists ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium">{table}</span>
                          <span className="text-sm text-gray-500">
                            ({status.count} records)
                          </span>
                        </div>
                        
                        {status.error && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {status.error}
                          </p>
                        )}
                        
                        {status.sample && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer">
                              Sample data
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(status.sample, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      
                      {table === 'subjects' && status.count === 0 && (
                        <button
                          onClick={createDefaultSubjects}
                          disabled={creating}
                          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          Create Defaults
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL Script Info */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Tables Missing?</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    If tables are missing, you need to run the SQL script in Supabase:
                  </p>
                  <ol className="list-decimal list-inside text-yellow-700 text-sm mt-2 space-y-1">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to SQL Editor</li>
                    <li>Copy the content from <code className="bg-yellow-100 px-1 rounded">supabase/schema.sql</code></li>
                    <li>Paste and run the script</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}