/**
 * Finds and returns the value of the specified environment variable.
 * If the environment variable is not found, throws an error.
 * The return value of this function is always guaranteed to be the actual
 * value of the specified environment variable.
 * This allows skipping the writing of boilerplate guard clauses.
 * @param varName - The environment variable's name
 * @returns the environment variable's value
 */
export const ensureEnvPresence = ( varName : string ) => {
    const envVarValue = process.env[varName];
    if ( !envVarValue ) {
        throw new Error(`${envVarValue} environment variable missing!`);
    }
    return envVarValue;
};
