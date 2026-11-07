import * as THREE from 'three'
import {Vector3} from "three";

export class RotationsContainer {
    private readonly axesRotations: AxisRotations[]
    public readonly rotations: ReadonlyArray<Rotation>


    constructor(axesRotations: AxisRotations[]) {
        this.axesRotations = axesRotations;
        this.rotations = this.axesRotations.flatMap(a => a.rotations);
    }

    getRandomMove(): Move {
        const rotation = this.rotations[Math.floor(Math.random() * this.rotations.length)];
        let position = Math.floor((rotation.nbPositions - 1) * Math.random()) + 1;
        if (position > rotation.nbPositions / 2) {
            position -= rotation.nbPositions
        }

        return new Move(rotation, position);
    }
}

export class AxisRotations {
    public readonly axis: THREE.Vector3
    public readonly rotations: ReadonlyArray<Rotation>


    constructor(axis: Vector3, rotations: Rotation[]) {
        this.axis = axis;
        this.rotations = rotations;
    }
}

/**
 * Represents a possible rotation on the puzzle
 */
export class Rotation {

    /**
     * The axis around which the rotation occurs.
     * The vector is assumed to be normalized
     */
    public readonly axis: THREE.Vector3;

    /**
     * Function used to find the THREE.Object3D to rotate from their position.
     * A THREE.Object3D is included in the rotation if the function evaluates to true.
     */
    public readonly positionEvaluator: (p: THREE.Vector3) => boolean;

    /**
     * The number of possible positions the rotation can take.
     * For example, each face of a cube has 4 positions, each face of a dodecahedron has 5, but the slice move of a Square-One has only 2 positions.
     */
    public readonly nbPositions: number;

    constructor(axis: THREE.Vector3, positionEvaluator: (p: THREE.Vector3) => boolean, nbPositions: number) {
        this.axis = axis;
        this.positionEvaluator = positionEvaluator;
        this.nbPositions = nbPositions;
    }
}

/**
 * Represents a move to apply of the puzzle
 */
export class Move {
    /**
     * The rotation to use for the move
     */
    public readonly rotation: Rotation;

    /**
     * How many positions to rotate to.
     */
    public readonly position: number;


    constructor(rotation: Rotation, position: number) {
        this.rotation = rotation;
        this.position = position;
    }
}
