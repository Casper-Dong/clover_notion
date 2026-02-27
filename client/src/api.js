const API = 'http://localhost:3001/api';

export async function fetchTitle() {
  const res = await fetch(`${API}/title`);
  const data = await res.json();
  return data.title;
}

export async function saveTitle(title) {
  const res = await fetch(`${API}/title`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function fetchBlocks() {
  const res = await fetch(`${API}/blocks`);
  return res.json();
}

export async function createBlock(type, content) {
  const res = await fetch(`${API}/blocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content }),
  });
  return res.json();
}

export async function updateBlock(id, type, content) {
  const res = await fetch(`${API}/blocks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content }),
  });
  return res.json();
}

export async function deleteBlock(id) {
  const res = await fetch(`${API}/blocks/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function syncState(blocks, title) {
  const res = await fetch(`${API}/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks, title }),
  });
  return res.json();
}

export async function reorderBlocks(orderedIds) {
  const res = await fetch(`${API}/blocks-reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  return res.json();
}
