import * as THREE from "three";

import {type Solid} from "../definition/solid/Solid";
import {type Cut} from "../definition/cut/Cut";
import CubeSolid from "../definition/solid/CubeSolid";
import type TwistyPuzzleDefinition from "../definition/twisty_puzzle/TwistyPuzzleDefinition";
import PlaneCut from "../definition/cut/PlaneCut";

export class CubeTwistyPuzzle implements TwistyPuzzleDefinition {
    public readonly solid: Solid
    private readonly _cuts: Cut[]
    private readonly _colorMap: Map<number, THREE.Color>

    get cuts(): ReadonlyArray<Cut> {
        return this._cuts
    }

    get colorMap(): ReadonlyMap<number, THREE.Color> {
        return this._colorMap
    }

    constructor(size: number, colorMap?: Map<number, THREE.Color>) {
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

        this._colorMap = colorMap !== undefined
            ? colorMap
            : new Map<number, THREE.Color>([
                [0, new THREE.Color().setHex(0x0000ff)],
                [1, new THREE.Color().setHex(0x00ff00)],
                [2, new THREE.Color().setHex(0xffffff)],
                [3, new THREE.Color().setHex(0xffff00)],
                [4, new THREE.Color().setHex(0xff0000)],
                [5, new THREE.Color().setHex(0xffa500)],
            ])
    }
}
