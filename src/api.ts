import createAPI, { API, Request, Response } from 'lambda-api';

import { resolveTeletextPageImageUrlAt } from './yle_teletext_image_finder';
import { YLE_API_APP_ID, YLE_API_APP_KEY } from './credentials';

/**
 * Lambda API root
 */
export const httpApi : API = createAPI({
  base: 'v1'
});

/**
 * Endpoint for fetching teletext images at a specified point in time.
 * Redirects to correct S3 URL if an image matching the requested timestamp
 * is found. Responds with 404 otherwise.
 * Example: /v1/100/1?time=1693588579
 */
httpApi.get( '/:pageNr/:subpageFilename', async ( request : Request, response : Response ) => {
  const pageNr = parseInt( request.params['pageNr'] || '' );
  const subpageNr = parseInt( request.params['subpageFilename'] || '' );
  const timestamp = parseInt( request.query['time'] || '' );
  const appId = request.query['app_id'] || '';
  const appKey = request.query['app_key'] || '';
  if ( appId !== YLE_API_APP_ID || appKey !== YLE_API_APP_KEY ) {
    return response.status( 401 ).send( undefined );
  }
  if ( !pageNr || !subpageNr || !timestamp ) {
    return response.status( 404 ).send( undefined );
  }

  const imageUrl = await resolveTeletextPageImageUrlAt( pageNr, subpageNr, timestamp )
  if ( imageUrl ) {
    response.location( imageUrl ).status( 302 ).send( undefined );
  } else {
    response.status( 404 ).send( undefined );
  }
} );
