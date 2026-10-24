const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

function archiveCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
  // Clamp February 29 to February 28 when the target year is not a leap year.
  if (cutoff.getUTCMonth() !== now.getUTCMonth()) cutoff.setUTCDate(0);
  return cutoff;
}

function purgeExpiredArchives(model, now = new Date()) {
  return model.deleteMany({deletedAt: {$type: 'date', $lte: archiveCutoff(now)}});
}

function startArchiveCleanup(model, {schedule = setInterval, logger = console} = {}) {
  const cleanup = () => purgeExpiredArchives(model).catch(error => {
    logger.error('Failed to delete expired archived records:', error.message);
  });
  void cleanup();
  const timer = schedule(cleanup, CLEANUP_INTERVAL_MS);
  timer.unref?.();
  return timer;
}

module.exports = {archiveCutoff, purgeExpiredArchives, startArchiveCleanup};
