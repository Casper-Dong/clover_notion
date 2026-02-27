import { useState, useRef, useEffect, useCallback } from 'react';

const STYLES = ['paragraph', 'h1', 'h2', 'h3'];
const STYLE_LABELS = { paragraph: 'P', h1: 'H1', h2: 'H2', h3: 'H3' };

function useLocalHistory(initial) {
  const stack = useRef([JSON.parse(JSON.stringify(initial))]);
  const pointer = useRef(0);
  const [, forceRender] = useState(0);

  const current = useCallback(() => stack.current[pointer.current], []);
  const canUndo = pointer.current > 0;
  const canRedo = pointer.current < stack.current.length - 1;

  const push = useCallback((snapshot) => {
    stack.current = stack.current.slice(0, pointer.current + 1);
    stack.current.push(JSON.parse(JSON.stringify(snapshot)));
    if (stack.current.length > 100) stack.current.shift();
    else pointer.current += 1;
    forceRender((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (pointer.current > 0) {
      pointer.current -= 1;
      forceRender((n) => n + 1);
      return JSON.parse(JSON.stringify(stack.current[pointer.current]));
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    if (pointer.current < stack.current.length - 1) {
      pointer.current += 1;
      forceRender((n) => n + 1);
      return JSON.parse(JSON.stringify(stack.current[pointer.current]));
    }
    return null;
  }, []);

  const reset = useCallback((snapshot) => {
    stack.current = [JSON.parse(JSON.stringify(snapshot))];
    pointer.current = 0;
    forceRender((n) => n + 1);
  }, []);

  return { current, canUndo, canRedo, push, undo, redo, reset };
}

export default function TextBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.content.text);
  const [style, setStyle] = useState(block.content.style);
  const inputRef = useRef(null);
  const pushTimer = useRef(null);

  const history = useLocalHistory({ text: block.content.text, style: block.content.style });

  useEffect(() => {
    setText(block.content.text);
    setStyle(block.content.style);
    history.reset({ text: block.content.text, style: block.content.style });
  }, [block.content.text, block.content.style]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Debounced push to local history on text changes
  const onTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      history.push({ text: newText, style });
    }, 400);
  };

  const onStyleChange = (s) => {
    setStyle(s);
    history.push({ text, style: s });
  };

  const localUndo = useCallback(() => {
    const snap = history.undo();
    if (snap) {
      setText(snap.text);
      setStyle(snap.style);
    }
  }, [history]);

  const localRedo = useCallback(() => {
    const snap = history.redo();
    if (snap) {
      setText(snap.text);
      setStyle(snap.style);
    }
  }, [history]);

  const save = () => {
    clearTimeout(pushTimer.current);
    onUpdate(block.id, 'text', { text, style });
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      localUndo();
      return;
    }
    if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault();
      e.stopPropagation();
      localRedo();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      setText(block.content.text);
      setStyle(block.content.style);
      setEditing(false);
    }
  };

  const Tag = style === 'paragraph' ? 'p' : style;

  if (!editing) {
    return (
      <div className="block text-block" onClick={() => setEditing(true)}>
        <Tag className="block-content">{text || 'Click to edit...'}</Tag>
      </div>
    );
  }

  return (
    <div className="block text-block editing">
      <div className="editor-toolbar">
        <div className="style-picker">
          {STYLES.map((s) => (
            <button
              key={s}
              className={`style-btn ${s === style ? 'active' : ''}`}
              onClick={() => onStyleChange(s)}
            >
              {STYLE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="undo-redo inline-undo-redo">
          <button
            className="undo-redo-btn"
            onClick={localUndo}
            disabled={!history.canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            className="undo-redo-btn"
            onClick={localRedo}
            disabled={!history.canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↪
          </button>
        </div>
      </div>
      <textarea
        ref={inputRef}
        className={`text-input style-${style}`}
        value={text}
        onChange={onTextChange}
        onKeyDown={handleKeyDown}
        placeholder="Type something..."
        rows={style === 'paragraph' ? 3 : 1}
      />
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={() => {
          clearTimeout(pushTimer.current);
          setText(block.content.text);
          setStyle(block.content.style);
          setEditing(false);
        }}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
