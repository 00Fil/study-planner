// ClasseViva Web Scraper
// Uses Puppeteer to scrape data directly from ClasseViva web pages

import puppeteer, { Browser, Page } from 'puppeteer';

export interface ScrapedGrade {
  date: string;
  subject: string;
  grade: string;
  type: string;
  description?: string;
  weight?: number;
}

export interface ScrapedAssignment {
  date: string;
  subject: string;
  type: string;
  description: string;
  topics?: string[];
  time?: string;
}

export interface ScrapedLesson {
  date: string;
  time: string;
  subject: string;
  topic?: string;
  homework?: string;
}

export class ClasseVivaScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn: boolean = false;
  private credentials: { username: string; password: string } | null = null;

  // Initialize browser
  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true, // Set to false to see the browser
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      this.page = await this.browser.newPage();
      
      // Enable console logging from the browser
      this.page.on('console', msg => console.log('Browser console:', msg.text()));
      this.page.on('pageerror', error => console.log('Page error:', error.message));
      
      // Set viewport and user agent
      await this.page.setViewport({ width: 1280, height: 800 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }
  }

  // Close browser
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }

  // Login to ClasseViva
  async login(username: string, password: string): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      // Store credentials for later use
      this.credentials = { username, password };

      console.log('Navigating to ClasseViva login page...');
      
      // Go to login page
      await this.page.goto('https://web.spaggiari.eu/home/app/default/login.php', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for login form
      await this.page.waitForSelector('#login', { timeout: 10000 });
      
      console.log('Filling login form...');
      
      // Fill in credentials
      await this.page.type('#login', username);
      await this.page.type('#password', password);
      
      // Submit form
      await Promise.all([
        this.page.click('#loginbutton, button[type="submit"], input[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);
      
      // Check if login was successful
      const url = this.page.url();
      const content = await this.page.content();
      
      console.log('Post-login URL:', url);
      
      if (url.includes('menu') || url.includes('cvv/app') || url.includes('home') || content.includes('menu_webinfoschool')) {
        console.log('Login successful!');
        this.isLoggedIn = true;
        
        // Extract all available links from the page
        const availableLinks = await this.page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links.map(link => ({
            text: link.textContent?.trim(),
            href: link.href
          })).filter(link => link.href && !link.href.includes('logout'));
        });
        
        console.log('Available links after login:');
        availableLinks.forEach(link => {
          if (link.text?.toLowerCase().includes('voti') || 
              link.text?.toLowerCase().includes('agenda') ||
              link.text?.toLowerCase().includes('compiti') ||
              link.href.includes('voti') ||
              link.href.includes('agenda')) {
            console.log(`- ${link.text}: ${link.href}`);
          }
        });
        
        return true;
      }
      
      // Check for error messages
      const errorElement = await this.page.$('.error, .alert-danger, #error_msg');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log('Login error:', errorText);
      }
      
      this.isLoggedIn = false;
      return false;
      
    } catch (error) {
      console.error('Login failed:', error);
      this.isLoggedIn = false;
      return false;
    }
  }

  // Scrape grades (voti)
  async scrapeGrades(): Promise<ScrapedGrade[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in');
    }

    try {
      console.log('Navigating to grades page...');
      
      // Check current URL to see if we need to navigate to menu
      const currentUrl = this.page.url();
      console.log('Current URL before grades navigation:', currentUrl);
      
      if (!currentUrl.includes('menu_webinfoschool')) {
        // We're not on the menu page, go there first
        console.log('Navigating to menu first...');
        await this.page.goto('https://web.spaggiari.eu/home/app/default/menu_webinfoschool_studenti.php', {
          waitUntil: 'networkidle2',
          timeout: 20000
        });
      }
      
      // Find and click the grades link
      console.log('Looking for grades link...');
      const gradesInfo = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const gradesLink = links.find(link => 
          link.href?.includes('voti') || 
          link.href?.includes('scrutinio') ||
          link.textContent?.toLowerCase().includes('voti') ||
          link.textContent?.toLowerCase().includes('valutazioni') ||
          link.textContent?.toLowerCase().includes('pagelle')
        );
        if (gradesLink) {
          return {
            found: true,
            href: gradesLink.href,
            text: gradesLink.textContent
          };
        }
        return { found: false };
      });
      
      if (gradesInfo.found) {
        console.log(`Found grades link: ${gradesInfo.text} -> ${gradesInfo.href}`);
        // Navigate directly to the URL instead of clicking
        await this.page.goto(gradesInfo.href, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        console.log('Grades page loaded:', this.page.url());
      } else {
        console.log('No grades link found, there might be no grades module available');
        // Return empty array if no grades module is available
        return [];
      }
      
      console.log('Current grades URL:', this.page.url());

      // Wait for the page to load - use a more generic selector
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Take a screenshot for debugging (optional)
      // await this.page.screenshot({ path: 'grades-page.png' });
      
      // Log the current URL to verify we're on the right page
      console.log('Current URL:', this.page.url());
      
      // Extract grades data with more flexible selectors
      const grades = await this.page.evaluate(() => {
        const gradesList: any[] = [];
        
        // Debug: Log what we find on the page
        console.log('Tables found:', document.querySelectorAll('table').length);
        console.log('Page title:', document.title);
        console.log('Page HTML sample:', document.body.innerHTML.substring(0, 500));
        
        // Try different selectors for grades - including scrutinio-specific ones
        const rows = document.querySelectorAll(
          'table tr[class*="voto"], ' +
          'table tbody tr, ' + 
          '.voti tr, ' +
          'div[class*="voto"], ' +
          '.row[class*="grade"], ' +
          'tr[class*="list"], ' +
          '.registro tr'
        );
        
        console.log('Rows found with selectors:', rows.length);
        
        rows.forEach((row: any) => {
          // Skip header rows
          if (row.querySelector('th')) return;
          
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const dateText = cells[0]?.textContent?.trim() || '';
            const subjectText = cells[1]?.textContent?.trim() || '';
            const gradeText = cells[2]?.textContent?.trim() || '';
            const typeText = cells[3]?.textContent?.trim() || 'Scritto';
            const descText = cells[4]?.textContent?.trim() || '';
            
            if (dateText && subjectText && gradeText && /\d/.test(gradeText)) {
              gradesList.push({
                data: dateText,
                materia: subjectText,
                voto: gradeText,
                tipo: typeText,
                descrizione: descText
              });
            }
          }
        });
        
        // Alternative: look for grade cards
        const cards = document.querySelectorAll('.voto-card, .grade-item, .voto');
        cards.forEach((card: any) => {
          const date = card.querySelector('.data, .date')?.textContent?.trim();
          const subject = card.querySelector('.materia, .subject')?.textContent?.trim();
          const grade = card.querySelector('.voto, .grade-value')?.textContent?.trim();
          const type = card.querySelector('.tipo, .type')?.textContent?.trim() || 'Scritto';
          
          if (date && subject && grade) {
            gradesList.push({
              data: date,
              materia: subject,
              voto: grade,
              tipo: type,
              descrizione: ''
            });
          }
        });
        
        return gradesList;
      });

      console.log(`Found ${grades.length} grades`);
      return this.formatGrades(grades);
      
    } catch (error) {
      console.error('Error scraping grades:', error);
      return [];
    }
  }

  // Scrape agenda (compiti e verifiche)
  async scrapeAgenda(startDate?: Date, endDate?: Date): Promise<ScrapedAssignment[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in');
    }

    try {
      console.log('Navigating to agenda page...');
      
      // Navigate directly to the FML agenda URL
      console.log('Going directly to FML agenda...');
      await this.page.goto('https://web.spaggiari.eu/fml/app/default/agenda_studenti.php', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Check if we need to login again for FML module
      const currentUrl = this.page.url();
      console.log('After navigation URL:', currentUrl);
      
      // Check if we're redirected to login page
      if (currentUrl.includes('login')) {
        console.log('FML requires login, filling credentials...');
        
        // Wait for login form
        try {
          await this.page.waitForSelector('#login', { timeout: 5000 });
          
          // Use stored credentials
          if (this.credentials) {
            // Fill in credentials
            await this.page.type('#login', this.credentials.username);
            await this.page.type('#password', this.credentials.password);
            
            // Submit form
            await Promise.all([
              this.page.click('#loginbutton, button[type="submit"], input[type="submit"]'),
              this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
            ]);
            
            console.log('FML login completed, now on:', this.page.url());
          } else {
            console.log('No stored credentials found for FML login');
          }
        } catch (e) {
          console.log('Login form not found or login failed:', e);
        }
      }
      
      // Verify we're on the agenda page
      const finalUrl = this.page.url();
      if (!finalUrl.includes('agenda')) {
        console.log('Not on agenda page, current URL:', finalUrl);
        return [];
      }
      
      console.log('Successfully on agenda page');
      
      
      console.log('Current agenda URL:', this.page.url());
      
      // Check if we actually landed on the agenda page
      const pageContent = await this.page.evaluate(() => {
        return {
          title: document.title,
          hasAgenda: document.body.textContent?.includes('agenda') || 
                     document.body.textContent?.includes('Agenda'),
          hasLogin: document.body.textContent?.includes('Login') ||
                    document.body.textContent?.includes('login'),
          bodySnippet: document.body.textContent?.substring(0, 200)
        };
      });
      
      console.log('Page check:', pageContent);
      
      // Check if there's an Excel export link
      const hasExport = await this.page.evaluate(() => {
        const exportLink = document.querySelector('a.export[alt="scarica"], a[href*="export"]');
        return !!exportLink;
      });
      
      if (hasExport) {
        console.log('Found Excel export option');
      }

      // Wait for the page to load
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Log current URL for debugging
      console.log('Current agenda URL:', this.page.url());
      
      // Extract agenda data
      const assignments = await this.page.evaluate(() => {
        const assignmentsList: any[] = [];
        
        // First try FullCalendar events (most common in ClasseViva)
        const fcEvents = document.querySelectorAll('.fc-event');
        if (fcEvents.length > 0) {
          console.log(`Found ${fcEvents.length} FullCalendar events`);
          fcEvents.forEach((event: any) => {
            // Extract from title attribute and inner content
            const title = event.getAttribute('title') || '';
            const timeSpan = event.querySelector('.fc-event-time');
            const titleSpan = event.querySelector('.fc-event-title');
            
            // Extract time if available
            const time = timeSpan?.textContent?.replace(/[()]/g, '').trim() || '';
            
            // Parse the title to extract subject and description
            let materia = '';
            let descrizione = title;
            
            // Check if title has the pattern "COMPITI DI [SUBJECT]: [description]"
            const match = title.match(/COMPITI DI ([^:]+):\s*(.+)/i) || 
                         title.match(/VERIFICA DI ([^:]+):\s*(.+)/i) ||
                         title.match(/([^:]+):\s*(.+)/);
            
            if (match) {
              materia = match[1].trim();
              descrizione = match[2].trim();
            } else if (titleSpan) {
              // Try to extract from the formatted HTML
              const boldText = titleSpan.querySelector('font[style*="bold"]')?.textContent || '';
              if (boldText) {
                materia = boldText.replace(/COMPITI DI|VERIFICA DI|:/gi, '').trim();
                descrizione = titleSpan.textContent?.replace(boldText, '').trim() || title;
              }
            }
            
            // Determine type based on content
            let tipo = 'Compiti';
            if (title.toLowerCase().includes('verifica') || 
                title.toLowerCase().includes('test') || 
                title.toLowerCase().includes('compito in classe')) {
              tipo = 'Verifica';
            } else if (title.toLowerCase().includes('interrogazione')) {
              tipo = 'Interrogazione';
            }
            
            // Extract date from FullCalendar event position
            let data = '';
            
            // Method 1: Check parent element for date
            const parentCell = event.closest('.fc-day, .fc-day-content, td[data-date]');
            if (parentCell) {
              const dateAttr = parentCell.getAttribute('data-date');
              if (dateAttr) {
                // Convert YYYY-MM-DD to DD/MM/YYYY
                const [year, month, day] = dateAttr.split('-');
                data = `${day}/${month}/${year}`;
              } else {
                // Try to get date from class name (e.g., fc-day-20240115)
                const classList = parentCell.className;
                const dateMatch = classList.match(/fc-day-(\d{4})(\d{2})(\d{2})/);
                if (dateMatch) {
                  const [_, year, month, day] = dateMatch;
                  data = `${day}/${month}/${year}`;
                }
              }
            }
            
            // Method 2: Look for date in the event content itself
            if (!data) {
              const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
              const dateInTitle = title.match(datePattern);
              const dateInContent = event.textContent?.match(datePattern);
              
              if (dateInTitle) {
                data = dateInTitle[0];
              } else if (dateInContent) {
                data = dateInContent[0];
              }
            }
            
            // Method 3: Check for date header near the event
            if (!data) {
              const dateHeader = event.closest('.fc-row')?.querySelector('.fc-day-number');
              if (dateHeader) {
                const dayNum = dateHeader.textContent?.trim();
                // Get month and year from calendar header
                const monthYear = document.querySelector('.fc-header-title, .fc-toolbar-title')?.textContent;
                if (dayNum && monthYear) {
                  // Parse month year (e.g., "Gennaio 2024")
                  const monthMatch = monthYear.match(/(\w+)\s+(\d{4})/);
                  if (monthMatch) {
                    const [_, monthName, year] = monthMatch;
                    // Convert month name inline since we're in evaluate context
                    const months: Record<string, string> = {
                      'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
                      'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
                      'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
                    };
                    const monthNum = months[monthName.toLowerCase()] || '01';
                    data = `${dayNum.padStart(2, '0')}/${monthNum}/${year}`;
                  }
                }
              }
            }
            
            // Fallback: use today's date
            if (!data) {
              const today = new Date();
              data = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            }
            
            if (materia || descrizione) {
              assignmentsList.push({
                date: data,
                time: time,
                subject: materia || 'Materia non specificata',
                type: tipo.toLowerCase(),
                description: descrizione,
                topics: []
              });
            }
          });
        }
        
        // Fallback: try other selectors if no FullCalendar events
        if (assignmentsList.length === 0) {
          const items = document.querySelectorAll(
            '.agenda_row, ' +
            '.agenda-item, ' +
            'table tr.compito, ' +
            'table tr.verifica'
          );
          
          items.forEach((item: any) => {
          const dateEl = item.querySelector('.data, .date, td:first-child');
          const subjectEl = item.querySelector('.materia, .subject, td:nth-child(2)');
          const descEl = item.querySelector('.compito, .descrizione, .description, td:nth-child(3)');
          
          if (dateEl && subjectEl && descEl) {
            const dateText = dateEl.textContent?.trim() || '';
            const subjectText = subjectEl.textContent?.trim() || '';
            const descText = descEl.textContent?.trim() || '';
            
            // Determine type based on keywords
            let tipo: string = 'Compiti';
            const descLower = descText.toLowerCase();
            if (descLower.includes('verifica') || descLower.includes('compito in classe')) {
              tipo = 'Verifica';
            } else if (descLower.includes('interrogazione')) {
              tipo = 'Interrogazione';
            }
            
            // Extract topics from description
            const argomenti: string[] = [];
            const topicMatches = descText.match(/(?:su |di |riguardante |argomento: )([^,.;]+)/gi);
            if (topicMatches) {
              topicMatches.forEach(match => {
                const topic = match.replace(/(?:su |di |riguardante |argomento: )/i, '').trim();
                if (topic) argomenti.push(topic);
              });
            }
            
            if (dateText && subjectText) {
              assignmentsList.push({
                date: dateText,
                subject: subjectText,
                type: tipo.toLowerCase(),
                description: descText,
                topics: argomenti
              });
            }
          }
        });
        }
        
        // Alternative: calendar view (if no assignments found yet)
        if (assignmentsList.length === 0) {
          const calendarItems = document.querySelectorAll('.calendar-item, .event');
        calendarItems.forEach((item: any) => {
          const title = item.getAttribute('title') || item.textContent || '';
          const dateAttr = item.getAttribute('data-date') || '';
          
          if (title && dateAttr) {
            // Parse title for subject and description
            const parts = title.split(' - ');
            if (parts.length >= 2) {
              assignmentsList.push({
                date: dateAttr,
                subject: parts[0].trim(),
                type: 'homework',
                description: parts[1].trim(),
                topics: []
              });
            }
          }
        });
        }
        
        return assignmentsList;
      });

      console.log(`Found ${assignments.length} assignments`);
      return this.formatAssignments(assignments);
      
    } catch (error) {
      console.error('Error scraping agenda:', error);
      return [];
    }
  }

  // Scrape today's lessons and arguments
  async scrapeLessons(date?: Date): Promise<ScrapedLesson[]> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in');
    }

    try {
      console.log('Navigating to lessons page...');
      
      const targetDate = date || new Date();
      const dateStr = this.formatDateForUrl(targetDate);
      
      await this.page.goto(
        `https://web.spaggiari.eu/fml/app/default/regclasse_lezioni_xstudenti.php`,
        { waitUntil: 'networkidle2', timeout: 30000 }
      );

      // Wait for content
      await this.page.waitForSelector('.registro, table, .lessons', { timeout: 10000 });
      
      // Extract lessons data
      const lessons = await this.page.evaluate(() => {
        const lessonsList: any[] = [];
        
        const rows = document.querySelectorAll(
          '.registro_row, ' +
          'table tr.lezione, ' +
          '.lesson-item'
        );
        
        rows.forEach((row: any) => {
          const timeEl = row.querySelector('.ora, .time, td:first-child');
          const subjectEl = row.querySelector('.materia, .subject, td:nth-child(2)');
          const topicEl = row.querySelector('.argomento, .topic, td:nth-child(3)');
          const homeworkEl = row.querySelector('.compiti, .homework, td:nth-child(4)');
          
          if (timeEl && subjectEl) {
            lessonsList.push({
              ora: timeEl.textContent?.trim() || '',
              materia: subjectEl.textContent?.trim() || '',
              argomento: topicEl?.textContent?.trim() || '',
              compiti: homeworkEl?.textContent?.trim() || ''
            });
          }
        });
        
        return lessonsList;
      });

      console.log(`Found ${lessons.length} lessons`);
      
      return lessons.map(lesson => ({
        data: this.formatDateForUrl(targetDate),
        ora: lesson.ora,
        materia: lesson.materia,
        argomento: lesson.argomento,
        compiti: lesson.compiti
      }));
      
    } catch (error) {
      console.error('Error scraping lessons:', error);
      return [];
    }
  }

  // Helper: Format grades
  private formatGrades(grades: any[]): ScrapedGrade[] {
    return grades.map(grade => ({
      date: this.parseDate(grade.date || grade.data),
      subject: grade.subject || grade.materia,
      grade: grade.grade || grade.voto,
      type: (grade.type || grade.tipo || 'written').toLowerCase(),
      description: grade.description || grade.descrizione || '',
      weight: grade.weight || grade.peso
    }));
  }

  // Helper: Format assignments
  private formatAssignments(assignments: any[]): ScrapedAssignment[] {
    return assignments.map(assignment => ({
      date: this.parseDate(assignment.date || assignment.data),
      subject: assignment.subject || assignment.materia,
      type: assignment.type || assignment.tipo,
      description: assignment.description || assignment.descrizione,
      topics: assignment.topics || assignment.argomenti || []
    }));
  }

  // Helper: Parse date from Italian format to ISO
  private parseDate(dateStr: string): string {
    // Handle DD/MM/YYYY format
    const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (match) {
      const [_, day, month, year] = match;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  }

  // Helper: Format date for URL
  private formatDateForUrl(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    // Use dash format instead of slash for URL parameters
    return `${day}-${month}-${year}`;
  }

  // Helper: Convert Italian month name to number
  private getMonthNumber(monthName: string): string {
    const months: Record<string, string> = {
      'gennaio': '01',
      'febbraio': '02',
      'marzo': '03',
      'aprile': '04',
      'maggio': '05',
      'giugno': '06',
      'luglio': '07',
      'agosto': '08',
      'settembre': '09',
      'ottobre': '10',
      'novembre': '11',
      'dicembre': '12'
    };
    return months[monthName.toLowerCase()] || '01';
  }

  // Check if logged in
  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}

// Export singleton instance
export const classeVivaScraper = new ClasseVivaScraper();