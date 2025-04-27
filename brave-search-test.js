// Simple test script for Brave Search API
const https = require('https');

const BRAVE_API_KEY = 'BSA4qQdx9ZVF4swcQ6UJ_88mNdbwBmG';
const query = 'latest AI news';

console.log('Testing Brave Search API key...');

const options = {
  hostname: 'api.search.brave.com',
  path: `/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'X-Subscription-Token': BRAVE_API_KEY
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log('API Key is valid!');
        console.log('Search results:');
        
        if (response.web && response.web.results) {
          response.web.results.forEach((result, index) => {
            console.log(`\n[${index + 1}] ${result.title}`);
            console.log(`URL: ${result.url}`);
            console.log(`Description: ${result.description}`);
          });
        } else {
          console.log('No results found or unexpected response format.');
          console.log('Response:', JSON.stringify(response, null, 2));
        }
      } catch (error) {
        console.error('Error parsing JSON response:');
        console.error(error);
        console.log('Raw response:', data);
      }
    } else {
      console.error('Error response from Brave Search API:');
      console.error(`Status code: ${res.statusCode}`);
      try {
        const errorData = JSON.parse(data);
        console.error('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Response:', data);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request to Brave Search API:');
  console.error(error);
});

req.end();
