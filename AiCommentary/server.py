import uuid
import subprocess

from pathlib import Path
from fastapi import FastAPI, HTTPException, File, Response # type: ignore
from fastapi.responses import FileResponse # type: ignore
from fastapi.middleware.cors import CORSMiddleware #type: ignore
from pydantic import BaseModel

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartGameResponse(BaseModel):
    token: str

class Move(BaseModel):
    token: str
    move: str

class Game:
    def __init__(self, token: str) -> None:
        print(f"Initialising game. Token={token}")
        self.token = token
        self.process = subprocess.Popen(
            ["./run_worker.sh"],
            stdin=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

    def make_move(self, move: str) -> None:
        print(f"Making move {move}. Token={self.token}")
        assert(self.process.stdin is not None)
        self.process.stdin.write(f"move {move}\n")
        self.process.stdin.flush()

    def get_audio(self) -> Path:
        print(f"Requesting audio. Token={self.token}")
        assert(self.process.stdin is not None)
        self.process.stdin.write(f"audio\n")
        self.process.stdin.flush()

        assert(self.process.stderr is not None)
        output = self.process.stderr.readline().strip()
        output = Path(output)
        assert(output.exists())
        return output
        

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
    return FileResponse(file_path, media_type="audio/mpeg")