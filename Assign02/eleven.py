import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import play

load_dotenv()

API_KEY = os.getenv('API_KEY')

client = ElevenLabs(
    api_key=API_KEY
)

audio = client.text_to_speech.convert(
    text="This is supposed to be long text Xiohuanshu, I am also talking to stall to make sure I have enough time to hear it out of the stupid computer",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2",
    output_format="mp3_44100_128",
)

play(audio)