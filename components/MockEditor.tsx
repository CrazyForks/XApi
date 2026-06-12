import React, { useMemo, useState } from 'react';
import { HttpMethod, JsonPatch, LoggedRequest, MockMode, MockRule, RuleMatchMode } from '../types';
import { collectJsonPaths, createJsonPatch } from '../mockUtils';

interface MockEditorProps {
  rule: MockRule;
  history: LoggedRequest[];
  onRuleChange: (rule: MockRule) => void;
}

const METHODS: (HttpMethod | 'ANY')[] = ['ANY', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const MATCH_MODES: { value: RuleMatchMode; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'exact', label: 'exact' },
  { value: 'regex', label: 'regex' }
];

const t = (key: string, fallback: string) => {
  try {
    const m = chrome.i18n.getMessage(key);
    return m || fallback;
  } catch {
    return fallback;
  }
};

const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{children}</div>
    {right}
  </div>
);

const tryFormatJson = (s: string): { ok: boolean; pretty?: string; error?: string } => {
  if (!s.trim()) return { ok: true, pretty: s };
  try {
    return { ok: true, pretty: JSON.stringify(JSON.parse(s), null, 2) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid JSON' };
  }
};

export const MockEditor: React.FC<MockEditorProps> = ({ rule, history, onRuleChange }) => {
  const update = (partial: Partial<MockRule>) => onRuleChange({ ...rule, ...partial });

  // Find sample real responses for this URL pattern (best-effort).
  const sampleData = useMemo(() => {
    if (!rule.urlPattern) return null;
    const matched = history.find(h => {
      try {
        if (rule.matchMode === 'exact') return h.url === rule.urlPattern;
        if (rule.matchMode === 'contains') return h.url.includes(rule.urlPattern);
        if (rule.matchMode === 'regex') return new RegExp(rule.urlPattern).test(h.url);
      } catch { return false; }
      return false;
    });
    return matched || null;
  }, [history, rule.urlPattern, rule.matchMode]);

  const jsonHint = useMemo(() => tryFormatJson(rule.replaceBody || ''), [rule.replaceBody]);

  // Get JSON path autocomplete options from a sample request body if available.
  // (We don't have response bodies stored in history, but we render hints from body if it's JSON.)
  const pathOptions = useMemo(() => {
    if (!sampleData) return [];
    let body: any = sampleData.requestBody;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    if (!body || typeof body !== 'object') return [];
    return collectJsonPaths(body);
  }, [sampleData]);

  const updatePatches = (next: JsonPatch[]) => update({ jsonPatches: next });
  const addPatch = () => updatePatches([...(rule.jsonPatches || []), createJsonPatch()]);
  const updatePatch = (id: string, partial: Partial<JsonPatch>) =>
    updatePatches((rule.jsonPatches || []).map(p => p.id === id ? { ...p, ...partial } : p));
  const removePatch = (id: string) =>
    updatePatches((rule.jsonPatches || []).filter(p => p.id !== id));

  const ruleEnabledLabel = t('mockRuleEnabled', 'Enabled');
  const namePh = t('mockRuleNamePlaceholder', 'Friendly rule name');
  const matchTitle = t('mockMatchSection', 'Match');
  const modifyTitle = t('mockModifySection', 'Modify');
  const urlPatternLabel = t('mockUrlPattern', 'URL Pattern');
  const urlPatternPh = t('mockUrlPatternPlaceholder', 'e.g. /api/user/info');
  const matchModeLabel = t('mockMatchMode', 'Match');
  const methodLabel = t('mockMethod', 'Method');
  const modeReplace = t('mockModeReplace', 'Replace whole response');
  const modePatch = t('mockModePatchJson', 'Modify JSON fields');
  const statusLabel = t('mockStatus', 'Status');
  const ctLabel = t('mockContentType', 'Content-Type');
  const bodyLabel = t('mockReplaceBody', 'Response Body');
  const formatBtn = t('formatJSON', 'Format JSON');
  const fillFromHistoryBtn = t('mockFillFromHistory', 'Fill from history');
  const pathLabel = t('mockJsonPathHeader', 'Field path');
  const newValueLabel = t('mockJsonValueHeader', 'New value');
  const addFieldLabel = t('mockAddField', 'Add field');
  const rawHint = t('mockRawValueHint', 'Use prefix "::raw::" to inject raw JSON (number/bool/null/object).');
  const noRequestSampleHint = t('mockNoSample', 'No matching capture in history yet — type the path manually.');
  const disabledHint = t('mockDisabledHint', 'This rule is disabled and will not affect any request.');
  const hitsLabel = t('mockHits', 'Hits');

  const fillFromHistory = () => {
    if (!sampleData) return;
    let body: any = sampleData.requestBody;
    if (typeof body === 'object' && body) body = JSON.stringify(body, null, 2);
    update({ replaceBody: typeof body === 'string' ? body : (rule.replaceBody || '') });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto p-5 space-y-6">
        {/* Header row: enabled + name */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={e => update({ enabled: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
            />
            <span className="text-xs font-semibold text-gray-700">{ruleEnabledLabel}</span>
          </label>
          <input
            type="text"
            value={rule.name}
            placeholder={namePh}
            onChange={e => update({ name: e.target.value })}
            className="flex-1 text-sm font-semibold border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded px-2 py-1.5 focus:outline-none transition-colors"
          />
          <span className="text-[11px] text-gray-500">
            {hitsLabel}: <span className="font-bold text-gray-700">{rule.hitCount || 0}</span>
          </span>
        </div>

        {!rule.enabled && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            {disabledHint}
          </div>
        )}

        {/* MATCH */}
        <section>
          <SectionTitle>{matchTitle}</SectionTitle>
          <div className="space-y-2">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">{urlPatternLabel}</div>
              <input
                type="text"
                value={rule.urlPattern}
                placeholder={urlPatternPh}
                onChange={e => update({ urlPattern: e.target.value })}
                className="w-full text-xs font-mono border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded px-2 py-1.5 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex space-x-3">
              <div className="flex-1">
                <div className="text-[11px] text-gray-500 mb-1">{matchModeLabel}</div>
                <div className="flex bg-gray-100 rounded p-0.5">
                  {MATCH_MODES.map(m => (
                    <button
                      key={m.value}
                      onClick={() => update({ matchMode: m.value })}
                      className={`flex-1 text-[11px] py-1 rounded transition-colors ${rule.matchMode === m.value ? 'bg-white text-green-700 font-semibold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-40">
                <div className="text-[11px] text-gray-500 mb-1">{methodLabel}</div>
                <select
                  value={rule.method}
                  onChange={e => update({ method: e.target.value as any })}
                  className="w-full text-xs border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded px-2 py-1.5 focus:outline-none bg-white transition-colors"
                >
                  {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* MODIFY */}
        <section>
          <SectionTitle>{modifyTitle}</SectionTitle>
          <div className="flex space-x-2 mb-3">
            <ModeRadio active={rule.mode === 'replace'} onClick={() => update({ mode: 'replace' })}>
              {modeReplace}
            </ModeRadio>
            <ModeRadio active={rule.mode === 'patch-json'} onClick={() => update({ mode: 'patch-json' })}>
              {modePatch}
            </ModeRadio>
          </div>

          {rule.mode === 'replace' && (
            <div className="space-y-2">
              <div className="flex space-x-3">
                <div className="w-32">
                  <div className="text-[11px] text-gray-500 mb-1">{statusLabel}</div>
                  <input
                    type="number"
                    value={rule.replaceStatus ?? 200}
                    onChange={e => update({ replaceStatus: parseInt(e.target.value || '200', 10) })}
                    className="w-full text-xs border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded px-2 py-1.5 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-gray-500 mb-1">{ctLabel}</div>
                  <input
                    type="text"
                    value={rule.replaceContentType ?? 'application/json'}
                    onChange={e => update({ replaceContentType: e.target.value })}
                    className="w-full text-xs border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded px-2 py-1.5 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] text-gray-500">{bodyLabel}</div>
                  <div className="space-x-2">
                    {sampleData && (
                      <button
                        onClick={fillFromHistory}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        {fillFromHistoryBtn}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const r = tryFormatJson(rule.replaceBody || '');
                        if (r.ok && r.pretty != null) update({ replaceBody: r.pretty });
                      }}
                      className="text-[10px] text-gray-500 hover:text-green-600 font-semibold"
                    >
                      {formatBtn}
                    </button>
                  </div>
                </div>
                <textarea
                  value={rule.replaceBody ?? ''}
                  onChange={e => update({ replaceBody: e.target.value })}
                  rows={12}
                  className={`w-full font-mono text-xs border rounded p-2 focus:outline-none transition-colors ${jsonHint.ok ? 'border-gray-200 focus:border-green-500' : 'border-red-300 focus:border-red-500'}`}
                  placeholder={'{ "code": 0, "data": {} }'}
                />
                {!jsonHint.ok && (rule.replaceContentType || '').includes('json') && (
                  <div className="text-[10px] text-red-600 mt-1">⚠ {jsonHint.error}</div>
                )}
              </div>
            </div>
          )}

          {rule.mode === 'patch-json' && (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-500">{rawHint}</div>
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="flex bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1.5 border-b border-gray-200">
                  <div className="w-7"></div>
                  <div className="flex-1 pr-2">{pathLabel}</div>
                  <div className="flex-1 pr-2">{newValueLabel}</div>
                  <div className="w-7"></div>
                </div>
                {(rule.jsonPatches || []).map(p => (
                  <div key={p.id} className="flex items-center px-2 py-1 border-b border-gray-100 last:border-b-0 group">
                    <div className="w-7 flex justify-center">
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={e => updatePatch(p.id, { enabled: e.target.checked })}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex-1 pr-2 relative">
                      <input
                        type="text"
                        value={p.path}
                        onChange={e => updatePatch(p.id, { path: e.target.value })}
                        list={`paths-${p.id}`}
                        placeholder="data.user.name"
                        className="w-full text-xs font-mono border border-transparent hover:border-gray-200 focus:border-green-500 focus:bg-white rounded px-2 py-1 focus:outline-none transition-all"
                      />
                      {pathOptions.length > 0 && (
                        <datalist id={`paths-${p.id}`}>
                          {pathOptions.map(opt => <option key={opt} value={opt} />)}
                        </datalist>
                      )}
                    </div>
                    <div className="flex-1 pr-2">
                      <input
                        type="text"
                        value={p.value}
                        onChange={e => updatePatch(p.id, { value: e.target.value })}
                        placeholder="admin   (or ::raw::true)"
                        className="w-full text-xs font-mono border border-transparent hover:border-gray-200 focus:border-green-500 focus:bg-white rounded px-2 py-1 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="w-7 flex justify-center">
                      <button
                        onClick={() => removePatch(p.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {(rule.jsonPatches || []).length === 0 && (
                  <div className="text-[11px] text-gray-400 italic px-3 py-3 text-center">
                    {t('mockNoPatches', 'No fields configured. Click "Add field" below to start.')}
                  </div>
                )}
              </div>
              <button
                onClick={addPatch}
                className="text-xs text-gray-600 hover:text-green-600 font-semibold flex items-center"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {addFieldLabel}
              </button>
              {pathOptions.length === 0 && rule.urlPattern && (
                <div className="text-[10px] text-gray-400 italic">{noRequestSampleHint}</div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ModeRadio: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 py-2 text-xs rounded border transition-all ${active ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
  >
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
    {children}
  </button>
);
