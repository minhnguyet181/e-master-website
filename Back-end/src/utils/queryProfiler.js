async function profileOperation(name, fn, meta = {}) {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    if (elapsed >= Number(process.env.SLOW_OPERATION_MS || 200)) {
      console.log(`[perf] ${name} took ${elapsed}ms`, meta);
    }
    return result;
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error(`[perf] ${name} failed after ${elapsed}ms`, {
      ...meta,
      error: error.message,
    });
    throw error;
  }
}

module.exports = { profileOperation };
