require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key (first 10 chars):', supabaseAnonKey?.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection by trying to fetch from a non-existent table (should give permission error, not auth error)
supabase
  .from('manutencoes_campo')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Connection test failed:');
      console.error('Error message:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('Connection successful!');
      console.log('Data:', data);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });