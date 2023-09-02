import { findAndStoreNewTeletextImages } from './yle_teletext_updater';
import { httpApi } from './api';
import { APIGatewayEvent, Context } from 'aws-lambda';

/**
 * AWS Lambda function. Fetches metadata from YLE External API for all
 * teletext pages and compares timestamps with currently stored data.
 * Stores the PNG images of all pages that have changed since last run.
 * Currently uses S3 for file storage.
 */
export const teletextImagesFetch = async () : Promise<any> => {
  return findAndStoreNewTeletextImages();
};

/**
 * AWS Lambda function. Finds the S3 URL for a teletext page+subpage at a
 * specified point in time and redirects to that URL. Responds to API Gateway
 * events.
 */
export const getTeletextImageAt = async( event : APIGatewayEvent, context : Context ) : Promise<any> => {
  return await httpApi.run( event, context );
};
