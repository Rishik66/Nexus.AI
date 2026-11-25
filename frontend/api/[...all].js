export default async function handler(req, res) {
  try {
    const mod = await import('./index.js');
    const app = mod.default || mod;
    if (typeof app === 'function') {
      return app(req, res);
    } else {
      return res.status(500).json({
        error: 'APP_NOT_FUNCTION',
        type: typeof app,
        keys: Object.keys(mod)
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: 'CRASH_IN_INDEX_JS',
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  }
}
