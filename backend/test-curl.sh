#!/bin/bash

echo "🔍 Testing Backend API with curl"
echo "================================"

BASE_URL="http://localhost:3001"

echo -e "\n1. Testing Health Endpoint"
echo "curl -v $BASE_URL/api/health"
curl -v $BASE_URL/api/health 2>&1 | grep -E "(< HTTP|< Content-Type|{)"

echo -e "\n\n2. Testing Test Endpoint"
echo 'curl -v -X POST -H "Content-Type: application/json" -d "{\"test\":\"data\"}" '$BASE_URL'/api/test'
curl -v -X POST -H "Content-Type: application/json" -d '{"test":"data"}' $BASE_URL/api/test 2>&1 | grep -E "(< HTTP|< Content-Type|{)"

echo -e "\n\n3. Testing Chat Message Endpoint"
echo 'curl -v -X POST -H "Content-Type: application/json" -d "{\"message\":\"Hello\",\"context\":{}}" '$BASE_URL'/api/chat/message'
curl -v -X POST -H "Content-Type: application/json" -d '{"message":"Hello","context":{}}' $BASE_URL/api/chat/message 2>&1 | grep -E "(< HTTP|< Content-Type|{)"

echo -e "\n\n4. Testing Data Stats Endpoint"
echo "curl -v $BASE_URL/api/data/stats"
curl -v $BASE_URL/api/data/stats 2>&1 | grep -E "(< HTTP|< Content-Type|{)"

echo -e "\n\n5. Testing Root Path"
echo "curl -v $BASE_URL/"
curl -v $BASE_URL/ 2>&1 | grep -E "(< HTTP|< Content-Type|<)"

echo -e "\n\nDone!"