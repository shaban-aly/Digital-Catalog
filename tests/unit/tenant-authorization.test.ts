import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasMinimumRole } from '../../src/server/services/tenant-auth.ts';

describe('Tenant Authorization Service (TEN-001)', () => {
  describe('Role Hierarchy & Permission Evaluation (hasMinimumRole)', () => {
    it('evaluates owner permissions correctly', () => {
      assert.equal(hasMinimumRole('owner', 'viewer'), true);
      assert.equal(hasMinimumRole('owner', 'editor'), true);
      assert.equal(hasMinimumRole('owner', 'admin'), true);
      assert.equal(hasMinimumRole('owner', 'owner'), true);
    });

    it('evaluates admin permissions correctly', () => {
      assert.equal(hasMinimumRole('admin', 'viewer'), true);
      assert.equal(hasMinimumRole('admin', 'editor'), true);
      assert.equal(hasMinimumRole('admin', 'admin'), true);
      assert.equal(hasMinimumRole('admin', 'owner'), false);
    });

    it('evaluates editor permissions correctly', () => {
      assert.equal(hasMinimumRole('editor', 'viewer'), true);
      assert.equal(hasMinimumRole('editor', 'editor'), true);
      assert.equal(hasMinimumRole('editor', 'admin'), false);
      assert.equal(hasMinimumRole('editor', 'owner'), false);
    });

    it('evaluates viewer permissions correctly', () => {
      assert.equal(hasMinimumRole('viewer', 'viewer'), true);
      assert.equal(hasMinimumRole('viewer', 'editor'), false);
      assert.equal(hasMinimumRole('viewer', 'admin'), false);
      assert.equal(hasMinimumRole('viewer', 'owner'), false);
    });
  });
});

