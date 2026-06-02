import { useState, useEffect } from 'react';
import { format, startOfDay, differenceInDays } from 'date-fns';
import {
  DownloadCloud,
  FileText,
  Send,
  Trash2,
  Zap,
  Cloud,
  CloudOff,
  Plus,
  RotateCw,
  Brain,
  List,
  LogOut,
  Sparkles,
  Clock,
  Settings,
  Shield,
  Layers,
  Home,
  CheckCircle2,
  X,
  Edit2
} from 'lucide-react';

// Tauri API imports (conditionally executed)
let Database = null;
let invoke = null;
try {
  Database = require('@tauri-apps/plugin-sql').default;
  invoke = require('@tauri-apps/api/core').invoke;
} catch (e) {
  // Fallback if not running inside Tauri Node/Bundled environment
}

const CATEGORIES = ['Dev', 'Data', 'Docs', 'Bugfix', 'Meeting', 'Other'];
const CATEGORY_COLORS = {
  'Dev': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Data': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'Docs': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Bugfix': 'bg-red-500/10 text-red-400 border border-red-500/20',
  'Meeting': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'Other': 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};
const CATEGORY_DOT_COLORS = {
  'Dev': 'bg-emerald-400 emerald-glow',
  'Data': 'bg-blue-400',
  'Docs': 'bg-amber-400',
  'Bugfix': 'bg-red-400',
  'Meeting': 'bg-purple-400',
  'Other': 'bg-slate-400'
};

const COLOR_OPTIONS = [
  { class: 'bg-emerald-400', name: 'Emerald' },
  { class: 'bg-blue-400', name: 'Blue' },
  { class: 'bg-amber-400', name: 'Amber' },
  { class: 'bg-purple-400', name: 'Purple' },
  { class: 'bg-red-400', name: 'Red' },
  { class: 'bg-slate-400', name: 'Slate' }
];

const INITIAL_IPCR_TARGETS = [
  { id: 'IPCR-B-004', name: 'System Development & Vue 3', requiredHours: 40, color: 'bg-emerald-400' },
  { id: 'IPCR-A-102', name: 'Data Processing & R Scripting', requiredHours: 32, color: 'bg-blue-400' },
  { id: 'IPCR-A-101', name: 'Technical Documentation', requiredHours: 16, color: 'bg-amber-400' },
  { id: 'IPCR-ADMIN', name: 'Administrative & Support', requiredHours: 16, color: 'bg-purple-400' }
];

const INITIAL_SUGGESTIONS = [
  { id: 's1', text: 'Run R scripting checks on WGP dataset', targetCode: 'IPCR-A-102' },
  { id: 's2', text: 'Standardize CBMS Portal component tokens', targetCode: 'IPCR-B-004' },
  { id: 's3', text: 'Draft quarterly output summary for verification', targetCode: 'IPCR-A-101' },
  { id: 's4', text: 'Resolve Vue 3 router hydration mismatch in CBMS', targetCode: 'IPCR-B-004' }
];

const getPHTNow = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 8));
};

const getPeriodDetails = (dateStr, tab) => {
  const [year, month] = dateStr.split('-');
  const y = parseInt(year);
  const m = parseInt(month) - 1;

  if (tab === 'A') {
    const start = new Date(y, m, 11);
    const end = new Date(y, m, 25);
    return {
      label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
      start,
      end
    };
  } else {
    const start = new Date(y, m, 26);
    const end = new Date(y, m === 11 ? 0 : m + 1, 10);
    if (m === 11) end.setFullYear(y + 1);
    return {
      label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
      start,
      end
    };
  }
};

const determineCurrentPeriod = (date) => {
  const day = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();

  if (day >= 11 && day <= 25) {
    return {
      key: `${y}-${String(m + 1).padStart(2, '0')}-A`,
      baseMonth: `${y}-${String(m + 1).padStart(2, '0')}`,
      tab: 'A'
    };
  } else if (day >= 26) {
    return {
      key: `${y}-${String(m + 1).padStart(2, '0')}-B`,
      baseMonth: `${y}-${String(m + 1).padStart(2, '0')}`,
      tab: 'B'
    };
  } else {
    const prevMonthDate = new Date(y, m - 1, 1);
    const pm = prevMonthDate.getMonth();
    const py = prevMonthDate.getFullYear();
    return {
      key: `${py}-${String(pm + 1).padStart(2, '0')}-B`,
      baseMonth: `${py}-${String(pm + 1).padStart(2, '0')}`,
      tab: 'B'
    };
  }
};

export default function AccomplishmentDashboard() {
  const phtNow = getPHTNow();
  const initialPeriod = determineCurrentPeriod(phtNow);

  // Tabs / Navigation State
  const [activeModule, setActiveModule] = useState('payroll'); // 'payroll' | 'wfh'
  const [activeBaseMonth] = useState(initialPeriod.baseMonth);
  const [activeTab, setActiveTab] = useState(initialPeriod.tab);
  const activeKey = `${activeBaseMonth}-${activeTab}`;

  // SQLite Connection & Environment State
  const [db, setDb] = useState(null);
  const [isTauri, setIsTauri] = useState(false);

  // Data States
  const [entries, setEntries] = useState({});
  const [wfhEntries, setWfhEntries] = useState({});
  const [ipcrTargets, setIpcrTargets] = useState(INITIAL_IPCR_TARGETS);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);

  // Target Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState('');
  const [targetNameInput, setTargetNameInput] = useState('');
  const [targetHoursInput, setTargetHoursInput] = useState('16');
  const [targetColorInput, setTargetColorInput] = useState('bg-emerald-400');

  // Input states (Regular Payroll)
  const [inputValue, setInputValue] = useState('');
  const [inputCategory, setInputCategory] = useState('Dev');
  const [inputDate, setInputDate] = useState(format(phtNow, 'yyyy-MM-dd'));

  // Input states (WFH Log)
  const [wfhOutput, setWfhOutput] = useState('');
  const [wfhHours, setWfhHours] = useState('8.0');
  const [wfhTarget, setWfhTarget] = useState('IPCR-B-004');
  const [wfhDate, setWfhDate] = useState(format(phtNow, 'yyyy-MM-dd'));

  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // 1. Initialize Database & Check Tauri Env
  useEffect(() => {
    const initDb = async () => {
      if (Database) {
        try {
          const loadedDb = await Database.load('sqlite:accomplishments.db');
          setDb(loadedDb);
          setIsTauri(true);
        } catch (e) {
          console.warn("Tauri Database load failed, falling back to LocalStorage.", e);
        }
      }
    };
    initDb();
  }, []);

  // 2. Fetch Data from SQLite or LocalStorage
  useEffect(() => {
    const fetchData = async () => {
      if (isTauri && db) {
        try {
          // Fetch Payroll Accomplishments
          const resEntries = await db.select(
            "SELECT id, text, category, date, created_at as createdAt FROM payroll_accomplishments WHERE active_key = ? ORDER BY date DESC, created_at DESC",
            [activeKey]
          );
          setEntries(prev => ({ ...prev, [activeKey]: resEntries }));

          // Fetch WFH Logs
          const resWfh = await db.select(
            "SELECT id, output, hours, target_code as targetCode, date, created_at as createdAt FROM wfh_logs WHERE active_key = ? ORDER BY date DESC, created_at DESC",
            [activeKey]
          );
          setWfhEntries(prev => ({ ...prev, [activeKey]: resWfh }));

          // Fetch IPCR Targets
          const resTargets = await db.select(
            "SELECT id, name, required_hours as requiredHours, color FROM ipcr_targets"
          );
          if (resTargets && resTargets.length > 0) {
            setIpcrTargets(resTargets);
          }
        } catch (e) {
          console.error("SQLite Fetch Error:", e);
        }
      } else {
        // LocalStorage Fallback
        const storedPayroll = localStorage.getItem('psa-accomplishments');
        if (storedPayroll) {
          try { setEntries(JSON.parse(storedPayroll)); } catch {}
        }
        const storedWfh = localStorage.getItem('wfh-accomplishments');
        if (storedWfh) {
          try { setWfhEntries(JSON.parse(storedWfh)); } catch {}
        }
        const storedTargets = localStorage.getItem('ipcr-targets');
        if (storedTargets) {
          try { setIpcrTargets(JSON.parse(storedTargets)); } catch {}
        }
      }
    };
    fetchData();
  }, [activeKey, db, isTauri]);

  // 3. Fetch ML suggestions from sidecar
  useEffect(() => {
    fetchMlSuggestions();
  }, [db, isTauri, activeKey]);

  // Add Regular Payroll Entry
  const handleAddEntry = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const newEntry = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      category: inputCategory,
      date: inputDate,
      createdAt: phtNow.getTime()
    };

    if (isTauri && db) {
      try {
        await db.execute(
          "INSERT INTO payroll_accomplishments (id, active_key, text, category, date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [newEntry.id, activeKey, newEntry.text, newEntry.category, newEntry.date, newEntry.createdAt]
        );
        // Trigger suggestions update
        setTimeout(fetchMlSuggestions, 500);
      } catch (err) {
        console.error("SQLite Insert Error:", err);
      }
    }

    // Sync Local State & LocalStorage
    setEntries(prev => {
      const list = prev[activeKey] || [];
      const updated = [newEntry, ...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
      localStorage.setItem('psa-accomplishments', JSON.stringify({ ...prev, [activeKey]: updated }));
      return { ...prev, [activeKey]: updated };
    });

    setInputValue('');
    setLastSaved(getPHTNow());
  };

  // Add WFH Log Entry
  const handleAddWfhEntry = async (e) => {
    if (e) e.preventDefault();
    if (!wfhOutput.trim()) return;

    const newWfh = {
      id: crypto.randomUUID(),
      output: wfhOutput.trim(),
      hours: wfhHours,
      targetCode: wfhTarget,
      date: wfhDate,
      createdAt: phtNow.getTime()
    };

    if (isTauri && db) {
      try {
        await db.execute(
          "INSERT INTO wfh_logs (id, active_key, output, hours, target_code, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [newWfh.id, activeKey, newWfh.output, newWfh.hours, newWfh.targetCode, newWfh.date, newWfh.createdAt]
        );
        // Trigger suggestions update
        setTimeout(fetchMlSuggestions, 500);
      } catch (err) {
        console.error("SQLite Insert Error:", err);
      }
    }

    // Sync Local State & LocalStorage
    setWfhEntries(prev => {
      const list = prev[activeKey] || [];
      const updated = [newWfh, ...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
      localStorage.setItem('wfh-accomplishments', JSON.stringify({ ...prev, [activeKey]: updated }));
      return { ...prev, [activeKey]: updated };
    });

    setWfhOutput('');
    setLastSaved(getPHTNow());
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    if (isTauri && db) {
      try {
        await db.execute("DELETE FROM payroll_accomplishments WHERE id = ?", [id]);
      } catch (err) {
        console.error("SQLite Delete Error:", err);
      }
    }

    setEntries(prev => {
      const updated = (prev[activeKey] || []).filter(e => e.id !== id);
      const next = { ...prev, [activeKey]: updated };
      localStorage.setItem('psa-accomplishments', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteWfhEntry = async (id) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return;

    if (isTauri && db) {
      try {
        await db.execute("DELETE FROM wfh_logs WHERE id = ?", [id]);
      } catch (err) {
        console.error("SQLite Delete Error:", err);
      }
    }

    setWfhEntries(prev => {
      const updated = (prev[activeKey] || []).filter(e => e.id !== id);
      const next = { ...prev, [activeKey]: updated };
      localStorage.setItem('wfh-accomplishments', JSON.stringify(next));
      return next;
    });
  };

  // Add/Edit IPCR Target Configuration
  const handleSaveIPCRTarget = async (e) => {
    e.preventDefault();
    if (!editingTargetId.trim() || !targetNameInput.trim()) return;

    const newTarget = {
      id: editingTargetId.trim(),
      name: targetNameInput.trim(),
      requiredHours: parseInt(targetHoursInput) || 16,
      color: targetColorInput
    };

    if (isTauri && db) {
      try {
        await db.execute(
          "INSERT OR REPLACE INTO ipcr_targets (id, name, required_hours, color) VALUES (?, ?, ?, ?)",
          [newTarget.id, newTarget.name, newTarget.requiredHours, newTarget.color]
        );
      } catch (err) {
        console.error("SQLite Save Target Error:", err);
      }
    }

    setIpcrTargets(prev => {
      const filtered = prev.filter(t => t.id !== newTarget.id);
      const next = [...filtered, newTarget];
      localStorage.setItem('ipcr-targets', JSON.stringify(next));
      return next;
    });

    // Reset Form
    setEditingTargetId('');
    setTargetNameInput('');
    setTargetHoursInput('16');
  };

  const handleDeleteIPCRTarget = async (id) => {
    if (!confirm(`Are you sure you want to delete IPCR Target ${id}?`)) return;

    if (isTauri && db) {
      try {
        await db.execute("DELETE FROM ipcr_targets WHERE id = ?", [id]);
      } catch (err) {
        console.error("SQLite Delete Target Error:", err);
      }
    }

    setIpcrTargets(prev => {
      const next = prev.filter(t => t.id !== id);
      localStorage.setItem('ipcr-targets', JSON.stringify(next));
      return next;
    });
  };

  // Task T(h)inker ML Suggestions Trigger
  const fetchMlSuggestions = async () => {
    setIsThinking(true);
    if (isTauri && invoke) {
      try {
        const rawResult = await invoke('get_ml_suggestions');
        const parsed = JSON.parse(rawResult);
        setSuggestions(parsed);
      } catch (e) {
        console.warn("Failed to execute ML sidecar, running local shuffle fallback.", e);
        setSuggestions(prev => [...prev].sort(() => Math.random() - 0.5));
      } finally {
        setIsThinking(false);
      }
    } else {
      // Local Mock Delay
      setTimeout(() => {
        setSuggestions(prev => [...prev].sort(() => Math.random() - 0.5));
        setIsThinking(false);
      }, 800);
    }
  };

  // Add Suggested Task to Log
  const handleAddSuggestedTask = async (suggestion) => {
    if (activeModule === 'payroll') {
      const categoryMap = {
        'IPCR-B-004': 'Dev',
        'IPCR-A-102': 'Data',
        'IPCR-A-101': 'Docs',
        'IPCR-ADMIN': 'Meeting'
      };
      const newEntry = {
        id: crypto.randomUUID(),
        text: suggestion.text,
        category: categoryMap[suggestion.targetCode] || 'Other',
        date: format(phtNow, 'yyyy-MM-dd'),
        createdAt: phtNow.getTime()
      };

      if (isTauri && db) {
        try {
          await db.execute(
            "INSERT INTO payroll_accomplishments (id, active_key, text, category, date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [newEntry.id, activeKey, newEntry.text, newEntry.category, newEntry.date, newEntry.createdAt]
          );
        } catch (err) {}
      }

      setEntries(prev => {
        const list = prev[activeKey] || [];
        const next = [newEntry, ...list];
        localStorage.setItem('psa-accomplishments', JSON.stringify({ ...prev, [activeKey]: next }));
        return { ...prev, [activeKey]: next };
      });
    } else {
      const newWfh = {
        id: crypto.randomUUID(),
        output: suggestion.text,
        hours: '8.0',
        targetCode: suggestion.targetCode,
        date: format(phtNow, 'yyyy-MM-dd'),
        createdAt: phtNow.getTime()
      };

      if (isTauri && db) {
        try {
          await db.execute(
            "INSERT INTO wfh_logs (id, active_key, output, hours, target_code, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [newWfh.id, activeKey, newWfh.output, newWfh.hours, newWfh.targetCode, newWfh.date, newWfh.createdAt]
          );
        } catch (err) {}
      }

      setWfhEntries(prev => {
        const list = prev[activeKey] || [];
        const next = [newWfh, ...list];
        localStorage.setItem('wfh-accomplishments', JSON.stringify({ ...prev, [activeKey]: next }));
        return { ...prev, [activeKey]: next };
      });
    }
    setLastSaved(getPHTNow());
    // Retrain ML models
    setTimeout(fetchMlSuggestions, 500);
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages: [{ role: "user", content: "Generate accomplishments for the current period." }],
          system: "You are an accomplishment writer for a PSA front-end developer named Dave. Given his work context (CBMS Portal Vue 3 development, R scripting for CBMS/WGP data, VBA Excel macros for CBMS 2026 Listing Record, freelance projects), generate 3–5 concise, professional work accomplishment bullets for the current payroll period. Return only a JSON array of objects: [{text, category, date}]. Use YYYY-MM-DD for date. Allowed categories: Dev, Data, Docs, Bugfix, Meeting, Other. No preamble, just JSON."
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const content = data.content[0].text;
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not parse JSON from response");

      const generated = JSON.parse(match[0]);
      const newEntriesList = generated.map(item => ({
        id: crypto.randomUUID(),
        text: item.text,
        category: CATEGORIES.includes(item.category) ? item.category : 'Other',
        date: item.date || format(phtNow, 'yyyy-MM-dd'),
        createdAt: phtNow.getTime()
      }));

      if (isTauri && db) {
        for (const entry of newEntriesList) {
          try {
            await db.execute(
              "INSERT INTO payroll_accomplishments (id, active_key, text, category, date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              [entry.id, activeKey, entry.text, entry.category, entry.date, entry.createdAt]
            );
          } catch {}
        }
      }

      setEntries(prev => {
        const list = prev[activeKey] || [];
        const next = [...newEntriesList, ...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
        localStorage.setItem('psa-accomplishments', JSON.stringify({ ...prev, [activeKey]: next }));
        return { ...prev, [activeKey]: next };
      });
    } catch (err) {
      console.error(err);
      alert("Failed to auto-generate: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendPrompt = (promptText) => {
    alert(`Action dispatched:\n\n${promptText}`);
  };

  const handleExportDrive = () => {
    const list = activeModule === 'payroll' ? (entries[activeKey] || []) : (wfhEntries[activeKey] || []);
    if (list.length === 0) return alert("No entries to export.");
    const bullets = activeModule === 'payroll'
      ? list.map(e => `- [${e.date}] [${e.category}] ${e.text}`).join('\n')
      : list.map(e => `- [${e.date}] [${e.hours} hrs] [${e.targetCode}] ${e.output}`).join('\n');
    sendPrompt(`Save my ${periodDetails.label} accomplishments to Google Drive as a formatted Google Doc titled 'Accomplishments (${activeModule.toUpperCase()}) – ${periodDetails.label}'. Here are the entries:\n${bullets}`);
  };

  const handleExportResume = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return alert("No payroll entries to export.");
    const bullets = list.map(e => `- ${e.text}`).join('\n');
    sendPrompt(`Turn my accomplishments for ${periodDetails.label} into polished resume bullet points using strong action verbs and quantified impact where possible:\n${bullets}`);
  };

  const handleExportSummary = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return alert("No payroll entries to export.");
    const bullets = list.map(e => `- ${e.text}`).join('\n');
    sendPrompt(`Write a short 2–3 sentence professional summary of my work this period (${periodDetails.label}):\n${bullets}`);
  };

  const periodDetails = getPeriodDetails(activeBaseMonth, activeTab);
  const activeEntries = entries[activeKey] || [];
  const activeWfhEntries = wfhEntries[activeKey] || [];

  // Calculate remaining days
  const endOfPeriod = startOfDay(periodDetails.end);
  const today = startOfDay(phtNow);
  const daysRemaining = Math.max(0, differenceInDays(endOfPeriod, today));

  // Dynamic IPCR target calculations based on WFH hours
  const loggedWfhHours = activeWfhEntries.reduce((acc, curr) => {
    acc[curr.targetCode] = (acc[curr.targetCode] || 0) + parseFloat(curr.hours || 0);
    return acc;
  }, {});

  const totalLoggedHours = Object.values(loggedWfhHours).reduce((sum, h) => sum + h, 0);

  // Category counts (Regular payroll)
  const categoryCounts = activeEntries.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-on-background font-sans overflow-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest h-16 border-b border-outline-variant flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-6">
          <span className="font-headline text-2xl font-black text-primary tracking-tight">Accomplish</span>
          <div className="flex items-center bg-surface-container-low p-1 rounded-full border border-outline-variant">
            <button
              onClick={() => setActiveModule('payroll')}
              className={`px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                activeModule === 'payroll'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Regular Payroll
            </button>
            <button
              onClick={() => setActiveModule('wfh')}
              className={`px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                activeModule === 'wfh'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              WFH Daily Log
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            onClick={fetchMlSuggestions}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-primary"
            title="Siri Machine Learning suggestions sync"
          >
            <RotateCw className={`w-5 h-5 ${isThinking ? 'animate-spin' : ''}`} />
          </div>
          <div className="w-8 h-8 rounded-full border border-primary-container overflow-hidden bg-surface-container-high flex items-center justify-center font-bold text-xs text-primary">
            D
          </div>
        </div>
      </nav>

      {/* Screen Canvas Container */}
      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Left Side Navigation */}
        <aside className="w-64 bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col py-8 px-4 gap-4">
          <div className="mb-4">
            <h2 className="text-on-surface font-headline text-lg font-bold px-4">Workspace</h2>
            <p className="text-on-surface-variant text-xs px-4 opacity-70">Productivity System</p>
          </div>
          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-high text-primary font-bold rounded-lg transition-all cursor-pointer">
              <Home className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-all cursor-pointer">
              <List className="w-5 h-5" />
              <span className="text-sm">History Log</span>
            </div>
          </nav>
          <div className="mt-auto pt-4 border-t border-outline-variant">
            <div className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer text-xs">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 rounded-lg cursor-pointer text-xs">
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          {/* Work Panel */}
          <section className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline text-3xl font-black text-on-surface">
                  {activeModule === 'payroll' ? 'Payroll Accomplishments' : 'WFH Daily Log'}
                </h1>
                <p className="text-on-surface-variant text-sm mt-1">
                  {periodDetails.label} • {daysRemaining} days remaining
                </p>
              </div>
              <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant self-start">
                <button
                  onClick={() => setActiveTab('A')}
                  className={`px-4 py-1 text-xs md:text-sm font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'A' ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  11–25
                </button>
                <button
                  onClick={() => setActiveTab('B')}
                  className={`px-4 py-1 text-xs md:text-sm font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'B' ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  26–10
                </button>
              </div>
            </header>

            {/* Quick Metrics */}
            {activeModule === 'payroll' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-on-surface-variant font-semibold tracking-wider block uppercase">Logged Entries</span>
                    <span className="text-3xl font-bold mt-1 block">{activeEntries.length}</span>
                  </div>
                  <div className="mt-3 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 emerald-glow"></div>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <span className="text-xs text-on-surface-variant font-semibold tracking-wider block uppercase mb-2">Category Spread</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(categoryCounts).length > 0 ? (
                      Object.entries(categoryCounts).map(([cat, count]) => (
                        <span key={cat} className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>
                          {cat}: {count}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-on-surface-variant opacity-60">No categories recorded yet</span>
                    )}
                  </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-on-surface-variant font-semibold tracking-wider block uppercase">Cloud Sync</span>
                    <span className="text-sm font-medium text-primary mt-1 block flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Securely synced
                    </span>
                  </div>
                  {lastSaved ? (
                    <Cloud className="w-8 h-8 text-primary" />
                  ) : (
                    <CloudOff className="w-8 h-8 text-on-surface-variant opacity-40" />
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-2xl">
                  <span className="text-xs text-on-surface-variant font-semibold tracking-wider block uppercase">Logged Hours</span>
                  <span className="text-3xl font-bold mt-1 block text-primary">{totalLoggedHours.toFixed(1)} hrs</span>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <span className="text-xs text-on-surface-variant font-semibold tracking-wider block uppercase">Target Coverage</span>
                  <span className="text-3xl font-bold mt-1 block text-secondary">
                    {Object.keys(loggedWfhHours).length} / {ipcrTargets.length} Targets
                  </span>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-on-surface-variant font-semibold tracking-wider block uppercase">Sync Status</span>
                    <span className="text-xs text-on-surface-variant mt-1 block">
                      {lastSaved ? `Last backup: ${format(lastSaved, 'HH:mm')}` : 'Not backed up'}
                    </span>
                  </div>
                  <Cloud className="w-8 h-8 text-primary" />
                </div>
              </div>
            )}

            {/* Entry Workspace Card */}
            <div className="glass-card rounded-3xl overflow-hidden border border-outline-variant/30 flex flex-col">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low/40 flex items-center justify-between">
                <h2 className="text-base font-bold text-on-surface">
                  {activeModule === 'payroll' ? 'Activity Workspace' : 'WFH Log Workcard'}
                </h2>
                {activeModule === 'payroll' && (
                  <button
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 transition-all px-3 py-1.5 rounded-lg border border-primary/20 active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isGenerating ? 'Generating...' : 'Auto-generate ↗'}
                  </button>
                )}
              </div>

              {/* Form Input Block */}
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest/30">
                {activeModule === 'payroll' ? (
                  <form onSubmit={handleAddEntry} className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="What did you finish or ship today?"
                      className="flex-1 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 placeholder:text-on-surface-variant/40"
                      required
                    />
                    <div className="flex gap-2 self-end w-full md:w-auto">
                      <select
                        value={inputCategory}
                        onChange={(e) => setInputCategory(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input
                        type="date"
                        value={inputDate}
                        onChange={(e) => setInputDate(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                      />
                      <button
                        type="submit"
                        className="text-on-primary bg-primary hover:bg-primary/95 font-bold rounded-lg text-sm px-5 py-2.5 transition-all cursor-pointer emerald-glow active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAddWfhEntry} className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={wfhOutput}
                      onChange={(e) => setWfhOutput(e.target.value)}
                      placeholder="Enter daily remote work output details..."
                      className="flex-1 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 placeholder:text-on-surface-variant/40"
                      required
                    />
                    <div className="flex gap-2 self-end w-full md:w-auto">
                      <select
                        value={wfhTarget}
                        onChange={(e) => setWfhTarget(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                      >
                        {ipcrTargets.map(t => (
                          <option key={t.id} value={t.id}>{t.id}</option>
                        ))}
                      </select>
                      <select
                        value={wfhHours}
                        onChange={(e) => setWfhHours(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 w-24"
                      >
                        <option value="8.0">8.0 hrs</option>
                        <option value="6.0">6.0 hrs</option>
                        <option value="4.0">4.0 hrs</option>
                        <option value="2.0">2.0 hrs</option>
                      </select>
                      <input
                        type="date"
                        value={wfhDate}
                        onChange={(e) => setWfhDate(e.target.value)}
                        className="bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                      />
                      <button
                        type="submit"
                        className="text-on-primary bg-primary hover:bg-primary/95 font-bold rounded-lg text-sm px-5 py-2.5 transition-all cursor-pointer emerald-glow active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Data Table / List */}
              <div className="overflow-x-auto custom-scrollbar">
                {activeModule === 'payroll' ? (
                  <div className="divide-y divide-outline-variant">
                    {activeEntries.length === 0 ? (
                      <div className="p-8 text-center text-on-surface-variant/50 text-sm">
                        No accomplishments logged for this payroll period.
                      </div>
                    ) : (
                      activeEntries.map(entry => (
                        <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-surface-container-low/40 transition-colors group">
                          <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_DOT_COLORS[entry.category]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-on-surface font-medium leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-on-surface-variant opacity-60 font-mono">
                                {format(new Date(entry.date + 'T12:00:00'), 'MMM d, yyyy')}
                              </span>
                              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${CATEGORY_COLORS[entry.category]}`}>
                                {entry.category}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-on-surface-variant/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded hover:bg-surface-container-high"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-surface-container-low/30 border-b border-outline-variant">
                        <th className="px-6 py-3 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Output / Description</th>
                        <th className="px-6 py-3 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-3 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target Reference</th>
                        <th className="px-6 py-3 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {activeWfhEntries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-on-surface-variant/50 text-sm">
                            No daily WFH logs recorded for this period.
                          </td>
                        </tr>
                      ) : (
                        activeWfhEntries.map(wfh => (
                          <tr key={wfh.id} className="hover:bg-surface-container-low/20 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs text-on-surface">{format(new Date(wfh.date + 'T12:00:00'), 'MMM d, yyyy')}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-on-surface">{wfh.output}</p>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-primary">{wfh.hours} hrs</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-primary-container text-on-primary-container border border-primary/20 uppercase">
                                {wfh.targetCode}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteWfhEntry(wfh.id)}
                                className="text-on-surface-variant/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded"
                                title="Delete Daily Log"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Export Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleExportDrive}
                className="flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-container-high font-bold rounded-xl text-sm py-3 transition-all cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4 text-primary" /> Save to Google Drive ↗
              </button>
              <button
                onClick={handleExportResume}
                disabled={activeModule === 'wfh'}
                className="flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-container-high font-bold rounded-xl text-sm py-3 transition-all cursor-pointer disabled:opacity-40"
              >
                <FileText className="w-4 h-4 text-primary" /> Resume Bullets ↗
              </button>
              <button
                onClick={handleExportSummary}
                disabled={activeModule === 'wfh'}
                className="flex items-center justify-center gap-2 bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-container-high font-bold rounded-xl text-sm py-3 transition-all cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4 text-primary" /> Period Summary ↗
              </button>
            </div>
          </section>

          {/* Right Sidebar - Task T(h)inker Widget */}
          <aside className="w-[380px] border-l border-outline-variant bg-surface-container-lowest/80 hidden lg:flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
            {/* Header Widget */}
            <div className="glass-card emerald-glow rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/15 transition-all"></div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-primary" />
                  <h3 className="font-headline text-lg font-black text-on-surface">Task T(h)inker</h3>
                </div>
                <button
                  onClick={() => setIsTargetModalOpen(true)}
                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container"
                  title="Configure IPCR Targets"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                AI suggestions are updated in real-time. We scan your accomplishments to check against IPCR goals.
              </p>
            </div>

            {/* IPCR Target Progress Bars */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black font-headline text-on-surface-variant opacity-70 tracking-widest uppercase">
                IPCR Target Progress
              </h4>
              <div className="space-y-4">
                {ipcrTargets.map(t => {
                  const logged = loggedWfhHours[t.id] || 0;
                  const progress = Math.min(100, (logged / t.requiredHours) * 100);

                  return (
                    <div key={t.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-on-surface text-xs leading-none truncate max-w-[200px]" title={t.name}>
                          {t.name}
                        </span>
                        <span className="text-primary font-mono font-bold">
                          {logged.toFixed(1)} / {t.requiredHours}h ({progress.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                        <div
                          className={`h-full ${t.color || 'bg-primary'} rounded-full transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Suggested Tasks list */}
            <div className="flex-1 space-y-4 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black font-headline text-on-surface-variant opacity-70 tracking-widest uppercase">
                  AI Suggested Tasks
                </h4>
                <button
                  onClick={fetchMlSuggestions}
                  disabled={isThinking}
                  className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isThinking ? 'Analyzing...' : 'REFRESH'}
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {suggestions.map(s => (
                  <div
                    key={s.id}
                    className="glass-card rounded-2xl p-4 border-l-4 border-l-primary flex justify-between items-start gap-4 hover:bg-surface-container-high/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-on-surface text-xs font-semibold leading-snug">{s.text}</p>
                      <span className="text-[9px] font-bold font-mono text-primary mt-1.5 block uppercase opacity-65">
                        Fulfills: {s.targetCode}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddSuggestedTask(s)}
                      className="bg-primary/10 text-primary p-1 rounded-lg hover:bg-primary hover:text-on-primary transition-all active:scale-90 cursor-pointer flex-shrink-0"
                      title="Add suggested task to log"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Hours Mini-analytics card */}
            <div className="bg-surface-container-high rounded-3xl p-5 border border-outline-variant/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black font-headline text-on-surface-variant tracking-wider uppercase">Period Workload</span>
                <span className="text-primary font-mono text-xs font-bold">{totalLoggedHours.toFixed(1)} / 80 hrs</span>
              </div>
              <div className="flex gap-1.5 h-8 items-end">
                <div className="flex-1 bg-primary/10 rounded-t h-[40%]"></div>
                <div className="flex-1 bg-primary/25 rounded-t h-[60%]"></div>
                <div className="flex-1 bg-primary/35 rounded-t h-[50%]"></div>
                <div className="flex-1 bg-primary/50 rounded-t h-[80%]"></div>
                <div className="flex-1 bg-primary/65 rounded-t h-[70%]"></div>
                <div className={`flex-1 bg-primary rounded-t h-[${Math.min(100, Math.max(10, (totalLoggedHours / 80) * 100))}%] emerald-glow`}></div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Integrated Targets Configuration Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl max-w-xl w-full p-6 flex flex-col gap-6 shadow-2xl relative">
            <button
              onClick={() => setIsTargetModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface">Manage IPCR Targets</h3>
              <p className="text-on-surface-variant text-xs mt-1">Configure your performance commitment hours and codes</p>
            </div>

            {/* Target Editing/Adding Form */}
            <form onSubmit={handleSaveIPCRTarget} className="space-y-4 bg-surface-container-low/40 p-4 rounded-2xl border border-outline-variant/35">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant mb-1 uppercase">Target Code</label>
                  <input
                    type="text"
                    value={editingTargetId}
                    onChange={(e) => setEditingTargetId(e.target.value)}
                    placeholder="e.g. IPCR-B-004"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-on-surface-variant mb-1 uppercase">Target Name</label>
                  <input
                    type="text"
                    value={targetNameInput}
                    onChange={(e) => setTargetNameInput(e.target.value)}
                    placeholder="e.g. System Development"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant mb-1 uppercase">Required Hours</label>
                  <input
                    type="number"
                    value={targetHoursInput}
                    onChange={(e) => setTargetHoursInput(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant mb-1 uppercase">Color Theme</label>
                  <select
                    value={targetColorInput}
                    onChange={(e) => setTargetColorInput(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs"
                  >
                    {COLOR_OPTIONS.map(opt => (
                      <option key={opt.class} value={opt.class}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2 rounded-lg text-xs font-bold hover:opacity-95 transition-all emerald-glow"
              >
                Save Commitment Target
              </button>
            </form>

            {/* List of active targets */}
            <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-on-surface-variant">
                    <th className="pb-2 font-bold uppercase text-[10px]">Code</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Name</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Hours</th>
                    <th className="pb-2 font-bold uppercase text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {ipcrTargets.map(target => (
                    <tr key={target.id} className="hover:bg-surface-container-low/20">
                      <td className="py-2.5 font-mono font-bold text-primary">{target.id}</td>
                      <td className="py-2.5 truncate max-w-[200px]" title={target.name}>{target.name}</td>
                      <td className="py-2.5 font-semibold">{target.requiredHours} hrs</td>
                      <td className="py-2.5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTargetId(target.id);
                            setTargetNameInput(target.name);
                            setTargetHoursInput(target.requiredHours.toString());
                            setTargetColorInput(target.color || 'bg-emerald-400');
                          }}
                          className="p-1 hover:text-primary rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIPCRTarget(target.id)}
                          className="p-1 hover:text-red-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Glowing Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]"></div>
      </div>
    </div>
  );
}
