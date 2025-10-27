#!/bin/bash
# Test Tagging Workflow

API_BASE_URL="http://localhost:4000/api"

echo "🎬 Testing Tagging Workflow..."
echo ""

# 1. Create a story
echo "1️⃣  Creating a story..."
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/stories" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tagging Test Story",
    "prompt": "A magical forest where animals can talk",
    "creatorName": "Alice"
  }')

STORY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.storyId')

if [ "$STORY_ID" != "null" ] && [ -n "$STORY_ID" ]; then
    echo "   ✅ Story created: $STORY_ID"
else
    echo "   ❌ Failed to create story"
    exit 1
fi

echo ""

# 2. Tag a user to continue
echo "2️⃣  Alice tags Bob to continue..."
TAG_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/stories/${STORY_ID}/tag" \
  -H "Content-Type: application/json" \
  -d '{
    "nextContributor": "Bob",
    "taggedBy": "Alice"
  }')

echo "   Response: $(echo "$TAG_RESPONSE" | jq -r '.message')"

echo ""

# 3. Check if Bob can continue
echo "3️⃣  Checking if Bob can continue..."
BOB_CHECK=$(curl -s "${API_BASE_URL}/stories/${STORY_ID}/can-continue?userName=Bob")
BOB_CAN=$(echo "$BOB_CHECK" | jq -r '.canContinue')

if [ "$BOB_CAN" == "true" ]; then
    echo "   ✅ Bob CAN continue"
else
    echo "   ❌ Bob CANNOT continue: $(echo "$BOB_CHECK" | jq -r '.reason')"
fi

echo ""

# 4. Check if Charlie can continue (should be blocked)
echo "4️⃣  Checking if Charlie can continue (should fail)..."
CHARLIE_CHECK=$(curl -s "${API_BASE_URL}/stories/${STORY_ID}/can-continue?userName=Charlie")
CHARLIE_CAN=$(echo "$CHARLIE_CHECK" | jq -r '.canContinue')

if [ "$CHARLIE_CAN" == "false" ]; then
    echo "   ✅ Charlie is correctly blocked: $(echo "$CHARLIE_CHECK" | jq -r '.reason')"
else
    echo "   ❌ Charlie should not be able to continue"
fi

echo ""

# 5. View story state with tag
echo "5️⃣  Story state with tag:"
curl -s "${API_BASE_URL}/stories/${STORY_ID}" | jq '.story | {title, nextContributor, taggedBy, status}'

echo ""

# 6. Clear the tag
echo "6️⃣  Alice clears the tag..."
CLEAR_RESPONSE=$(curl -s -X DELETE "${API_BASE_URL}/stories/${STORY_ID}/tag")
echo "   Response: $(echo "$CLEAR_RESPONSE" | jq -r '.message')"

echo ""

# 7. Check if Charlie can continue now
echo "7️⃣  Checking if Charlie can continue after tag cleared..."
CHARLIE_CHECK2=$(curl -s "${API_BASE_URL}/stories/${STORY_ID}/can-continue?userName=Charlie")
CHARLIE_CAN2=$(echo "$CHARLIE_CHECK2" | jq -r '.canContinue')

if [ "$CHARLIE_CAN2" == "true" ]; then
    echo "   ✅ Charlie CAN now continue"
else
    echo "   ❌ Charlie still blocked: $(echo "$CHARLIE_CHECK2" | jq -r '.reason')"
fi

echo ""

# 8. Final story state
echo "8️⃣  Final story state:"
curl -s "${API_BASE_URL}/stories/${STORY_ID}" | jq '.story | {title, nextContributor, taggedBy, status}'

echo ""
echo "🎉 Tagging workflow test complete!"

