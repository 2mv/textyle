jest.mock('./yle_teletext_image_storage', () => {
    const originalModule = jest.requireActual('./yle_teletext_image_storage');

    return {
        __esModule: true,
        ...originalModule as object,
        fetchAvailableTimestamps: function() {
            return [100, 200, 300, 400, 500];
        }
    };
});

import { resolveTeletextPageImageUrlAt } from './yle_teletext_image_finder';
import { jest, expect, test } from '@jest/globals';

test('returns last page image url when requested timestamp is newer than last available', async () => {
    const url = await resolveTeletextPageImageUrlAt( 100, 1, 501 );
    expect(url).toEqual('https://qux/100/1/500.png');
});

test('returns last page image url when requested timestamp is same as last available', async () => {
    const url = await resolveTeletextPageImageUrlAt( 100, 1, 500 );
    expect(url).toEqual('https://qux/100/1/500.png');
});

test('returns second to last page image url when requested timestamp is older than last available', async () => {
    const url = await resolveTeletextPageImageUrlAt( 100, 1, 499 );
    expect(url).toEqual('https://qux/100/1/400.png');
});

test('returns first page image url when requested timestamp is same as first available', async () => {
    const url = await resolveTeletextPageImageUrlAt( 100, 1, 100 );
    expect(url).toEqual('https://qux/100/1/100.png');
});

test('returns undefined when requested timestamp is older than first available', async () => {
    const url = await resolveTeletextPageImageUrlAt( 100, 1, 99 );
    expect(url).toBeUndefined();
});
