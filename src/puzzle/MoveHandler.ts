import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import TwistyPuzzle from "./definition/twisty_puzzle/TwistyPuzzle";
import {Rotation} from "./PuzzleDefinition";

const ROTATION_SPEED = 500;

type MoveHandlerEventMap = {
    'move': {}
}
export class MoveHandler extends THREE.EventDispatcher<MoveHandlerEventMap> {
    public readonly puzzle: TwistyPuzzle
    private readonly parentObject3d: THREE.Object3D
    private readonly groupToRotate: THREE.Object3D
    private _isBusy: boolean;

    private tween: TWEEN.Tween | null

    constructor(puzzle: TwistyPuzzle, parentObject3d: THREE.Object3D) {
        super()
        this.puzzle = puzzle;
        this.parentObject3d = parentObject3d

        this.groupToRotate = new THREE.Object3D()
        this.tween = null
        this._isBusy = false;

        this.parentObject3d.add(this.groupToRotate)
        for(const object3d of this.puzzle.objects3d) {
            this.parentObject3d.attach(object3d);
        }
    }

    get isBusy(): boolean {
        return this._isBusy
    }

    selectRotationObjects(rotation: Rotation) {
        if (this._isBusy) {
            return;
        }
        this._isBusy = true;
        const objects = this.puzzle.objects3d
            .filter(o => rotation.positionEvaluator(o.getWorldPosition(new THREE.Vector3())))
        this.groupToRotate.add(...objects)
    }

    rotateGroup(rotation: Rotation, angle: number) {
        this.groupToRotate.setRotationFromAxisAngle(rotation.axis, angle);
        this.dispatchEvent({type: 'move'})
    }

    completeRotation(rotation: Rotation, angle: number) {
        const stepAngle = 2 * Math.PI / rotation.nbPositions;
        const goalAngle = Math.round(angle / stepAngle) * stepAngle

        this.createSnapTween(rotation, angle, goalAngle)
    }

    updateTween(): boolean {
        if (this.tween !== null) {
            return this.tween.update()
        }
        return false
    }

    private createSnapTween(rotation: Rotation, startAngle: number, endAngle: number) {
        const angleTween = {angle: startAngle}
        this.tween = new TWEEN.Tween(angleTween)
            .to({angle: endAngle}, ROTATION_SPEED * Math.abs(endAngle - startAngle) / (2 * Math.PI / rotation.nbPositions))
            .easing(TWEEN.Easing.Back.Out)
            .onUpdate(({angle}) => {
                this.groupToRotate.setRotationFromAxisAngle(rotation.axis, angle);
            })
            .onComplete(() => {
                this.clearRotationObjects()
                this._isBusy = false;
            })
        this.tween.start()
        this.dispatchEvent({type: 'move'})
    }

    private clearRotationObjects() {
        while (this.groupToRotate.children.length > 0) {
            this.parentObject3d.attach(this.groupToRotate.children.pop()!);
        }
    }
}