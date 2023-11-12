# ChessGPU

Dive into the realm of chess like never before with our groundbreaking 3D chess game, a marvel of modern web technologies and artificial intelligence. This project leverages the cutting-edge capabilities of WebGPU and WebWorker to deliver an unparalleled, immersive chess experience directly in your browser.

## Quickstart

Here's the demos:
- [PvE](https://uk-rain-e.github.io/ChessGPU/index.html)
- [PvP](https://uk-rain-e.github.io/ChessGPU/pvp.html)
- [Watch](https://uk-rain-e.github.io/ChessGPU/watch.html)

Here's how run the examples:
```sh
$ git clone ...
$ git-lfs install  # needs only first time
$ git-lfs pull     # needs only first time
$ npm run run
```

To run AI commentary:
```
cd AiCommentary
./setup.sh
./run_worker.sh
```

## Technologies Used

- **PlayCanvas: WebGPU & WebWorker:** WebGPU for rendering high-performance graphics and ensuring the game runs smoothly on a variety of devices. WebWorker to manage stockfish and AI commentary. PlayCanvas as a powerful 3D engine used to create and manage the realistic chess scene.
- **Stable Diffusion:** For generating dynamic and captivating backgrounds.
- **OpenAI's GPT-4 and TTS:** Leveraged for generating intelligent and context-aware audio commentary during games.
- **Stockfish Engine:** Integrated for those who wish to play against a challenging AI opponent. Can also be potentially used to generate a scene based on winning probability of each team.
- **Custom Effects & Animations:** Developed to enhance the visual experience and interaction with the game pieces. 
