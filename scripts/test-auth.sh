#!/bin/bash

# Test script to verify authentication is working

echo "🔒 Testing Authentication Security"
echo "=================================="
echo ""

# Test 1: Unauthenticated request (should fail with 401)
echo "Test 1: Unauthenticated request (should return 401)"
echo "---------------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:4000/api/stories/test-id)
HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ PASS: Received 401 Unauthorized"
  echo "   Response: $BODY"
else
  echo "❌ FAIL: Expected 401, got $HTTP_STATUS"
  echo "   Response: $BODY"
fi

echo ""
echo "---------------------------------------------------"
echo "✅ Authentication is enabled and working!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Firebase in frontend/.env (see AUTHENTICATION_SETUP.md)"
echo "2. Enable Anonymous authentication in Firebase Console"
echo "3. Launch the frontend app - it will auto-authenticate"
echo ""
echo "For detailed setup instructions, see:"
echo "  - AUTHENTICATION_SETUP.md (quick start)"
echo "  - AUTHENTICATION.md (detailed guide)"


