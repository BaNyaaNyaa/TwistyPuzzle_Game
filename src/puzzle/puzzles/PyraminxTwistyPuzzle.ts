import * as THREE from "three";

import {type Solid} from "../definition/solid/Solid";
import {type Cut} from "../definition/cut/Cut";
import type TwistyPuzzleDefinition from "../definition/twisty_puzzle/TwistyPuzzleDefinition";
import PlaneCut from "../definition/cut/PlaneCut";
import TetrahedronSolid from "../definition/solid/TetrahedronSolid";

export class PyraminxTwistyPuzzle implements TwistyPuzzleDefinition {
    public readonly solid: Solid
    private readonly _cuts: Cut[]
    private readonly _colorMap: Map<number, THREE.Color>

    get cuts(): readonly Cut[] {
        return this._cuts;
    }

    get colorMap(): ReadonlyMap<number, THREE.Color> {
        return this._colorMap
    }

    constructor(size: number, colorMap?: Map<number, THREE.Color>) {
        this.solid = new TetrahedronSolid()
        this._cuts = []
        const axes = [
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(2*Math.sqrt(2)/3, -1/3, 0),
            new THREE.Vector3(-Math.sqrt(2)/3, -1/3, Math.sqrt(6)/3),
            new THREE.Vector3(-Math.sqrt(2)/3, -1/3, -Math.sqrt(6)/3),
        ]

        const step = 4/3/size;
        const start = -1/3

        for (const axis of axes) {
            for (let i = 1 ; i < size ; i++) {
                const distance = start + step*i;
                this._cuts.push(new PlaneCut(new THREE.Plane(axis, -distance), 3));
            }
        }

        this._colorMap = colorMap !== undefined
            ? colorMap
            : new Map<number, THREE.Color>([
                [0, new THREE.Color().setHex(0xff0000)],
                [1, new THREE.Color().setHex(0xffff00)],
                [2, new THREE.Color().setHex(0x00ff00)],
                [3, new THREE.Color().setHex(0x0000ff)],
            ])
    }
}
