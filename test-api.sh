#!/bin/bash

echo "=== KrishiRakshak API Endpoint Tests ==="
echo

# 1. Test User Creation/Login
echo "1. Testing User Login/Registration:"
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9959321421", "name": "Test Farmer"}' | jq .
echo

# 2. Test Voice Command Processing
echo "2. Testing Voice Command Processing:"
curl -X POST http://localhost:5000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"command": "Check my cotton field", "mobile": "9959321421"}' | jq .
echo

# 3. Test XAI Analysis with Hindi Output
echo "3. Testing XAI Analysis (Hindi):"
curl -X POST http://localhost:5000/api/xai-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "ndviBefore": 0.8,
    "ndviCurrent": 0.3,
    "latitude": 20.5937,
    "longitude": 78.9629,
    "cropType": "cotton",
    "language": "hi"
  }' | jq .predictedLoss,.pmfbyEligibility.eligible,.farmerFriendlyExplanation
echo

# 4. Test XAI Analysis with Telugu Output
echo "4. Testing XAI Analysis (Telugu):"
curl -X POST http://localhost:5000/api/xai-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "ndviBefore": 0.7,
    "ndviCurrent": 0.4,
    "latitude": 17.3850,
    "longitude": 78.4867,
    "cropType": "rice",
    "language": "te"
  }' | jq .predictedLoss,.pmfbyEligibility.eligible,.farmerFriendlyExplanation
echo

# 5. Test Crop Analysis Creation
echo "5. Testing Crop Analysis Creation:"
ANALYSIS_RESULT=$(curl -s -X POST http://localhost:5000/api/crop-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 20.5937,
    "longitude": 78.9629,
    "fieldArea": 2.5,
    "cropType": "cotton",
    "mobile": "9959321421"
  }')
echo $ANALYSIS_RESULT | jq .

# Extract analysis ID for next test
ANALYSIS_ID=$(echo $ANALYSIS_RESULT | jq -r .id)
echo "Analysis ID: $ANALYSIS_ID"
echo

# 6. Test Crop Analysis Retrieval
echo "6. Testing Crop Analysis Retrieval:"
if [ "$ANALYSIS_ID" != "null" ] && [ "$ANALYSIS_ID" != "" ]; then
  sleep 2  # Wait for processing
  curl -X GET "http://localhost:5000/api/crop-analysis/$ANALYSIS_ID" | jq .
else
  echo "No valid analysis ID to test retrieval"
fi
echo

# 7. Test User Retrieval
echo "7. Testing User Retrieval:"
curl -X GET http://localhost:5000/api/users/9959321421 | jq .
echo

echo "=== API Test Complete ==="