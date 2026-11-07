import * as THREE from "three";
import {Cut, CutHandler} from "./Cut";
import PlaneCutHandler from "../../builder/cut/PlaneCutHandler";

/**
 * A cut defined by a plane
 */
export default class PlaneCut implements Cut {

    /**
     * A plane with a normalized normal
     * @private
     */
    private readonly plane: THREE.Plane
    public readonly handler: CutHandler
    public readonly nbPositions: number

    constructor(plane: THREE.Plane, nbPositions: number) {
        this.plane = plane;
        this.nbPositions = nbPositions
        this.handler = new PlaneCutHandler(this.plane);
    }
}
