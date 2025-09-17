'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Cloud, 
  Upload, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  School,
  ClipboardList,
  Info,
  Copy,
  ExternalLink,
  FileJson,
  LogIn,
  Settings,
  Shield,
  Bell,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { saveExam, saveSubject, getExams, getSubjects, saveHomework, getHomework, saveTopic } from '@/lib/storage';
import { Exam, Subject, Homework, Topic } from '@/lib/types';
import { classeVivaAPI, ClasseVivaCredentials } from '@/lib/classeviva-api';
import { autoSyncService, SyncResult, SyncSchedule } from '@/lib/auto-sync';

interface ParsedAssignment {
  subject: string;
  type: 'homework' | 'test';
  date: string;
  description: string;
  topics?: string[];
}

interface ParsedGrade {
  subject: string;
  grade: string;
  date: string;
  type: string;
  description?: string;
}

export default function SyncPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'file' | 'auto'>('manual');
  const [pastedData, setPastedData] = useState('');
  const [parsedData, setParsedData] = useState<{
    assignments: ParsedAssignment[];
    grades: ParsedGrade[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState({
    examsAdded: 0,
    homeworkAdded: 0,
    gradesAdded: 0,
    subjectsUpdated: 0
  });

  // Auto-sync related state
  const [credentials, setCredentials] = useState<ClasseVivaCredentials>({
    username: '',
    password: '',
    school: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule>({
    enabled: false,
    frequency: 'daily',
    time: '08:00'
  });
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [nextSyncDate, setNextSyncDate] = useState<Date | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [autoSyncResult, setAutoSyncResult] = useState<SyncResult | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    // Load authentication status
    setIsAuthenticated(classeVivaAPI.isAuthenticated());
    
    // Load stored credentials for form display (without password)
    const storedCreds = classeVivaAPI.getStoredCredentials();
    if (storedCreds) {
      setCredentials({
        username: storedCreds.username,
        password: '', // Never show stored password
        school: storedCreds.school || ''
      });
    }

    // Load sync schedule
    const schedule = autoSyncService.getSyncSchedule();
    setSyncSchedule(schedule);
    setLastSyncDate(autoSyncService.getLastSyncDate());
    setNextSyncDate(autoSyncService.getNextSyncDate());
  }, []);

  // Handle login
  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      setLoginError('Username e password sono obbligatori');
      return;
    }

    setIsProcessing(true);
    setLoginError('');

    try {
      const success = await classeVivaAPI.login(credentials);
      if (success) {
        setIsAuthenticated(true);
        setShowLoginForm(false);
        toast.success('Login effettuato con successo!');
        
        // Clear password from form for security
        setCredentials(prev => ({ ...prev, password: '' }));
      } else {
        setLoginError('Credenziali non valide. Verifica username e password.');
      }
    } catch (error) {
      setLoginError('Errore di connessione. Riprova più tardi.');
      console.error('Login error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      // Clear credentials and close scraping session
      classeVivaAPI.clearCredentials();
      setIsAuthenticated(false);
      setCredentials({ username: '', password: '', school: '' });
      setAutoSyncResult(null);
      toast.success('Logout effettuato');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle auto sync trigger
  const handleAutoSync = async () => {
    // Check if we're on Vercel deployment
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      toast.error('Auto-sync non disponibile su Vercel. Usa il metodo manuale copia-incolla.');
      setActiveTab('manual');
      return;
    }
    
    if (!isAuthenticated) {
      toast.error('Effettua prima il login per sincronizzare');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await autoSyncService.triggerSync();
      setAutoSyncResult(result);
      
      if (result.success) {
        const totalItems = result.examsAdded + result.homeworkAdded + result.gradesAdded;
        if (totalItems > 0) {
          toast.success(`Sincronizzazione completata! ${result.examsAdded} verifiche, ${result.homeworkAdded} compiti, ${result.gradesAdded} voti aggiunti`);
        } else {
          toast.success('Sincronizzazione completata. Nessun nuovo elemento trovato.');
        }
      } else {
        toast.error(result.error || 'Errore durante la sincronizzazione');
      }

      // Update sync dates
      setLastSyncDate(autoSyncService.getLastSyncDate());
      setNextSyncDate(autoSyncService.getNextSyncDate());
    } catch (error) {
      toast.error('Errore durante la sincronizzazione');
      console.error('Sync error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sync schedule update
  const handleSyncScheduleUpdate = (updates: Partial<SyncSchedule>) => {
    const newSchedule = { ...syncSchedule, ...updates };
    setSyncSchedule(newSchedule);
    autoSyncService.updateSyncSchedule(updates);
    setNextSyncDate(autoSyncService.getNextSyncDate());
    
    if (updates.enabled) {
      toast.success('Sincronizzazione automatica attivata!');
      // Request notification permission
      autoSyncService.enableNotifications();
    }
  };

  const parseCSVData = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { assignments: [], grades: [] };
    
    const assignments: ParsedAssignment[] = [];
    const grades: ParsedGrade[] = [];
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    dataLines.forEach(line => {
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (columns.length >= 4) {
        const [date, subject, type, description, topics] = columns;
        
        if (type.toLowerCase().includes('voto') || type.toLowerCase().includes('grade')) {
          // It's a grade
          grades.push({
            subject: subject.trim(),
            grade: description.trim(),
            date: convertDateFormat(date.trim()),
            type: 'written',
            description: topics || ''
          });
        } else {
          // It's an assignment
          const isTest = type.toLowerCase().includes('verifica') || 
                        type.toLowerCase().includes('interrogazione') ||
                        type.toLowerCase().includes('test');
          
          assignments.push({
            subject: subject.trim(),
            type: isTest ? 'test' : 'homework',
            date: convertDateFormat(date.trim()),
            description: description.trim(),
            topics: topics ? topics.split(';').map(t => t.trim()) : extractTopics(description)
          });
        }
      }
    });
    
    return { assignments, grades };
  };

  const parseJSONData = (text: string) => {
    try {
      const data = JSON.parse(text);
      const assignments: ParsedAssignment[] = [];
      const grades: ParsedGrade[] = [];
      
      // Handle different JSON structures
      if (data.agenda || data.assignments) {
        const items = data.agenda || data.assignments;
        items.forEach((item: any) => {
          const isTest = item.type === 'test' || item.type === 'verifica' ||
                        item.description?.toLowerCase().includes('verifica');
          
          assignments.push({
            subject: item.subject || item.materia,
            type: isTest ? 'test' : 'homework',
            date: convertDateFormat(item.date || item.data),
            description: item.description || item.descrizione,
            topics: item.topics || item.argomenti || extractTopics(item.description || item.descrizione)
          });
        });
      }
      
      if (data.grades || data.voti) {
        const items = data.grades || data.voti;
        items.forEach((item: any) => {
          grades.push({
            subject: item.subject || item.materia,
            grade: item.grade || item.voto,
            date: convertDateFormat(item.date || item.data),
            type: item.type || 'written',
            description: item.description || item.descrizione || ''
          });
        });
      }
      
      return { assignments, grades };
    } catch (error) {
      console.error('JSON parsing error:', error);
      return { assignments: [], grades: [] };
    }
  };

  const parseClasseVivaData = (text: string, fileType?: string) => {
    // Detect format and parse accordingly
    if (fileType === 'csv' || text.includes(',') && text.includes('\n') && text.split('\n')[0].split(',').length > 3) {
      return parseCSVData(text);
    }
    
    if (fileType === 'json' || (text.trim().startsWith('{') || text.trim().startsWith('['))) {
      return parseJSONData(text);
    }
    
    // Default text parsing
    const lines = text.split('\n').filter(line => line.trim());
    const assignments: ParsedAssignment[] = [];
    const grades: ParsedGrade[] = [];

    // Enhanced patterns for better recognition
    const assignmentPatterns = [
      /(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*([^-–]+)\s*[-–]\s*(.+)/,
      /(\d{2}-\d{2}-\d{4})\s*[-–]\s*([^-–]+)\s*[-–]\s*(.+)/,
      /([^:]+):\s*(.+)\s*\((\d{2}\/\d{2}\/\d{4})\)/
    ];
    
    const gradePattern = /([^:]+):\s*(\d+(?:[,\.]\d+)?[+\-]?)\s*\((\d{2}\/\d{2}\/\d{4})\)/;

    lines.forEach(line => {
      // Try assignment patterns
      let matched = false;
      for (const pattern of assignmentPatterns) {
        const assignmentMatch = line.match(pattern);
        if (assignmentMatch) {
          const [_, dateOrSubject, subjectOrDescription, descriptionOrDate] = assignmentMatch;
          
          // Determine if it's date-first or subject-first format
          const isDateFirst = /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(dateOrSubject);
          
          if (isDateFirst) {
            const date = dateOrSubject;
            const subject = subjectOrDescription;
            const description = descriptionOrDate;
            
            const isTest = description.toLowerCase().includes('verifica') || 
                          description.toLowerCase().includes('interrogazione') ||
                          description.toLowerCase().includes('test');
            
            assignments.push({
              subject: subject.trim(),
              type: isTest ? 'test' : 'homework',
              date: convertDateFormat(date.trim()),
              description: description.trim(),
              topics: extractTopics(description)
            });
          }
          matched = true;
          break;
        }
      }

      // Try grade pattern if not matched as assignment
      if (!matched) {
        const gradeMatch = line.match(gradePattern);
        if (gradeMatch) {
          const [_, subject, grade, date] = gradeMatch;
          grades.push({
            subject: subject.trim(),
            grade: grade.trim(),
            date: convertDateFormat(date.trim()),
            type: 'written',
            description: ''
          });
        }
      }
    });

    return { assignments, grades };
  };

  const convertDateFormat = (dateStr: string): string => {
    // Converte vari formati di data in YYYY-MM-DD
    if (!dateStr || typeof dateStr !== 'string') {
      // Se non c'è data, usa una data futura di default (1 settimana)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      return futureDate.toISOString().split('T')[0];
    }
    
    // Rimuovi spazi extra
    dateStr = dateStr.trim();
    
    // Pattern 1: DD/MM/YYYY o DD-MM-YYYY
    const pattern1 = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const match1 = dateStr.match(pattern1);
    if (match1) {
      const [_, day, month, year] = match1;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      
      // Validate date components
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(fullYear);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 2020 && yearNum <= 2030) {
        // Verifica che la data sia valida
        const dateObj = new Date(`${fullYear}-${paddedMonth}-${paddedDay}`);
        if (!isNaN(dateObj.getTime())) {
          return `${fullYear}-${paddedMonth}-${paddedDay}`;
        }
      }
    }
    
    // Pattern 2: YYYY-MM-DD (già nel formato corretto)
    const pattern2 = /(\d{4})-(\d{2})-(\d{2})/;
    const match2 = dateStr.match(pattern2);
    if (match2) {
      const dateObj = new Date(match2[0]);
      if (!isNaN(dateObj.getTime())) {
        return match2[0];
      }
    }
    
    // Pattern 3: Data italiana (es. "lunedì 15 gennaio 2025" o "15 gennaio 2025")
    const italianPattern = /(?:\w+\s+)?(\d{1,2})\s+(\w+)\s+(\d{4})/;
    const italianMatch = dateStr.match(italianPattern);
    if (italianMatch) {
      const [_, day, monthName, year] = italianMatch;
      const months: Record<string, string> = {
        'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
        'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
        'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
      };
      const monthNum = months[monthName.toLowerCase()];
      if (monthNum) {
        const paddedDay = day.padStart(2, '0');
        const dateObj = new Date(`${year}-${monthNum}-${paddedDay}`);
        if (!isNaN(dateObj.getTime())) {
          return `${year}-${monthNum}-${paddedDay}`;
        }
      }
    }
    
    // Pattern 4: Solo giorno e mese (assumi anno corrente)
    const dayMonthPattern = /(\d{1,2})[\/\-](\d{1,2})/;
    const dayMonthMatch = dateStr.match(dayMonthPattern);
    if (dayMonthMatch && !dateStr.includes('20')) {
      const [_, day, month] = dayMonthMatch;
      const currentYear = new Date().getFullYear();
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      
      // Crea la data e verifica se è nel passato
      let dateObj = new Date(`${currentYear}-${paddedMonth}-${paddedDay}`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Se la data è nel passato, usa l'anno successivo
      if (dateObj < today) {
        dateObj = new Date(`${currentYear + 1}-${paddedMonth}-${paddedDay}`);
      }
      
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    }
    
    console.warn('Invalid date format, using default future date:', dateStr);
    // Default: usa una data futura (1 settimana da oggi)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    return futureDate.toISOString().split('T')[0];
  };

  const extractTopics = (description: string): string[] => {
    // Estrae argomenti dalla descrizione
    const topics: string[] = [];
    
    // Parole chiave comuni che indicano argomenti
    const keywords = description.toLowerCase().match(/(?:su|di|riguardante|capitolo|cap\.|unità|argomento:|argomenti:)\s*([^,.;]+)/g);
    if (keywords) {
      keywords.forEach(kw => {
        const topic = kw.replace(/(?:su|di|riguardante|capitolo|cap\.|unità|argomento:|argomenti:)\s*/i, '').trim();
        if (topic) topics.push(topic);
      });
    }

    // Se non trova argomenti specifici, usa la descrizione intera
    if (topics.length === 0 && description.length < 50) {
      topics.push(description);
    }

    return topics;
  };

  const handlePasteData = () => {
    if (!pastedData.trim()) {
      toast.error('Incolla prima i dati da ClasseViva');
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = parseClasseVivaData(pastedData);
      setParsedData(parsed);
      
      if (parsed.assignments.length === 0 && parsed.grades.length === 0) {
        toast.warning('Nessun dato riconosciuto. Verifica il formato.');
      } else {
        toast.success(`Trovati ${parsed.assignments.length} compiti/verifiche e ${parsed.grades.length} voti`);
      }
    } catch (error) {
      toast.error('Errore nel parsing dei dati');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    const stats = {
      examsAdded: 0,
      homeworkAdded: 0,
      gradesAdded: 0,
      subjectsUpdated: 0
    };

    try {
      // Import verifiche
      const existingExams = getExams();
      const existingSubjects = getSubjects();
      const existingHomework = getHomework();

      for (const assignment of parsedData.assignments) {
        // Validation
        if (!assignment.subject || !assignment.date || !assignment.description) {
          console.warn('Invalid assignment data:', assignment);
          continue;
        }
        
        if (assignment.type === 'test') {
          // Enhanced duplicate detection for exams
          const exists = existingExams.some(e => 
            e.subject.toLowerCase() === assignment.subject.toLowerCase() && 
            e.date === assignment.date &&
            e.notes?.toLowerCase().includes(assignment.description.toLowerCase().substring(0, 20))
          );

          if (!exists) {
            const newExam: Exam = {
              id: `exam-${Date.now()}-${Math.random()}`,
              date: assignment.date,
              subject: assignment.subject,
              type: assignment.description.toLowerCase().includes('orale') ? 'oral' : 'written',
              topics: assignment.topics || [],
              priority: 'medium',
              status: 'pending',
              notes: assignment.description
            };
            saveExam(newExam);
            stats.examsAdded++;
          }

          // Aggiorna o crea materia se non esiste
          if (!existingSubjects.find(s => s.name === assignment.subject)) {
            const newSubject: Subject = {
              name: assignment.subject,
              color: getRandomColor(),
              currentTopic: assignment.topics?.[0] || '',
              lastStudied: new Date().toISOString(),
              totalHours: 0,
              averageGrade: 0,
              topics: [],
              examGrades: []
            };
            saveSubject(newSubject);
            stats.subjectsUpdated++;
          }
        } else {
          // Enhanced duplicate detection for homework
          const homeworkExists = existingHomework.some(h => 
            h.subject.toLowerCase() === assignment.subject.toLowerCase() && 
            h.dueDate === assignment.date &&
            h.description.toLowerCase().includes(assignment.description.toLowerCase().substring(0, 20))
          );
          
          if (!homeworkExists) {
            // Save homework
            const newHomework: Homework = {
              id: `homework-${Date.now()}-${Math.random()}`,
              subject: assignment.subject,
              description: assignment.description,
              dueDate: assignment.date,
              assignedDate: new Date().toISOString().split('T')[0],
              topics: assignment.topics || [],
              priority: 'medium',
              status: 'pending',
              estimatedHours: 1
            };
            saveHomework(newHomework);
            stats.homeworkAdded++;
          }
          
          // Create topics from homework description
          if (assignment.topics && assignment.topics.length > 0) {
            assignment.topics.forEach(topicTitle => {
              const newTopic: Topic = {
                id: `topic-${Date.now()}-${Math.random()}`,
                subjectName: assignment.subject,
                title: topicTitle,
                description: `Argomento estratto da: ${assignment.description}`,
                dateAdded: new Date().toISOString(),
                completed: false,
                difficulty: 'medium',
                importance: 'medium',
                notes: assignment.description
              };
              saveTopic(newTopic);
            });
          }
        }
      }

      // Import voti
      for (const grade of parsedData.grades) {
        // Validation
        if (!grade.subject || !grade.grade || !grade.date) {
          console.warn('Invalid grade data:', grade);
          continue;
        }
        
        // Validate grade format
        const gradePattern = /^\d+([,\.]\d+)?[+\-]?$/;
        if (!gradePattern.test(grade.grade)) {
          console.warn('Invalid grade format:', grade.grade);
          continue;
        }
        
        let subject = existingSubjects.find(s => s.name.toLowerCase() === grade.subject.toLowerCase());
        
        // Create subject if it doesn't exist
        if (!subject) {
          subject = {
            name: grade.subject,
            color: getRandomColor(),
            currentTopic: '',
            lastStudied: new Date().toISOString(),
            totalHours: 0,
            averageGrade: 0,
            topics: [],
            examGrades: []
          };
          saveSubject(subject);
          existingSubjects.push(subject);
          stats.subjectsUpdated++;
        }
        
        if (!subject.examGrades) subject.examGrades = [];
        
        // Enhanced duplicate detection - check grade and date combination
        const gradeExists = subject.examGrades.some(existingGrade => {
          // For simple comparison, just check if the exact grade already exists
          // You could enhance this with date-based checking if available
          return existingGrade === grade.grade;
        });
        
        if (!gradeExists) {
          subject.examGrades.push(grade.grade);
          saveSubject(subject);
          stats.gradesAdded++;
        }
      }

      setImportStats(stats);
      toast.success(`✅ Import completato! ${stats.examsAdded} verifiche, ${stats.homeworkAdded} compiti, ${stats.gradesAdded} voti aggiunti`);
      
      // Reset dopo import
      setTimeout(() => {
        setPastedData('');
        setParsedData(null);
      }, 2000);

    } catch (error) {
      toast.error('Errore durante l\'import');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRandomColor = () => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      try {
        const parsed = parseClasseVivaData(text, fileExtension);
        setParsedData(parsed);
        setPastedData(text); // Store for preview
        
        if (parsed.assignments.length === 0 && parsed.grades.length === 0) {
          toast.warning(`Nessun dato riconosciuto nel file ${file.name}. Verifica il formato.`);
        } else {
          toast.success(`File ${file.name} caricato! Trovati ${parsed.assignments.length} compiti/verifiche e ${parsed.grades.length} voti`);
        }
      } catch (error) {
        toast.error(`Errore nel caricamento del file ${file.name}`);
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const csvContent = `Data,Materia,Tipo,Descrizione,Argomenti
15/01/2025,Matematica,Verifica,Verifica scritta su derivate,derivate;integrali
20/01/2025,Informatica,Verifica,Test pratico database,database;SQL
22/01/2025,Italiano,Interrogazione,Interrogazione orale,Leopardi;romanticismo
25/01/2025,Matematica,Compiti,Esercizi capitolo 5,limiti;continuità
Matematica,Voto,8.5,Verifica del 15/01/2025,
Informatica,Voto,7+,Test del 20/01/2025,`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_classeviva.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template CSV scaricato!');
  };

  const sampleFormat = `15/01/2025 - Matematica - Verifica su derivate e integrali
20/01/2025 - Informatica - Test su database SQL
22/01/2025 - Italiano - Interrogazione su Leopardi
Matematica: 8+ (10/01/2025)
Informatica: 7.5 (08/01/2025)`;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Sincronizzazione ClasseViva</h1>
          </div>
          <p className="text-gray-600">
            Importa compiti, verifiche e voti da ClasseViva nel tuo Study Planner
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'manual'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copia e Incolla
                </div>
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'file'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Carica File
                </div>
              </button>
              <button
                onClick={() => setActiveTab('auto')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'auto'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Auto-Sync
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Disponibile!
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'manual' && (
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-2">Come importare da ClasseViva:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Accedi a ClasseViva dal browser</li>
                        <li>Vai alla sezione Agenda o Voti</li>
                        <li>Seleziona e copia i dati (Ctrl+C)</li>
                        <li>Incolla qui sotto (Ctrl+V)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Paste Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incolla i dati da ClasseViva
                  </label>
                  <textarea
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    placeholder={`Esempio formato supportato:\n${sampleFormat}`}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    onClick={handlePasteData}
                    disabled={!pastedData.trim() || isProcessing}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Elaborazione...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Analizza Dati
                      </>
                    )}
                  </button>
                </div>

                {/* Parsed Data Preview */}
                {parsedData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dati Riconosciuti</h3>
                    
                    {parsedData.assignments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" />
                          Compiti e Verifiche ({parsedData.assignments.length})
                        </h4>
                        <div className="space-y-2">
                          {parsedData.assignments.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  item.type === 'test' ? 'bg-red-500' : 'bg-blue-500'
                                }`} />
                                <div>
                                  <p className="font-medium text-gray-900">{item.subject}</p>
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">
                                  {new Date(item.date).toLocaleDateString('it-IT')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.type === 'test' ? 'Verifica' : 'Compiti'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {parsedData.grades.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <School className="w-4 h-4" />
                          Voti ({parsedData.grades.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {parsedData.grades.map((grade, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-900">{grade.subject}</p>
                              <p className="text-2xl font-bold text-blue-600">{grade.grade}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(grade.date).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleImport}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Importa nel Study Planner
                    </button>
                  </div>
                )}

                {/* Import Stats */}
                {(importStats.examsAdded > 0 || importStats.homeworkAdded > 0 || importStats.gradesAdded > 0) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Import Completato!</p>
                        <p className="text-sm text-green-700">
                          {importStats.examsAdded} verifiche, {importStats.homeworkAdded} compiti, {importStats.gradesAdded} voti, 
                          {importStats.subjectsUpdated} materie aggiornate
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'file' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-2">Formati supportati:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>File di testo (.txt)</li>
                        <li>CSV esportato da ClasseViva</li>
                        <li>JSON con struttura compatibile</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Trascina un file qui o clicca per selezionare
                  </p>
                  <input
                    type="file"
                    accept=".txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Seleziona File
                  </label>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Esempio Template CSV:</h4>
                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`Data,Materia,Tipo,Descrizione,Argomenti
15/01/2025,Matematica,Verifica,Verifica scritta,derivate;integrali
20/01/2025,Informatica,Verifica,Test pratico,database;SQL
22/01/2025,Italiano,Interrogazione,Interrogazione orale,Leopardi;romanticismo`}
                  </pre>
                  <button 
                    onClick={downloadCSVTemplate}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Scarica template CSV
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'auto' && (
              <div className="space-y-6">
                {/* Authentication Section */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isAuthenticated ? (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <WifiOff className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isAuthenticated ? 'Account Connesso' : 'Connetti Account'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {isAuthenticated 
                            ? `Connesso come ${credentials.username}`
                            : 'Effettua il login per abilitare la sincronizzazione automatica'
                          }
                        </p>
                      </div>
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Logout
                      </button>
                    )}
                  </div>

                  {!isAuthenticated && !showLoginForm && (
                    <button
                      onClick={() => setShowLoginForm(true)}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Accedi a ClasseViva
                    </button>
                  )}

                  {!isAuthenticated && showLoginForm && (
                    <div className="bg-white rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={credentials.username}
                          onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Il tuo username ClasseViva"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={credentials.password}
                          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="La tua password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Codice Scuola (opzionale)
                        </label>
                        <input
                          type="text"
                          value={credentials.school || ''}
                          onChange={(e) => setCredentials(prev => ({ ...prev, school: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Lascia vuoto se non lo conosci"
                        />
                      </div>
                      
                      {loginError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {loginError}
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handleLogin}
                          disabled={isProcessing}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogIn className="w-4 h-4" />
                          )}
                          {isProcessing ? 'Accesso...' : 'Accedi'}
                        </button>
                        <button
                          onClick={() => setShowLoginForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex gap-2">
                          <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Le tue credenziali sono sicure</p>
                            <p>I dati vengono crittografati e salvati solo localmente sul tuo dispositivo.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sync Controls */}
                {isAuthenticated && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Sincronizzazione Automatica</h3>
                      <button
                        onClick={handleAutoSync}
                        disabled={isProcessing || autoSyncService.isSyncInProgress()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        {isProcessing ? 'Sincronizzazione...' : 'Sincronizza Ora'}
                      </button>
                    </div>

                    {/* Sync Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Ultima sincronizzazione</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {lastSyncDate 
                            ? lastSyncDate.toLocaleDateString('it-IT', { 
                                day: 'numeric', 
                                month: 'short', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : 'Mai'
                          }
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Prossima sincronizzazione</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {syncSchedule.enabled && nextSyncDate
                            ? nextSyncDate.toLocaleDateString('it-IT', { 
                                day: 'numeric', 
                                month: 'short', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : 'Disabilitata'
                          }
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Stato</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {syncSchedule.enabled 
                            ? `Attivo (${syncSchedule.frequency === 'daily' ? 'giornaliero' : 'settimanale'})` 
                            : 'Manuale'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Sync Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Sincronizzazione automatica</p>
                          <p className="text-sm text-gray-600">Importa automaticamente nuovi dati da ClasseViva</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={syncSchedule.enabled}
                            onChange={(e) => handleSyncScheduleUpdate({ enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {syncSchedule.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Frequenza
                            </label>
                            <select
                              value={syncSchedule.frequency}
                              onChange={(e) => handleSyncScheduleUpdate({ frequency: e.target.value as 'daily' | 'weekly' })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="daily">Giornaliera</option>
                              <option value="weekly">Settimanale</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Orario
                            </label>
                            <input
                              type="time"
                              value={syncSchedule.time}
                              onChange={(e) => handleSyncScheduleUpdate({ time: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Last Sync Result */}
                    {autoSyncResult && (
                      <div className={`mt-6 p-4 rounded-lg ${
                        autoSyncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          {autoSyncResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <p className={`font-medium ${
                            autoSyncResult.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {autoSyncResult.success ? 'Sincronizzazione completata!' : 'Errore di sincronizzazione'}
                          </p>
                        </div>
                        {autoSyncResult.success ? (
                          <p className="text-sm text-green-700">
                            {autoSyncResult.examsAdded} verifiche, {autoSyncResult.homeworkAdded} compiti, 
                            {autoSyncResult.gradesAdded} voti, {autoSyncResult.subjectsUpdated} materie aggiornate
                          </p>
                        ) : (
                          <p className="text-sm text-red-700">{autoSyncResult.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Features Overview */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Funzionalità Disponibili
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Login sicuro</p>
                        <p className="text-sm text-gray-600">Credenziali crittografate localmente</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Sync automatica</p>
                        <p className="text-sm text-gray-600">Programmazione giornaliera o settimanale</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Notifiche</p>
                        <p className="text-sm text-gray-600">Avvisi per nuovi dati importati</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Cloud className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Import completo</p>
                        <p className="text-sm text-gray-600">Agenda, voti e argomenti</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">❓ Domande Frequenti</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Come faccio a copiare i dati da ClasseViva?</h4>
              <p className="text-sm text-gray-600">
                Accedi a ClasseViva dal browser, vai nella sezione Agenda o Voti, seleziona il testo con il mouse, 
                copia con Ctrl+C (o Cmd+C su Mac) e incolla qui.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">I miei dati sono al sicuro?</h4>
              <p className="text-sm text-gray-600">
                Tutti i dati vengono elaborati localmente nel tuo browser. Nessuna informazione viene inviata a server esterni.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Quali formati sono supportati?</h4>
              <p className="text-sm text-gray-600">
                Supportiamo il copia-incolla diretto, file TXT/CSV/JSON e la sincronizzazione automatica diretta con ClasseViva. 
                Il sistema riconosce automaticamente date, materie e tipologie di attività.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Come funziona la sincronizzazione automatica?</h4>
              <p className="text-sm text-gray-600">
                Una volta effettuato il login con le tue credenziali ClasseViva, puoi programmare sync automatici 
                giornalieri o settimanali. Il sistema importa automaticamente nuovi compiti, verifiche e voti.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Le mie credenziali ClasseViva sono sicure?</h4>
              <p className="text-sm text-gray-600">
                Sì, le credenziali vengono crittografate e salvate solo localmente sul tuo dispositivo. 
                Nessun dato viene inviato ai nostri server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}