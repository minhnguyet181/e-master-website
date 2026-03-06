// src/services/sse.service.js

// In-memory SSE clients map: userId -> Set(response)
const clients = new Map();

function addClient(userId, res) {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);
}

function removeClient(userId, res) {
  const key = String(userId);
  const set = clients.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(key);
}

function sendEvent(userId, eventName, data) {
  const key = String(userId);
  const set = clients.get(key);
  if (!set || set.size === 0) return;

  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch (e) {
      // best-effort: drop broken stream
      try { res.end(); } catch (_) {}
      set.delete(res);
    }
  }
  if (set.size === 0) clients.delete(key);
}

module.exports = { addClient, removeClient, sendEvent };

