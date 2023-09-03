/**
 * Finds and returns the value of the specified environment variable.
 * If the environment variable is not found, throws an error.
 * The return value of this function is always guaranteed to be the actual
 * value of the specified environment variable.
 * This allows skipping the writing of boilerplate guard clauses.
 * @param varName - The environment variable's name
 * @returns the environment variable's value
 */
export const ensureEnvPresence = ( varName : string ) : string => {
    const envVarValue = process.env[varName];
    if ( !envVarValue ) {
        throw new Error(`'${varName}' environment variable missing!`);
    }
    return envVarValue;
};

export const TESTING : boolean = process.env['NODE_ENV'] === 'test';

/**
 * Takes a value and throws an error if the value is missing (null or undefined)
 * Otherwise returns the value itself.
 * This reduces boilerplate guard clauses in cases where a value must exist
 * in order for the code to succesfully run.
 * @param value the value to check
 * @returns value, if it is present
 */
export const ensurePresence = <T> ( value : T | undefined ) : T => {
    if ( value === null || typeof value === 'undefined' ) {
        throw new Error(`Required value is missing!`);
    }
    return value;
};
