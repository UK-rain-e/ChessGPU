window.addEventListener("DOMContentLoaded", function () {
    setInterval(
        () => {
            console.log("check");
            if (typeof pc !== 'undefined') {
                mvRook();
            }
        }, 2000
    );
});

function mvRook() {
    var rook = pc.app.root.findByName("ROOK");
    var x = Math.ceil(Math.random() * 7 - 3) - 0.5;
    var y = Math.ceil(Math.random() * 7 - 3) - 0.5;
    rook.rigidbody.teleport(x, 1, y);
}
