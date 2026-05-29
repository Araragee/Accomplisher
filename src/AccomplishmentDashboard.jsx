import { useState } from 'react';
import { format, startOfDay, differenceInDays } from 'date-fns';
import { DownloadCloud, FileText, Send, Trash2, Zap, Cloud, CloudOff } from 'lucide-react';

import Button from './components/Button';
import Modal from './components/Modal';

const CATEGORIES = ['Dev', 'Data', 'Docs', 'Bugfix', 'Meeting', 'Other'];
const CATEGORY_COLORS = {
  'Dev': 'bg-blue-500 text-blue-50',
  'Data': 'bg-teal-500 text-teal-50',
  'Docs': 'bg-amber-500 text-amber-50',
  'Bugfix': 'bg-red-500 text-red-50',
  'Meeting': 'bg-purple-500 text-purple-50',
  'Other': 'bg-gray-500 text-gray-50'
};
const CATEGORY_DOT_COLORS = {
  'Dev': 'bg-blue-500',
  'Data': 'bg-teal-500',
  'Docs': 'bg-amber-500',
  'Bugfix': 'bg-red-500',
  'Meeting': 'bg-purple-500',
  'Other': 'bg-gray-500'
};

const getPHTNow = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 8));
};

const getPeriodDetails = (dateStr, tab) => {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}$/.test(dateStr)) {
    console.warn(`Invalid dateStr provided to getPeriodDetails: ${dateStr}. Using current date as fallback.`);
    const d = new Date();
    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // dateStr is basically 'YYYY-MM'
  const [year, month] = dateStr.split('-');
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1; // 0-indexed for Date

  if (isNaN(y) || isNaN(m)) {
    console.warn(`Could not parse year/month from dateStr: ${dateStr}.`);
    return { label: 'Invalid Period', start: new Date(), end: new Date() };
  }

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
  if (!(date instanceof Date) || isNaN(date)) {
    console.warn('Invalid date passed to determineCurrentPeriod, falling back to current date.');
    date = new Date();
  }

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
    // 1st to 10th
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

  const [activeBaseMonth] = useState(initialPeriod.baseMonth);
  const [activeTab, setActiveTab] = useState(initialPeriod.tab);
  const activeKey = `${activeBaseMonth}-${activeTab}`;

  const [entries, setEntries] = useState(() => {
    const stored = localStorage.getItem('psa-accomplishments');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        console.error("Failed to parse stored entries");
        return {};
      }
    }
    return {};
  });
  const [inputValue, setInputValue] = useState('');
  const [inputCategory, setInputCategory] = useState('Dev');
  const [inputDate, setInputDate] = useState(format(phtNow, 'yyyy-MM-dd'));

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Modal states
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ isOpen: true, title, message });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  const saveEntries = (newEntries) => {
    setEntries(prev => {
      const next = typeof newEntries === 'function' ? newEntries(prev) : newEntries;
      try {
        localStorage.setItem('psa-accomplishments', JSON.stringify(next));
        setLastSaved(getPHTNow());
      } catch (err) {
        console.error("Failed to save entries to localStorage:", err);
        showAlert("Save Error", "Could not save your entries. This might be due to private browsing mode or storage limits.");
      }
      return next;
    });
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newEntry = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      category: inputCategory,
      date: inputDate,
      createdAt: phtNow.getTime()
    };

    saveEntries(prevEntries => {
      const currentList = prevEntries[activeKey] || [];
      const updatedList = [newEntry, ...currentList].sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt - a.createdAt;
      });
      return { ...prevEntries, [activeKey]: updatedList };
    });

    setInputValue('');
  };

  const requestDeleteEntry = (id) => {
    setEntryToDelete(id);
  };

  const confirmDeleteEntry = () => {
    if (!entryToDelete) return;
    saveEntries(prevEntries => {
      const currentList = prevEntries[activeKey] || [];
      return {
        ...prevEntries,
        [activeKey]: currentList.filter(e => e.id !== entryToDelete)
      };
    });
    setEntryToDelete(null);
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

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Extract JSON array
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

      saveEntries(prevEntries => {
        const currentList = prevEntries[activeKey] || [];
        const updatedList = [...newEntriesList, ...currentList].sort((a, b) => {
          if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
          }
          return b.createdAt - a.createdAt;
        });
        return { ...prevEntries, [activeKey]: updatedList };
      });

    } catch (err) {
      console.error(err);
      showAlert("Generation Failed", "Failed to auto-generate: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendPrompt = (promptText) => {
    console.log("SEND PROMPT:", promptText);
    showAlert("Action Dispatched", promptText);
  };

  const handleExportDrive = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return showAlert("Notice", "No entries to export.");
    const bullets = list.map(e => `- [${e.date}] [${e.category}] ${e.text}`).join('\n');
    sendPrompt(`Save my ${periodDetails.label} accomplishments to Google Drive as a formatted Google Doc titled 'Accomplishments – ${periodDetails.label}'. Here are the entries:\n${bullets}`);
  };

  const handleExportResume = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return showAlert("Notice", "No entries to export.");
    const bullets = list.map(e => `- ${e.text}`).join('\n');
    sendPrompt(`Turn my accomplishments for ${periodDetails.label} into polished resume bullet points using strong action verbs and quantified impact where possible:\n${bullets}`);
  };

  const handleExportSummary = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return showAlert("Notice", "No entries to export.");
    const bullets = list.map(e => `- ${e.text}`).join('\n');
    sendPrompt(`Write a short 2–3 sentence professional summary of my work this period (${periodDetails.label}):\n${bullets}`);
  };

  const periodDetails = getPeriodDetails(activeBaseMonth, activeTab);
  const activeEntries = entries[activeKey] || [];

  // Calculate remaining days
  const endOfPeriod = startOfDay(periodDetails.end);
  const today = startOfDay(phtNow);
  const daysRemaining = Math.max(0, differenceInDays(endOfPeriod, today));

  // Stats
  const categoryCounts = activeEntries.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-800">Accomplishments</h1>
            <p className="text-gray-500 text-sm mt-1">{periodDetails.label} • {daysRemaining} days remaining</p>
          </div>
          <div className="flex bg-gray-200 p-1 rounded-md">
            <Button
              variant={activeTab === 'A' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('A')}
              className={activeTab === 'A' ? 'shadow-sm' : ''}
            >
              11–25
            </Button>
            <Button
              variant={activeTab === 'B' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('B')}
              className={activeTab === 'B' ? 'shadow-sm' : ''}
            >
              26–10
            </Button>
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-500 font-medium">Logged Entries</div>
            <div className="text-3xl font-semibold mt-1">{activeEntries.length}</div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-500 font-medium mb-2">Categories</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(categoryCounts).length > 0 ? (
                Object.entries(categoryCounts).map(([cat, count]) => (
                  <span key={cat} className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>
                    {cat}: {count}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No categories yet</span>
              )}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Drive Sync</span>
              {lastSaved ? <Cloud className="w-5 h-5 text-blue-500" /> : <CloudOff className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {lastSaved ? `Last saved: ${format(lastSaved, 'HH:mm')}` : 'Not synced'}
            </div>
          </div>
        </div>

        {/* Main Entry Section */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Current Period Entries</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="text-blue-600 bg-blue-50 border-blue-100 hover:text-blue-700 hover:bg-blue-100 flex gap-1.5"
            >
              <Zap className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Auto-generate ↗'}
            </Button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What did you finish or ship today?"
                className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
                required
              />
              <div className="flex gap-3">
                <select
                  value={inputCategory}
                  onChange={(e) => setInputCategory(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
                />
                <Button type="submit" variant="primary">
                  Add
                </Button>
              </div>
            </form>
          </div>

          <div className="divide-y divide-gray-100">
            {activeEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No entries logged for this period.
              </div>
            ) : (
              activeEntries.map(entry => (
                <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors group">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_DOT_COLORS[entry.category]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{entry.text}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-500">{format(new Date(entry.date + 'T12:00:00'), 'MMM d, yyyy')}</span>
                      <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-sm ${CATEGORY_COLORS[entry.category]}`}>
                        {entry.category}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="dangerGhost"
                    size="icon"
                    onClick={() => requestDeleteEntry(entry.id)}
                    className="opacity-0 focus-visible:opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Export Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" onClick={handleExportDrive} className="flex justify-center gap-2">
            <DownloadCloud className="w-4 h-4" /> Save to Google Drive ↗
          </Button>
          <Button variant="outline" onClick={handleExportResume} className="flex justify-center gap-2">
            <FileText className="w-4 h-4" /> Resume bullets ↗
          </Button>
          <Button variant="outline" onClick={handleExportSummary} className="flex justify-center gap-2">
            <Send className="w-4 h-4" /> Period summary ↗
          </Button>
        </div>

      </div>

      {/* Modals */}
      <Modal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        title="Delete Entry"
        footer={
          <>
            <Button variant="outline" onClick={() => setEntryToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteEntry}>Delete</Button>
          </>
        }
      >
        <p className="text-gray-600">Are you sure you want to delete this entry? This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        footer={
          <Button variant="primary" onClick={closeAlert}>OK</Button>
        }
      >
        <div className="text-gray-600 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200">
          {alertConfig.message}
        </div>
      </Modal>
    </div>
  );
}
