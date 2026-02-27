import { useState, useRef, useEffect } from 'react';

export default function TodoBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.content.text);
  const [checked, setChecked] = useState(block.content.checked || false);
  const inputRef = useRef(null);

  useEffect(() => { setText(block.content.text); setChecked(block.content.checked || false); }, [block.content.text, block.content.checked]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const toggleCheck = (e) => {
    e.stopPropagation();
    const newChecked = !checked;
    setChecked(newChecked);
    onUpdate(block.id, 'todo', { text, checked: newChecked });
  };

  const save = () => {
    onUpdate(block.id, 'todo', { text, checked });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="block todo-block" onClick={() => setEditing(true)}>
        <div className="todo-display">
          <input
            type="checkbox"
            className="todo-checkbox"
            checked={checked}
            onChange={toggleCheck}
            onClick={(e) => e.stopPropagation()}
          />
          <span className={`todo-text ${checked ? 'todo-done' : ''}`}>{text || 'Click to add to-do...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="block todo-block editing">
      <div className="todo-edit-row">
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <input
          ref={inputRef}
          type="text"
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') { setText(block.content.text); setChecked(block.content.checked || false); setEditing(false); }
          }}
          placeholder="To-do"
        />
      </div>
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={() => { setText(block.content.text); setChecked(block.content.checked || false); setEditing(false); }}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
