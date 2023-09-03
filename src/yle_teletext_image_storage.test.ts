const sendMock = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
    const originalModule = jest.requireActual('@aws-sdk/client-s3');

    return {
        __esModule: true,
        ...originalModule as object,
        S3Client: jest.fn(() => { return {
            send: sendMock
        } })
    };
});

import { NoSuchKey } from '@aws-sdk/client-s3';
import { ensurePresence } from './util';
import { teletextImageStorageKey, testing as maybeTesting, storeTeletextImage, storeLastTimestamp, findLastStoredTimestamp, fetchAvailableTimestamps, imagePublicUrl } from './yle_teletext_image_storage';
import { jest, expect, test } from '@jest/globals';

const testing = ensurePresence( maybeTesting );

test('image storage key is generated correctly', async () => {
    const key = teletextImageStorageKey( 100, 1, 1000 );
    expect(key).toEqual('100/1/1000.png');
});

test('last timestamp storage key is generated correctly', async () => {
    const key = testing.lastTimestampFileName( 100 );
    expect(key).toEqual('100/LAST_TS');
});

test('teletext image data is sent to S3 with correct parameters', async () => {
    sendMock.mockReset();
    const testData = Buffer.from("testing");
    storeTeletextImage( 100, 1, 500, testData );
    expect(sendMock.mock.calls).toHaveLength(1);
    const command : any = sendMock.mock.calls[0]?.[0];
    const inputParam = command['input'];
    expect(inputParam['Body']).toEqual(testData);
    expect(inputParam['Key']).toEqual("100/1/500.png");
    expect(inputParam['Bucket']).toEqual("baz");
});

test('teletext page last timestamp is sent to S3 with correct parameters', async () => {
    sendMock.mockReset();
    storeLastTimestamp( 100, 4234234 );
    expect(sendMock.mock.calls).toHaveLength(1);
    const command : any = sendMock.mock.calls[0]?.[0];
    const inputParam = command['input'];
    expect(inputParam['Body']).toEqual("4234234");
    expect(inputParam['Key']).toEqual("100/LAST_TS");
    expect(inputParam['Bucket']).toEqual("baz");
});

test('teletext page last stored timestamp is fetched from S3 with correct parameters and returns correct value', async () => {
    sendMock.mockReset();
    sendMock.mockImplementation( () => { return Promise.resolve({ 
        Body: {
            transformToString: () => { return Promise.resolve( "837645" ) }
        }
    }) } );
    const ts = await findLastStoredTimestamp( 100 );
    expect(ts).toEqual(837645);
    expect(sendMock.mock.calls).toHaveLength(1);
    const command : any = sendMock.mock.calls[0]?.[0];
    const inputParam = command['input'];
    expect(inputParam['Key']).toEqual("100/LAST_TS");
    expect(inputParam['Bucket']).toEqual("baz");
});

test('teletext page last stored timestamp is undefined if fetch from S3 returns nothing', async () => {
    sendMock.mockReset();
    sendMock.mockImplementation( () => { return Promise.resolve({ 
        Body: {
            transformToString: () => { return Promise.resolve( undefined ) }
        }
    }) } );
    const ts = await findLastStoredTimestamp( 100 );
    expect(ts).toEqual(undefined);
});

test('teletext page last stored timestamp is undefined if fetch from S3 results in no-such-key error', async () => {
    sendMock.mockReset();
    sendMock.mockImplementation( () => { throw new NoSuchKey({message: 'foo', $metadata: {}}) } );
    const ts = await findLastStoredTimestamp( 100 );
    expect(ts).toEqual(undefined);
});

test('teletext page available timestamps are fetched from S3 with correct parameters and returns correct value', async () => {
    sendMock.mockReset();
    sendMock.mockImplementation( () => { return Promise.resolve({ 
        Contents: [{Key: '100/1/200'}, {Key: '100/1/300'}, {Key: '100/1/400'}]
    }) } );
    const timestamps = await fetchAvailableTimestamps( 100, 1 );
    expect(timestamps).toEqual([200, 300, 400]);
    expect(sendMock.mock.calls).toHaveLength(1);
    const command : any = sendMock.mock.calls[0]?.[0];
    const inputParam = command['input'];
    expect(inputParam['Bucket']).toEqual("baz");
    expect(inputParam['Prefix']).toEqual("100/1");
});

test('teletext page available timestamps returns empty array if Contents is missing', async () => {
    sendMock.mockReset();
    sendMock.mockImplementation( () => { return Promise.resolve({}) } );
    const timestamps = await fetchAvailableTimestamps( 100, 1 );
    expect(timestamps).toEqual([]);
});

test('teletext page available timestamps returns empty array if no objects present', async () => {
    sendMock.mockReset();
    sendMock.mockImplementation( () => { return Promise.resolve({ 
        Contents: []
    }) } );
    const timestamps = await fetchAvailableTimestamps( 100, 1 );
    expect(timestamps).toEqual([]);
});

test('public image url is formed correctly', () => {
    const url = imagePublicUrl(100, 1, 500);
    expect(url).toEqual("https://qux/100/1/500.png");
});
