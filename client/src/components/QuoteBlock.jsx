import { useState, useRef, useEffect } from 'react';

export default function QuoteBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.content.text);
  const inputRef = useRef(null);

  useEffect(() => { setText(block.content.text); }, [block.content.text]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = () => {
    onUpdate(block.id, 'quote', { text });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="block quote-block" onClick={() => setEditing(true)}>
        <blockquote className="quote-content">{text || 'Click to add a quote...'}</blockquote>
      </div>
    );
  }

  return (
    <div className="block quote-block editing">
      <textarea
        ref={inputRef}
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
          if (e.key === 'Escape') { setText(block.content.text); setEditing(false); }
        }}
        placeholder="Type a quote..."
        rows={2}
      />
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={() => { setText(block.content.text); setEditing(false); }}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
