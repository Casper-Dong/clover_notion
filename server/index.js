const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, 'notion.db'));
db.pragma('journal_mode = WAL');

// Migrate: remove old CHECK constraint if the table exists with one
const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='blocks'").get();
if (tableInfo && tableInfo.sql.includes('CHECK')) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks_new (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`INSERT OR IGNORE INTO blocks_new SELECT * FROM blocks`);
  db.exec(`DROP TABLE blocks`);
  db.exec(`ALTER TABLE blocks_new RENAME TO blocks`);
} else {
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS page_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Seed default title if not present
const existingTitle = db.prepare("SELECT value FROM page_meta WHERE key = 'title'").get();
if (!existingTitle) {
  db.prepare("INSERT INTO page_meta (key, value) VALUES ('title', 'Untitled')").run();
}

// Get page title
app.get('/api/title', (req, res) => {
  const row = db.prepare("SELECT value FROM page_meta WHERE key = 'title'").get();
  res.json({ title: row.value });
});

// Update page title
app.put('/api/title', (req, res) => {
  const { title } = req.body;
  db.prepare("UPDATE page_meta SET value = ? WHERE key = 'title'").run(title);
  res.json({ title });
});

// Get all blocks ordered by sort_order
app.get('/api/blocks', (req, res) => {
  const blocks = db.prepare('SELECT * FROM blocks ORDER BY sort_order ASC').all();
  res.json(blocks.map(b => ({ ...b, content: JSON.parse(b.content) })));
});

// Create a new block
app.post('/api/blocks', (req, res) => {
  const { type, content } = req.body;
  const id = uuidv4();

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM blocks').get();
  const sort_order = (maxOrder.max ?? -1) + 1;

  db.prepare(
    'INSERT INTO blocks (id, type, content, sort_order) VALUES (?, ?, ?, ?)'
  ).run(id, type, JSON.stringify(content), sort_order);

  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(id);
  res.status(201).json({ ...block, content: JSON.parse(block.content) });
});

// Update a block
app.put('/api/blocks/:id', (req, res) => {
  const { id } = req.params;
  const { type, content } = req.body;

  const existing = db.prepare('SELECT * FROM blocks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Block not found' });

  db.prepare(
    "UPDATE blocks SET type = ?, content = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(type, JSON.stringify(content), id);

  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(id);
  res.json({ ...block, content: JSON.parse(block.content) });
});

// Delete a block
app.delete('/api/blocks/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM blocks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Block not found' });

  db.prepare('DELETE FROM blocks WHERE id = ?').run(id);
  res.json({ success: true });
});

// Reorder blocks
app.put('/api/blocks-reorder', (req, res) => {
  const { orderedIds } = req.body; // array of block IDs in new order

  const update = db.prepare('UPDATE blocks SET sort_order = ? WHERE id = ?');
  const reorder = db.transaction((ids) => {
    ids.forEach((id, index) => {
      update.run(index, id);
    });
  });

  reorder(orderedIds);

  const blocks = db.prepare('SELECT * FROM blocks ORDER BY sort_order ASC').all();
  res.json(blocks.map(b => ({ ...b, content: JSON.parse(b.content) })));
});

// Sync full state (used by undo/redo)
app.put('/api/sync', (req, res) => {
  const { blocks, title } = req.body;

  const sync = db.transaction(() => {
    // Replace title
    if (title !== undefined) {
      db.prepare("UPDATE page_meta SET value = ? WHERE key = 'title'").run(title);
    }

    // Replace all blocks
    db.prepare('DELETE FROM blocks').run();
    const insert = db.prepare(
      'INSERT INTO blocks (id, type, content, sort_order) VALUES (?, ?, ?, ?)'
    );
    blocks.forEach((b, i) => {
      insert.run(b.id, b.type, JSON.stringify(b.content), i);
    });
  });

  sync();

  const savedBlocks = db.prepare('SELECT * FROM blocks ORDER BY sort_order ASC').all();
  const savedTitle = db.prepare("SELECT value FROM page_meta WHERE key = 'title'").get();
  res.json({
    blocks: savedBlocks.map(b => ({ ...b, content: JSON.parse(b.content) })),
    title: savedTitle.value,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
