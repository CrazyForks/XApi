
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { applyLanguage, LANGUAGE_STORAGE_KEY } from './i18n';
import { LoggedRequest, MockRule, GlobalHeader } from './types';
import { formatUrl, formatTime, getMethodBadgeColor, generateId } from './utils';
import {
  MOCK_RULES_KEY,
  MOCK_GLOBAL_ENABLED_KEY,
  GLOBAL_HEADERS_KEY,
  GLOBAL_HEADERS_ENABLED_KEY,
} from './mockUtils';
import { Logo } from './components/Logo';

type PopupTab = 'capture' | 'mock' | 'header';

const POPUP_ACTIVE_TAB_KEY = 'popupActiveTab';

const Popup = () => {
  const [activeTab, setActiveTab] = useState<PopupTab>('capture');
  const [isRecording, setIsRecording] = useState(false);
  const [mockGlobalEnabled, setMockGlobalEnabled] = useState(false);
  const [logs, setLogs] = useState<LoggedRequest[]>([]);
  const [mockRules, setMockRules] = useState<MockRule[]>([]);
  const [globalHeaders, setGlobalHeaders] = useState<GlobalHeader[]>([]);
  const [globalHeadersEnabled, setGlobalHeadersEnabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageVersion, setLanguageVersion] = useState(0);

  // 获取国际化文本
  const startRecordingText = chrome.i18n.getMessage("startRecording");
  const stopRecordingText = chrome.i18n.getMessage("stopRecording");
  const noRequestsFoundText = chrome.i18n.getMessage("noRequestsFound");
  const recordingText = chrome.i18n.getMessage("recording");
  const filterRequestsText = chrome.i18n.getMessage("filterRequests");
  const clearText = chrome.i18n.getMessage("clear");
  const openDashboardText = chrome.i18n.getMessage("openDashboard");
  const pendingText = chrome.i18n.getMessage("pending");
  const captureTabText = chrome.i18n.getMessage("captureTab") || 'Capture';
  const mockTabText = chrome.i18n.getMessage("mockTab") || 'Mock';
  const headerTabText = chrome.i18n.getMessage("headerTab") || 'Header';

  useEffect(() => {
    // Load initial state
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ['isRecording', 'logs', MOCK_GLOBAL_ENABLED_KEY, MOCK_RULES_KEY, GLOBAL_HEADERS_KEY, GLOBAL_HEADERS_ENABLED_KEY, POPUP_ACTIVE_TAB_KEY, LANGUAGE_STORAGE_KEY],
        (result) => {
          const storedLanguage = result[LANGUAGE_STORAGE_KEY];
          if (storedLanguage === 'en' || storedLanguage === 'zh_CN') {
            applyLanguage(storedLanguage);
            setLanguageVersion(v => v + 1);
          }
          const savedTab = result[POPUP_ACTIVE_TAB_KEY];
          if (savedTab === 'capture' || savedTab === 'mock' || savedTab === 'header') {
            setActiveTab(savedTab);
          }
          setIsRecording(!!result.isRecording);
          setMockGlobalEnabled(result[MOCK_GLOBAL_ENABLED_KEY] === true);
          setLogs(result.logs || []);
          setMockRules(result[MOCK_RULES_KEY] || []);
          setGlobalHeaders(result[GLOBAL_HEADERS_KEY] || []);
          setGlobalHeadersEnabled(result[GLOBAL_HEADERS_ENABLED_KEY] === true);
        });

      const listener = (changes: any) => {
         if (changes.logs) {
           setLogs(changes.logs.newValue || []);
         }
         if (changes.isRecording) {
            setIsRecording(changes.isRecording.newValue);
         }
         if (changes[MOCK_GLOBAL_ENABLED_KEY]) {
            setMockGlobalEnabled(changes[MOCK_GLOBAL_ENABLED_KEY].newValue === true);
         }
         if (changes[MOCK_RULES_KEY]) {
            setMockRules(changes[MOCK_RULES_KEY].newValue || []);
         }
         if (changes[GLOBAL_HEADERS_KEY]) {
            setGlobalHeaders(changes[GLOBAL_HEADERS_KEY].newValue || []);
         }
         if (changes[GLOBAL_HEADERS_ENABLED_KEY]) {
            setGlobalHeadersEnabled(changes[GLOBAL_HEADERS_ENABLED_KEY].newValue === true);
         }
         if (changes[LANGUAGE_STORAGE_KEY]) {
            const nextLanguage = changes[LANGUAGE_STORAGE_KEY].newValue;
            applyLanguage(nextLanguage === 'en' || nextLanguage === 'zh_CN' ? nextLanguage : 'system');
            setLanguageVersion(v => v + 1);
         }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  const toggleRecording = () => {
    const newState = !isRecording;
    setIsRecording(newState);
    chrome.storage.local.set({ isRecording: newState });
  };

  const selectTab = (tab: PopupTab) => {
    setActiveTab(tab);
    chrome.storage.local.set({ [POPUP_ACTIVE_TAB_KEY]: tab });
  };

  const toggleMockGlobal = () => {
    const newState = !mockGlobalEnabled;
    setMockGlobalEnabled(newState);
    chrome.storage.local.set({ [MOCK_GLOBAL_ENABLED_KEY]: newState });
  };

  const clearLogs = () => {
      chrome.storage.local.set({ logs: [] });
  };

  const openDashboard = (logId?: string) => {
    const url = logId ? `panel.html?logId=${logId}` : 'panel.html';
    if (chrome.tabs) {
      chrome.tabs.create({ url });
    }
  };

  const openDashboardMock = (mockId: string) => {
    if (chrome.tabs) {
      chrome.tabs.create({ url: `panel.html?mockId=${mockId}` });
    }
  };

  // --- Mock rule helpers ---
  const persistMockRules = (next: MockRule[]) => {
    setMockRules(next);
    chrome.storage.local.set({ [MOCK_RULES_KEY]: next });
  };
  const toggleMockRule = (id: string) => {
    persistMockRules(mockRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  // --- Global header helpers ---
  const persistHeaders = (next: GlobalHeader[]) => {
    setGlobalHeaders(next);
    chrome.storage.local.set({ [GLOBAL_HEADERS_KEY]: next });
  };
  const toggleHeadersEnabled = () => {
    const newState = !globalHeadersEnabled;
    setGlobalHeadersEnabled(newState);
    chrome.storage.local.set({ [GLOBAL_HEADERS_ENABLED_KEY]: newState });
  };
  const addHeader = () => {
    persistHeaders([...globalHeaders, { id: generateId(), key: '', value: '', enabled: true }]);
  };
  const updateHeader = (id: string, patch: Partial<GlobalHeader>) => {
    persistHeaders(globalHeaders.map(h => h.id === id ? { ...h, ...patch } : h));
  };
  const removeHeader = (id: string) => {
    persistHeaders(globalHeaders.filter(h => h.id !== id));
  };

  // Filter logs to ensure valid data display
  const validLogs = logs.filter(log => {
      if (!log || !log.url || log.url.startsWith('chrome-extension')) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return log.url.toLowerCase().includes(term) || log.method.toLowerCase().includes(term);
  });

  const Toggle = ({ on, onClick, label, title }: { on: boolean; onClick: () => void; label: string; title?: string }) => (
    <button
      onClick={onClick}
      title={title}
      className={`relative inline-flex h-5 w-16 items-center rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-gray-600'}`}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${on ? 'translate-x-12' : 'translate-x-1'}`} />
      <span className={`absolute text-[9px] font-bold uppercase tracking-wide text-white pointer-events-none ${on ? 'left-1.5' : 'right-1.5'}`}>
        {label}
      </span>
    </button>
  );

  const tabButtonClass = (tab: PopupTab) =>
    `flex-1 text-xs font-medium py-2 transition-colors border-b-2 ${
      activeTab === tab
        ? 'border-green-500 text-green-600 bg-white'
        : 'border-transparent text-gray-500 hover:text-gray-700 bg-gray-50'
    }`;

  return (
    <div key={languageVersion} className="w-80 bg-white flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900 text-white flex justify-between items-center shadow-md flex-shrink-0">
         <Logo size={18} textColor="text-white" />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
         <button className={tabButtonClass('capture')} onClick={() => selectTab('capture')}>
            <span className="inline-flex items-center justify-center gap-1.5">
               {captureTabText}
               {isRecording && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" title={recordingText} />}
            </span>
         </button>
         <button className={tabButtonClass('mock')} onClick={() => selectTab('mock')}>
            <span className="inline-flex items-center justify-center gap-1.5">
               {mockTabText}
               {mockGlobalEnabled && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </span>
         </button>
         <button className={tabButtonClass('header')} onClick={() => selectTab('header')}>
            <span className="inline-flex items-center justify-center gap-1.5">
               {headerTabText}
               {globalHeadersEnabled && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </span>
         </button>
      </div>

      {/* ===================== CAPTURE TAB ===================== */}
      {activeTab === 'capture' && (
        <>
          <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
             <span className="text-xs text-gray-600">{isRecording ? recordingText : stopRecordingText}</span>
             <Toggle on={isRecording} onClick={toggleRecording} label={captureTabText} title={isRecording ? stopRecordingText : startRecordingText} />
          </div>
          <div className="px-2 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
             <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={filterRequestsText}
                className="w-full text-xs px-2 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-green-500"
             />
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {validLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 bg-gray-50">
                    <span className="text-2xl">📡</span>
                    <span className="text-xs">{noRequestsFoundText}</span>
                    {isRecording && !searchTerm && <span className="text-[10px] text-green-600 animate-pulse">{recordingText}</span>}
                </div>
            ) : (
                <ul className="flex flex-col gap-px">
                    {validLogs.map(log => {
                        const { origin, path } = formatUrl(log.url);
                        return (
                        <li
                            key={log.id}
                            onClick={() => openDashboard(log.id)}
                            className="px-4 py-2 cursor-pointer transition-all border-l-4 border-transparent hover:border-green-500 bg-white hover:bg-gray-100"
                        >
                            <div className="flex items-center justify-between mb-1">
                                 <span className={`text-[10px] font-bold px-1.5 rounded ${getMethodBadgeColor(log.method)}`}>
                                    {log.method}
                                 </span>
                                 <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {formatTime(log.timestamp)}
                                    </span>
                                    <span className={`text-[10px] ${log.status >= 400 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {log.status > 0 ? log.status : pendingText}
                                    </span>
                                 </div>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-xs font-semibold text-gray-700 truncate" title={origin}>{origin}</span>
                               <span className="text-[10px] text-gray-500 truncate font-mono" title={path}>{path}</span>
                           </div>
                        </li>
                        );
                    })}
                </ul>
            )}
          </div>
          <div className="p-3 bg-white border-t border-gray-200 flex space-x-2 flex-shrink-0">
             <button
                onClick={clearLogs}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2 rounded transition-colors"
             >
                {clearText}
             </button>
             <button
                onClick={() => openDashboard()}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded transition-colors flex items-center justify-center"
             >
                {openDashboardText}
             </button>
          </div>
        </>
      )}

      {/* ===================== MOCK TAB ===================== */}
      {activeTab === 'mock' && (
        <>
          <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
             <span className="text-xs text-gray-600">
                {mockGlobalEnabled
                   ? (chrome.i18n.getMessage("mockGlobalOn") || 'MOCK ON')
                   : (chrome.i18n.getMessage("mockGlobalOff") || 'MOCK OFF')}
             </span>
             <Toggle on={mockGlobalEnabled} onClick={toggleMockGlobal} label={mockTabText} />
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {mockRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 bg-gray-50 px-6 text-center">
                    <span className="text-2xl">🧪</span>
                    <span className="text-xs">{chrome.i18n.getMessage("mockListEmpty") || 'No mock rules yet'}</span>
                    <span className="text-[10px] text-gray-400">{chrome.i18n.getMessage("mockListEmptyHint") || ''}</span>
                </div>
            ) : (
                <ul className="flex flex-col gap-px">
                    {mockRules.map(rule => (
                        <li key={rule.id} className="px-3 py-2 bg-white flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => openDashboardMock(rule.id)}>
                               <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold px-1 rounded ${getMethodBadgeColor(rule.method === 'ANY' ? '' : rule.method)}`}>
                                     {rule.method}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-700 truncate">{rule.name}</span>
                               </div>
                               <span className="text-[10px] text-gray-500 truncate font-mono" title={rule.urlPattern}>{rule.urlPattern || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                               {typeof rule.hitCount === 'number' && rule.hitCount > 0 && (
                                  <span className="text-[9px] text-gray-400" title={chrome.i18n.getMessage("mockHits") || 'Hits'}>
                                     {rule.hitCount}
                                  </span>
                               )}
                               <button
                                  onClick={() => toggleMockRule(rule.id)}
                                  title={rule.enabled ? 'On' : 'Off'}
                                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                               >
                                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                               </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
          </div>
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
             <button
                onClick={() => openDashboard()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded transition-colors"
             >
                {openDashboardText}
             </button>
          </div>
        </>
      )}

      {/* ===================== HEADER TAB ===================== */}
      {activeTab === 'header' && (
        <>
          <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
             <span className="text-xs text-gray-600">
                {globalHeadersEnabled
                   ? (chrome.i18n.getMessage("globalHeaderOn") || 'HEADERS ON')
                   : (chrome.i18n.getMessage("globalHeaderOff") || 'HEADERS OFF')}
             </span>
             <Toggle on={globalHeadersEnabled} onClick={toggleHeadersEnabled} label={headerTabText} />
          </div>
          <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-100 flex-shrink-0">
             <span className="text-[10px] text-yellow-700 leading-tight block">
                {chrome.i18n.getMessage("globalHeaderHint") || 'When enabled, every XHR/Fetch request will carry the enabled headers.'}
             </span>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {globalHeaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 bg-gray-50 px-6 text-center">
                    <span className="text-2xl">🧩</span>
                    <span className="text-xs">{chrome.i18n.getMessage("headerListEmpty") || 'No headers yet'}</span>
                </div>
            ) : (
                <ul className="flex flex-col gap-px">
                    {globalHeaders.map(h => (
                        <li key={h.id} className="px-2 py-2 bg-white flex items-center gap-1.5">
                            <input
                               type="checkbox"
                               checked={h.enabled}
                               onChange={(e) => updateHeader(h.id, { enabled: e.target.checked })}
                               className="h-3.5 w-3.5 accent-green-500 flex-shrink-0"
                            />
                            <input
                               type="text"
                               value={h.key}
                               onChange={(e) => updateHeader(h.id, { key: e.target.value })}
                               placeholder={chrome.i18n.getMessage("headerKeyPlaceholder") || 'Header'}
                               className="w-1/2 text-[11px] px-1.5 py-1 bg-white border border-gray-300 rounded focus:outline-none focus:border-green-500 font-mono"
                            />
                            <input
                               type="text"
                               value={h.value}
                               onChange={(e) => updateHeader(h.id, { value: e.target.value })}
                               placeholder={chrome.i18n.getMessage("headerValuePlaceholder") || 'Value'}
                               className="flex-1 min-w-0 text-[11px] px-1.5 py-1 bg-white border border-gray-300 rounded focus:outline-none focus:border-green-500 font-mono"
                            />
                            <button
                               onClick={() => removeHeader(h.id)}
                               title={chrome.i18n.getMessage("delete") || 'Delete'}
                               className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0 px-1"
                            >
                               ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
          </div>
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
             <button
                onClick={addHeader}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 rounded transition-colors"
             >
                + {chrome.i18n.getMessage("addHeader") || 'Add Header'}
             </button>
          </div>
        </>
      )}
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<Popup />);
}
