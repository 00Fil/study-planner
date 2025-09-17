// Auto-sync service for ClasseViva integration
import { classeVivaAPI, ClasseVivaTest, ClasseVivaHomework, ClasseVivaGrade, ClasseVivaData } from './classeviva-api';
import { saveExam, saveHomework, saveSubject, getExams, getHomework, getSubjects, saveTopic } from './storage';
import { Exam, Homework, Topic } from './types';

interface SyncResult {
  success: boolean;
  examsAdded: number;
  homeworkAdded: number;
  gradesAdded: number;
  subjectsUpdated: number;
  error?: string;
}

interface SyncSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'manual';
  time: string; // HH:mm format
  lastSync?: string; // ISO date string
  nextSync?: string; // ISO date string
}

class AutoSyncService {
  private syncInProgress = false;
  private syncSchedule: SyncSchedule = {
    enabled: false,
    frequency: 'daily',
    time: '08:00'
  };

  constructor() {
    // Only initialize in browser
    if (typeof window !== 'undefined') {
      this.loadSyncSchedule();
      this.setupAutoSync();
    }
  }

  // Load sync schedule from localStorage
  private loadSyncSchedule(): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('classeviva_sync_schedule');
    if (stored) {
      try {
        this.syncSchedule = { ...this.syncSchedule, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Error loading sync schedule:', error);
      }
    }
  }

  // Save sync schedule to localStorage
  private saveSyncSchedule(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('classeviva_sync_schedule', JSON.stringify(this.syncSchedule));
  }

  // Get current sync schedule
  public getSyncSchedule(): SyncSchedule {
    return { ...this.syncSchedule };
  }

  // Update sync schedule
  public updateSyncSchedule(schedule: Partial<SyncSchedule>): void {
    this.syncSchedule = { ...this.syncSchedule, ...schedule };
    this.saveSyncSchedule();
    this.setupAutoSync();
  }

  // Setup automatic sync based on schedule
  private setupAutoSync(): void {
    if (this.syncSchedule.enabled && this.syncSchedule.frequency !== 'manual') {
      this.scheduleNextSync();
    }
  }

  // Schedule the next sync
  private scheduleNextSync(): void {
    const now = new Date();
    const [hours, minutes] = this.syncSchedule.time.split(':').map(Number);
    
    const nextSync = new Date();
    nextSync.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow/next week
    if (nextSync <= now) {
      if (this.syncSchedule.frequency === 'daily') {
        nextSync.setDate(nextSync.getDate() + 1);
      } else if (this.syncSchedule.frequency === 'weekly') {
        nextSync.setDate(nextSync.getDate() + 7);
      }
    }

    this.syncSchedule.nextSync = nextSync.toISOString();
    this.saveSyncSchedule();

    // Schedule the sync
    const timeUntilSync = nextSync.getTime() - now.getTime();
    setTimeout(() => {
      this.performAutoSync();
    }, timeUntilSync);
  }

  // Perform automatic sync
  private async performAutoSync(): Promise<void> {
    if (!classeVivaAPI.isAuthenticated()) {
      console.log('Auto-sync skipped: not authenticated');
      return;
    }

    try {
      await this.performSync();
      console.log('Auto-sync completed successfully');
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }

    // Schedule next sync
    this.scheduleNextSync();
  }

  // Check if sync is in progress
  public isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Get last sync date
  public getLastSyncDate(): Date | null {
    if (this.syncSchedule.lastSync) {
      return new Date(this.syncSchedule.lastSync);
    }
    return null;
  }

  // Get next sync date
  public getNextSyncDate(): Date | null {
    if (this.syncSchedule.nextSync) {
      return new Date(this.syncSchedule.nextSync);
    }
    return null;
  }

  // Manual sync trigger
  public async triggerSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        error: 'Sync already in progress',
        examsAdded: 0,
        homeworkAdded: 0,
        gradesAdded: 0,
        subjectsUpdated: 0
      };
    }

    return this.performSync();
  }

  // Main sync function
  private async performSync(): Promise<SyncResult> {
    this.syncInProgress = true;
    
    const result: SyncResult = {
      success: false,
      examsAdded: 0,
      homeworkAdded: 0,
      gradesAdded: 0,
      subjectsUpdated: 0
    };

    try {
      // Check authentication
      if (!classeVivaAPI.isAuthenticated()) {
        const credentials = classeVivaAPI.getStoredCredentials();
        if (!credentials) {
          throw new Error('No stored credentials found');
        }

        const loginSuccess = await classeVivaAPI.login(credentials);
        if (!loginSuccess) {
          throw new Error('Failed to authenticate with stored credentials');
        }
      }

      // Fetch data from ClasseViva
      const [agendaItems, grades] = await Promise.all([
        classeVivaAPI.fetchAgenda(),
        classeVivaAPI.fetchGrades()
      ]);

      // Process agenda items
      const agendaResult = await this.processAgendaItems(agendaItems);
      result.examsAdded = agendaResult.examsAdded;
      result.homeworkAdded = agendaResult.homeworkAdded;
      result.subjectsUpdated += agendaResult.subjectsUpdated;

      // Process grades
      const gradesResult = await this.processGrades(grades);
      result.gradesAdded = gradesResult.gradesAdded;
      result.subjectsUpdated += gradesResult.subjectsUpdated;

      // Update sync timestamp
      this.syncSchedule.lastSync = new Date().toISOString();
      this.saveSyncSchedule();

      result.success = true;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Process agenda items (assignments and tests)
  private async processAgendaItems(items: (ClasseVivaTest | ClasseVivaHomework)[]): Promise<{
    examsAdded: number;
    homeworkAdded: number;
    subjectsUpdated: number;
  }> {
    const existingExams = getExams();
    const existingHomework = getHomework();
    const existingSubjects = getSubjects();
    
    let examsAdded = 0;
    let homeworkAdded = 0;
    let subjectsUpdated = 0;

    for (const item of items) {
      // Validate item
      if (!item.date || !item.subject || !item.description) {
        continue;
      }

      // Determine if it's a test or homework
      const isTest = 'type' in item;

      // Create or update subject
      let subject = existingSubjects.find(s => s.name.toLowerCase() === item.subject.toLowerCase());
      if (!subject) {
        subject = {
          name: item.subject,
          color: this.getRandomColor(),
          currentTopic: '',
          lastStudied: new Date().toISOString(),
          totalHours: 0,
          averageGrade: 0,
          topics: [],
          examGrades: []
        };
        saveSubject(subject);
        existingSubjects.push(subject);
        subjectsUpdated++;
      }

      if (isTest) {
        const testItem = item as ClasseVivaTest;
        // Check for duplicate exams
        const examExists = existingExams.some(e => 
          e.subject.toLowerCase() === testItem.subject.toLowerCase() && 
          e.date === testItem.date &&
          e.notes?.toLowerCase().includes(testItem.description.toLowerCase().substring(0, 20))
        );

        if (!examExists) {
          const newExam: Exam = {
            id: `exam-${Date.now()}-${Math.random()}`,
            date: testItem.date,
            subject: testItem.subject,
            type: testItem.type || 'written',
            topics: this.extractTopicsFromDescription(testItem.description),
            priority: 'medium',
            status: 'pending',
            notes: testItem.description
          };
          saveExam(newExam);
          existingExams.push(newExam);
          examsAdded++;
        }
      } else {
        const homeworkItem = item as ClasseVivaHomework;
        // Check for duplicate homework
        const homeworkExists = existingHomework.some(h => 
          h.subject.toLowerCase() === homeworkItem.subject.toLowerCase() && 
          h.dueDate === homeworkItem.date &&
          h.description.toLowerCase().includes(homeworkItem.description.toLowerCase().substring(0, 20))
        );

        if (!homeworkExists) {
          const newHomework: Homework = {
            id: `homework-${Date.now()}-${Math.random()}`,
            subject: homeworkItem.subject,
            description: homeworkItem.description,
            dueDate: homeworkItem.date,
            assignedDate: new Date().toISOString().split('T')[0],
            topics: this.extractTopicsFromDescription(homeworkItem.description),
            priority: 'medium',
            status: 'pending',
            estimatedHours: 1
          };
          saveHomework(newHomework);
          existingHomework.push(newHomework);
          homeworkAdded++;
        }
      }
    }

    return { examsAdded, homeworkAdded, subjectsUpdated };
  }

  // Process grades
  private async processGrades(grades: ClasseVivaGrade[]): Promise<{
    gradesAdded: number;
    subjectsUpdated: number;
  }> {
    const existingSubjects = getSubjects();
    let gradesAdded = 0;
    let subjectsUpdated = 0;

    for (const grade of grades) {
      // Validate grade  
      if (!grade.subject || !grade.grade || !grade.date) {
        continue;
      }

      // Validate grade format
      const gradePattern = /^\d+([,\.]\d+)?[+\-]?$/;
      if (!gradePattern.test(grade.grade)) {
        continue;
      }

      // Find or create subject
      let subject = existingSubjects.find(s => s.name.toLowerCase() === grade.subject.toLowerCase());
      if (!subject) {
        subject = {
          name: grade.subject,
          color: this.getRandomColor(),
          currentTopic: '',
          lastStudied: new Date().toISOString(),
          totalHours: 0,
          averageGrade: 0,
          topics: [],
          examGrades: []
        };
        saveSubject(subject);
        existingSubjects.push(subject);
        subjectsUpdated++;
      }

      // Add grade if not duplicate
      if (!subject.examGrades) subject.examGrades = [];
      
      const gradeExists = subject.examGrades.some(existingGrade => 
        existingGrade === grade.grade
      );

      if (!gradeExists) {
        subject.examGrades.push(grade.grade);
        saveSubject(subject);
        gradesAdded++;
      }
    }

    return { gradesAdded, subjectsUpdated };
  }

  // Extract topics from description text
  private extractTopicsFromDescription(description: string): string[] {
    const topics: string[] = [];
    
    // Look for topics separated by semicolons, commas, or specific keywords
    const patterns = [
      /argomenti?:\s*([^.]+)/gi,
      /topics?:\s*([^.]+)/gi,
      /contenuti?:\s*([^.]+)/gi
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(description);
      if (match) {
        const topicString = match[1];
        const separatedTopics = topicString.split(/[;,]/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
        topics.push(...separatedTopics);
      }
    }
    
    // If no specific topics found, try to extract key phrases
    if (topics.length === 0 && description.length > 20) {
      const keyPhrases = description
        .split(/[.!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 100)
        .slice(0, 3);
      topics.push(...keyPhrases);
    }
    
    return topics;
  }
  
  // Helper function to get random color
  private getRandomColor(): string {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Enable notifications (for browser notifications)
  public async enableNotifications(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Send notification
  private sendNotification(title: string, body: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  // Send sync completion notification
  public notifySyncResult(result: SyncResult): void {
    if (result.success) {
      const totalItems = result.examsAdded + result.homeworkAdded + result.gradesAdded;
      if (totalItems > 0) {
        this.sendNotification(
          '📚 Sync ClasseViva completato!',
          `${result.examsAdded} verifiche, ${result.homeworkAdded} compiti, ${result.gradesAdded} voti aggiunti`
        );
      }
    } else {
      this.sendNotification(
        '⚠️ Errore sync ClasseViva',
        result.error || 'Errore sconosciuto durante la sincronizzazione'
      );
    }
  }
}

// Export singleton instance
export const autoSyncService = new AutoSyncService();

// Export types
export type { SyncResult, SyncSchedule };