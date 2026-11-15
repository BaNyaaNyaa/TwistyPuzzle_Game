import RepeatRotationScene from "./scene/RepeatRotationScene";
import {CubeTwistyPuzzle} from "./puzzle/puzzles/CubeTwistyPuzzle";
import {PyraminxTwistyPuzzle} from "./puzzle/puzzles/PyraminxTwistyPuzzle";

const repeatedRotationScene = new RepeatRotationScene();
repeatedRotationScene.setup(new PyraminxTwistyPuzzle(7));

function render() {
    repeatedRotationScene.render();
    requestAnimationFrame(render);
}
requestAnimationFrame(render);