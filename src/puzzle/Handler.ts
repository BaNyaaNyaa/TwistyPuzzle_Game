import * as THREE from 'three';
import {Move, Rotation} from "./PuzzleDefinition";
import TwistyPuzzleDefinition from "./definition/twisty_puzzle/TwistyPuzzleDefinition";
import TwistyPuzzle from "./definition/twisty_puzzle/TwistyPuzzle";
import {TwistyPuzzleBuilder} from "./builder/TwistyPuzzleBuilder";

export interface IPuzzleHandler {
    get3dObjects(): THREE.Object3D[];
    getRandomMove(): Move
    getAllRotations(): readonly Rotation[]
}

export class PuzzleHandler implements IPuzzleHandler {
    private readonly puzzle: TwistyPuzzle
    private _3dObjects?: THREE.Object3D[]

    constructor(puzzle: TwistyPuzzleDefinition) {
        const builder = new TwistyPuzzleBuilder(puzzle)
        this.puzzle = builder.build();
    }

    get3dObjects(): THREE.Object3D[] {
        if (this._3dObjects === undefined) {
            const objects3d: THREE.Object3D[] = [];
            for (const piece of this.puzzle.pieces) {
                for (const vertices of piece.facesWithVertices) {
                    const vertex1 = vertices[0]
                    const vertex2 = vertices[1]
                    const vertex3 = vertices[2]
                    const plane = new THREE.Plane().setFromCoplanarPoints(vertex1, vertex2, vertex3).normalize();

                    const xAxis = new THREE.Vector3().subVectors(vertex1, vertex2).normalize();
                    const yAxis = new THREE.Vector3().crossVectors(xAxis, plane.normal);
                    const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, plane.normal);

                    const verticesOnXyPlane: THREE.Vector3[] = vertices.map(
                        (v) => v.clone().applyMatrix4(matrix.clone().invert()));

                    const signedArea = verticesOnXyPlane.map((v_i, i) => {
                        const v_ip1 = verticesOnXyPlane[(i + 1) % verticesOnXyPlane.length];
                        return v_i.x * v_ip1.y - v_ip1.x * v_i.y
                    }).reduce((s, v) => s + v, 0) / 2;

                    const xCentroid = verticesOnXyPlane.map((v_i, i) => {
                        const v_ip1 = verticesOnXyPlane[(i + 1) % verticesOnXyPlane.length];
                        return (v_i.x + v_ip1.x) * (v_i.x * v_ip1.y - v_ip1.x * v_i.y)
                    }).reduce((s, v) => s + v, 0) / (6 * signedArea);

                    const yCentroid = verticesOnXyPlane.map((v_i, i) => {
                        const v_ip1 = verticesOnXyPlane[(i + 1) % verticesOnXyPlane.length];
                        return (v_i.y + v_ip1.y) * (v_i.x * v_ip1.y - v_ip1.x * v_i.y)
                    }).reduce((s, v) => s + v, 0) / (6 * signedArea);

                    const vertices2d = verticesOnXyPlane.map(v => new THREE.Vector2(v.x - xCentroid, v.y - yCentroid))

                    const shape = new THREE.Shape();
                    shape.moveTo(vertices2d[vertices2d.length - 1].x, vertices2d[vertices2d.length - 1].y);
                    for (const vertex of vertices2d) {
                        shape.lineTo(vertex.x, vertex.y);
                    }

                    const geometry = new THREE.ExtrudeGeometry(shape, {bevelEnabled: false, depth: 1});
                    const material = new THREE.MeshPhongMaterial({ color: Math.floor(Math.random()*0xffffff) });
                    const mesh = new THREE.Mesh(geometry, material);

                    mesh.applyMatrix4(matrix);
                    mesh.scale.set(0.9, 0.9, 0.01);

                    let position = new THREE.Vector3()
                    let quaternion = new THREE.Quaternion()
                    let scale = new THREE.Vector3()
                    matrix.decompose(position, quaternion, scale);
                    mesh.position.addScaledVector(plane.normal, -plane.constant)
                        .addScaledVector(xAxis, xCentroid)
                        .addScaledVector(yAxis, yCentroid);
                    objects3d.push(mesh);
                }
            }
            this._3dObjects = objects3d;
        }
        return this._3dObjects;
    }

    getRandomMove(): Move {
        if (this.puzzle.rotationsContainer.rotations.length === 0) {
            return new Move(new Rotation(new THREE.Vector3, () => false, 1), 0);
        }
        return this.puzzle.rotationsContainer.getRandomMove()
    }

    getAllRotations(): readonly Rotation[] {
        return this.puzzle.rotationsContainer.rotations
    }
}
