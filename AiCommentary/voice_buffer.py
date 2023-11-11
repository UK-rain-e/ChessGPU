from typing import Optional
from pathlib import Path
from threading import Lock

import commentary
import voice
from move import Move

MAX_COMMENTARY_REQUESTS = 1
DEFAULT_AUDIO_PATH = Path("./default_background_music.mp3")

class VoiceBuffer:
    def __init__(self) -> None:
        commentary.init_game()
        self.audio_buffer: list[Path] = []
        self.mutex = Lock()
        self.commentary_requests = 0

    def tick(self) -> None:
        with self.mutex:
            if len(self.audio_buffer) == 0: 
                self._add_new_commentary(None)

    def make_move(self, move: Move) -> None:
        with self.mutex:
            self.audio_buffer = []
            self._add_new_commentary(move)

    def pop_current_audio(self) -> Path:
        with self.mutex:
            if len(self.audio_buffer) == 0:
                self._add_new_commentary(None)
            audio = self.audio_buffer[0]
            self.audio_buffer.pop(0)
            return audio
        

    def _add_new_commentary(self, move: Optional[Move]):
        self.commentary_requests += 1
        if self.commentary_requests > MAX_COMMENTARY_REQUESTS:
            print(f"Commentary requests exceeded limit {MAX_COMMENTARY_REQUESTS}. Returning default audio")
            self.audio_buffer.append(DEFAULT_AUDIO_PATH)
            return
        # print(f"Requesting commentary for move: {move}. Current buffer size={len(self.audio_buffer)}", flush=True)
        comment = commentary.get_response(move)
        # print(f"Commentary: {comment}", flush=True)
        audio_file = voice.text_to_audio(comment)
        self.audio_buffer.append(audio_file)