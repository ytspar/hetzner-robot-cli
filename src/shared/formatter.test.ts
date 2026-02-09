import { describe, it, expect } from 'vitest';
import { createTable } from './formatter.js';

describe('Shared Formatter', () => {
  describe('createTable', () => {
    it('should create a table without colWidths', () => {
      const table = createTable(['Col1', 'Col2']);
      expect(table).toBeDefined();
      expect(table.options.head).toHaveLength(2);
    });

    it('should create a table with colWidths', () => {
      const table = createTable(['Col1', 'Col2'], [10, 20]);
      expect(table).toBeDefined();
      expect(table.options.colWidths).toEqual([10, 20]);
    });
  });
});
