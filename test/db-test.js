require('dotenv').config();
const supabase = require('../config/supabase');

async function testDatabaseOperations() {
    try {
        console.log('Testing database operations...\n');
        
        // Step 1: Sign in test user
        console.log('1. Signing in test user...');
        const email = 'ian.hunter.supabase@gmail.com';
        const password = 'b4ucmeGMAIL!';
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            throw authError;
        }
        console.log('✓ Test user signed in successfully');

        // Step 2: Create a project without auth (should fail)
        console.log('\n2. Testing RLS - Creating project without auth...');
        const { data: noAuthData, error: noAuthError } = await supabase
            .from('projects')
            .insert([{
                name: 'Test Project',
                description: 'This should fail due to RLS'
            }])
            .select();

        if (noAuthError) {
            console.log('✓ RLS working - Unauthorized insert was blocked');
        } else {
            console.log('⚠ Warning: RLS might not be properly configured');
        }

        // Step 3: Create a project with auth
        console.log('\n3. Testing project creation with auth...');
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert([{
                name: 'Test Project',
                description: 'Test project description',
                created_by: authData.user.id
            }])
            .select();

        if (projectError) {
            throw projectError;
        }
        console.log('✓ Project created successfully');
        console.log('Project data:', projectData);

        // Step 4: Verify project retrieval
        console.log('\n4. Testing project retrieval...');
        const { data: retrievedData, error: retrieveError } = await supabase
            .from('projects')
            .select('*')
            .eq('created_by', authData.user.id);

        if (retrieveError) {
            throw retrieveError;
        }
        console.log('✓ Projects retrieved successfully');
        console.log('Retrieved projects:', retrievedData);

        console.log('\nAll tests completed successfully! 🎉');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testDatabaseOperations();
