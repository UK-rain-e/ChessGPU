from typing import Optional
from pathlib import Path
from threading import Lock

import commentary
import voice
from move import Move

class VoiceBuffer:
    def __init__(self) -> None:
        commentary.init_game()
        self.audio_buffer: list[Path] = []
        self.mutex = Lock()

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
        # print(f"Requesting commentary for move: {move}. Current buffer size={len(self.audio_buffer)}", flush=True)
        comment = commentary.get_response(move)
        # print(f"Commentary: {comment}", flush=True)
        audio_file = voice.text_to_audio(comment)
        self.audio_buffer.append(audio_file)