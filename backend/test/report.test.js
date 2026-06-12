const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { buildDateRange } = require('../src/utils/report');

describe('Reportes', () => {
  it('crea un rango inclusivo de fechas', () => {
    const filter = buildDateRange({
      from: '2026-06-01',
      to: '2026-06-12',
    });

    assert.equal(filter.createdAt.$gte.toISOString(), '2026-06-01T00:00:00.000Z');
    assert.equal(filter.createdAt.$lte.toISOString(), '2026-06-12T23:59:59.999Z');
  });

  it('permite reportes sin rango', () => {
    assert.deepEqual(buildDateRange({}), {});
  });

  it('rechaza fechas inexistentes y rangos invertidos', () => {
    assert.throws(
      () => buildDateRange({ from: '2026-02-30' }),
      /fecha inicial no es valida/,
    );
    assert.throws(
      () => buildDateRange({ from: '2026-06-12', to: '2026-06-01' }),
      /fecha inicial no puede superar/,
    );
  });
});
