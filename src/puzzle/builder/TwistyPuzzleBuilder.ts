import TwistyPuzzleDefinition from "../definition/twisty_puzzle/TwistyPuzzleDefinition";
import TwistyPuzzle from "../definition/twisty_puzzle/TwistyPuzzle";
import {TwistyPuzzleBuilderPiece} from "./TwistyCubeContainer";
import {CutsContainer} from "./cut/CutsContainer";

/**
 * Create a twisty puzzle from its definition
 */
export class TwistyPuzzleBuilder {
    private readonly twistyPuzzleDefinition: TwistyPuzzleDefinition

    constructor(twistyPuzzleDefinition: TwistyPuzzleDefinition) {
        this.twistyPuzzleDefinition = twistyPuzzleDefinition;
    }

    /**
     * Generate the TwistyPuzzle
     */
    build(): TwistyPuzzle {
        let pieces: TwistyPuzzleBuilderPiece[] = [TwistyPuzzleBuilderPiece.fromSolid(this.twistyPuzzleDefinition.solid)];
        const cutContainer = new CutsContainer()
        for (const cut of this.twistyPuzzleDefinition.cuts) {
            cutContainer.addCut(cut);
            pieces = pieces.flatMap(p => cut.handler.splitPiece(p));
        }
        return TwistyPuzzle.fromTwistyCubeBuilder(pieces, cutContainer.buildRotationsContainer());
    }
}