// src/controllers/events.controller.js
const { addClient, removeClient } = require('../services/sse.service');

exports.connect = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  // Tell client to retry quickly if dropped
  res.write('retry: 2000\n\n');

  addClient(userId, res);

  // Keep-alive ping to avoid proxies closing the connection
  const ping = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch (e) {
      // ignore
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(ping);
    removeClient(userId, res);
  });
};

