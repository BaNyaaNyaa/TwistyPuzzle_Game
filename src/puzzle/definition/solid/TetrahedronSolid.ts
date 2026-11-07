import * as THREE from 'three';
import {EdgeSolid, FaceSolid, Solid} from "./Solid";

export default class TetrahedronSolid extends Solid {

    constructor() {
        const vertices = [
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(2*Math.sqrt(2)/3, -1/3, 0),
            new THREE.Vector3(-Math.sqrt(2)/3, -1/3, Math.sqrt(6)/3),
            new THREE.Vector3(-Math.sqrt(2)/3, -1/3, -Math.sqrt(6)/3),
        ]

        const edges = [
            new EdgeSolid(0, 1),
            new EdgeSolid(0, 2),
            new EdgeSolid(0, 3),

            new EdgeSolid(1, 2),
            new EdgeSolid(1, 3),

            new EdgeSolid(2, 3),
        ]

        const faces = [
            new FaceSolid([0, 1, 3]),
            new FaceSolid([0, 2, 4]),
            new FaceSolid([1, 2, 5]),
            new FaceSolid([3, 4, 5]),
        ]

        super(vertices, edges, faces);
    }
}
