import * as THREE from 'three'
import {Rotation} from "../../PuzzleDefinition";
import {Object3D} from "three";

export default class TwistyPuzzle {
    public readonly rotations: Rotation[]
    public readonly objects3d: THREE.Object3D[]


    constructor(rotations: Rotation[], objects3d: Object3D[]) {
        this.rotations = rotations;
        this.objects3d = objects3d;
    }
}
