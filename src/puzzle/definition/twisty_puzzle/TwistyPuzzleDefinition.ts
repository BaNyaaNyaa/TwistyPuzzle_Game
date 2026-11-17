import type {Cut} from "../cut/Cut";
import type {Solid} from "../solid/Solid";
import type * as THREE from 'three'

/**
 * Defines a Twisty Puzzle
 */
export default interface TwistyPuzzleDefinition {

    /**
     * The base solid to use
     */
    readonly solid: Solid

    /**
     * The cuts to make on that solid
     */
    readonly cuts: readonly Cut[]

    readonly colorMap: ReadonlyMap<number, THREE.Color>
}