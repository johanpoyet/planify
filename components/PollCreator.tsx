"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/themeContext';
import DateTimePicker from '@/components/DateTimePicker';

type Friend = { id: string; friend: { id: string; name?: string; email: string } };
type OptionItem = { id: string; text: string };

export default function PollCreator() {
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();

  const [question, setQuestion] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [options, setOptions] = useState<OptionItem[]>([
    { id: crypto.randomUUID?.() || String(Date.now()) + '-1', text: '' },
    { id: crypto.randomUUID?.() || String(Date.now()) + '-2', text: '' },
  ]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/friends?status=accepted')
      .then(r => r.json())
      .then(data => setFriends(data || []))
      .catch(() => setFriends([]));
  }, []);

  function setOptionAt(id: string, value: string) {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text: value } : o));
  }

  function addOption() {
    setOptions(prev => [...prev, { id: crypto.randomUUID?.() || String(Date.now()), text: '' }]);
  }

  function toggleFriend(id: string) {
    setSelected(s => ({ ...s, [id]: !s[id] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const recipientIds = Object.entries(selected).filter(([k,v]) => v).map(([k]) => k);
    const cleanOptions = options.map(o => o.text.trim()).filter(o => o.length > 0);
    if (!question.trim() || cleanOptions.length < 2 || recipientIds.length === 0) {
      setError('Question, au moins 2 options et au moins un destinataire requis');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/polls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: cleanOptions, recipientIds, deadline: deadline || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Erreur');
      // Redirect to the newly created poll page
      if (body?.poll?.id) {
        router.push(`/polls/${body.poll.id}`);
      }
      // reset
      setQuestion(''); setOptions([
        { id: crypto.randomUUID?.() || String(Date.now()) + '-1', text: '' },
        { id: crypto.randomUUID?.() || String(Date.now()) + '-2', text: '' },
      ]); setSelected({});
    } catch (err: any) {
      setError(err?.message || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label htmlFor="poll-question" className="block text-sm font-medium text-slate-300 mb-2">Question</label>
        <div className="relative">
          <input
            id="poll-question"
            value={question}
            onChange={e=>setQuestion(e.target.value)}
            onFocus={() => setFocusedInput('question')}
            onBlur={() => setFocusedInput(null)}
            className="w-full px-3 sm:px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-2 transition text-sm sm:text-base"
            style={{ borderColor: focusedInput === 'question' ? primaryLightColor : undefined }}
            placeholder="Ex: On se voit quand ?"
          />
        </div>
      </div>

      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-slate-300 mb-2">Date et heure (optionnel)</legend>
          <DateTimePicker value={deadline} onChange={(v) => setDeadline(v)} onFocus={() => setFocusedInput('deadline')} onBlur={() => setFocusedInput(null)} />
        </fieldset>
      </div>

      <div>
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-slate-300 mb-2">Options</legend>
          <div className="space-y-2 mt-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="relative">
              <input
                id={`option-${opt.id}`}
                value={opt.text}
                onChange={e=>setOptionAt(opt.id, e.target.value)}
                className="w-full px-3 sm:px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-2 transition text-sm sm:text-base"
                placeholder={`Option ${i+1}`}
              />
            </div>
          ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl text-slate-300 hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Ajouter une option</span>
          </button>
        </fieldset>
      </div>

      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-slate-300 mb-2">Destinataires (amis)</legend>
          <div className="mt-3 space-y-2">
            {friends.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Aucun ami trouvé
              </div>
            )}
            {friends.map(f => (
              <label
                key={f.friend.id}
                htmlFor={`friend-${f.friend.id}`}
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-2xl cursor-pointer transition-all duration-200 group"
              >
                <input
                  id={`friend-${f.friend.id}`}
                  type="checkbox"
                  checked={!!selected[f.friend.id]}
                  onChange={() => toggleFriend(f.friend.id)}
                  className="w-5 h-5 rounded-lg border-2 border-slate-600 bg-slate-900 checked:bg-current text-current cursor-pointer transition-all flex-shrink-0"
                  style={{ color: selected[f.friend.id] ? primaryLightColor : undefined }}
                />
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    {(f.friend.name || f.friend.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-200 group-hover:text-white transition-colors text-sm sm:text-base truncate">{f.friend.name || f.friend.email}</span>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {error && <div className="text-red-400 text-sm sm:text-base p-3 bg-red-500/10 rounded-2xl border border-red-500/20">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="sm:flex-1 px-6 py-3.5 sm:py-3 bg-slate-800 text-slate-300 rounded-2xl hover:bg-slate-700 transition font-medium shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-2xl font-medium shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base text-white"
          style={{ backgroundColor: loading ? '#64748b' : primaryColor }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = primaryHoverColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = primaryColor;
            }
          }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Création...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Créer sondage
            </>
          )}
        </button>
      </div>
    </form>
  );
}
