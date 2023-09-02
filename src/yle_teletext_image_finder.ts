import { ensureEnvPresence } from './util';
import { fetchAvailableTimestamps, teletextImageStorageKey } from "./yle_teletext_image_storage";

const IMAGES_BUCKET_HOSTNAME = ensureEnvPresence('IMAGES_BUCKET_HOSTNAME');

/**
 * Finds the PNG image file URL of the requested page from S3. The target 
 * timestamp specifies the latest allowed timestamp to fetch. If no earlier
 * timestamps are found, returns `undefined`.
 * In short, finds the URL to the point in time specified by the timestamp
 * parameter.
 * @param pageNr - The page number to find image URL for
 * @param subpageNr - The subpage number to find image URL for
 * @param targetTimestamp - The point in time to find image URL for
 * @returns a URL string, or `undefined` if specified page or point in time not found
 */
export const resolveTeletextPageImageUrlAt = async ( pageNr : number, subpageNr : number, targetTimestamp : number ) => {
    const availableTimestamps = await fetchAvailableTimestamps( pageNr, subpageNr );
    availableTimestamps.sort( ( a, b ) => b - a );

    const timestampToFetch = availableTimestamps.find( ( timestamp ) => timestamp <= targetTimestamp );
    if ( !timestampToFetch ) {
        return;
    }

    const filename = teletextImageStorageKey( pageNr, subpageNr, timestampToFetch );
    return `https://${IMAGES_BUCKET_HOSTNAME}/${filename}`;
};
