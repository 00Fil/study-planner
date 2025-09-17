'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Brain, 
  Clock, 
  Target, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  Users,
  Palette,
  Map,
  Film,
  Home
} from 'lucide-react';

const studyMethods = [
  {
    id: 'immediate-review',
    title: 'Ripasso Immediato',
    icon: Clock,
    color: 'blue',
    description: 'La regola del 15-30-45 per fissare i concetti nella memoria',
    shortDesc: 'Mai rimandare a domani quello che puoi ripassare oggi!',
    steps: [
      '15 minuti: Ripasso IMMEDIATO dopo ogni lezione (stesso giorno)',
      '30 minuti: Ripasso il giorno dopo',
      '45 minuti: Ripasso nel weekend'
    ],
    tips: [
      'Rileggi gli appunti subito dopo la lezione',
      'Riscrivi i concetti chiave con parole tue',
      'Crea 3 domande per ogni argomento',
      'Spiega a voce alta quello che hai imparato'
    ],
    benefits: 'Riduce del 70% il tempo necessario per studiare prima delle verifiche'
  },
  {
    id: 'pomodoro',
    title: 'Tecnica Pomodoro',
    icon: Clock,
    color: 'red',
    description: 'Studio concentrato con pause regolari per massimizzare la produttività',
    shortDesc: '25 minuti di focus totale, 5 minuti di riposo',
    steps: [
      '25 minuti: Studio intenso senza distrazioni',
      '5 minuti: Pausa breve (alzati e muoviti)',
      'Ripeti per 4 cicli',
      '15-30 minuti: Pausa lunga dopo 4 pomodori'
    ],
    tips: [
      'Elimina TUTTE le distrazioni prima di iniziare',
      'Usa un timer visibile',
      'Non saltare mai le pause',
      'Tieni un foglio per annotare le distrazioni'
    ],
    benefits: 'Aumenta la concentrazione del 40% e riduce la stanchezza mentale'
  },
  {
    id: 'mind-maps',
    title: 'Mappe Mentali',
    icon: Map,
    color: 'green',
    description: 'Organizza visualmente le informazioni per comprenderle meglio',
    shortDesc: 'Trasforma liste noiose in diagrammi colorati',
    steps: [
      'Metti l\'argomento principale al centro',
      'Crea rami per i concetti principali',
      'Aggiungi sotto-rami per i dettagli',
      'Usa colori diversi per ogni ramo',
      'Aggiungi disegni e simboli'
    ],
    tips: [
      'Usa fogli A3 o più grandi',
      'Scrivi solo parole chiave, non frasi',
      'Più colori = più memoria',
      'Disegna anche se non sei bravo'
    ],
    benefits: 'Migliora la memoria visiva e i collegamenti tra concetti'
  },
  {
    id: 'feynman',
    title: 'Tecnica Feynman',
    icon: Users,
    color: 'purple',
    description: 'Se non sai spiegarlo semplicemente, non l\'hai capito abbastanza',
    shortDesc: 'Impara insegnando',
    steps: [
      'Studia l\'argomento normalmente',
      'Spiega a voce alta come se insegnassi a un bambino',
      'Identifica i punti che non riesci a spiegare',
      'Torna a studiare SOLO quei punti',
      'Ripeti finché non sai spiegare tutto'
    ],
    tips: [
      'Registrati mentre spieghi',
      'Usa esempi dalla vita quotidiana',
      'Se usi paroloni, non hai capito',
      'Chiedi a qualcuno di farti domande'
    ],
    benefits: 'Garantisce comprensione profonda, non solo memorizzazione'
  },
  {
    id: 'spaced-repetition',
    title: 'Ripetizione Spaziata',
    icon: Zap,
    color: 'yellow',
    description: 'Ripassa al momento giusto per non dimenticare mai',
    shortDesc: 'Il segreto per ricordare tutto a lungo termine',
    steps: [
      'Dopo 1 ora: Ripasso veloce (5 min)',
      'Dopo 1 giorno: Ripasso medio (15 min)',
      'Dopo 3 giorni: Test personale (20 min)',
      'Dopo 1 settimana: Ripasso completo (30 min)',
      'Dopo 2 settimane: Simulazione verifica'
    ],
    tips: [
      'Usa app come Anki per automatizzare',
      'Non saltare nessun intervallo',
      'Se sbagli, ricomincia il ciclo',
      'Aumenta gradualmente gli intervalli'
    ],
    benefits: 'Ricordi il 90% delle informazioni anche dopo mesi'
  },
  {
    id: 'color-coding',
    title: 'Codice Colori',
    icon: Palette,
    color: 'pink',
    description: 'Usa i colori per organizzare e memorizzare meglio',
    shortDesc: 'Un arcobaleno di conoscenza',
    steps: [
      'ROSSO: Concetti fondamentali (da sapere SEMPRE)',
      'GIALLO: Informazioni importanti',
      'VERDE: Esempi e approfondimenti',
      'BLU: Collegamenti con altri argomenti',
      'Evidenzia MAX 20% del testo'
    ],
    tips: [
      'Usa sempre gli stessi colori',
      'Non esagerare con l\'evidenziatore',
      'Crea una legenda all\'inizio del quaderno',
      'Usa post-it colorati per note extra'
    ],
    benefits: 'Trova le informazioni 3 volte più velocemente'
  },
  {
    id: 'mental-movie',
    title: 'Film Mentale',
    icon: Film,
    color: 'indigo',
    description: 'Trasforma date e eventi in scene memorabili',
    shortDesc: 'Diventa il regista della tua memoria',
    steps: [
      'Trasforma gli eventi in scene di un film',
      'Aggiungi dettagli visivi vividi',
      'Crea collegamenti emotivi',
      'Esagera e rendi tutto assurdo',
      '"Guarda" il film prima di dormire'
    ],
    tips: [
      'Più è strano, più ricordi',
      'Inserisci te stesso nelle scene',
      'Usa musica mentale di sottofondo',
      'Collega scene con transizioni assurde'
    ],
    benefits: 'Perfetto per Storia, Geografia e materie narrative'
  },
  {
    id: 'memory-palace',
    title: 'Palazzo della Memoria',
    icon: Home,
    color: 'cyan',
    description: 'Usa luoghi familiari per memorizzare liste e sequenze',
    shortDesc: 'La tua casa diventa un archivio mentale',
    steps: [
      'Scegli un luogo che conosci benissimo (casa tua)',
      'Associa ogni informazione a una stanza/oggetto',
      'Crea immagini strane e memorabili',
      'Stabilisci un percorso fisso',
      '"Cammina" mentalmente per ricordare'
    ],
    tips: [
      'Usa casa, scuola o percorso per scuola',
      'Più assurda l\'associazione, meglio è',
      'Usa sempre lo stesso percorso',
      'Aggiungi azioni alle immagini'
    ],
    benefits: 'Memorizza liste di 50+ elementi senza errori'
  }
];

const dailySchedule = {
  morning: {
    time: '14:00-14:30',
    activity: 'Pranzo e relax',
    tip: 'NO cellulare per i primi 30 minuti'
  },
  afternoon1: {
    time: '14:30-15:30',
    activity: 'RIPASSO IMMEDIATO',
    tip: 'Fissa nella memoria le spiegazioni del giorno'
  },
  break1: {
    time: '15:30-15:45',
    activity: 'Pausa attiva',
    tip: 'Alzati, muoviti, bevi acqua'
  },
  afternoon2: {
    time: '15:45-17:15',
    activity: 'STUDIO PROFONDO',
    tip: 'Materie che richiedono più concentrazione'
  },
  break2: {
    time: '17:15-17:45',
    activity: 'Pausa lunga',
    tip: 'Merenda e aria fresca'
  },
  evening: {
    time: '17:45-19:00',
    activity: 'COMPITI ED ESERCIZI',
    tip: 'Inizia sempre dai più difficili'
  }
};

export default function MethodsPage() {
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'methods' | 'schedule' | 'mistakes'>('methods');

  const toggleMethod = (methodId: string) => {
    setExpandedMethod(expandedMethod === methodId ? null : methodId);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Metodi di Studio</h1>
          <p className="text-gray-600">Tecniche comprovate per studiare meglio, non di più</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 mb-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('methods')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'methods'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Tecniche
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Orario Perfetto
            </button>
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'mistakes'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Errori da Evitare
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'methods' && (
          <div className="space-y-4">
            {studyMethods.map((method) => {
              const Icon = method.icon;
              const isExpanded = expandedMethod === method.id;
              
              return (
                <div
                  key={method.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleMethod(method.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-${method.color}-100 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${method.color}-600`} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">{method.title}</h3>
                        <p className="text-sm text-gray-600">{method.shortDesc}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="mt-4">
                        <p className="text-gray-700 mb-4">{method.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">📋</span> Come Fare
                            </h4>
                            <ol className="space-y-2">
                              {method.steps.map((step, index) => (
                                <li key={index} className="flex gap-2 text-sm text-gray-700">
                                  <span className="font-semibold text-blue-600">{index + 1}.</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">💡</span> Consigli Pro
                            </h4>
                            <ul className="space-y-2">
                              {method.tips.map((tip, index) => (
                                <li key={index} className="flex gap-2 text-sm text-gray-700">
                                  <span className="text-green-500">✓</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">
                            🎯 Risultato: {method.benefits}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">⏰ L\'Orario Perfetto per Studiare</h2>
              
              <div className="space-y-4">
                {Object.entries(dailySchedule).map(([key, item]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      key.includes('break') ? 'bg-green-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-900 w-28">{item.time}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.activity}</p>
                      <p className="text-sm text-gray-600">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>🔥 Ricorda:</strong> Questo orario è flessibile! L\'importante è mantenere la costanza e rispettare le pause.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Formula del Successo</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">2h</p>
                  <p className="text-blue-100">al giorno</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">×5</p>
                  <p className="text-blue-100">giorni a settimana</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">=10</p>
                  <p className="text-blue-100">in pagella!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">❌ Errori da NON Fare MAI</h2>
              
              <div className="space-y-4">
                {[
                  { mistake: 'Studiare a letto', reason: 'Il cervello associa il letto al riposo' },
                  { mistake: 'Tenere il cellulare vicino', reason: 'Anche in silenzioso distrae' },
                  { mistake: 'Studiare più di 50 minuti di fila', reason: 'Il cervello si stanca e non memorizza' },
                  { mistake: 'Saltare le pause', reason: 'Riducono l\'efficacia dello studio' },
                  { mistake: 'Studiare solo leggendo', reason: 'Devi essere attivo: scrivi, parla, disegna' },
                  { mistake: 'Rimandare al weekend', reason: 'Si accumula troppo e non ce la fai' },
                  { mistake: 'Studiare con TV/musica con parole', reason: 'Multitasking = studio inefficace' }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-red-50 rounded-lg">
                    <span className="text-2xl">🚫</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.mistake}</p>
                      <p className="text-sm text-gray-600">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">✅ Cosa Fare SEMPRE</h2>
              
              <div className="space-y-4">
                {[
                  { action: 'Stesso orario ogni giorno', benefit: 'Crea abitudine automatica' },
                  { action: 'Posto fisso per studiare', benefit: 'Il cervello si prepara al focus' },
                  { action: 'Cellulare in un\'altra stanza', benefit: 'Zero tentazioni' },
                  { action: 'Timer per ogni sessione', benefit: 'Mantieni alta la concentrazione' },
                  { action: 'Ricompense dopo lo studio', benefit: 'Motivazione garantita' },
                  { action: 'Dormire almeno 8 ore', benefit: 'Consolida la memoria' },
                  { action: 'Bere acqua regolarmente', benefit: 'Il cervello ha bisogno di idratazione' }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-green-50 rounded-lg">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-600">{item.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mt-8 text-white text-center">
          <p className="text-2xl font-bold mb-2">
            "Non devi essere perfetto da subito. Devi solo essere costante."
          </p>
          <p className="text-yellow-100">
            Ogni giorno di studio è un investimento nel tuo futuro. Non stai studiando per i prof o per i tuoi genitori, stai studiando per TE STESSO!
          </p>
        </div>
      </div>
    </AppLayout>
  );
}