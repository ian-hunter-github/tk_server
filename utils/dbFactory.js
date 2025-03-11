const SupabaseDB = require('./SupabaseDB');
const DatasourceInterface = require('./DatasourceInterface');

function getDatabaseInstance() {
    switch (process.env.DB_TYPE) {
        case 'supabase':
            return new SupabaseDB();
        default:
            throw new Error('Unsupported DB_TYPE');
    }
}

module.exports = { getDatabaseInstance };
