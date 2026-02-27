import { useState, useEffect, useRef, useCallback } from 'react';

export default function ImageBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(block.content.url);
  const [width, setWidth] = useState(block.content.width);
  const [height, setHeight] = useState(block.content.height);
  const [selected, setSelected] = useState(false);

  // Drag-resize state
  const resizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });
  const handle = useRef(null);
  const imgWrapperRef = useRef(null);

  useEffect(() => {
    setUrl(block.content.url);
    setWidth(block.content.width);
    setHeight(block.content.height);
  }, [block.content.url, block.content.width, block.content.height]);

  // Deselect when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (imgWrapperRef.current && !imgWrapperRef.current.contains(e.target)) {
        setSelected(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onMouseDown = useCallback((e, handleName) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    handle.current = handleName;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { w: width, h: height };

    const onMouseMove = (e) => {
      if (!resizing.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      let newW = startSize.current.w;
      let newH = startSize.current.h;

      if (handle.current.includes('right')) newW = Math.max(50, startSize.current.w + dx);
      if (handle.current.includes('left')) newW = Math.max(50, startSize.current.w - dx);
      if (handle.current.includes('bottom')) newH = Math.max(50, startSize.current.h + dy);
      if (handle.current.includes('top')) newH = Math.max(50, startSize.current.h - dy);

      setWidth(Math.round(newW));
      setHeight(Math.round(newH));
    };

    const onMouseUp = () => {
      if (resizing.current) {
        resizing.current = false;
        // Persist the new size — read from latest state via setState callback
        setWidth((w) => {
          setHeight((h) => {
            onUpdate(block.id, 'image', { url: block.content.url, width: w, height: h });
            return h;
          });
          return w;
        });
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, height, block.id, block.content.url, onUpdate]);

  const save = () => {
    onUpdate(block.id, 'image', {
      url,
      width: Number(width) || 400,
      height: Number(height) || 300,
    });
    setEditing(false);
    setSelected(false);
  };

  const cancel = () => {
    setUrl(block.content.url);
    setWidth(block.content.width);
    setHeight(block.content.height);
    setEditing(false);
    setSelected(false);
  };

  const handleImageClick = (e) => {
    if (resizing.current) return;
    if (!selected) {
      setSelected(true);
    } else {
      setEditing(true);
    }
  };

  if (!editing) {
    return (
      <div className="block image-block" ref={imgWrapperRef}>
        {url ? (
          <div
            className={`image-resizable ${selected ? 'selected' : ''}`}
            style={{ width: `${width}px`, height: `${height}px`, position: 'relative', display: 'inline-block' }}
            onClick={handleImageClick}
          >
            <img
              src={url}
              alt="block"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '4px' }}
              draggable={false}
            />
            {selected && (
              <>
                {/* Corner handles */}
                <div className="resize-handle corner top-left" onMouseDown={(e) => onMouseDown(e, 'top-left')} />
                <div className="resize-handle corner top-right" onMouseDown={(e) => onMouseDown(e, 'top-right')} />
                <div className="resize-handle corner bottom-left" onMouseDown={(e) => onMouseDown(e, 'bottom-left')} />
                <div className="resize-handle corner bottom-right" onMouseDown={(e) => onMouseDown(e, 'bottom-right')} />
                {/* Edge handles */}
                <div className="resize-handle edge top" onMouseDown={(e) => onMouseDown(e, 'top')} />
                <div className="resize-handle edge bottom" onMouseDown={(e) => onMouseDown(e, 'bottom')} />
                <div className="resize-handle edge left" onMouseDown={(e) => onMouseDown(e, 'left')} />
                <div className="resize-handle edge right" onMouseDown={(e) => onMouseDown(e, 'right')} />
                <div className="resize-dimensions">{width} × {height}</div>
              </>
            )}
          </div>
        ) : (
          <div className="image-placeholder" onClick={() => setEditing(true)}>Click to set image URL</div>
        )}
      </div>
    );
  }

  return (
    <div className="block image-block editing">
      <div className="image-form">
        <label>
          URL
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </label>
        <div className="size-inputs">
          <label>
            Width
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min="50"
              max="1200"
            />
          </label>
          <label>
            Height
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="50"
              max="1200"
            />
          </label>
        </div>
        {url && (
          <img
            src={url}
            alt="preview"
            className="image-preview"
            style={{ width: `${width}px`, height: `${height}px`, objectFit: 'cover' }}
          />
        )}
      </div>
      <div className="block-actions">
        <button className="btn save-btn" onClick={save}>Save</button>
        <button className="btn cancel-btn" onClick={cancel}>Cancel</button>
        <button className="btn delete-btn" onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  );
}
