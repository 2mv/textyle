const lastStoredTimestampMock = jest.fn();
const storeTeletextImageMock = jest.fn();
const storeLastTimestampMock = jest.fn();

jest.mock('./yle_teletext_image_storage', () => {
    const originalModule = jest.requireActual('./yle_teletext_image_storage');

    return {
        __esModule: true,
        ...originalModule as object,
        findLastStoredTimestamp: lastStoredTimestampMock,
        storeTeletextImage: storeTeletextImageMock,
        storeLastTimestamp: storeLastTimestampMock
    };
});

const pageImageMock = jest.fn();
const pageDataMock = jest.fn();

jest.mock('./yle_teletext_client', () => {
    const originalModule = jest.requireActual('./yle_teletext_client');

    return {
        __esModule: true,
        ...originalModule as object,
        pageImage: pageImageMock,
        pageData: pageDataMock
    };
});

import { ensurePresence } from './util';
import { findAndStoreNewTeletextImages, testing as maybeTesting } from './yle_teletext_updater';
import { jest, expect, test } from '@jest/globals';

const testing = ensurePresence( maybeTesting );

test('stores new teletext images if provided timestamp is newer than last stored one', async () => {
    lastStoredTimestampMock.mockReset();
    storeTeletextImageMock.mockReset();
    pageImageMock.mockReset();
    storeLastTimestampMock.mockReset();

    lastStoredTimestampMock.mockImplementation( () => { return Promise.resolve(499) } );
    pageImageMock.mockImplementation( () => { return Promise.resolve( { data: 'testing' } ) } );
    storeTeletextImageMock.mockImplementation( () => { return Promise.resolve(true)});
    storeLastTimestampMock.mockImplementation( () => { return Promise.resolve(true)});

    await testing.storeTeletextImagesIfNewer( 100, 500, 4 );
    expect(lastStoredTimestampMock.mock.calls).toHaveLength(1);
    expect(lastStoredTimestampMock.mock.calls[0]?.[0]).toEqual( 100 );

    expect(storeTeletextImageMock.mock.calls).toHaveLength(4);
    expect(storeTeletextImageMock.mock.calls[0]).toEqual( [100, 1, 500, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls[1]).toEqual( [100, 2, 500, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls[2]).toEqual( [100, 3, 500, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls[3]).toEqual( [100, 4, 500, Buffer.from('testing', 'binary')] );

    expect(pageImageMock.mock.calls).toHaveLength(4);
    expect(pageImageMock.mock.calls[0]).toEqual( [100, 1] );
    expect(pageImageMock.mock.calls[1]).toEqual( [100, 2] );
    expect(pageImageMock.mock.calls[2]).toEqual( [100, 3] );
    expect(pageImageMock.mock.calls[3]).toEqual( [100, 4] );

    expect(storeLastTimestampMock.mock.calls).toHaveLength(1);
    expect(storeLastTimestampMock.mock.calls[0]).toEqual( [100, 500] );
});

test('does not store new teletext images if provided timestamp is same as last stored one', async () => {
    lastStoredTimestampMock.mockReset();
    storeTeletextImageMock.mockReset();
    pageImageMock.mockReset();
    storeLastTimestampMock.mockReset();

    lastStoredTimestampMock.mockImplementation( () => { return Promise.resolve(500) } );
    pageImageMock.mockImplementation( () => { return Promise.resolve( { data: 'testing' } ) } );
    storeTeletextImageMock.mockImplementation( () => { return Promise.resolve(true)});
    storeLastTimestampMock.mockImplementation( () => { return Promise.resolve(true)});

    await testing.storeTeletextImagesIfNewer( 100, 500, 4 );
    expect(lastStoredTimestampMock.mock.calls).toHaveLength(1);
    expect(lastStoredTimestampMock.mock.calls[0]?.[0]).toEqual( 100 );

    expect(storeTeletextImageMock.mock.calls).toHaveLength(0);
    expect(pageImageMock.mock.calls).toHaveLength(0);
    expect(storeLastTimestampMock.mock.calls).toHaveLength(0);
});

test('finds the teletext pages that are newer than the last stored one', async () => {
    lastStoredTimestampMock.mockReset();
    storeTeletextImageMock.mockReset();
    pageImageMock.mockReset();
    storeLastTimestampMock.mockReset();
    pageDataMock.mockReset();

    const lastStoredTimestamp = Date.parse("2023-09-03T09:00:00") / 1000;

    lastStoredTimestampMock.mockImplementation( () => { return Promise.resolve(lastStoredTimestamp) } );
    pageImageMock.mockImplementation( () => { return Promise.resolve( { data: 'testing' } ) } );
    storeTeletextImageMock.mockImplementation( () => { return Promise.resolve(true)});
    storeLastTimestampMock.mockImplementation( () => { return Promise.resolve(true)});

    pageDataMock.mockImplementationOnce( () => { return Promise.resolve({
        data: {
            teletext: {
                page: {
                    time: "2023-09-03T10:00:00",
                    subpagecount: "4",
                    nextpg: "101"
                }
            }
        }
    }) } );
    pageDataMock.mockImplementationOnce( () => { return Promise.resolve({
        data: {
            teletext: {
                page: {
                    time: "2023-09-03T08:00:00",
                    subpagecount: "4",
                    nextpg: "102"
                }
            }
        }
    }) } );
    pageDataMock.mockImplementationOnce( () => { return Promise.resolve({
        data: {
            teletext: {
                page: {
                    time: "2023-09-03T10:01:00",
                    subpagecount: "3"
                }
            }
        }
    }) } );

    await findAndStoreNewTeletextImages();

    expect(lastStoredTimestampMock.mock.calls).toHaveLength(3);
    expect(lastStoredTimestampMock.mock.calls[0]?.[0]).toEqual( 100 );
    expect(lastStoredTimestampMock.mock.calls[1]?.[0]).toEqual( 101 );
    expect(lastStoredTimestampMock.mock.calls[2]?.[0]).toEqual( 102 );

    expect(storeTeletextImageMock.mock.calls).toHaveLength(7);

    expect(storeTeletextImageMock.mock.calls).toContainEqual( [100, 1, 1693724400, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls).toContainEqual( [100, 2, 1693724400, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls).toContainEqual( [100, 3, 1693724400, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls).toContainEqual( [100, 4, 1693724400, Buffer.from('testing', 'binary')] );
    
    expect(storeTeletextImageMock.mock.calls).toContainEqual( [102, 1, 1693724460, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls).toContainEqual( [102, 2, 1693724460, Buffer.from('testing', 'binary')] );
    expect(storeTeletextImageMock.mock.calls).toContainEqual( [102, 3, 1693724460, Buffer.from('testing', 'binary')] );

    expect(pageImageMock.mock.calls).toHaveLength(7);
    
    expect(pageImageMock.mock.calls).toContainEqual( [100, 1] );
    expect(pageImageMock.mock.calls).toContainEqual( [100, 2] );
    expect(pageImageMock.mock.calls).toContainEqual( [100, 3] );
    expect(pageImageMock.mock.calls).toContainEqual( [100, 4] );

    expect(pageImageMock.mock.calls).toContainEqual( [102, 1] );
    expect(pageImageMock.mock.calls).toContainEqual( [102, 2] );
    expect(pageImageMock.mock.calls).toContainEqual( [102, 3] );

    expect(storeLastTimestampMock.mock.calls).toHaveLength(2);
    expect(storeLastTimestampMock.mock.calls).toContainEqual( [100, 1693724400] );
    expect(storeLastTimestampMock.mock.calls).toContainEqual( [102, 1693724460] );

});
