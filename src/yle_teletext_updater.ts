import { pageData, pageImage } from './yle_teletext_client'
import { findLastStoredTimestamp, storeLastTimestamp, storeTeletextImage } from './yle_teletext_image_storage';

const START_AT_PAGE = 100;

/**
 * Checks if the stored version of a teletext page is older than the given
 * timestamp. If the timestamp is newer, fetches new page images and stores
 * them.
 * @param pageNr - the page number to check and store
 * @param timestamp - timestamp to check latest version against
 * @param lastSubpage - number of subpages to store
 * @returns a promise that resolves when all subpage images are stored or failed
 */
const storeTeletextImagesIfNewer = async ( pageNr : number, timestamp : number, lastSubpage : number ) => {
    const lastStoredAt = await findLastStoredTimestamp( pageNr );
    const storePromises : Promise<any>[] = [];
    if ( !lastStoredAt || timestamp > lastStoredAt ) {
        for ( let subpageNr = 1; subpageNr <= lastSubpage; subpageNr++ ) {
            const imgResponse = await pageImage( pageNr, subpageNr );
            const fileData = Buffer.from(imgResponse.data, 'binary');
            storePromises.push( storeTeletextImage( pageNr, subpageNr, timestamp, fileData ) );
        }
        storePromises.push( storeLastTimestamp( pageNr, timestamp ) );
    }
    return Promise.all( storePromises );
};

/**
 * Finds which teletext pages have a newer version available than what is
 * currently stored. Stores the subpage images that are newer.
 * @param pageNr - the page number to start at
 * @returns a promise that resolves when all newer subpage images are stored or failed
 */
export const findAndStoreNewTeletextImages = async ( pageNr : number = START_AT_PAGE ) : Promise<any> => {
    const pageResponse = await pageData( pageNr );
    const pageInfo = pageResponse.data["teletext"]["page"];
    const timestamp = Date.parse( pageInfo["time"] ) / 1000;
    const lastSubpage = parseInt( pageInfo["subpagecount"] );
    const storePromises = storeTeletextImagesIfNewer( pageNr, timestamp, lastSubpage );

    const nextPageNr = parseInt( pageInfo["nextpg"] );
    if ( !nextPageNr ) {
        return storePromises;
    }
    return Promise.all( [ storePromises, findAndStoreNewTeletextImages( nextPageNr ) ] );
};
