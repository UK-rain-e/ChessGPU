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
    // Check if the input is a valid chess cell notation
    var cellRegex = /^[a-h][1-8]$/i; // Regular expression for valid chess cell notation
    if (!cellRegex.test(chessCell)) {
        console.error("Invalid chess cell notation. Please provide a valid input.");
        return null;
    }

    // Convert the chess cell to coordinates
    var file = chessCell.charCodeAt(0) - 'a'.charCodeAt(0) - 3.5; // Map 'a' to -3.5, 'b' to -2.5, ..., 'h' to 3.5
    var rank = -parseInt(chessCell.charAt(1), 10) + 4.5; // Map '1' to -3.5, '2' to -2.5, ..., '8' to 3.5

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
    return chess.history();
}());
const chess = new Chess();
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
                        this.placePiece(entities[name], board[i][j].square)
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
}

class MoveObserver {
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
        if (entity === this.chosenEntity) {
            this.chosenEntity = null
            this.delegate.didDeselectEntity(entity)
            return
        }
        if (entity.parent.name === "pieces") {
            if (this.chosenEntity === null) {
                this.chosenEntity = entity
                this.delegate.didSelectEntity(entity)
                return
            }

            const dest = this.board.nameToSquare[entity.name]
            this.delegate.didMove(this.chosenEntity, dest)
            this.chosenEntity = null
        } else {
            const dest = this.parseSquare(entity.path)
            this.delegate.didMove(this.chosenEntity, dest)
            this.chosenEntity = null
        }
    }
}

const board = new Board()
const moveObserver = new MoveObserver()
moveObserver.board = board
moveObserver.delegate = {
    didSelectEntity: (ent) => console.log("did select", ent),
    didDeselectEntity: (ent) => console.log("did deselect", ent),
    didMove: (ent, dest) => console.log("did move", ent, dest)
}

function mvAll() {
    const oldBoard = chess.board()
    const pieceEntities = collectPieces()

    board.initEntityAnimator()
    moveObserver.initPiecesChooser()

    if (imove < moves.length) {
        chess.move(moves[imove]);
        imove++;
    }

    const newBoard = chess.board()
    board.placeAllIfNeeded(oldBoard, pieceEntities)
    board.makeMoves(getMoves(oldBoard, newBoard))
}

window.addEventListener("DOMContentLoaded", function () {
    setInterval(
        () => {
            if (typeof pc !== 'undefined') {
                mvAll();
            }
        }, 1000
    );
});