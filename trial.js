const axios = require('axios');

async function testApiCall() {
  try {
    // Replace with the actual URL of your API route
    const response = await axios.get('http://localhost:3000/url/getUrlDetails');
    
    // Log the response from the server
    console.log('Response Data:', response.data);
  } catch (error) {
    // Handle errors
    if (error.response) {
      // Server responded with a status code other than 2xx
      console.log('Error Response:', error.response.data);
      console.log('Error Status:', error.response.status);
    } else if (error.request) {
      // No response received
      console.log('Error Request:', error.request);
    } else {
      // Something else happened
      console.log('Error Message:', error.message);
    }
  }
}

// Call the function to test the API
module.exports = testApiCall;