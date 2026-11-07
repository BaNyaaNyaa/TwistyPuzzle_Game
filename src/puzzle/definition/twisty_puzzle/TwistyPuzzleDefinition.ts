import {Cut} from "../cut/Cut";
import {Solid} from "../solid/Solid";

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
    readonly cuts: ReadonlyArray<Cut>
}