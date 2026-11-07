import * as THREE from 'three';
import {Face, IPuzzle, Rotation, Sticker} from "../PuzzleDefinition";

export default class CubePuzzle implements IPuzzle {

    /**
     * Number of stickers per edge
     * @private
     */
    private readonly size: number;

    public readonly faces: Face[];
    public readonly rotations: Rotation[];

    constructor(size: number) {
        this.size = size;
        this.faces = this.generateFaces();
        this.rotations = this.generateRotations();
    }

    private generateFaces(): Face[] {

        const stickers: Sticker[] = []

        const square = new THREE.Shape();
        square.moveTo(-0.5, -0.5);
        square.lineTo(-0.5, 0.5);
        square.lineTo(0.5, 0.5);
        square.lineTo(0.5, -0.5);
        square.lineTo(-0.5, -0.5);

        // Create a size * size square
        for (let xPos = 0; xPos < this.size; xPos++) {
            for (let yPos = 0; yPos < this.size; yPos++) {
                const position = new THREE.Vector2((xPos + 0.5) / this.size - 0.5, (yPos + 0.5) / this.size - 0.5);
                stickers.push(new Sticker(position, square, 0, 1/ this.size));
            }
        }

        const faces: Face[] = [];
        // For each axis, create a face on each "side"
        for (let component = 0; component < 3; component++) {
            for (const coefficient of [-1, 1]) {
                const orientation = new THREE.Vector3().setComponent(component, coefficient);
                const up = new THREE.Vector3().setComponent((component+1)%3, coefficient);
                faces.push(new Face(stickers, orientation, up, 0.5));
            }
        }

        return faces;
    }

    private generateRotations(): Rotation[] {
        const rotations: Rotation[] = [];

        const bottom = -0.5
        const step = 1/this.size;

        // Generate rotations for every layer on every axis
        for (let i = 0; i < 3; i++) {
            const axis = new THREE.Vector3().setComponent(i, 1);
            for (let x = 0 ; x < this.size ; x++) {
                const position = (x + 0.5)*step + bottom
                // Check whether the sticker is close enough to the center of the layer
                // We need a big epsilon to include face stickers for face moves
                const evaluation = (p: THREE.Vector3) => {
                    return Math.abs(p.getComponent(i) - position) < (3*step/4)
                };
                rotations.push(new Rotation(axis, evaluation, 4))
            }
        }
        return rotations;
    }
}