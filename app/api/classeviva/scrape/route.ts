import { NextRequest, NextResponse } from 'next/server';
import { classeVivaScraper } from '@/lib/classeviva-scraper';

// POST: Login and start scraping session
export async function POST(request: NextRequest) {
  try {
    const { username, password, action } = await request.json();
    
    if (action === 'login') {
      console.log('Starting web scraping login for:', username);
      
      // Perform login via scraping
      const success = await classeVivaScraper.login(username, password);
      
      if (success) {
        console.log('Scraping login successful');
        
        return NextResponse.json({
          success: true,
          sessionId: 'scraper-session-' + Date.now(),
          message: 'Login riuscito tramite web scraping'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Credenziali non valide o errore di accesso'
        }, { status: 401 });
      }
    }
    
    if (action === 'logout') {
      await classeVivaScraper.close();
      return NextResponse.json({
        success: true,
        message: 'Logout effettuato'
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Azione non valida'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante lo scraping',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET: Scrape data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataType = searchParams.get('type'); // grades, agenda, lessons
    
    if (!classeVivaScraper.isAuthenticated()) {
      return NextResponse.json({
        success: false,
        message: 'Non autenticato. Effettua prima il login.'
      }, { status: 401 });
    }
    
    let data: unknown = null;
    
    switch (dataType) {
      case 'grades':
        console.log('Scraping grades...');
        data = await classeVivaScraper.scrapeGrades();
        break;
        
      case 'agenda':
        console.log('Scraping agenda...');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        data = await classeVivaScraper.scrapeAgenda(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;
        
      case 'lessons':
        console.log('Scraping lessons...');
        const lessonDate = searchParams.get('date');
        data = await classeVivaScraper.scrapeLessons(
          lessonDate ? new Date(lessonDate) : undefined
        );
        break;
        
      case 'all':
        console.log('Scraping all data...');
        const [grades, agenda, lessons] = await Promise.all([
          classeVivaScraper.scrapeGrades(),
          classeVivaScraper.scrapeAgenda(),
          classeVivaScraper.scrapeLessons()
        ]);
        
        data = {
          grades,
          agenda,
          lessons
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Tipo di dato non valido. Usa: grades, agenda, lessons, all'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scraping fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante il recupero dei dati',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}