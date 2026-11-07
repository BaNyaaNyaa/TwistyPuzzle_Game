import * as THREE from "three";

import {type Solid} from "../definition/solid/Solid";
import {type Cut} from "../definition/cut/Cut";
import CubeSolid from "../definition/solid/CubeSolid";
import type TwistyPuzzleDefinition from "../definition/twisty_puzzle/TwistyPuzzleDefinition";
import PlaneCut from "../definition/cut/PlaneCut";

export class CubeTwistyPuzzle implements TwistyPuzzleDefinition {
    public readonly solid: Solid
    private readonly _cuts: Cut[]

    get cuts(): ReadonlyArray<Cut> {
        return this._cuts
    }

    constructor(size: number) {
        this.solid = new CubeSolid()
        this._cuts = []
        const axes = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0,0,1)
        ];

        const step = 2 / size;

        for (const axis of axes) {
            for (let i = 1 ; i < size ; i++) {
                const distance = -(i - size/2)*step;
                this._cuts.push(new PlaneCut(new THREE.Plane(axis, -distance), 4));
            }
        }
    }
}
