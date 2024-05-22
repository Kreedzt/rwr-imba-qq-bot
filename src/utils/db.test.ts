import { ignoreNullChar } from './db';
import { describe, it, expect } from 'vitest';

describe('ignore Null char', () => {
    it.concurrent('should ignore null char', () => {
        expect(ignoreNullChar('hello\x00world')).toBe('hello');
    });

    it.concurrent('should return the same string if no null char', () => {
        expect(ignoreNullChar('hello')).toBe('hello');
    });
});
