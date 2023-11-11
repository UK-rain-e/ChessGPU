import uuid
import subprocess

from pathlib import Path
from fastapi import FastAPI, HTTPException, File, Response # type: ignore
from fastapi.responses import FileResponse # type: ignore
from pydantic import BaseModel

app = FastAPI()

MAX_AUDIOS_PER_SESSION = 5
DEFAULT_AUDIO_PATH = Path("./default_background_music")

class StartGameResponse(BaseModel):
    token: str

class Move(BaseModel):
    token: str
    move: str

class Game:
    def __init__(self, token: str) -> None:
        print(f"Initialising game. Token={token}")
        self.token = token
        self.audio_counter = 0
        self.process = subprocess.Popen(
            ["./run_worker.sh"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True
        )

    def make_move(self, move: str) -> None:
        print(f"Making move {move}. Token={self.token}")
        assert(self.process.stdin is not None)
        self.process.stdin.write(f"move {move}\n")
        self.process.stdin.flush()

    def get_audio(self) -> Path:
        self.audio_counter += 1
        print(f"Requesting audio. Token={self.token}. Request counter = {self.audio_counter}")
        if self.audio_counter > MAX_AUDIOS_PER_SESSION:
            print(f"Audio counter exceeded limit {MAX_AUDIOS_PER_SESSION}. Returning default audio")
            return DEFAULT_AUDIO_PATH
        assert(self.process.stdin is not None)
        self.process.stdin.write(f"audio\n")
        self.process.stdin.flush()

        assert(self.process.stdout is not None)
        output = self.process.stdout.readline()
        return Path(output)
        

games: dict[str, Game] = {}

@app.post("/start_game", response_model=StartGameResponse)
def start_game():
    token = str(uuid.uuid4())
    games[token] = Game(token) 
    return StartGameResponse(token=token)

@app.post("/move")
def make_move(move: Move):
    if move.token not in games:
        raise HTTPException(status_code=404, detail="Game not found")

    games[move.token].make_move(move.move)
    return {"detail": "Move registered"}

@app.get("/get_audio/{token}")
def get_audio(token: str):
    if token not in games:
        raise HTTPException(status_code=404, detail="Game not found")

    file_path = games[token].get_audio()
    return FileResponse(file_path, media_type="audio/mpeg", filename="audio.mp3")