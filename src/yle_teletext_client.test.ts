import mockAxios from 'jest-mock-axios';

import { ensurePresence } from './util';
import { testing as maybeTesting, pageData } from './yle_teletext_client';
import { afterEach, expect, test } from '@jest/globals';

const testing = ensurePresence( maybeTesting );

afterEach(() => {
    // cleaning up the mess left behind the previous test
    mockAxios.reset();
});

test('yle api urls contain credentials', () => {
    const testUrl = new testing.YleAPIURL( 'a', 'https://external.api.yle.foo' )
    expect(testUrl.href).toBe("https://external.api.yle.foo/a?app_id=foo&app_key=bar");
});

test('yle teletext api urls contain credentials', () => {
    const testUrl = new testing.YleTeletextAPIURL( 'a' )
    expect(testUrl.href).toBe("https://external.api.yle.fi/v1/teletext/a?app_id=foo&app_key=bar");
});

test('yle api errors contain the offending url', () => {
    try {
        throw new testing.YleAPIError( "testing", new testing.YleTeletextAPIURL( 'a' ) );
    } catch ( err ) {
        if ( !(err instanceof testing.YleAPIError) ) {
            throw( err );
        }
        expect(err.url.href).toBe("https://external.api.yle.fi/v1/teletext/a?app_id=foo&app_key=bar");
        expect(err.message).toBe("testing");
    }
});

test('yle teletext page api errors contain all relevant data', () => {
    try {
        throw new testing.TeletextPageAPIError( "testing", new testing.YleTeletextAPIURL( 'a' ), 100, 1 );
    } catch ( err ) {
        if ( !(err instanceof testing.TeletextPageAPIError) ) {
            throw( err );
        }
        expect(err.url.href).toBe("https://external.api.yle.fi/v1/teletext/a?app_id=foo&app_key=bar");
        expect(err.message).toBe("testing");
        expect(err.pageNr).toBe(100);
        expect(err.subpageNr).toBe(1);
    }
});

test('yle teletext page not found errors contain all relevant data', () => {
    try {
        throw new testing.TeletextPageNotFoundError( "testing", new testing.YleTeletextAPIURL( 'a' ), 100, 1 );
    } catch ( err ) {
        if ( !(err instanceof testing.TeletextPageNotFoundError) ) {
            throw( err );
        }
        expect(err.url.href).toBe("https://external.api.yle.fi/v1/teletext/a?app_id=foo&app_key=bar");
        expect(err.message).toBe("testing");
        expect(err.pageNr).toBe(100);
        expect(err.subpageNr).toBe(1);
    }
});

test('page data json urls are correctly formed', () => {
    const url = testing.pageDataJsonUrl( 100 );
    expect(url).toBeInstanceOf( testing.YleTeletextAPIURL );
    expect(url.href).toBe("https://external.api.yle.fi/v1/teletext/pages/100.json?app_id=foo&app_key=bar");
});

test('page image urls are correctly formed', () => {
    const url = testing.pageImageUrl( 100, 1 );
    expect(url).toBeInstanceOf( testing.YleTeletextAPIURL );
    expect(url.href).toBe("https://external.api.yle.fi/v1/teletext/images/100/1.png?app_id=foo&app_key=bar");
});

test('page data fetching works', async () => {
    const promise = pageData( 100 );
    mockAxios.mockResponse({ data: "foo" });

    const result = await promise;
    expect(result.data).toEqual("foo")
});

test('page data fetching throws on 404', async () => {
    const promise = pageData( 100 );
    mockAxios.mockError( { response: { status: 404 } } );

    let raised = false;
    try {
        await promise;
    } catch ( err ) {
        raised = true;
        expect(err).toBeInstanceOf(testing.TeletextPageNotFoundError);
    }
    expect(raised).toEqual(true);
});

test('page data fetching throws on 500', async () => {
    const promise = pageData( 100 );
    mockAxios.mockError( { response: { status: 500 } } );

    let raised = false;
    try {
        await promise;
    } catch ( err ) {
        raised = true;
        expect(err).toBeInstanceOf(testing.TeletextPageAPIError);
    }
    expect(raised).toEqual(true);
});

test('page data fetching rethrows on other errors', async () => {
    const promise = pageData( 100 );
    const err = new Error("something else");
    mockAxios.mockError( err );

    let raised = false;
    try {
        await promise;
    } catch ( err2 ) {
        raised = true;
        expect(err2).toBe(err);
    }
    expect(raised).toEqual(true);
});
