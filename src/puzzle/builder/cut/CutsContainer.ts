import * as THREE from 'three'
import {Cut} from "../../definition/cut/Cut";
import {Rotation} from "../../PuzzleDefinition";

/**
 * Contains all the cuts to apply to every pieces
 */
export class CutsContainer {
    /**
     * The list of cuts, split by axis
     * @private
     */
    private readonly axisCuts: AxisCutContainer[]

    constructor() {
        this.axisCuts = []
    }

    /**
     * Add a cut to the container, organizing it in the right AxisCutContainer
     * @param cut
     */
    public addCut(cut: Cut) {
        let axisCutContainer = this.axisCuts.find(axisCut => axisCut.axis.equals(cut.handler.axis))
        if (axisCutContainer === undefined) {
            this.axisCuts.push(new AxisCutContainer(cut.handler.axis, [cut]));
            return;
        }
        axisCutContainer.addCut(cut);
    }

    buildRotations(): Rotation[] {
        return this.axisCuts.flatMap(
            axisCut => {
                const rotations: Rotation[] = []
                for (let i = 0 ; i < axisCut.cuts.length ; i++) {
                    const currentCut = axisCut.cuts[i];

                    const currentCutEvaluator = currentCut.handler.getIsOnPositiveSideEvaluator();
                    const previousCutEvaluator = i === 0 ? null : axisCut.cuts[i-1].handler.getIsOnPositiveSideEvaluator();

                    const evaluators = previousCutEvaluator === null
                        ? (p: THREE.Vector3) => !currentCutEvaluator(p)
                        : (p: THREE.Vector3) => !currentCutEvaluator(p) && previousCutEvaluator(p);

                    rotations.push(new Rotation(axisCut.axis, evaluators, currentCut.nbPositions))
                }
                const lastCut = axisCut.cuts[axisCut.cuts.length - 1]
                rotations.push(new Rotation(axisCut.axis, lastCut.handler.getIsOnPositiveSideEvaluator(), lastCut.nbPositions))
                return rotations;
            }
        )
    }
}

/**
 * Contains all the cuts on a specific axis, in order of signed distance from the center
 */
class AxisCutContainer {
    public readonly axis: THREE.Vector3
    public readonly cuts: Cut[]


    constructor(axis: THREE.Vector3, cuts: Cut[]) {
        this.axis = axis;
        this.cuts = cuts;
    }

    /**
     * Adds a cut to the axis container, ensuring that the order is kept
     * @param cut
     */
    public addCut(cut: Cut) {
        for (let i = 0 ; i < this.cuts.length ; i++) {
            const currentCut = this.cuts[i];
            if (cut.handler.distanceFromCenter < currentCut.handler.distanceFromCenter) {
                this.cuts.splice(i, 0, cut)
                return;
            }
        }
        this.cuts.push(cut);
    }
}