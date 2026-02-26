import { describe, it, expect } from 'vitest';
import { Category } from '../../types';

describe('Enums Test', () => {
    it('Category Enum has correct values', () => {
        expect(Category.FOOD).toBe('Food & Dining');
        expect(Category.TRANSPORT).toBe('Transportation');
    });
});
