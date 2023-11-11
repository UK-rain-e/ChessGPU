import random
import string
import subprocess
import openai
from pathlib import Path

#from playsound import playsound # type: ignore

def get_random_string(length = 10) -> str:
    result_str = ''.join(random.choice(string.ascii_letters) for i in range(length))
    return result_str

def text_to_audio_say(text: str) -> Path:
    voice = "Daniel"
    Path("./generated").mkdir(parents=True, exist_ok=True)
    output_path = "./generated/" + get_random_string() + ".aiff"
    subprocess.run(["say", "-v", voice, "-o", output_path, text])
    return Path(output_path)

def text_to_audio_openai(text: str) -> Path:
    Path("./generated").mkdir(parents=True, exist_ok=True)
    output_path = Path("./generated/" + get_random_string() + ".mp3")
    response = openai.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text
    )
    response.stream_to_file(output_path)
    return output_path

def text_to_audio(text: str) -> Path:
    return text_to_audio_openai(text)

#def play_audio(audio_path: Path) -> None:
#    playsound(audio_path)
