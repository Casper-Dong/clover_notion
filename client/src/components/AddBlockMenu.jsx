import { useState } from 'react';

const BLOCK_TYPES = [
  { type: 'text',    icon: 'A',  label: 'Text',    defaults: { text: '', style: 'paragraph' } },
  { type: 'image',   icon: '🖼', label: 'Image',   defaults: { url: '', width: 400, height: 300 } },
  { type: 'todo',    icon: '☑', label: 'To-do',   defaults: { text: '', checked: false } },
  { type: 'quote',   icon: '❝', label: 'Quote',   defaults: { text: '' } },
  { type: 'callout', icon: '💡', label: 'Callout', defaults: { text: '', emoji: '💡' } },
  { type: 'code',    icon: '</>', label: 'Code',   defaults: { code: '', language: '' } },
  { type: 'toggle',  icon: '▶', label: 'Toggle',  defaults: { title: '', body: '' } },
  { type: 'divider', icon: '—',  label: 'Divider', defaults: {} },
];

export default function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false);

  const add = (bt) => {
    onAdd(bt.type, { ...bt.defaults });
    setOpen(false);
  };

  return (
    <div className="add-block-menu">
      {open ? (
        <div className="add-block-grid">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} className="add-grid-item" onClick={() => add(bt)}>
              <span className="add-grid-icon">{bt.icon}</span>
              <span className="add-grid-label">{bt.label}</span>
            </button>
          ))}
          <button className="add-close-float" onClick={() => setOpen(false)}>×</button>
        </div>
      ) : (
        <button className="add-trigger" onClick={() => setOpen(true)}>
          + Add a block
        </button>
      )}
    </div>
  );
}
