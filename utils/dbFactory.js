const SupabaseDB = require('./SupabaseDB');
const DatasourceInterface = require('./DatasourceInterface');

function getDatabaseInstance() {
    const dbType = process.env.DB_TYPE || 'supabase';
    let isTestEnvironment = process.env.NODE_ENV === 'test';

    // TEMPORARY WORKAROUND: Force use of service role key if not in test environment
    // due to issues with Netlify Dev and environment variables.
    if (process.env.NODE_ENV !== 'test') {
      console.warn("WARNING: Using Supabase SERVICE_ROLE_KEY because NODE_ENV is not 'test'.  This bypasses RLS.  Ensure RLS is configured correctly for production.");
      isTestEnvironment = true; 
    }

    // Handle both spellings (supabase and superbase) for backward compatibility
    if (dbType === 'supabase' || dbType === 'superbase') {
        return new SupabaseDB(isTestEnvironment);
    }

    throw new Error('Unsupported DB_TYPE: ' + dbType);
}

module.exports = { getDatabaseInstance };
