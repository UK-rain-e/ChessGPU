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

window.addEventListener("DOMContentLoaded", function () {
    setInterval(
        () => {
            if (typeof pc !== 'undefined') {
                mvAll();
            }
        }, 5000
    );
});

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


const nameToPosition = {};
const positionToName = {};

function mvAll() {
    const board = chess.board()
    const pieceEntities = collectPieces()

    if (imove < moves.length) {
        console.log(moves, moves[imove]);
        chess.move(moves[imove]);
        imove++;
    }

    for (i = 0; i < 8; ++i) {
        for (j = 0; j < 8; ++j) {
            const piece = board[i][j]
            if (piece === null) {
                continue
            }

            const base = (piece.type + piece.color).toUpperCase()
            const position = chessCellToCoordinates(piece.square)

            const suffixes = ["", "1", "2", "3", "4", "5", "6", "7", "8"];
            for (let suff of suffixes) {
                const name = `${base}${suff}`
                if (name in pieceEntities) {
                    if (!areObjectsEqual(position, nameToPosition[name])) {
                        pieceEntities[name].rigidbody.teleport(position.x, 1, position.y)
                        nameToPosition[name] = position;
                        positionToName[position] = name;
                    }
                    delete pieceEntities[name];

                    break
                }
            }
        }
    }


}
