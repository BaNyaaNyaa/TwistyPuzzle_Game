import * as THREE from "three";
import {EdgeSolid, FaceSolid, Solid} from "../definition/solid/Solid";

/**
 * Defines a piece of the puzzle
 * Each piece can be split by "cuts"
 */
export class TwistyPuzzleBuilderPiece {
    /**
     * The coordinates of each vertex
     */
    public readonly vertices: readonly THREE.Vector3[]

    /**
     * The edges of this piece
     */
    public readonly edges: readonly TwistyPuzzleBuilderEdge[]

    /**
     * The list of faces on this piece
     */
    public readonly faces: readonly TwistyPuzzleBuilderFace[]


    constructor(vertices: readonly THREE.Vector3[], edges: readonly TwistyPuzzleBuilderEdge[], faces: readonly TwistyPuzzleBuilderFace[]) {
        this.vertices = vertices;
        this.edges = edges;
        this.faces = faces;
    }

    /**
     * Converts a solid into a single piece
     *
     * @param solid The solid to convert into a piece
     */
    static fromSolid(solid: Solid): TwistyPuzzleBuilderPiece {
        return new TwistyPuzzleBuilderPiece(
            solid.vertices,
            solid.edges.map(TwistyPuzzleBuilderEdge.fromEdgeSolid),
            solid.faces.map(
                (face: FaceSolid, index: number) => TwistyPuzzleBuilderFace.fromFaceSolid(face, index)
            )
        )
    }
}

/**
 * Represents an edge of the puzzle
 */
export class TwistyPuzzleBuilderEdge {
    /**
     * The index of the vertex this edge starts on
     */
    public readonly startVertex: number

    /**
     * The index of the vertex this edge ends on
     */
    public readonly endVertex: number

    /**
     * Whether this edge was generated from a cut
     */
    public readonly isCut: boolean;


    constructor(startVertex: number, endVertex: number, isCut: boolean) {
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.isCut = isCut;
    }

    static fromEdgeSolid(edgeSolid: EdgeSolid): TwistyPuzzleBuilderEdge {
        return new TwistyPuzzleBuilderEdge(edgeSolid.startVertex, edgeSolid.endVertex, false);
    }
}

/**
 * Represents a face of the puzzle
 */
export class TwistyPuzzleBuilderFace {

    /**
     * The indices of the edges this face is made of
     */
    public readonly edges: readonly number[]
    public readonly index: number

    constructor(edges: readonly number[], index: number) {
        this.edges = edges;
        this.index = index
    }

    static fromFaceSolid(faceSolid: FaceSolid, index: number): TwistyPuzzleBuilderFace {
        return new TwistyPuzzleBuilderFace(faceSolid.edges, index);
    }
}
