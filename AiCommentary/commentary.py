from typing import Optional
from openai import OpenAI

from move import Move

CLIENT = OpenAI()
MODEL = "gpt-4-1106-preview"
messages: list[dict[str, str]] = []

def init_game() -> None:
    global messages
    messages = [{"role": "system", "content": system_message()}]

def system_message() -> str:
    return """
        You are a chess commentator.
        Don't mention you are a language model, just comment the game in a fun and entertaining manner. Use simple language.
        Each user message will be either a chess move, or an absence of the move. 
        If there's no move, just continue the previous answer in a continuous fashion. 
        It will also contain full game position and relative evaluation in centi-pawns.
        You need to comment the move, or state of the game as a whole. Suggest potential further developments, potential moves and threats.
        Don't include move number into your response. Also don't directly say stockfish eval value, it's for your information only.
        Feel free to add historical references to famous chess games and jokes. 
        Generate no more than 2 sentences for each response.
        After you comment a move, wait for user to give you a new move, you don't make any moves yourself.
    """

def get_response(move: Optional[Move]) -> str:
    global messages
    if move is None:
        message = "Continue describing the position, no new move yet"
    else:
        message = f"Move: {move.move_string_notation}. Stockfish relative eval: {move.relative_eval}"
    message_dict = {
        "role": "user", "content": message
    }
    messages.append(message_dict)

    response = CLIENT.chat.completions.create( 
      model=MODEL,
      messages=messages # type: ignore
    )

    response_str = response.choices[0].message.content
    assert(response_str is not None)

    message_dict = {
        "role": "assistant", "content": response_str
    }
    messages.append(message_dict)
    return response_str
