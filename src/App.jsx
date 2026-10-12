import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const initialUserData = {
  cigarettesPerDay: 10,
  cigarettesPerPack: 20,
  packPrice: 14,
  quitDate: '',
  startDate: new Date().toISOString().split('T')[0],
  triggers: [],
  isConfigured: false,
};

const defaultResponses = {
  'Fumer sans déclencheur': 'Cigarette permise, fais attention !',
  'Stress': "Prenez une grande inspiration, buvez un verre d'eau.",
  'Habitude': "Remplacez ce geste automatique par un nouveau rituel.",
  "Environnement": "Changez temporairement de lieu ou d'activité.",
};

const triggersOrder = [
  'Fumer sans déclencheur',
  'le stress',
  'une habitude',
  "l'environnement"
];

// Méditation animée (respiration guidée)
const Meditation = () => {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const durations = { inspiration: 4, pause: 7, expiration: 8 };

  useEffect(() => {
    if (!running) {
      setPhase('');
      setTimeLeft(0);
      clearTimeout(timerRef.current);
      return;
    }

    const phases = ['inspiration', 'pause', 'expiration'];
    let phaseIndex = 0;

    const startNextPhase = () => {
      clearTimeout(timerRef.current); // Annule le décompte précédent
      
      const currentPhase = phases[phaseIndex];
      setPhase(currentPhase);
      let duration = durations[currentPhase];
      setTimeLeft(duration);

      const tick = () => {
        duration--;
        setTimeLeft(duration);
        if (duration <= 0) {
          phaseIndex = (phaseIndex + 1) % phases.length;
          startNextPhase();
        } else {
          timerRef.current = setTimeout(tick, 1000);
        }
      };

      if (duration > 0) {
        timerRef.current = setTimeout(tick, 1000);
      } else {
        phaseIndex = (phaseIndex + 1) % phases.length;
        startNextPhase();
      }
    };

    startNextPhase();

    return () => clearTimeout(timerRef.current);
  }, [running]);

  return (
    <div className="meditation-box"> {/* Le div parent est de retour */}
      <h3>🧘 Exercice de respiration</h3>
      <div
        className="circle"
        style={{
          animationName: running ? 'breathCycle' : 'none',
          animationDuration: '19s',
          animationPlayState: running ? 'running' : 'paused',
          animationIterationCount: 'infinite',
        }}
      />
      {!running ? (
        <button onClick={() => setRunning(true)}>Démarrer l'exercice</button>
      ) : (
        <button onClick={() => setRunning(false)}>Arrêter</button>
      )}
      {running && (
        <p>
          {phase === 'inspiration' && 'Inspire...'}
          {phase === 'pause' && 'Retenez...'}
          {phase === 'expiration' && 'Expire...'}
          {' '} {timeLeft}s
        </p>
      )}
    </div>
  );
};

// Missions journalières avec sauvegarde par date
const Missions = () => {
  const missionsList = [
    { id: 'no_smoke_2h', label: "Ne pas fumer 2h" },
    { id: 'drink_water', label: "Boire de l’eau" },
    { id: 'walk_5min', label: "Faire 5 min de marche" },
  ];
  const [missions, setMissions] = useState(() => {
    const saved = localStorage.getItem('missions');
    if (saved) {
      const { date, data } = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      if (date === today) return data;
    }
    return {};
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('missions', JSON.stringify({ date: today, data: missions }));
  }, [missions]);

  const toggleMission = (id) => {
    setMissions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="missions-box">
      <h3>🎯 Missions journalières</h3>
      <ul>
        {missionsList.map(({ id, label }) => (
          <li key={id}>
            <label>
              <input
                type="checkbox"
                checked={!!missions[id]}
                onChange={() => toggleMission(id)}
              />{' '}
              {label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Graphique consommation (fumées vs évitées)
const ConsumptionChart = ({ logs, cigarettesPerDay }) => {
  const grouped = logs.reduce((acc, log) => {
    const day = log.date.split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const data = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    data.push({
      date: dayStr,
      fumées: grouped[dayStr] || 0,
      evitée: Math.max(0, cigarettesPerDay - (grouped[dayStr] || 0)),
    });
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <h3>📊 Consommation quotidienne (14 jours)</h3>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="fumées" stroke="#007bff" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="evitée" stroke="#28a745" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const App = () => {
  // États principaux
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : initialUserData;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [responses, setResponses] = useState(() => {
    const saved = localStorage.getItem('responses');
    return saved ? JSON.parse(saved) : defaultResponses;
  });
  const [darkMode, setDarkMode] = useState(false);
  const [craquagesToday, setCraquagesToday] = useState(0);
  const [shareFeedback, setShareFeedback] = useState('');

  // Sauvegarde userData, logs, responses dans localStorage
  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);
  useEffect(() => {
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem('responses', JSON.stringify(responses));
  }, [responses]);

  // Calcul craquages aujourd'hui (trigger === 'craquage' + date du jour)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const count = logs.filter(log => log.trigger === 'craquage' && log.date.startsWith(today)).length;
    setCraquagesToday(count);
  }, [logs]);

  // Ajouter une fumée avec déclencheur
  const handleSmoke = (trigger) => {
    if (trigger === 'craquage' && craquagesToday >= 3) {
      alert("Tu as déjà craqué 3 fois aujourd'hui. Le plan ne va pas être durci aujourd'hui.");
      return;
    }
    const entry = { date: new Date().toISOString(), trigger };
    setLogs(prev => [...prev, entry]);
  };

  // Calcul intervalle initial moyen (minutes) entre fumées premiers jours
const getInitialInterval = () => {
  const sorted = [...logs].sort((a,b) => new Date(a.date) - new Date(b.date));
  if (sorted.length < 2) return 120; // 2h par défaut

  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i-1].date);
    const currDate = new Date(sorted[i].date);
    intervals.push((currDate - prevDate) / 60000);
  }
  const sum = intervals.reduce((a,b) => a+b, 0);
  return sum / intervals.length;
};

// Intervalle actuel = initial + 5min * jours depuis startDate
const getCurrentInterval = () => {
  if (logs.length < 2) return 120;
  const initial = getInitialInterval();
  const start = new Date(userData.startDate);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000*60*60*24));
  return initial + diffDays * 5;
};

const currentIntervalMin = getCurrentInterval();

// Temps avant prochaine cigarette autorisée (en ms)
const getNextAllowedSmokeTime = () => {
  if (logs.length === 0) return 0;
  const lastSmoke = new Date(logs[logs.length - 1].date);
  const nextAllowed = new Date(lastSmoke.getTime() + currentIntervalMin * 60000);
  const now = new Date();
  const diffMs = nextAllowed - now;
  return diffMs > 0 ? diffMs : 0;
};

const nextAllowedMs = getNextAllowedSmokeTime();

// Format hh:mm pour affichage temps (heures et minutes)
const formatMs = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  // Les secondes sont ignorées dans le retour final pour n'afficher que hh:mm
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

  // Group logs par date (pour stats)
  const groupedLogs = logs.reduce((acc, log) => {
    const date = log.date.split('T')[0];
    if (!acc[date]) acc[date] = { count: 0, triggers: [] };
    acc[date].count++;
    acc[date].triggers.push(log.trigger);
    return acc;
  }, {});

  // Mise à jour configuration utilisateur
  const handleUpdateConfig = (key, value) => {
    setUserData(prev => ({ ...prev, [key]: value }));
  };

  // Reset total (localStorage + reload)
  const resetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Export CSV des stats journalières
  const handleExportCSV = () => {
    const rows = Object.entries(groupedLogs).map(([date, data]) => {
      const avoided = Math.max(0, userData.cigarettesPerDay - data.count);
      const saved = avoided * (userData.packPrice / userData.cigarettesPerPack);
      return [date, data.count, avoided, saved.toFixed(2), data.triggers.join(';')];
    });
    const headers = ['Date', 'Fumées', 'Évitée', 'Économisé ($)', 'Déclencheurs'];
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'statistiques_journalières.csv';
    link.click();
  };

  // Partage simple : copie lien dans presse-papier
  const handleShare = () => {
    if (!navigator.clipboard) {
      alert("La copie dans le presse-papier n'est pas supportée.");
      return;
    }
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShareFeedback('Lien copié dans le presse-papier !');
        setTimeout(() => setShareFeedback(''), 3000);
      })
      .catch(() => alert("Échec de la copie dans le presse-papier."));
  };

  if (!userData.isConfigured) {
    return (
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <div className="config-box centered">
          <h2>🎯 Configuration Initiale</h2>
          <label>
            Nombre moyen de cigarettes par jour
            <input
              type="number"
              defaultValue={userData.cigarettesPerDay}
              onChange={(e) => handleUpdateConfig('cigarettesPerDay', parseInt(e.target.value))}
            />
          </label>
          <label>
            Prix moyen d’un paquet (en $)
            <input
              type="number"
              defaultValue={userData.packPrice}
              onChange={(e) => handleUpdateConfig('packPrice', parseFloat(e.target.value))}
            />
          </label>
          <label>
            Nombre de cigarettes par paquet
            <input
              type="number"
              defaultValue={userData.cigarettesPerPack}
              onChange={(e) => handleUpdateConfig('cigarettesPerPack', parseInt(e.target.value))}
            />
          </label>
          <label>
            Date cible d’arrêt
            <input
              type="date"
              onChange={(e) => handleUpdateConfig('quitDate', e.target.value)}
            />
          </label>
          <div className="actions">
            <button onClick={() => handleUpdateConfig('isConfigured', true)}>✅ Valider</button>
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <div className="container centered">
        <header>
          <h1>🚭 Journal de Sevrage</h1>
          <div className="top-actions">
            <button onClick={resetAll}>🔄 Réinitialiser</button>
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
            </button>
          </div>
        </header>

        <section className="trigger-buttons">
          <h2>Déclencheurs</h2>
          <button
            onClick={() => handleSmoke('craquage')}
            style={{ backgroundColor: '#b3543f', marginBottom: '12px', fontWeight: 'bold' }}
          >
            ❗ J’ai craqué ({craquagesToday})
          </button>
          {triggersOrder.map(trigger => (
            <button
              key={trigger}
              onClick={() => handleSmoke(trigger)}
              disabled={!responses[trigger]}
            >
              🚬 {trigger}
            </button>
          ))}
        </section>

        <section className="dashboard">
          <h2>📈 Tableau de bord</h2>
          <p>Temps avant prochaine cigarette : <strong>{nextAllowedMs > 0 ? formatMs(nextAllowedMs) : 'Autorisé maintenant'}</strong></p>
          <p>Jours avant date d'arrêt : <strong>{userData.quitDate ? Math.max(0, Math.floor((new Date(userData.quitDate) - new Date())/(1000*60*60*24))) : 'Non défini'}</strong></p>
          <p>Cigarettes fumées aujourd'hui : <strong>{groupedLogs[new Date().toISOString().split('T')[0]]?.count || 0}</strong></p>
          <p>Craquages aujourd'hui : <strong>{craquagesToday}</strong></p>
          {/* C'EST ICI QUE LE CHANGEMENT DOIT ETRE FAIT */}
          <p>Intervalle actuel entre cigarettes : <strong>{formatMs(currentIntervalMin * 60000)}</strong></p>
        </section>

        <Meditation />
        <Missions />
        <ConsumptionChart logs={logs} cigarettesPerDay={userData.cigarettesPerDay} />

        <section className="daily-stats">
          <div className="export-header">
            <h2>📊 Statistiques Journalières</h2>
            <button onClick={handleExportCSV}>📁 Exporter CSV</button>
            <button onClick={handleShare} className="share-button">
              📤 Partager cette application
            </button>
            {shareFeedback && <span className="share-feedback">{shareFeedback}</span>}
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Fumées</th>
                <th>Évitée</th>
                <th>Économisé ($)</th>
                <th>Déclencheurs</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedLogs).map(([date, { count, triggers }]) => {
                const avoided = Math.max(0, userData.cigarettesPerDay - count);
                const saved = avoided * (userData.packPrice / userData.cigarettesPerPack);
                return (
                  <tr key={date}>
                    <td>{date}</td>
                    <td>{count}</td>
                    <td>{avoided}</td>
                    <td>{saved.toFixed(2)}</td>
                    <td>{triggers.join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="admin-panel">
          <h2>🛠️ Réponses Personnalisées</h2>
          {Object.entries(responses).map(([trigger, message], index) => (
            <div key={index}>
              <label>
                {trigger}
                <input
                  value={message}
                  onChange={(e) =>
                    setResponses(prev => ({ ...prev, [trigger]: e.target.value }))
                  }
                />
              </label>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default App;
