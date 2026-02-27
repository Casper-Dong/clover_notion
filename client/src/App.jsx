import { useState, useEffect, useRef, useCallback } from 'react';
import BlockList from './components/BlockList';
import AddBlockMenu from './components/AddBlockMenu';
import {
  fetchBlocks, createBlock, updateBlock, deleteBlock,
  reorderBlocks, fetchTitle, saveTitle, syncState,
} from './api';
import useHistory from './useHistory';

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);
  const saveTimer = useRef(null);
  const titleTimer = useRef(null);
  const history = useHistory();
  const isRestoring = useRef(false);

  const refreshUndoRedo = useCallback(() => {
    setUndoable(history.canUndo());
    setRedoable(history.canRedo());
  }, [history]);

  const pushSnapshot = useCallback((newBlocks, newTitle) => {
    if (isRestoring.current) return;
    history.push({ blocks: newBlocks, title: newTitle });
    refreshUndoRedo();
  }, [history, refreshUndoRedo]);

  // Keep latest values accessible in refs for snapshot helpers
  const blocksRef = useRef(blocks);
  const titleRef = useRef(title);
  blocksRef.current = blocks;
  titleRef.current = title;

  useEffect(() => {
    Promise.all([fetchBlocks(), fetchTitle()])
      .then(([blocksData, titleData]) => {
        setBlocks(blocksData);
        setTitle(titleData);
        // Push initial state as first snapshot
        history.push({ blocks: blocksData, title: titleData });
        refreshUndoRedo();
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Undo / Redo ---
  const handleUndo = useCallback(async () => {
    const snapshot = history.undo();
    if (!snapshot) return;
    isRestoring.current = true;
    setBlocks(snapshot.blocks);
    setTitle(snapshot.title);
    await syncState(snapshot.blocks, snapshot.title);
    isRestoring.current = false;
    refreshUndoRedo();
  }, [history, refreshUndoRedo]);

  const handleRedo = useCallback(async () => {
    const snapshot = history.redo();
    if (!snapshot) return;
    isRestoring.current = true;
    setBlocks(snapshot.blocks);
    setTitle(snapshot.title);
    await syncState(snapshot.blocks, snapshot.title);
    isRestoring.current = false;
    refreshUndoRedo();
  }, [history, refreshUndoRedo]);

  // Global keyboard shortcut — works even inside inputs/textareas
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || (e.key !== 'z' && e.key !== 'y')) return;

      // When focus is inside a text input or textarea, let the
      // browser's native undo/redo handle it instead.
      const el = document.activeElement;
      if (el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text'))) {
        return;
      }

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handleUndo, handleRedo]);

  // --- Title ---
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTitle(newTitle);
    }, 500);
    // Debounce history push for title typing
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      pushSnapshot(blocksRef.current, newTitle);
    }, 800);
  }, [pushSnapshot]);

  const handleTitleBlur = useCallback(() => {
    clearTimeout(saveTimer.current);
    clearTimeout(titleTimer.current);
    saveTitle(title);
    pushSnapshot(blocksRef.current, title);
  }, [title, pushSnapshot]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  }, []);

  // --- Blocks ---
  const handleAdd = async (type, content) => {
    const block = await createBlock(type, content);
    const newBlocks = [...blocksRef.current, block];
    setBlocks(newBlocks);
    pushSnapshot(newBlocks, titleRef.current);
  };

  const handleUpdate = async (id, type, content) => {
    const updated = await updateBlock(id, type, content);
    const newBlocks = blocksRef.current.map((b) => (b.id === id ? updated : b));
    setBlocks(newBlocks);
    pushSnapshot(newBlocks, titleRef.current);
  };

  const handleDelete = async (id) => {
    await deleteBlock(id);
    const newBlocks = blocksRef.current.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    pushSnapshot(newBlocks, titleRef.current);
  };

  const handleReorder = async (orderedIds) => {
    const reordered = await reorderBlocks(orderedIds);
    setBlocks(reordered);
    pushSnapshot(reordered, titleRef.current);
  };

  const handleClearPage = async () => {
    if (!window.confirm('Clear all blocks and reset the title? This can be undone.')) return;
    const newTitle = 'Untitled';
    const newBlocks = [];
    setBlocks(newBlocks);
    setTitle(newTitle);
    await syncState(newBlocks, newTitle);
    pushSnapshot(newBlocks, newTitle);
  };

  if (loading) {
    return <div className="page"><div className="loader">Loading...</div></div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-row">
          <input
            className="page-title-input"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled"
          />
          <div className="header-actions">
            <div className="undo-redo">
              <button
                className="undo-redo-btn"
                onClick={handleUndo}
                disabled={!undoable}
                title="Undo (Ctrl+Z)"
              >
                ↩
              </button>
              <button
                className="undo-redo-btn"
                onClick={handleRedo}
                disabled={!redoable}
                title="Redo (Ctrl+Shift+Z)"
              >
                ↪
              </button>
            </div>
            <button
              className="clear-page-btn"
              onClick={handleClearPage}
              title="Clear page"
            >
              Clear page
            </button>
          </div>
        </div>
      </header>
      <main className="page-content">
        {blocks.length === 0 && (
          <p className="empty-state">No blocks yet. Add one below!</p>
        )}
        <BlockList
          blocks={blocks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
        <AddBlockMenu onAdd={handleAdd} />
      </main>
    </div>
  );
}
