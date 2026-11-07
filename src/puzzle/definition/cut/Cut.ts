import * as THREE from 'three'
import {TwistyPuzzleBuilderPiece} from "../../builder/TwistyCubeContainer";

/**
 * A cut to apply to a Solid to make a Twisty Puzzle
 */
export interface Cut {
    /**
     * The CutHandler to use for this cut
     */
    readonly handler: CutHandler

    /**
     * The number of positions the puzzle can take around this cut
     */
    readonly nbPositions: number
}

/**
 * Handles the logic for this cute
 */
export interface CutHandler {

    /**
     * The axis this cut has been applied on
     */
    readonly axis: THREE.Vector3

    /**
     * The distance from the center of this cut
     */
    readonly distanceFromCenter: number

    /**
     * Cuts a piece into multiple pieces
     * Returns the list of pieces created from this cut
     *
     * @param piece
     */
    splitPiece(piece: TwistyPuzzleBuilderPiece): ReadonlyArray<TwistyPuzzleBuilderPiece>

    /**
     * Creates a function that checks whether the given position is on the positive side of the cut
     */
    getIsOnPositiveSideEvaluator(): (position: THREE.Vector3) => boolean
}