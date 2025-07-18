// Test database connection and data
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...');

  try {
    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, company_name')
      .eq('account_type', 'company')
      .limit(1);

    if (testError) {
      console.error('Connection test failed:', testError);
      return;
    }

    console.log('✅ Database connection successful');
    console.log('Sample company data:', testData);

    // Test 2: Check company_feedback table
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('company_feedback')
      .select('*')
      .limit(5);

    if (feedbackError) {
      console.error('Feedback query failed:', feedbackError);
    } else {
      console.log('✅ Company feedback data:', feedbackData);
    }

    // Test 3: Check completed services
    const { data: completedData, error: completedError } = await supabase
      .from('service_request_responses')
      .select('*')
      .eq('response_status', 'completed')
      .limit(5);

    if (completedError) {
      console.error('Completed services query failed:', completedError);
    } else {
      console.log('✅ Completed services data:', completedData);
    }

    // Test 4: Check service_feedback table
    const { data: serviceFeedbackData, error: serviceFeedbackError } = await supabase
      .from('service_feedback')
      .select('*')
      .limit(5);

    if (serviceFeedbackError) {
      console.error('Service feedback query failed:', serviceFeedbackError);
    } else {
      console.log('✅ Service feedback data:', serviceFeedbackData);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase(); 