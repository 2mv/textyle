import { GetObjectCommand, ListObjectsV2Command, NoSuchKey, PutObjectCommand, PutObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import { TESTING, ensureEnvPresence } from './util';

const S3 = new S3Client();
const LAST_TIMESTAMP_KEY = "LAST_TS";
const IMAGES_BUCKET = ensureEnvPresence( 'IMAGES_BUCKET' );
const IMAGES_BUCKET_HOSTNAME = ensureEnvPresence('IMAGES_BUCKET_HOSTNAME');

/**
 * Generates S3 key for the specified teletext page+subpage at given point in time.
 * @param pageNr - The page number to generate key for
 * @param subpageNr - The subpage number to generate key for
 * @param timestamp - The point in time to generate key for (in unix epoch format)
 * @returns S3 key for image storage
 */
export const teletextImageStorageKey = ( pageNr : number, subpageNr : number, timestamp: number ) : string => {
    const targetDirectoryName = `${pageNr}/${subpageNr}`;
    return `${targetDirectoryName}/${timestamp}.png`;
};

/**
 * Generates the S3 key for the object that contains the last changed timestamp
 * for the specified teletext page number.
 * @param pageNr - The page number to generate key for
 * @returns S3 key for last change timestamp object
 */
const lastTimestampFileName = ( pageNr : number ) : string => {
    return `${pageNr}/${LAST_TIMESTAMP_KEY}`;
}

/**
 * Stores the PNG image of a specified teletext page+subpage (at given point in 
 * time) in S3.
 * @param pageNr - The page number of the image
 * @param subpageNr - The subpage number of the image
 * @param timestamp - The timestamp of the page edit in unix epoch format
 * @param imageData - The actual image data as a Buffer object
 * @returns a promise that resolves when the S3 write is done or fails
 */
export const storeTeletextImage = async ( pageNr : number, subpageNr : number, timestamp: number, imageData : Buffer ) : Promise<PutObjectCommandOutput> => {
    const imageFileName = teletextImageStorageKey( pageNr, subpageNr, timestamp );
    const writeImageCommand = new PutObjectCommand({
        Bucket: IMAGES_BUCKET,
        Key: imageFileName,
        Body: imageData
    });

    return S3.send(writeImageCommand);
};

/**
 * Stores the last edit timestamp of a page in S3.
 * @param pageNr - The teletext page number
 * @param timestamp - The timestamp of the page edit in unix epoch format
 * @returns a promise that resolves when the S3 write is done or fails
 */
export const storeLastTimestamp = async ( pageNr : number, timestamp : number ) : Promise<PutObjectCommandOutput> => {
    const writeLastTimestampCommand = new PutObjectCommand({
        Bucket: IMAGES_BUCKET,
        Key: lastTimestampFileName( pageNr ),
        Body: timestamp.toString()
    });
    return S3.send(writeLastTimestampCommand);
};

/**
 * Finds the timestamp of the last stored edit of a page.
 * @param pageNr - The page number to find the timestamp for
 * @returns the unix epoch timestamp of the last stored edit of the specified 
 * page or `undefined` if unknown.
 */
export const findLastStoredTimestamp = async ( pageNr : number ) : Promise<number | undefined> => {
    const getLastTimestampCommand = new GetObjectCommand({
        Bucket: IMAGES_BUCKET,
        Key: lastTimestampFileName( pageNr )
    });

    try {
        const responseBody = (await S3.send( getLastTimestampCommand )).Body;
        if ( !responseBody ) {
            return;
        }
        const lastTimestamp = await responseBody.transformToString();
        if ( !lastTimestamp ) {
            return;
        }
        return parseInt( lastTimestamp );
    } catch ( s3Error : any ) {
        if ( s3Error instanceof NoSuchKey && s3Error.name === 'NoSuchKey' ) {
            return;
        }
        throw( s3Error );
    }
};

/**
 * Finds all available versions of a page+subpage and returns their timestamps.
 * @param pageNr - The page number to find the timestamps for
 * @param subpageNr - The subpage number to find the timestamps for
 * @returns Available unix epoch timestamps for the specified page+subpage
 */
export const fetchAvailableTimestamps = async ( pageNr : number, subpageNr : number ) : Promise<number[]> => {
    const listAvailableImagesCommand = new ListObjectsV2Command({
        Bucket: IMAGES_BUCKET,
        Prefix: `${pageNr}/${subpageNr}`
    });

    // FIXME: this is limited to 1000 results unless paging is implemented. 
    // maybe just store the list as a separate object.
    const response = await S3.send(listAvailableImagesCommand);
    if ( !response.Contents ) {
        return [];
    }

    const filenames = response.Contents.map( (obj) => { return obj.Key?.split('/').pop() } );
    return filenames.map( (filename) => { return parseInt( filename?.split('.')[0] || '' ) } );
};

export const imagePublicUrl = ( pageNr : number, subpageNr : number, timestamp : number ) => {
    const filename = teletextImageStorageKey( pageNr, subpageNr, timestamp );
    return `https://${IMAGES_BUCKET_HOSTNAME}/${filename}`;
};

export const testing = TESTING ? {
    lastTimestampFileName: lastTimestampFileName
} : undefined;
