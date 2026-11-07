import * as THREE from 'three'

/**
 * Defines the components of the puzzle
 */
export interface IPuzzle {
    readonly faces: Face[];
    readonly rotations: Rotation[]
}

/**
 * Represents a face of the puzzle
 */
export class Face {
    /**
     * The list of stickers on that face
     */
    public readonly stickers: Sticker[]

    /**
     * The direction where the face is facing.
     * The vector is assumed to be normalized and orthogonal to "up"
     */
    public readonly orientation: THREE.Vector3;

    /**
     * The up direction of the face, to orient it in the correct direction.
     * The vector is assumed to be normalized and orthogonal to orientation
     */
    public readonly up: THREE.Vector3

    /**
     * The distance between the origin and the center of the face.
     */
    public readonly distanceFromCenter: number;


    constructor(stickers: Sticker[], orientation: THREE.Vector3, up: THREE.Vector3, distanceFromCenter: number) {
        this.stickers = stickers;
        this.orientation = orientation;
        this.up = up;
        this.distanceFromCenter = distanceFromCenter;
    }
}

/**
 * Represents a sticker on the puzzle
 */
export class Sticker {
    /**
     * The position of the sticker on the 2D plane
     */
    public readonly position: THREE.Vector2;

    /**
     * The shape of the sticker
     */
    public readonly shape: THREE.Shape;

    /**
     * The angle of rotation of the sticker, in radians
     */
    public readonly rotation: number;

    /**
     * By how much this sticker should be scaled
     */
    public readonly scale: number;


    constructor(position: THREE.Vector2, shape: THREE.Shape, rotation: number, scale: number) {
        this.position = position;
        this.shape = shape;
        this.rotation = rotation;
        this.scale = scale;
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
