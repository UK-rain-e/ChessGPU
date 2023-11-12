function collectPieces() {
    const pieceCount = [
        { piece: "R", count: 2 },
        { piece: "B", count: 2 },
        { piece: "N", count: 2 },
        { piece: "Q", count: 1 },
        { piece: "K", count: 1 },
        { piece: "P", count: 8 },
    ];

    var pieces = {};

    for (let x of pieceCount) {
        const piece = x.piece;
        const cnt = x.count;

        for (let color of ["W", "B"]) {
            if (cnt === 1) {
                const name = `${piece}${color}`;
                const pieceEntity = pc.app.root.findByName(name)
                pieces[pieceEntity.name] = pieceEntity
            } else {
                for (i = 1; i <= cnt; i++) {
                    const name = `${piece}${color}${i}`
                    const pieceEntity = pc.app.root.findByName(name)
                    pieces[pieceEntity.name] = pieceEntity
                }
            }
        }
    }

    return pieces
}

function chessCellToCoordinates(chessCell) {
    var file = chessCell.charCodeAt(0) - 'a'.charCodeAt(0) - 3.5;
    var rank = -parseInt(chessCell.charAt(1), 10) + 4.5;
    return { x: file, y: rank };
}

const moves = (function () {
    var chess = new Chess()
    chess.loadPgn(`[Event "F/S Return Match"]
    [Site "Belgrade, Serbia JUG"]
    [Date "1992.11.04"]
    [Round "29"]
    [White "Fischer, Robert J."]
    [Black "Spassky, Boris V."]
    [Result "1/2-1/2"]

    1. e4 e5 2. Nf3 Nc6 3. Bb5 {This opening is called the Ruy Lopez.} 3... a6
    4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7
    11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5
    Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6
    23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5
    hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5
    35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6
    Nf2 42. g4 Bd3 43. Re6 1/2-1/2
    `);
    return chess.history({verbose: true});
}());
var imove = 0;

function areObjectsEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }

    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
        return false;
    }


    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}


const getBase = (piece) => (piece.type + piece.color).toUpperCase();

function getMoves(oldBoard, newBoard) {
    var mismatch = [];
    for (i = 0; i < 8; ++i) {
        for (j = 0; j < 8; ++j) {
            if (oldBoard[i][j] == null && newBoard[i][j] == null) continue
            if (oldBoard[i][j] == null || newBoard[i][j] == null) {
                mismatch.push(oldBoard[i][j] == null
                    ? newBoard[i][j].square
                    : oldBoard[i][j].square)
                continue
            }
            if (getBase(oldBoard[i][j]) != getBase(newBoard[i][j])) {
                mismatch.push(oldBoard[i][j].square)
            }
        }
    }

    const getBaseSquare = (board, square) => {
        const x = "a8".charCodeAt(1) - square.charCodeAt(1)
        const y = square.charCodeAt(0) - "a8".charCodeAt(0)
        if (board[x][y] == null)
            return null
        return getBase(board[x][y])
    }

    var movements = {};
    for (let pos of mismatch) {
        if (getBaseSquare(oldBoard, pos) != null)
            movements[getBaseSquare(oldBoard, pos)] = { old: null, new: null }
        if (getBaseSquare(newBoard, pos) != null)
            movements[getBaseSquare(newBoard, pos)] = { old: null, new: null }
    }

    for (let pos of mismatch) {
        if (getBaseSquare(oldBoard, pos) != null)
            movements[getBaseSquare(oldBoard, pos)].old = pos
        if (getBaseSquare(newBoard, pos) != null)
            movements[getBaseSquare(newBoard, pos)].new = pos
    }

    return movements
}

class Board {
    nameToSquare = {}
    squareToEntity = {}
    entites = {}
    placed = false

    entityAnimator = null
    entityChooser = null
    moveIndicatorColor = null

    delegate = null

    initEntityAnimator() {
        if (this.entityAnimator !== null) return

        const camera = pc.app.root.findByPath("Root/Camera")
        const scripts = camera.script.scripts
        for (let script of scripts) {
            if ("entityMove" in script) {
                this.entityAnimator = script
            }
        }

        this.moveIndicatorColor = pc.app.root.findByPath("Root/moveIndicator").script.scripts[0]
        this.entityAnimator.setChessAnimationDuration(500 / 1000)
        if (this.entityAnimator == null) {
            console.error("failed to find animator, expected script with entityMove on Camera")
        }
    }

    placeAllIfNeeded(board, entities) {
        if (this.placed) return

        for (var i = 0; i < 8; ++i) {
            for (var j = 0; j < 8; ++j) {
                if (board[i][j] == null) continue
                for (let suff of ["", "1", "2", "3", "4", "5", "6", "7", "8"]) {
                    const name = `${getBase(board[i][j])}${suff}`
                    if (name in entities) {
                        this.nameToSquare[name] = board[i][j].square
                        this.squareToEntity[board[i][j].square] = entities[name]
                        delete entities[name]
                        break
                    }
                }
            }

            this.placed = true
        }
    }

    disposePiece(entity) {
        const x = (entity.name[1] == "W" ? -7 : +7) + Math.random() * 4 - 2
        const y = Math.random() * 4 - 2
        // entity.rigidbody.teleport(x, 1, y)
        this.entityAnimator.chessPieceMove(entity, {x: x, y: 0, z: y})
    }

    placePiece(entity, square) {
        if (square == null) {
            return this.disposePiece(entity)
        }

        const coord = chessCellToCoordinates(square)
        this.nameToSquare[entity.name] = square
        this.squareToEntity[square] = entity

        // entity.rigidbody.teleport(coord.x, 1, coord.y)
        this.entityAnimator.chessPieceMove(entity, {x: coord.x, y: 0, z: coord.y})
    }

    makeMove(move, entity) {
        this.placePiece(entity, move.new)
    }

    makeMoves(moves) {
        var fullMoves = []
        for (let move in moves)
            fullMoves.push({
                entity: this.squareToEntity[moves[move].old],
                move: moves[move]
            })
        for (let p of fullMoves)
            this.makeMove(p.move, p.entity)
    }

    setCellHighlighted(square, highlighted) {
        const cell = pc.app.root.findByPath(`Root/board/${square[0]}/${square[1]}`)
        this.entityAnimator.setCellHighlighted(cell, highlighted)
    }

    setGameEnded(result) {
        this.entityAnimator.setGameEnded(result)
    }

    setCurrentPlayer(playerId) {
        this.moveIndicatorColor.setCurrentChessPlater(playerId)
    }
}

const SERVER_BASE_URL = 'https://cors-anywhere.herokuapp.com/http://77.68.34.133:5539'; 
let moveWorker;
let audioWorker;
let token;
let userInteracted = false;
let audioWorkerStarted = false;

function onUserInteraction() {
    userInteracted = true;
    document.removeEventListener("click", onUserInteraction);
    if (token) {
        if (audioWorker) {
            audioWorkerStarted = true;
            audioWorker.postMessage({url: `${SERVER_BASE_URL}`, token});
        }
    }
}

document.addEventListener("click", onUserInteraction);

function startGame() {
    return fetch(`${SERVER_BASE_URL}/start_game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        token = data.token;
        console.info('Received token:', token)
        return token;
    })
    .catch(err => console.error('Error starting game:', err));
}

function initializeWorkers(token) {
    if (window.Worker) {
        moveWorker = new Worker('src/move-worker.js');
        audioWorker = new Worker('src/audio-worker.js');

        audioWorker.onmessage = function(e) {
            if (e.data instanceof Blob) {
                console.info('Got new commentary. Playing...');
                const audioURL = URL.createObjectURL(e.data);
                const audio = new Audio(audioURL);
                audio.play();

                audio.onended = function() {
                audioWorker.postMessage({url: `${SERVER_BASE_URL}`, token}); // Request the next audio file
                };
            } else {
                console.error('Error from audio worker:', e.data.error);
            }
        };
        // Start playing the first audio file
        if (userInteracted) {
            if (!audioWorkerStarted) {
                audioWorker.postMessage({url: `${SERVER_BASE_URL}`, token});
            }
        }
    } else {
        console.error('Your browser doesn\'t support Web Workers.');
    }
}

function makeMove(move) {
  if (moveWorker) {
    moveWorker.postMessage({ url: `${SERVER_BASE_URL}/move`, token, move });
  } else {
    console.error('MoveWorker is not initialised yet');
  }
}

class MovePicker {
    chosenEntity = null
    entityChooser = null
    delegate = null
    board = null

    initPiecesChooser() {
        if (this.entityChooser !== null) return

        const camera = pc.app.root.findByPath("Root/Camera")
        const scripts = camera.script.scripts
        for (let script of scripts) {
            if ("mousePicker" in script) {
                this.entityChooser = script
            }
        }
        this.entityChooser.setChessPickCallback((entity) => { this.pieceWasChoosen(entity) })

        if (this.entityChooser == null) {
            console.error("failed to find chooser, expected script with entityMove on Camera")
        }
    }

    parseSquare(path) {
        // Split the string by "/"
        var parts = path.split("/");

        // Get the last two parts
        var column = parts[parts.length - 2];
        var row = parts[parts.length - 1];

        // Combine the parts to get "a8"
        return column + row
    }

    pieceWasChoosen(entity) {
        if (entity.parent.name === "pieces") {
            if (this.chosenEntity === null) {
                if (entity.name[1] == "B") return

                this.chosenEntity = entity
                this.delegate.didSelectEntity(entity)
                return
            }

            if (this.chosenEntity.name[1] == entity.name[1]) {
                this.delegate.didDeselectEntity(this.chosenEntity)
                this.chosenEntity = entity
                this.delegate.didSelectEntity(entity)
                return
            }

            const dest = this.board.nameToSquare[entity.name]
            this.delegate.pickedMove(this.chosenEntity, dest)
            this.chosenEntity = null
        } else {
            if (this.chosenEntity !== null) {
                const dest = this.parseSquare(entity.path)
                this.delegate.pickedMove(this.chosenEntity, dest)
                this.chosenEntity = null
            }
        }
    }
}

var stockfish = new Worker('src/stockfish.js');

stockfish.addEventListener('message', function (e) {
    if (e.data.startsWith('bestmove')) {
        const move = e.data.split(' ')[1]; // Parse the best move
        console.log('Stockfish best Move:', move);

        setTimeout(()=> {
            game.move({from: move.substring(0, 2), to: move.substring(2, 4), promotion: "q"})
        }, 1000);
        
    }
});

stockfish.postMessage('uci');

class Game {
    wasInit = false

    constructor() {
        this.chess = new Chess()
        this.board = new Board()
        this.picker = new MovePicker()
    }

    initComponents() {
        if (this.wasInit) return
        this.wasInit = true

        this.board.initEntityAnimator()
        this.board.placeAllIfNeeded(this.chess.board(), collectPieces())

        this.picker.board = this.board
        this.picker.initPiecesChooser()
        this.picker.delegate = {
            didDeselectEntity: (ent) => {
                for (let x of "abcdefgh") {
                    for (var y = 1; y <= 8; ++y) {
                        this.board.setCellHighlighted(`${x}${y}`, false)
                    }
                }
            },
            didSelectEntity: (ent) => {
                for (let move of game.chess.moves({verbose: true})) {
                    if (move.from === this.board.nameToSquare[ent.name]) {
                        this.board.setCellHighlighted(move.from, true)
                        this.board.setCellHighlighted(move.to, true)
                    }
                }
            },
            pickedMove: (ent, dest) => {
                if (this.move({from: this.board.nameToSquare[ent.name], to: dest, promotion: "q"})) {
                    this.picker.delegate.didDeselectEntity(null)
                    const allMoves = this.chess.history({ verbose: true }).map(move => move.from + move.to);
                    stockfish.postMessage(`position startpos moves ${allMoves.join(' ')}`);
                    stockfish.postMessage('go depth 2');
                }
            }
        }
    }

    move(o) {
        try {
            const oldBoard = this.chess.board()
            this.chess.move(o)
            const newBoard = this.chess.board()
            this.board.makeMoves(getMoves(oldBoard, newBoard))
            this.board.setCurrentPlayer(this.chess.turn() === 'b' ? 1 : 0)
            if (this.chess.isGameOver()) {
                this.board.setGameEnded({
                    draw: this.chess.isDraw(),
                    turn: this.chess.turn()
                })
            }
            return true
        } catch (e) {
            console.log("failed to make move:", e)
            return false
        }
    }
}

const game = new Game()

function doInit() {
    game.initComponents()
    startGame().then(initializeWorkers);
}

function mvAll() {
    const oldBoard = chess.board()
    const pieceEntities = collectPieces()

    board.initEntityAnimator()
    movePicker.initPiecesChooser()

    if (imove < moves.length) {
        chess.move(moves[imove]);
        makeMove(moves[imove])
        imove++;
    }

    const newBoard = chess.board()
    board.placeAllIfNeeded(oldBoard, pieceEntities)
    board.makeMoves(getMoves(oldBoard, newBoard))
}

wasInit = false

window.addEventListener("DOMContentLoaded", function () {
    setInterval(
        () => {
            if (typeof pc !== 'undefined' &&
                pc.app.root.findByPath("Root/Camera") != null) {
                if (!wasInit) {
                    doInit()
                    wasInit = true
                }

                // if (imove < moves.length) {
                //     game.move(moves[imove])
                //     imove++
                // }
            }
        }, 1000
    );
});