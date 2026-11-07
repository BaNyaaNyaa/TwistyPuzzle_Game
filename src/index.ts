import RepeatRotationScene from "./scene/RepeatRotationScene";
import PyraminxPuzzle from "./puzzle/puzzles/Pyraminx";

const repeatedRotationScene = new RepeatRotationScene();
repeatedRotationScene.setup(new PyraminxPuzzle(7));
repeatedRotationScene.startNewTween()

function render() {
    repeatedRotationScene.render();
    requestAnimationFrame(render);
}
requestAnimationFrame(render);