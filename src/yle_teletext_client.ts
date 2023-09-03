import get, { AxiosResponse } from 'axios';
import { URL } from 'node:url';
import { TESTING } from './util';
import { Agent as HttpsAgent } from 'node:https';
import { YLE_API_APP_ID, YLE_API_APP_KEY } from './credentials';

const YLE_TELETEXT_API_ORIGIN = 'https://external.api.yle.fi';
const YLE_TELETEXT_API_ROOT_PATH = '/v1/teletext';

const httpsAgent = new HttpsAgent({ keepAlive: true });

/**
 * Class for any Yle API URLs that require using an app ID and app key.
 * Adds the `app_id` and `app_key` query parameters automatically.
 */
class YleAPIURL extends URL {
  constructor( path : string, base : string ) {
    super( path, base );
    this.searchParams.set( 'app_id', YLE_API_APP_ID );
    this.searchParams.set( 'app_key', YLE_API_APP_KEY );
  }
}

/**
 * Class for Yle teletext API URLs. 
 * Example: `new YleTeletextAPIURL( 'pages/100.json' )` =>
 * 'https://external.api.yle.fi/v1/teletext/pages/100.json?app_id=<ID>&app_key=<KEY>'
 */
class YleTeletextAPIURL extends YleAPIURL {
  constructor( path : string ) {
    super( `${YLE_TELETEXT_API_ROOT_PATH}/${path}`, YLE_TELETEXT_API_ORIGIN );
  }
}

/**
 * Error class for any errors originating from Yle External API.
 * Always contains the URL that caused the error.
 */
class YleAPIError extends Error {

  url : URL

  constructor(message : string, url : URL) {
    super(message);
    this.name = 'YleAPIError';
    this.url = url;
  }
}

/**
 * An YLE API error for teletext pages.
 * Contains the page number and possible subpage number that caused the error.
 */
class TeletextPageAPIError extends YleAPIError {

  pageNr : number
  subpageNr? : number

  constructor( message : string, url : URL, pageNr : number, subpageNr? : number ) {
    super( message, url);
    this.name = 'TeletextPageAPIError';
    this.pageNr = pageNr;
    if ( subpageNr ) {
      this.subpageNr = subpageNr;
    }
  }
}

/**
 * Thrown when a teletext page or subpage request results in a 404.
 */
class TeletextPageNotFoundError extends TeletextPageAPIError {
  constructor( message : string, url : URL, pageNr : number, subpageNr? : number ) {
    super(message, url, pageNr, subpageNr);
    this.name = 'TeletextPageNotFoundError';
  }
}

/**
 * Forms an API URL for fetching teletext page data in JSON format.
 * @param pageNr - The page number to generate URL for
 * @returns the API URL for fetching teletext page data
 */
const pageDataJsonUrl = ( pageNr : number ) : YleTeletextAPIURL => {
  return new YleTeletextAPIURL( `pages/${pageNr}.json` );
};

/**
 * Forms an API URL for fetching a teletext subpage PNG image.
 * @param pageNr - The page number to generate URL for
 * @param subpageNr - The subpage number to generate URL for
 * @returns API URL for fetching teletext subpage PNG image
 */
const pageImageUrl = ( pageNr : number, subpageNr : number ) : YleTeletextAPIURL => {
  return new YleTeletextAPIURL( `images/${pageNr}/${subpageNr}.png` );
};

/**
 * Fetches page metadata from API for specified teletext page number in JSON format.
 * @param pageNr - The page number to fetch data for
 * @returns an axios response object that contains the HTTP response from the API
 */
export const pageData = async ( pageNr: number ) : Promise<AxiosResponse> => {
  const url = pageDataJsonUrl( pageNr );
  try {
    return await get( url.href, { httpsAgent: httpsAgent } );
  } catch ( axiosError : any ) {
    const httpStatus = axiosError?.response?.status
    if ( !httpStatus ) {
      throw( axiosError );
    }

    if ( httpStatus == 404 ) {
      throw new TeletextPageNotFoundError( `Teletext page ${pageNr} was not found`, url, pageNr );
    }
    throw new TeletextPageAPIError( `Teletext page ${pageNr} request failed with HTTP status '${httpStatus}'`, url, pageNr );
  }
};

/**
 * Fetches subpage PNG image from API for specified teletext page+subpage number.
 * @param pageNr - The page number to fetch image for
 * @param subpageNr - The subpage number to fetch image for
 * @returns an axios response object that contains the HTTP response from the API
 */
export const pageImage = async ( pageNr: number, subpageNr : number ) : Promise<AxiosResponse> => {
  const url =pageImageUrl( pageNr, subpageNr );
  try {
    return await get( url.href, { responseType: 'arraybuffer', httpsAgent: httpsAgent } );
  } catch ( axiosError : any ) {
    const httpStatus = axiosError?.response?.status
    if ( !httpStatus ) {
      throw( axiosError );
    }

    if ( httpStatus == 404 ) {
      throw new TeletextPageNotFoundError( `Teletext page ${pageNr}, subpage ${subpageNr}, was not found`, url, pageNr, subpageNr );
    }
    throw new TeletextPageAPIError( `Teletext page ${pageNr}, subpage ${subpageNr}, request failed with HTTP status '${httpStatus}'`, url, pageNr, subpageNr );
  }
};

export const testing = TESTING ? {
  pageImageUrl: pageImageUrl,
  YleAPIURL: YleAPIURL,
  YleTeletextAPIURL: YleTeletextAPIURL,
  YleAPIError: YleAPIError,
  TeletextPageAPIError: TeletextPageAPIError,
  TeletextPageNotFoundError: TeletextPageNotFoundError,
  pageDataJsonUrl: pageDataJsonUrl
} : undefined;
