const {test} = require('node:test');
const assert = require('node:assert/strict');
const {archiveCutoff, purgeExpiredArchives, startArchiveCleanup} = require('../archiveRetention');

test('retention uses five calendar years and handles leap days', () => {
  assert.equal(archiveCutoff(new Date('2030-10-24T12:00:00Z')).toISOString(), '2025-10-24T12:00:00.000Z');
  assert.equal(archiveCutoff(new Date('2028-02-29T12:00:00Z')).toISOString(), '2023-02-28T12:00:00.000Z');
});

test('cleanup deletes only archives at least five years old, including legacy archives', async () => {
  const rows = [
    {id: 'active', deletedAt: null}, {id: 'legacy-active'},
    {id: 'expired', deletedAt: new Date('2020-01-01')},
    {id: 'boundary', deletedAt: new Date('2025-10-24T12:00:00Z')},
    {id: 'recent', deletedAt: new Date('2025-10-24T12:00:00.001Z')},
    {id: 'restored', deletedAt: null},
  ];
  let remaining;
  await purgeExpiredArchives({deleteMany: async filter => {
    assert.equal(filter.deletedAt.$type, 'date');
    remaining = rows.filter(row => !(row.deletedAt instanceof Date && row.deletedAt <= filter.deletedAt.$lte));
  }}, new Date('2030-10-24T12:00:00Z'));
  assert.deepEqual(remaining.map(row => row.id), ['active', 'legacy-active', 'recent', 'restored']);
});

test('cleanup runs immediately and hourly and logs failures without stopping future runs', async () => {
  let calls = 0;
  let scheduled;
  const errors = [];
  startArchiveCleanup({deleteMany: async () => {
    calls++;
    if (calls === 1) throw new Error('offline');
  }}, {schedule: (callback, interval) => {
    assert.equal(interval, 3600000);
    scheduled = callback;
    return {unref(){}};
  }, logger: {error: (...args) => errors.push(args)}});
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(errors.length, 1);
  await scheduled();
  assert.equal(calls, 2);
});
