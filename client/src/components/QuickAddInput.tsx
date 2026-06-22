import { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { importApi, handleApiError } from '../services/api';
import type { Application, Module, Incident, Action } from '../types/index';

const getId = (field: string | { _id: string }): string =>
  typeof field === 'object' && field !== null ? field._id : field;

interface QuickAddInputProps {
  applications: Application[];
  allModules: Module[];
  allIncidents: Incident[];
  allActions: Action[];
  onResolved: (chain: { applicationId: string; moduleId: string; incidentId: string; actionId: string }) => void;
  onCreated: () => void;
}

export default function QuickAddInput({ applications, allModules, allIncidents, allActions, onResolved, onCreated }: QuickAddInputProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const segments = value.split(':');
  const segmentIndex = segments.length - 1;
  const currentTyped = segments[segmentIndex] ?? '';
  const priorSegments = segments.slice(0, segmentIndex).map(s => s.trim());

  const suggestions = useMemo(() => {
    if (segmentIndex > 3 || !currentTyped.trim()) return [];
    const lower = currentTyped.trim().toLowerCase();

    if (segmentIndex === 0) {
      return applications.filter(a => a.name.toLowerCase().startsWith(lower)).map(a => a.name);
    }
    if (segmentIndex === 1) {
      const app = applications.find(a => a.name.toLowerCase() === priorSegments[0]?.toLowerCase());
      const pool = app ? allModules.filter(m => getId(m.applicationId) === app._id) : allModules;
      return [...new Set(pool.filter(m => m.name.toLowerCase().startsWith(lower)).map(m => m.name))];
    }
    if (segmentIndex === 2) {
      const mod = allModules.find(m => m.name.toLowerCase() === priorSegments[1]?.toLowerCase());
      const pool = mod ? allIncidents.filter(i => i.moduleIds.some(mid => getId(mid) === mod._id)) : allIncidents;
      return [...new Set(pool.filter(i => i.name.toLowerCase().startsWith(lower)).map(i => i.name))];
    }
    if (segmentIndex === 3) {
      const incident = allIncidents.find(i => i.name.toLowerCase() === priorSegments[2]?.toLowerCase());
      const pool = incident ? allActions.filter(a => a.incidentIds.some(iid => getId(iid) === incident._id)) : allActions;
      return [...new Set(pool.filter(a => a.name.toLowerCase().startsWith(lower)).map(a => a.name))];
    }
    return [];
  }, [segmentIndex, currentTyped, priorSegments, applications, allModules, allIncidents, allActions]);

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [suggestions]);

  const applySuggestion = (name: string) => {
    const newSegments = [...segments];
    newSegments[segmentIndex] = name;
    setValue(newSegments.join(':') + (segmentIndex < 3 ? ':' : ''));
    setActiveSuggestionIndex(0);
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      const res = await importApi.importCsv(trimmed);
      if (res.data.resolved) {
        onResolved(res.data.resolved);
        await onCreated();
        setValue('');
      } else {
        setLocalError(res.data.errors?.[0] || 'Formato inválido. Use Aplicação:Módulo:Incidente:Ação');
      }
    } catch (err) {
      setLocalError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (segmentIndex < 3 && showSuggestions && suggestions.length > 0) {
        applySuggestion(suggestions[activeSuggestionIndex]);
        return;
      }
      handleSubmit();
      return;
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Sparkles size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
        <input
          type="text"
          value={value}
          disabled={submitting}
          onChange={e => { setValue(e.target.value); setShowSuggestions(true); setLocalError(null); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar rápido: Aplicação:Módulo:Incidente:Ação"
          className="form-input text-xs pl-6"
          style={{ width: '100%' }}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-48 overflow-y-auto"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s}
              onMouseDown={() => applySuggestion(s)}
              className="px-3 py-1.5 text-xs cursor-pointer"
              style={i === activeSuggestionIndex ? { background: 'var(--brand-tint)', color: 'var(--brand)' } : { color: 'var(--ink-900)' }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
      {localError && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>{localError}</p>
      )}
    </div>
  );
}
