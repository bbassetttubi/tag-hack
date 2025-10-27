#!/bin/bash
# Test Sora API endpoint

API_BASE_URL="http://localhost:4000/api"

echo "🎬 Testing Sora Video Generation..."
echo ""
echo "Creating a new story with prompt..."

# Create a story
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/stories" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Golden Retriever Playing",
    "prompt": "A golden retriever puppy playing in a sunny park, running through grass and catching a frisbee",
    "creatorName": "Test User"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'

# Extract story ID
STORY_ID=$(echo "$RESPONSE" | jq -r '.storyId')
SEGMENT_ID=$(echo "$RESPONSE" | jq -r '.segmentId')
JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId')

if [ "$STORY_ID" != "null" ] && [ -n "$STORY_ID" ]; then
    echo ""
    echo "✅ Story created successfully!"
    echo "   Story ID: $STORY_ID"
    echo "   Segment ID: $SEGMENT_ID"
    echo "   Sora Job ID: $JOB_ID"
    echo ""
    echo "Checking status..."
    
    # Poll status a few times
    for i in {1..5}; do
        sleep 5
        echo ""
        echo "Check #$i - Fetching story details..."
        
        STATUS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/stories/${STORY_ID}")
        
        SEGMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.segments[0].status')
        echo "   Segment status: $SEGMENT_STATUS"
        
        if [ "$SEGMENT_STATUS" == "completed" ]; then
            echo ""
            echo "🎉 Video generation completed!"
            echo "$STATUS_RESPONSE" | jq '.segments[0] | {status, videoUrl, thumbnailUrl}'
            break
        elif [ "$SEGMENT_STATUS" == "failed" ]; then
            echo ""
            echo "❌ Video generation failed"
            break
        fi
    done
    
    echo ""
    echo "📊 Final story state:"
    curl -s -X GET "${API_BASE_URL}/stories/${STORY_ID}" | jq '.'
    
else
    echo "❌ Failed to create story"
    exit 1
fi

