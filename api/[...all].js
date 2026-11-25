export default async function handler(req, res) {
  try {
    const mod = await import('./index.js');
    const app = mod.default || mod;
    return new Promise((resolve) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      try {
        app(req, res, (err) => {
          if (err && !res.headersSent) {
            res.status(500).json({ error: 'EXPRESS_ERR', message: err.message || String(err), stack: err.stack });
          }
          resolve();
        });
      } catch (callErr) {
        if (!res.headersSent) {
          res.status(500).json({ error: 'CALL_ERR', message: callErr.message, stack: callErr.stack });
        }
        resolve();
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'CRASH_IN_INDEX_JS',
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  }
}
