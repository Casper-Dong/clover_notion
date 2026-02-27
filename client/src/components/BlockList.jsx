import { useState, useRef } from 'react';
import TextBlock from './TextBlock';
import ImageBlock from './ImageBlock';
import DividerBlock from './DividerBlock';
import QuoteBlock from './QuoteBlock';
import CalloutBlock from './CalloutBlock';
import CodeBlock from './CodeBlock';
import TodoBlock from './TodoBlock';
import ToggleBlock from './ToggleBlock';

const BLOCK_COMPONENTS = {
  text: TextBlock,
  image: ImageBlock,
  divider: DividerBlock,
  quote: QuoteBlock,
  callout: CalloutBlock,
  code: CodeBlock,
  todo: TodoBlock,
  toggle: ToggleBlock,
};

export default function BlockList({ blocks, onUpdate, onDelete, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    dragNode.current = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== overIndex) {
      setOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.classList.remove('dragging');
    }
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newBlocks = [...blocks];
      const [moved] = newBlocks.splice(dragIndex, 1);
      newBlocks.splice(overIndex, 0, moved);
      onReorder(newBlocks.map((b) => b.id));
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  };

  return (
    <div className="block-list">
      {blocks.map((block, index) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) return null;
        return (
          <div
            key={block.id}
            className={`block-wrapper ${overIndex === index ? 'drop-target' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="drag-handle" title="Drag to reorder">⠿</div>
            <Component block={block} onUpdate={onUpdate} onDelete={onDelete} />
          </div>
        );
      })}
    </div>
  );
}
