import {
    TwistyPuzzleBuilderEdge,
    TwistyPuzzleBuilderFace,
    TwistyPuzzleBuilderPiece
} from "../../builder/TwistyCubeContainer";
import * as THREE from "three";
import {RotationsContainer} from "../../PuzzleDefinition";

/**
 * Represents a puzzle with pieces and a list of rotations
 */
export default class TwistyPuzzle {
    public readonly pieces: ReadonlyArray<TwistyPuzzlePiece>
    public readonly rotationsContainer: RotationsContainer


    constructor(pieces: ReadonlyArray<TwistyPuzzlePiece>, rotationsContainer: RotationsContainer) {
        this.pieces = pieces;
        this.rotationsContainer = rotationsContainer;
    }

    static fromTwistyCubeBuilder(pieces: ReadonlyArray<TwistyPuzzleBuilderPiece>, rotationsContainer: RotationsContainer): TwistyPuzzle {
        return new TwistyPuzzle(
            pieces.map(p => TwistyPuzzlePiece.fromTwistyPuzzleBuilderPiece(p)),
            rotationsContainer
        );
    }
}

class TwistyPuzzlePiece {
    public readonly vertices: ReadonlyArray<THREE.Vector3>
    public readonly edges: ReadonlyArray<TwistyPuzzleEdge>
    public readonly faces: ReadonlyArray<TwistyPuzzleFace>


    constructor(vertices: ReadonlyArray<THREE.Vector3>, edges: ReadonlyArray<TwistyPuzzleEdge>, faces: ReadonlyArray<TwistyPuzzleFace>) {
        this.vertices = vertices;
        this.edges = edges;
        this.faces = faces;
    }

    static fromTwistyPuzzleBuilderPiece(piece: TwistyPuzzleBuilderPiece): TwistyPuzzlePiece {
        return new TwistyPuzzlePiece(
            piece.vertices,
            piece.edges.map(e => TwistyPuzzleEdge.fromTwistyPuzzleBuilderEdge(e)),
            piece.faces.map(f => TwistyPuzzleFace.fromTwistyPuzzleBuilderFace(f))
        )
    }

    get facesWithVertices(): ReadonlyArray<ReadonlyArray<THREE.Vector3>> {
        return this.faces.map(
            f => {
                const remainingEdges = Array.from(f.edges);
                const startEdge = this.edges[remainingEdges.pop()!];
                const startVertex = startEdge.startVertex
                let currentVertex = startEdge.endVertex
                const vertices = [startVertex, currentVertex];
                while (remainingEdges.length > 1) {
                    for (let i = 0 ; i < remainingEdges.length ; i++) {
                        const edge = this.edges[remainingEdges[i]];
                        if (currentVertex === edge.startVertex) {
                            vertices.push(edge.endVertex);
                            currentVertex = edge.endVertex
                            remainingEdges.splice(i, 1);
                            break;
                        }
                        else if (currentVertex === edge.endVertex) {
                            vertices.push(edge.startVertex);
                            currentVertex = edge.startVertex
                            remainingEdges.splice(i, 1);
                            break;
                        }
                    }
                }
                return vertices.map(v => this.vertices[v]);
            }
        );
    }
}

export class TwistyPuzzleEdge {
    public readonly startVertex: number
    public readonly endVertex: number


    constructor(startVertex: number, endVertex: number) {
        this.startVertex = startVertex;
        this.endVertex = endVertex;
    }

    static fromTwistyPuzzleBuilderEdge(edge: TwistyPuzzleBuilderEdge): TwistyPuzzleEdge {
        return new TwistyPuzzleEdge(edge.startVertex, edge.endVertex);
    }
}

export class TwistyPuzzleFace {
    public readonly edges: ReadonlyArray<number>


    constructor(edges: ReadonlyArray<number>) {
        this.edges = edges;
    }

    static fromTwistyPuzzleBuilderFace(face: TwistyPuzzleBuilderFace): TwistyPuzzleFace {
        return new TwistyPuzzleFace(face.edges);
    }
}
