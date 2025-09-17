# Deployment su Vercel - Note Importanti

## ⚠️ Limitazioni dello Scraping Automatico

### Il Problema
La funzionalità di **Auto-Sync con ClasseViva** non è disponibile quando l'applicazione è deployata su Vercel. Questo perché:

1. **Puppeteer richiede Chrome**: Lo scraping web necessita di un browser completo (Chrome/Chromium)
2. **Vercel Serverless Functions**: Non supportano l'installazione di browser headless
3. **Limiti di dimensione**: Le funzioni serverless hanno limiti di dimensione che non permettono di includere Chrome

### Soluzioni Alternative

#### 1. 📋 **Metodo Copia-Incolla** (Consigliato su Vercel)
- Accedi a ClasseViva dal browser
- Copia i dati dalla pagina
- Incolla nella tab "Copia e Incolla" della pagina Sincronizza
- L'app rileverà automaticamente il formato e importerà i dati

#### 2. 📁 **Import File CSV/JSON**
- Esporta i dati da ClasseViva (se disponibile)
- Usa la tab "Carica File" per importare
- Supporta formati CSV e JSON

#### 3. 💻 **Sviluppo Locale** (Per Auto-Sync completo)
```bash
# Clona il repository
git clone https://github.com/tuousername/study-planner.git
cd study-planner

# Installa dipendenze
npm install

# Avvia in locale
npm run dev

# Apri http://localhost:3000
# Auto-Sync funzionerà completamente!
```

## ✅ Funzionalità Disponibili su Vercel

Tutte le altre funzionalità funzionano perfettamente su Vercel:

- ✅ Gestione manuale compiti e verifiche
- ✅ Agenda e pianificazione
- ✅ Diagramma di Gantt
- ✅ Pomodoro Timer
- ✅ Gestione materie e argomenti
- ✅ Statistiche e obiettivi
- ✅ Import manuale da ClasseViva (copia-incolla)
- ✅ Export/Import dati in JSON

## 🚀 Possibili Soluzioni Future

### 1. **API ClasseViva Ufficiale**
Se ClasseViva rilasciasse un'API REST ufficiale, potremmo integrarla direttamente.

### 2. **Servizio di Scraping Esterno**
Utilizzare servizi come:
- Browserless.io
- ScrapingBee
- Puppeteer as a Service

### 3. **Chrome Extension**
Sviluppare un'estensione Chrome che:
- Si integra con ClasseViva
- Invia i dati all'app
- Funziona completamente lato client

### 4. **Self-Hosted Solution**
Deployare su piattaforme che supportano container Docker:
- Railway
- Render
- Fly.io
- DigitalOcean App Platform

## 📝 Raccomandazioni

Per la migliore esperienza su Vercel:

1. **Usa il metodo copia-incolla** per importare dati da ClasseViva
2. **Pianifica import settimanali** invece di sync automatici giornalieri
3. **Esporta regolarmente i tuoi dati** per backup
4. **Considera l'uso locale** se hai bisogno di sync automatici frequenti

## 🔧 Configurazione per Altri Hosting

Se vuoi deployare con supporto completo per scraping, considera:

### Railway
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
```

### Docker
```dockerfile
FROM node:18-slim

# Install Chrome
RUN apt-get update && apt-get install -y \
  chromium \
  chromium-driver

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Rest of your Dockerfile...
```

---

Per domande o supporto, apri una issue su GitHub!