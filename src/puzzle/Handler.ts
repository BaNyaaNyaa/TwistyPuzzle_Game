import * as THREE from 'three';
import {IPuzzle, Move} from "./PuzzleDefinition";

/**
 * Intermediate class to handle the puzzle definition
 */
export default class PuzzleHandler {
    private readonly puzzle: IPuzzle;
    private _3dObjects?: THREE.Object3D[]


    constructor(puzzle: IPuzzle) {
        this.puzzle = puzzle;
    }

    /**
     * Generate the 3d objects representing the puzzle.
     * It currently only returns the stickers
     */
    public get3dObjects(): THREE.Object3D[] {
        if (!this._3dObjects) {
            // Avoids creating multiple geometry for the same shape
            const geometryMap = new Map<string, THREE.BufferGeometry>();

            this._3dObjects = this.puzzle.faces.flatMap(
                f => {

                    // Target vector space
                    const xAxis = f.up.clone().cross(f.orientation);
                    const yAxis = f.up;
                    const zAxis = f.orientation

                    // Matrix transformation to orient the stickers correctly
                    const rotationMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

                    return f.stickers.map(s => {
                        const geometry = geometryMap.getOrInsertComputed(
                            s.shape.uuid,
                                _ => new THREE.ExtrudeGeometry(s.shape, { bevelEnabled: false })
                        )
                        const material = new THREE.MeshPhongMaterial({ color: Math.floor(Math.random()*0xffffff) });
                        const mesh = new THREE.Mesh(geometry, material);

                        // Transform the object
                        mesh.rotateZ(s.rotation);
                        mesh.scale.set(s.scale * 0.9, s.scale * 0.9, 0.01);

                        const translationVector = new THREE.Vector3()
                            .addScaledVector(zAxis, f.distanceFromCenter)
                            .addScaledVector(xAxis, s.position.x)
                            .addScaledVector(yAxis, s.position.y);
                        mesh.applyMatrix4(rotationMatrix.clone().setPosition(translationVector));

                        return mesh;
                    })
                }
            );
        }

        return this._3dObjects;
    }

    /**
     * Generate a random move
     */
    public getRandomMove(): Move {
        const rotation = this.puzzle.rotations[Math.floor(Math.random()*this.puzzle.rotations.length)];
        let position = Math.floor(Math.random()*(rotation.nbPositions - 1)) + 1;
        if (position > rotation.nbPositions / 2) {
            position -= rotation.nbPositions;
        }
        return new Move(rotation, position);
    }
}
