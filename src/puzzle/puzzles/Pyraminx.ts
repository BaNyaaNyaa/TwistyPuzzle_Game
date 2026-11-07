import * as THREE from 'three';
import {Face, IPuzzle, Rotation, Sticker} from "../PuzzleDefinition";

export default class PyraminxPuzzle implements IPuzzle {

    /**
     * Number of stickers per edge
     * @private
     */
    private readonly size: number;
    /**
     * Axes of the face of the tetrahedron
     * @private
     */
    private readonly axes: THREE.Vector3[]

    public readonly faces: Face[];
    public readonly rotations: Rotation[];

    constructor(size: number) {
        this.size = size;
        const s3 = Math.sqrt(3);
        this.axes = [
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3((s3+1)/3, 1/3, (1-s3)/3),
            new THREE.Vector3((1-s3)/3, 1/3, (s3+1)/3),
            new THREE.Vector3(-2/3, 1/3, -2/3)
        ];
        this.faces = this.generateFaces();
        this.rotations = this.generateRotations();

    }

    private generateFaces(): Face[] {

        const stickers: Sticker[] = []

        // / Triangle of size 1, centered at its "triangle center"
        const triangle = new THREE.Shape();
        const s3 = Math.sqrt(3);
        triangle.moveTo(0, 1/s3);
        triangle.lineTo(-1/2, -s3/6);
        triangle.lineTo(1/2, -s3/6);
        triangle.lineTo(0, 1/s3);

        // Create the triangle from the top to the bottom
        for (let row = 0; row < this.size; row++) {
            const top = 1/s3 - row*s3/(2*this.size);

            for (let pos = 0; pos < 2*row+1; pos++) {
                // When the horizontal position is even, the triangle is right-side up
                // When the horizontal position is odd, the triangle is upside down
                const x = (pos - row)/(2*this.size);
                const y = top + (pos % 2 === 0 ? -1/(s3*this.size) :  -s3/(2*this.size) + 1/(s3*this.size))
                const rotation = pos % 2 === 0 ? 0 : Math.PI;
                stickers.push(new Sticker(new THREE.Vector2(x, y), triangle, rotation, 1/this.size));
            }
        }

        const faces: Face[] = [];
        for (let i = 0 ; i < this.axes.length ; i++) {
            const orientation = this.axes[i];

            // We want the top of the face to touch a vertex.
            // Every face touches each other, so we:
            // - Select the axis representing any other face
            // - Negate it to get the orientation of its opposite vertex
            // - Project it on the current face to find a vector perpendicular to the axis that points to a vertex
            // - Normalize it
            const up = this.axes[(i+1)%this.axes.length].clone()
                .negate()
                .projectOnPlane(orientation)
                .normalize();

            faces.push(new Face(stickers, orientation, up, 1/(2*Math.sqrt(6))));
        }

        return faces;
    }

    private generateRotations(): Rotation[] {
        const rotations: Rotation[] = [];
        const top = Math.sqrt(3/2)/2;
        const step = Math.sqrt(6)/(3*this.size);
        for (const axis of this.axes) {
            for (let x = 0 ; x < this.size ; x++) {
                const center = top - (x+0.5)*step
                // Position and orientation of the center of the plane for the current layer
                const clonedAxis = axis.clone().multiplyScalar(-center);
                const evaluator = (p: THREE.Vector3) => {
                    // - Get the vector representing the distance between the center of the layer and the position
                    // - Project on the axis to get the distance alongside said axis
                    const distanceToLayerCenter = p.clone().sub(clonedAxis).projectOnVector(axis).length()
                    return distanceToLayerCenter < 3*step/4
                }
                const rotation = new Rotation(axis, evaluator, 3);

                rotations.push(rotation);
            }
        }
        return rotations;
    }
}