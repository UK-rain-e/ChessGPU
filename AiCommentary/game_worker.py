import sys
import threading
from queue import Queue
from enum import Enum
from voice_buffer import VoiceBuffer
import voice
from move import Move
from time import sleep

import chess
import chess.engine

class Type(Enum):
    TICK = 1
    MOVE = 2
    STOP = 3


VOICE_TASKS: Queue = Queue()
VOICE_BUFFER = VoiceBuffer()
SHOULD_STOP = False

def voice_buffer_thread():
    while True:
        task = VOICE_TASKS.get()
        task_type = task[0]
        if task_type == Type.STOP:
            break
        elif task_type == Type.TICK:
            VOICE_BUFFER.tick()
        elif task_type == Type.MOVE:
            move = task[1]
            VOICE_BUFFER.make_move(move)
        else:
            raise RuntimeError("Unknown task type")

def moves_thread():
    board = chess.Board()
    engine = chess.engine.SimpleEngine.popen_uci("stockfish")    

    for line in sys.stdin:
        line = line.strip()
        if line.startswith("move"):
            move_san = line[5:]
            board.push_san(move_san)
            info = engine.analyse(board, chess.engine.Limit(time=0.5))
            score = info["score"].relative.score(mate_score=100000)
            assert(score is not None)
            move = Move(move_san, score)
            VOICE_TASKS.put((Type.MOVE, move))
        elif line.startswith("audio"):
            audio = VOICE_BUFFER.pop_current_audio()
            print(audio)
        else:
            raise RuntimeError("Invalid request")

# def audio_thread():
#     while not SHOULD_STOP:
#         audio = VOICE_BUFFER.pop_current_audio()
#         voice.play_audio(audio)

def ticks_thread():
    while not SHOULD_STOP:
        sleep(0.1)
        VOICE_TASKS.put((Type.TICK,))


def main():
    global SHOULD_STOP
    moves = threading.Thread(target=moves_thread)
    voice = threading.Thread(target=voice_buffer_thread)
    # audio = threading.Thread(target=audio_thread)
    ticks = threading.Thread(target=ticks_thread)
 
    moves.start()
    voice.start()
    # audio.start()
    ticks.start()
 
    moves.join()
    VOICE_TASKS.put((Type.STOP, ))
    SHOULD_STOP = True
    voice.join()
    # audio.join()
    ticks.join()

if __name__ == "__main__":
    main()