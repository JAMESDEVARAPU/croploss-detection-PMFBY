#!/usr/bin/env python3
import sys
import json
import io

def transcribe_audio(audio_data, language):
    """
    Simulate offline Whisper transcription
    In production, use: import whisper
    model = whisper.load_model("base")
    result = model.transcribe(audio_data, language=language)
    """
    # For demo, return simulated transcription
    simulated_transcriptions = {
        'en': "Check my crop health at field 5",
        'hi': "मेरी फसल की जांच करें खेत 5 पर",
        'te': "నా పంట ఆరోగ్యం చూడండి పొలం 5లో"
    }

    transcription = simulated_transcriptions.get(language, simulated_transcriptions['en'])

    return {
        "transcription": transcription,
        "confidence": 0.95
    }

if __name__ == "__main__":
    language = sys.argv[1] if len(sys.argv) > 1 else 'en'

    # Read audio data from stdin
    audio_data = sys.stdin.buffer.read()

    try:
        result = transcribe_audio(audio_data, language)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
