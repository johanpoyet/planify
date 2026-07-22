"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";
import DateTimePicker from "@/components/DateTimePicker";

type Friend = { id: string; friend: { id: string; name?: string; email: string } };
type OptionItem = { id: string; text: string };

const COLORS = ["#7C5CFF","#FF7A45","#4FD18B","#FF6BD6","#4F8BFF","#FFB454","#5CE0E0","#FF5C5C"];

function getColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + (seed.codePointAt(i) ?? 0)) >>> 0;
  return COLORS[h % COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + (parts.at(-1) ?? parts[0])[0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function newId(): string {
  return crypto.randomUUID?.() || String(Date.now() + Math.random());
}

const LABEL_STYLE: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.07em",
  color: "var(--pf-text-muted)", marginBottom: 10,
};

const INPUT_BASE: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  background: "var(--pf-surface)", border: "1px solid var(--pf-border)",
  color: "var(--pf-text)", fontSize: 14, outline: "none",
  transition: "border-color 0.15s",
};

export default function PollCreator() {
  const router = useRouter();
  const { primaryColor } = useTheme();

  const [question, setQuestion] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [options, setOptions] = useState<OptionItem[]>([
    { id: newId(), text: "" },
    { id: newId(), text: "" },
  ]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/friends?status=accepted")
      .then(r => r.json())
      .then((data: Friend[]) => setFriends((data || []).filter(f => f.friend != null)))
      .catch(() => setFriends([]));
  }, []);

  function setOptionAt(id: string, value: string) {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text: value } : o));
  }

  function addOption() {
    setOptions(prev => [...prev, { id: newId(), text: "" }]);
  }

  function removeOption(id: string) {
    setOptions(prev => prev.filter(o => o.id !== id));
  }

  function toggleFriend(id: string) {
    setSelected(s => ({ ...s, [id]: s[id] === true ? false : true }));
  }

  function focusStyle(id: string): React.CSSProperties {
    return focusedId === id ? { borderColor: primaryColor } : {};
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const recipientIds = Object.keys(selected).filter(k => selected[k]);
    const cleanOptions = options.map(o => o.text.trim()).filter(o => o.length > 0);
    if (!question.trim() || cleanOptions.length < 2 || recipientIds.length === 0) {
      setError("Question, au moins 2 options et au moins un destinataire requis.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/polls/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), options: cleanOptions, recipientIds, deadline: deadline || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Erreur");
      if (body?.poll?.id) router.push(`/polls/${body.poll.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Question */}
      <div>
        <label htmlFor="poll-question" style={LABEL_STYLE}>Question</label>
        <input
          id="poll-question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onFocus={() => setFocusedId("question")}
          onBlur={() => setFocusedId(null)}
          placeholder="Ex : On se voit quand ?"
          style={{ ...INPUT_BASE, ...focusStyle("question"), fontSize: 15 }}
        />
      </div>

      {/* Deadline */}
      <div>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={LABEL_STYLE}>Date limite (optionnel)</legend>
          <DateTimePicker
            value={deadline}
            onChange={v => setDeadline(v)}
            onFocus={() => setFocusedId("deadline")}
            onBlur={() => setFocusedId(null)}
          />
        </fieldset>
      </div>

      {/* Options */}
      <div>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={LABEL_STYLE}>Options</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {options.map((opt, i) => (
              <div key={opt.id} style={{ position: "relative" }}>
                <input
                  id={`option-${opt.id}`}
                  value={opt.text}
                  onChange={e => setOptionAt(opt.id, e.target.value)}
                  onFocus={() => setFocusedId(opt.id)}
                  onBlur={() => setFocusedId(null)}
                  placeholder={`Option ${i + 1}`}
                  style={{ ...INPUT_BASE, ...focusStyle(opt.id), paddingRight: options.length > 2 ? 44 : 14 }}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    aria-label="Supprimer l'option"
                    onClick={() => removeOption(opt.id)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      width: 28, height: 28, borderRadius: 8, border: "none",
                      background: "var(--pf-surface-2)", color: "var(--pf-text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            style={{
              marginTop: 10, width: "100%", padding: "10px 14px",
              borderRadius: 12, border: "1px dashed var(--pf-border)",
              background: "transparent", color: "var(--pf-text-muted)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Ajouter une option
          </button>
        </fieldset>
      </div>

      {/* Recipients */}
      <div>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <legend style={{ ...LABEL_STYLE, marginBottom: 0 }}>Destinataires</legend>
            {selectedCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: primaryColor }}>
                {selectedCount} sélectionné{selectedCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {friends.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--pf-text-muted)", fontSize: 13 }}>
              Aucun ami trouvé
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {friends.map(f => {
                const name = f.friend.name || f.friend.email;
                const isSelected = selected[f.friend.id] === true;
                const color = getColor(name);
                return (
                  <label
                    key={f.friend.id}
                    htmlFor={`friend-${f.friend.id}`}
                    aria-label={name}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                      background: isSelected ? "var(--pf-accent-soft)" : "var(--pf-surface)",
                      border: `1px solid ${isSelected ? primaryColor : "var(--pf-border)"}`,
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    <input
                      id={`friend-${f.friend.id}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFriend(f.friend.id)}
                      style={{ display: "none" }}
                    />
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>
                      {getInitials(name)}
                    </div>
                    {/* Name */}
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--pf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </span>
                    {/* Check */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      background: isSelected ? primaryColor : "var(--pf-surface-2)",
                      border: `1.5px solid ${isSelected ? primaryColor : "var(--pf-border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s, border-color 0.15s",
                    }}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      </div>

      {/* Error */}
      {error !== null && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 500,
            background: "var(--pf-surface)", border: "1px solid var(--pf-border)",
            color: "var(--pf-text-dim)", cursor: "pointer",
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 2, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 600,
            background: loading ? "var(--pf-surface-2)" : primaryColor,
            color: loading ? "var(--pf-text-muted)" : "#fff",
            border: "none", cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <>
              <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Création…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Créer le sondage
            </>
          )}
        </button>
      </div>
    </form>
  );
}
