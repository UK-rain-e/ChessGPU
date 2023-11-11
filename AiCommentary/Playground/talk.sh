#!/bin/bash

if [ -z "$1" ] 
then
    echo "Pass a text"
    exit 1
fi

say $1
exit 0

time curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "'"${1//\"/\\\"}"'",
    "voice": "onyx",
    "response_format": "mp3",
    "speed": "1"
  }' \
  --output speech.mp3

afplay speech.mp3

