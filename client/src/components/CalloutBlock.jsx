import { useState, useRef, useEffect } from 'react';

const EMOJI_OPTIONS = ['💡', '⚠️', '❗', '✅', '📌', '🔥', '💬', '📝'];

export default function CalloutBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.content.text);
  const [emoji, setEmoji] = useState(block.content.emoji || '💡');
  const inputRef = useRef(null);

  useEffect(() => { setText(block.content.text); setEmoji(block.content.emoji || '💡'); }, [block.content.text, block.content.emoji]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = () => {
    onUpdate(block.id, 'callout', { text, emoji });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="block callout-block" onClick={() => setEditing(true)}>
        <div className="callout-display">
          <span className="callout-emoji">{emoji}</span>
          <span className="callout-text">{text || 'Click to add a callout...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="block callout-block editing">
      <div className="emoji-picker">
        {EMOJI_OPTIONS.map((e) => (
          <button key={e} className={`emoji-btn ${e === emoji ? 'active' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
        ))}
      </div>
      <textarea
        ref={inputRef}
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
          if (e.key === 'Escape') { setText(block.content.text); setEmoji(block.content.emoji || '💡'); setEditing(false); }
        }}
        placeholder="Type callout text..."
        rows={2}
      />
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={() => { setText(block.content.text); setEmoji(block.content.emoji || '💡'); setEditing(false); }}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
