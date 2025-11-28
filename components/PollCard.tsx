"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from '@/lib/themeContext';
import { useSession } from 'next-auth/react';

export default function PollCard({ pollId }: { pollId: string }) {
  const { data: session } = useSession();
  const { primaryLightColor } = useTheme();
  const [pollData, setPollData] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    fetch(`/api/polls/${pollId}`)
      .then(r => r.json())
      .then(data => {
        setPollData(data);
        setLoadingData(false);

        // Vérifier si l'utilisateur a déjà voté
        if (data.votes && session?.user?.email) {
          fetch('/api/user')
            .then(r => r.json())
            .then(userData => {
              const userVote = data.votes.find((v: any) => v.userId === userData.id);
              if (userVote) {
                setHasVoted(true);
                setCurrentVote(userVote.optionId);
                setSelected(userVote.optionId);
                setIsEditing(false); // L'utilisateur a déjà voté, mode lecture
              } else {
                setIsEditing(true); // Première visite, mode édition
              }
            });
        }
      })
      .catch(() => {
        setPollData(null);
        setLoadingData(false);
      });
  }, [pollId, session]);

  async function vote() {
    if (!selected) return setMessage({ text: 'Choisissez une option', type: 'error' });
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/polls/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pollId, optionId: selected }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Erreur');

      setMessage({ text: hasVoted ? 'Vote modifié avec succès !' : 'Vote enregistré avec succès !', type: 'success' });
      setHasVoted(true);
      setCurrentVote(selected);
      setIsEditing(false); // Retour en mode lecture après vote

      // refresh
      const refreshed = await fetch(`/api/polls/${pollId}`).then(r=>r.json());
      setPollData(refreshed);
    } catch (e: any) {
      setMessage({ text: e?.message || 'Erreur', type: 'error' });
    } finally { setLoading(false); }
  }

  function enableEditing() {
    setIsEditing(true);
    setMessage(null);
  }

  function cancelEditing() {
    setSelected(currentVote);
    setIsEditing(false);
    setMessage(null);
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-transparent" style={{ borderTopColor: primaryLightColor }}></div>
      </div>
    );
  }

  if (!pollData || !pollData.poll) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400">Sondage introuvable</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{pollData.poll.question}</h3>
        {pollData.poll.deadline && (
          <p className="text-sm text-slate-400">
            Date limite : {new Date(pollData.poll.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {pollData.options?.map((opt: any) => (
          <label
            key={opt.id}
            htmlFor={`option-${opt.id}`}
            className={`flex items-center gap-3 p-4 border rounded-2xl transition-all duration-200 ${
              isEditing
                ? 'bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/50 cursor-pointer group'
                : 'bg-slate-800/20 border-slate-700/30 cursor-not-allowed opacity-75'
            }`}
          >
            <input
              id={`option-${opt.id}`}
              type="radio"
              name="poll-option"
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => isEditing && setSelected(opt.id)}
              disabled={!isEditing}
              className="w-5 h-5 rounded-full border-2 border-slate-600 bg-slate-900 checked:bg-current text-current transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: selected === opt.id ? primaryLightColor : undefined, cursor: isEditing ? 'pointer' : 'not-allowed' }}
            />
            <span className={`flex-1 transition-colors ${isEditing ? 'text-slate-200 group-hover:text-white' : 'text-slate-400'}`}>
              {opt.text}
            </span>
          </label>
        ))}
      </div>

      {message && (
        <div className={`p-4 border rounded-2xl flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-900/30 border-emerald-700/50'
            : 'bg-red-900/30 border-red-700/50'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {!isEditing && hasVoted ? (
          // Mode lecture : bouton pour passer en mode édition
          <button
            onClick={enableEditing}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-2xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryLightColor }}
          >
            Modifier mon vote
          </button>
        ) : (
          // Mode édition : boutons pour valider ou annuler
          <>
            <button
              onClick={vote}
              disabled={loading || !selected}
              className="flex-1 px-6 py-3 rounded-2xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryLightColor }}
            >
              {loading ? 'Envoi en cours...' : hasVoted ? 'Valider la modification' : 'Voter'}
            </button>
            {hasVoted && (
              <button
                onClick={cancelEditing}
                disabled={loading}
                className="px-6 py-3 rounded-2xl font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
