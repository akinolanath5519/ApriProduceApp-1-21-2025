const { Storage } = require('@google-cloud/storage');

// Instantiate a Storage client
const storage = new Storage();

async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:', buckets.map(bucket => bucket.name));
  } catch (err) {
    console.error('Error connecting to Google Cloud:');
    
    // Log the full error object and stack trace for more details
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);

    // Log the environment variable to check if it's set correctly
    console.error('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Check for missing or invalid credentials
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Please ensure the path to your service account JSON file is correct.');
    }
  }
}

listBuckets();
