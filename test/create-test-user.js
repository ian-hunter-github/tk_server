require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createTestUser() {
  const email = 'testuser@example.com'; // Use a different email for the new user
  const password = 'testpassword123';

  // Create Supabase client with service_role key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Looking up existing user...');

    // Try to get user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) throw getUserError;

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log('Found existing user with same email, deleting...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        existingUser.id
      );

      if (deleteError) {
        console.error('Error deleting existing user:', deleteError.message);
        console.log('Please manually delete the user in the Supabase dashboard if needed.');
      } else {
          console.log('Existing user deleted');
      }
    }

    console.log('Creating new user...');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;

    console.log('✓ Test user created successfully with email confirmed');
    console.log('User ID:', userData.user.id);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
