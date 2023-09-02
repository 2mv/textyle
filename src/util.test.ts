import { ensureEnvPresence } from './util';
import {expect, test} from '@jest/globals';

test('returns environment variable value when present', () => {
    process.env['JESTTEST'] = "foo";
    expect(ensureEnvPresence('JESTTEST')).toBe('foo');
});

test('throws when environment variable not present', () => {
    expect(() => { ensureEnvPresence('THIS SHOULD NOT EXIST') }).toThrowError();
});
