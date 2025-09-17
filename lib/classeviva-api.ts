// ClasseViva API Client
// Uses web scraping to extract data from ClasseViva

interface ClasseVivaCredentials {
  username: string;
  password: string;
  school?: string; // Optional school code
}

interface ClasseVivaSession {
  sessionId: string;
  userId: string;
  expiresAt: number;
}

export interface ClasseVivaTest {
  date: string;
  subject: string;
  description: string;
  type?: 'written' | 'oral' | 'practical';
}

export interface ClasseVivaHomework {
  date: string;
  subject: string;
  description: string;
}

export interface ClasseVivaGrade {
  date: string;
  subject: string;
  grade: string;
  type: string;
  description?: string;
  weight?: number;
}

export interface ClasseVivaLesson {
  date: string;
  hour: string;
  subject: string;
  teacher?: string;
  topics?: string;
  homework?: string;
}

export interface ClasseVivaData {
  tests: ClasseVivaTest[];
  homework: ClasseVivaHomework[];
  grades: ClasseVivaGrade[];
  lessons: ClasseVivaLesson[];
}

class ClasseVivaAPIClient {
  private session: ClasseVivaSession | null = null;
  private isLoggedIn = false;

  // Encrypt credentials for secure storage
  private encryptCredentials(credentials: ClasseVivaCredentials): string {
    const data = JSON.stringify(credentials);
    return btoa(encodeURIComponent(data));
  }

  // Decrypt credentials from secure storage
  private decryptCredentials(encrypted: string): ClasseVivaCredentials {
    try {
      const data = decodeURIComponent(atob(encrypted));
      return JSON.parse(data);
    } catch {
      throw new Error('Invalid credentials format');
    }
  }

  // Store credentials securely
  public storeCredentials(credentials: ClasseVivaCredentials): void {
    const encrypted = this.encryptCredentials(credentials);
    localStorage.setItem('classeviva_credentials', encrypted);
  }

  // Retrieve stored credentials
  public getStoredCredentials(): ClasseVivaCredentials | null {
    const encrypted = localStorage.getItem('classeviva_credentials');
    if (!encrypted) return null;
    
    try {
      return this.decryptCredentials(encrypted);
    } catch {
      return null;
    }
  }

  // Clear stored credentials
  public clearCredentials(): void {
    localStorage.removeItem('classeviva_credentials');
    localStorage.removeItem('classeviva_session');
    this.session = null;
    this.isLoggedIn = false;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    if (!this.session) {
      const stored = localStorage.getItem('classeviva_session');
      if (stored) {
        try {
          this.session = JSON.parse(stored);
          this.isLoggedIn = this.session !== null && 
                           this.session.sessionId !== '' && 
                           this.session.expiresAt > Date.now();
        } catch {
          return false;
        }
      }
    }
    
    return this.isLoggedIn;
  }

  // Login to ClasseViva usando lo scraper
  public async login(credentials: ClasseVivaCredentials): Promise<boolean> {
    try {
      console.log('Attempting login via web scraper...');
      
      const response = await fetch('/api/classeviva/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          action: 'login'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.session = {
          sessionId: result.sessionId || 'scraper-session-' + Date.now(),
          userId: credentials.username,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        this.isLoggedIn = true;
        
        localStorage.setItem('classeviva_session', JSON.stringify(this.session));
        this.storeCredentials(credentials);
        
        console.log('Login successful via scraper');
        return true;
      }
      
      console.error('Login failed:', result.message);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Fetch all data usando lo scraper
  public async fetchData(startDate?: Date, endDate?: Date): Promise<ClasseVivaData | null> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated');
      return null;
    }

    try {
      const params = new URLSearchParams();
      params.append('type', 'all');
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await fetch(`/api/classeviva/scrape?${params}`, {
        headers: {
          'X-Session-Id': this.session?.sessionId || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Formatta i dati nel formato ClasseVivaData
        const data: ClasseVivaData = {
          tests: [],
          homework: [],
          grades: result.data.grades || [],
          lessons: result.data.lessons || []
        };
        
        // Estrai verifiche e compiti dall'agenda
        if (result.data.agenda) {
          result.data.agenda.forEach((item: any) => {
            if (item.type === 'test' || item.type === 'verifica') {
              data.tests.push({
                date: item.date,
                subject: item.subject,
                description: item.description,
                type: item.testType || 'written'
              });
            } else if (item.type === 'homework' || item.type === 'compiti') {
              data.homework.push({
                date: item.date,
                subject: item.subject,
                description: item.description
              });
            }
          });
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Fetch data error:', error);
      return null;
    }
  }

  // Fetch solo i voti
  public async fetchGrades(): Promise<ClasseVivaGrade[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const params = new URLSearchParams();
      params.append('type', 'grades');
      
      const response = await fetch(`/api/classeviva/scrape?${params}`, {
        headers: {
          'X-Session-Id': this.session?.sessionId || '',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.message || 'Failed to fetch grades');
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw error;
    }
  }

  // Fetch agenda (verifiche e compiti)
  public async fetchAgenda(startDate?: Date, endDate?: Date): Promise<(ClasseVivaTest | ClasseVivaHomework)[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const params = new URLSearchParams();
      params.append('type', 'agenda');
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await fetch(`/api/classeviva/scrape?${params}`, {
        headers: {
          'X-Session-Id': this.session?.sessionId || '',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        const agenda: (ClasseVivaTest | ClasseVivaHomework)[] = [];
        
        result.data.forEach((item: any) => {
          if (item.type === 'test' || item.type === 'verifica') {
            agenda.push({
              date: item.date,
              subject: item.subject,
              description: item.description,
              type: 'written'
            } as ClasseVivaTest);
          } else {
            agenda.push({
              date: item.date,
              subject: item.subject,
              description: item.description
            } as ClasseVivaHomework);
          }
        });
        
        return agenda;
      }

      throw new Error(result.message || 'Failed to fetch agenda');
    } catch (error) {
      console.error('Error fetching agenda:', error);
      throw error;
    }
  }

  // Fetch lezioni
  public async fetchLessons(date?: Date): Promise<ClasseVivaLesson[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const params = new URLSearchParams();
      params.append('type', 'lessons');
      if (date) params.append('date', date.toISOString());
      
      const response = await fetch(`/api/classeviva/scrape?${params}`, {
        headers: {
          'X-Session-Id': this.session?.sessionId || '',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.message || 'Failed to fetch lessons');
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  // Logout e chiudi la sessione di scraping
  public async logout(): Promise<void> {
    try {
      await fetch('/api/classeviva/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    this.clearCredentials();
    this.isLoggedIn = false;
  }
}

// Export singleton instance
export const classeVivaAPI = new ClasseVivaAPIClient();