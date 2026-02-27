import { useState, useRef, useEffect } from 'react';

export default function ToggleBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(block.content.title);
  const [body, setBody] = useState(block.content.body);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTitle(block.content.title); setBody(block.content.body); }, [block.content.title, block.content.body]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = () => {
    onUpdate(block.id, 'toggle', { title, body });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="block toggle-block">
        <div className="toggle-header" onClick={() => setOpen(!open)}>
          <span className={`toggle-arrow ${open ? 'open' : ''}`}>&#9654;</span>
          <span className="toggle-title" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            {title || 'Click to add toggle...'}
          </span>
        </div>
        {open && (
          <div className="toggle-body" onClick={() => setEditing(true)}>
            {body || 'Empty toggle. Click to edit.'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="block toggle-block editing">
      <input
        ref={inputRef}
        type="text"
        className="text-input toggle-title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Toggle heading"
      />
      <textarea
        className="text-input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Hidden content..."
        rows={3}
      />
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={() => { setTitle(block.content.title); setBody(block.content.body); setEditing(false); }}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
