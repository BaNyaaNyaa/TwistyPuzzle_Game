import * as THREE from 'three';
import {EdgeSolid, FaceSolid, Solid} from "./Solid";

export default class CubeSolid extends Solid {

    constructor() {
        const vertices = [
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, -1),
            new THREE.Vector3(1, -1, -1),
            new THREE.Vector3(1, -1, 1),

            new THREE.Vector3(-1, -1, 1),
            new THREE.Vector3(-1, -1, -1),
            new THREE.Vector3(-1, 1, -1),
            new THREE.Vector3(-1, 1, 1),
        ]

        const edges = [
            new EdgeSolid(0, 1), // +x +y
            new EdgeSolid(1, 2), // +x -z
            new EdgeSolid(2, 3), // +x -y
            new EdgeSolid(3, 0), // +x +z

            new EdgeSolid(4, 5), // -x -y
            new EdgeSolid(5, 6), // -x -z
            new EdgeSolid(6, 7), // -x +y
            new EdgeSolid(7, 4), // -x +z

            new EdgeSolid(0, 7), // +y +z
            new EdgeSolid(1, 6), // +y -z
            new EdgeSolid(2, 5), // -y -z
            new EdgeSolid(3, 4) // -y +z
        ]

        const faces = [
            new FaceSolid([0, 1, 2, 3]), // +x
            new FaceSolid([4, 5, 6, 7]), // -x
            new FaceSolid([0, 6, 8, 9]), // +y
            new FaceSolid([2, 4, 10, 11]), // -y
            new FaceSolid([3, 7, 8, 11]), // +z
            new FaceSolid([1, 5, 9, 10]) // -z
        ]

        super(vertices, edges, faces);
    }
}
