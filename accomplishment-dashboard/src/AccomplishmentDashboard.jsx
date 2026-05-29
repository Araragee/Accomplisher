import { useState } from 'react';
import { format, startOfDay, differenceInDays } from 'date-fns';
import { DownloadCloud, FileText, Send, Trash2, Zap, Cloud, CloudOff } from 'lucide-react';

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
  // dateStr is basically 'YYYY-MM'
  const [year, month] = dateStr.split('-');
  const y = parseInt(year);
  const m = parseInt(month) - 1; // 0-indexed for Date

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

  const saveEntries = (newEntries) => {
    setEntries(prev => {
      const next = typeof newEntries === 'function' ? newEntries(prev) : newEntries;
      localStorage.setItem('psa-accomplishments', JSON.stringify(next));
      setLastSaved(getPHTNow());
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

  const handleDeleteEntry = (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    saveEntries(prevEntries => {
      const currentList = prevEntries[activeKey] || [];
      return {
        ...prevEntries,
        [activeKey]: currentList.filter(e => e.id !== id)
      };
    });
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
      alert("Failed to auto-generate: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendPrompt = (promptText) => {
    console.log("SEND PROMPT:", promptText);
    alert(`Action dispatched:\n\n${promptText}`);
  };

  const handleExportDrive = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return alert("No entries to export.");
    const bullets = list.map(e => `- [${e.date}] [${e.category}] ${e.text}`).join('\n');
    sendPrompt(`Save my ${periodDetails.label} accomplishments to Google Drive as a formatted Google Doc titled 'Accomplishments – ${periodDetails.label}'. Here are the entries:\n${bullets}`);
  };

  const handleExportResume = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return alert("No entries to export.");
    const bullets = list.map(e => `- ${e.text}`).join('\n');
    sendPrompt(`Turn my accomplishments for ${periodDetails.label} into polished resume bullet points using strong action verbs and quantified impact where possible:\n${bullets}`);
  };

  const handleExportSummary = () => {
    const list = entries[activeKey] || [];
    if (list.length === 0) return alert("No entries to export.");
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
            <button
              onClick={() => setActiveTab('A')}
              className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${activeTab === 'A' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              11–25
            </button>
            <button
              onClick={() => setActiveTab('B')}
              className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors ${activeTab === 'B' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              26–10
            </button>
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
            <button
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100"
            >
              <Zap className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Auto-generate ↗'}
            </button>
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
                <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md text-sm px-4 py-2 transition-colors">
                  Add
                </button>
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
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 focus-visible:opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Export Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={handleExportDrive} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-md text-sm px-4 py-2.5 transition-colors">
            <DownloadCloud className="w-4 h-4" /> Save to Google Drive ↗
          </button>
          <button onClick={handleExportResume} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-md text-sm px-4 py-2.5 transition-colors">
            <FileText className="w-4 h-4" /> Resume bullets ↗
          </button>
          <button onClick={handleExportSummary} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-md text-sm px-4 py-2.5 transition-colors">
            <Send className="w-4 h-4" /> Period summary ↗
          </button>
        </div>

      </div>
    </div>
  );
}
