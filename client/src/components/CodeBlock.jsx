import { useState, useRef, useEffect } from 'react';

export default function CodeBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(block.content.code);
  const [language, setLanguage] = useState(block.content.language || '');
  const inputRef = useRef(null);

  useEffect(() => { setCode(block.content.code); setLanguage(block.content.language || ''); }, [block.content.code, block.content.language]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = () => {
    onUpdate(block.id, 'code', { code, language });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="block code-block" onClick={() => setEditing(true)}>
        {language && <div className="code-language-badge">{language}</div>}
        <pre className="code-display"><code>{code || 'Click to add code...'}</code></pre>
      </div>
    );
  }

  return (
    <div className="block code-block editing">
      <input
        type="text"
        className="code-language-input"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder="Language (optional)"
      />
      <textarea
        ref={inputRef}
        className="code-input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setCode(block.content.code); setLanguage(block.content.language || ''); setEditing(false); }
        }}
        placeholder="Write your code..."
        rows={5}
        spellCheck={false}
      />
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={() => { setCode(block.content.code); setLanguage(block.content.language || ''); setEditing(false); }}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
