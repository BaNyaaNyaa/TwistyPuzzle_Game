import * as THREE from 'three'
import {CutHandler} from "../../definition/cut/Cut";
import {TwistyPuzzleBuilderEdge, TwistyPuzzleBuilderFace, TwistyPuzzleBuilderPiece} from "../TwistyCubeContainer";
import MathUtil from "../../../utils/MathUtil";

/**
 * Handler for a plane cut
 */
export default class PlaneCutHandler implements CutHandler {
    /**
     * The plane used to cut through. We assume that the normal had been normalized
     * @private
     */
    private readonly plane: THREE.Plane;

    public constructor(plane: THREE.Plane, ) {
        this.plane = plane;
    }

    public get axis(): THREE.Vector3 {
        return this.plane.normal;
    }

    public get distanceFromCenter(): number {
        // Since we assume that the normal of the plane has been normalized, the distance is simply the opposite of the constant
        return -this.plane.constant;
    }

    public getIsOnPositiveSideEvaluator(): (position: THREE.Vector3) => boolean {
        return (position: THREE.Vector3) => this.plane.distanceToPoint(position) > 0;
    }

    public splitPiece(piece: TwistyPuzzleBuilderPiece): ReadonlyArray<TwistyPuzzleBuilderPiece> {
        const pieceInfo = new PieceInfo(Array.from(piece.vertices), Array.from(piece.edges))

        const positivePiece = new PieceSection(pieceInfo);
        const negativePiece = new PieceSection(pieceInfo);

        // Distance to point is signed
        // If 0, we add the point to both
        for (let i = 0 ; i < piece.vertices.length ; i++) {
            const vertex = piece.vertices[i];
            const distanceToPoint = this.plane.distanceToPoint(vertex);
            if (MathUtil.greaterThanFloat(distanceToPoint, 0)) {
                positivePiece.vertices.add(i);
            }

            if (MathUtil.lessThanFloat(distanceToPoint, 0)) {
                negativePiece.vertices.add(i);
            }
        }

        // The piece is completely situated on one side or another, no cut
        if (positivePiece.vertices.size === pieceInfo.vertices.length || negativePiece.vertices.size === pieceInfo.vertices.length) {
            return [piece];
        }

        /**
         * Map original edge to the two new edges created by the split as [positive, negative]
         */
        const splitEdges = new Map<number, [number, number]>();

        for (let i = 0 ; i < piece.edges.length ; i++) {
            const edge = piece.edges[i];
            let edgeAdded = false;

            // Add the edge to the correct piece if both vertices are in the same piece
            edgeAdded ||= positivePiece.addEdgeIfVerticesExist(i, edge.startVertex, edge.endVertex)
            edgeAdded ||= negativePiece.addEdgeIfVerticesExist(i, edge.startVertex, edge.endVertex)

            // This means the edge is split
            if (!edgeAdded) {
                const startVertex = piece.vertices[edge.startVertex];
                const endVertex = piece.vertices[edge.endVertex];
                const line = new THREE.Line3(startVertex, endVertex);

                const intersection = this.plane.intersectLine(line, new THREE.Vector3(), true)!;

                // Create one new vertex and add it to each piece
                const newVertexIndex = pieceInfo.addVertex(intersection);
                positivePiece.vertices.add(newVertexIndex);
                negativePiece.vertices.add(newVertexIndex);

                // Create 2 edges from the split, and add them to the right piece
                const newEdgeStartIndex = pieceInfo.addEdge(new TwistyPuzzleBuilderEdge(edge.startVertex, newVertexIndex, false));
                const newEdgeEndIndex = pieceInfo.addEdge(new TwistyPuzzleBuilderEdge(edge.endVertex, newVertexIndex, false));

                if (positivePiece.vertices.has(edge.startVertex)) {
                    splitEdges.set(i, [newEdgeStartIndex, newEdgeEndIndex])
                    positivePiece.edges.add(newEdgeStartIndex);
                    negativePiece.edges.add(newEdgeEndIndex);
                } else {
                    splitEdges.set(i, [newEdgeEndIndex, newEdgeStartIndex])
                    positivePiece.edges.add(newEdgeEndIndex);
                    negativePiece.edges.add(newEdgeStartIndex);
                }
            }
        }

        // Split each face
        for (const face of piece.faces) {
            const positiveFace: number[] = []
            const negativeFace: number[] = []

            for (const edge of face.edges) {
                if (positivePiece.edges.has(edge)) {
                    positiveFace.push(edge)
                }

                if (negativePiece.edges.has(edge)) {
                    negativeFace.push(edge)
                }

                if (splitEdges.has(edge)) {
                    const [positiveEdge, negativeEdge] = splitEdges.get(edge)!
                    positiveFace.push(positiveEdge)
                    negativeFace.push(negativeEdge)
                }
            }

            positivePiece.addFace(positiveFace);
            negativePiece.addFace(negativeFace);
        }

        return [
            positivePiece.buildPiece(),
            negativePiece.buildPiece()
        ].filter(p => p !== null)
    }
}

/**
 * Contains the aggregated information about the piece
 */
class PieceInfo {
    private readonly _vertices: THREE.Vector3[]
    private readonly _edges: TwistyPuzzleBuilderEdge[]
    private readonly _newEdges: Map<string, number>


    constructor(vertices: THREE.Vector3[], edges: TwistyPuzzleBuilderEdge[]) {
        this._vertices = vertices;
        this._edges = edges;
        this._newEdges = new Map<string, number>()
    }

    /**
     * Add a vertex and return its index
     * @param vertex
     */
    addVertex(vertex: THREE.Vector3): number {
        return this._vertices.push(vertex) - 1
    }

    /**
     * Add a new edge and its index
     * If the edge already exists, return the index of the already existing edge
     *
     * @param edge
     */
    addEdge(edge: TwistyPuzzleBuilderEdge): number {
        const key = [Math.min(edge.startVertex, edge.endVertex), Math.max(edge.startVertex, edge.endVertex)].join(',')
        if (this._newEdges.has(key)) {
            return this._newEdges.get(key)!;
        }
        const index = this._edges.push(edge) - 1;
        this._newEdges.set(key, index)
        return index;
    }

    get vertices(): ReadonlyArray<THREE.Vector3> {
        return this._vertices
    }

    get edges(): ReadonlyArray<TwistyPuzzleBuilderEdge> {
        return this._edges;
    }
}

/**
 * A section of the piece, to simplify positive/negative split management
 */
class PieceSection {

    /**
     * The indices of the vertices in PieceInfo
     */
    public readonly vertices: Set<number>

    /**
     * The indices of the edges in PieceInfo
     */
    public readonly edges: Set<number>

    /**
     * The indices of the faces in PieceInfo
     */
    public readonly faces: number[][]

    private readonly pieceInfo: PieceInfo

    constructor(pieceInfo: PieceInfo) {
        this.pieceInfo = pieceInfo;

        this.vertices = new Set<number>()
        this.edges = new Set<number>();
        this.faces = [];
    }

    /**
     * Add the edge if both the starting and ending vertices exist in the piece
     * Returns true if the edge was successfully added
     *
     * @param edge
     * @param start
     * @param end
     */
    addEdgeIfVerticesExist(edge: number, start: number, end: number): boolean {
        if (this.vertices.has(start) && this.vertices.has(end)) {
            this.edges.add(edge);
            return true;
        }
        return false;
    }

    /**
     * Add a face to the piece
     * If the face has unattached vertices, create a new edge to complete the face
     *
     * @param face
     */
    addFace(face: number[]) {
        if (face.length === 0) {
            return;
        }

        // If the face was split, there should be two vertices
        const unattachedVertices = Map.groupBy<number, number>(
            face.flatMap(e => [this.pieceInfo.edges[e].startVertex, this.pieceInfo.edges[e].endVertex]), (i) => i
        )
            .entries()
            .filter(([, v]) => v.length === 1)
            .map(([k]) => k)
            .toArray();

        if (unattachedVertices.length === 2){
            const newEdgeIndex = this.pieceInfo.addEdge(new TwistyPuzzleBuilderEdge(unattachedVertices[0], unattachedVertices[1], true))
            this.edges.add(newEdgeIndex);
            face.push(newEdgeIndex);
        }

        this.faces.push(face);
    }

    /**
     * Generate a TwistyPuzzleBuilderPiece from the information of the PieceSection
     *
     * Returns null if the piece cannot be created
     */
    public buildPiece(): TwistyPuzzleBuilderPiece | null {
        if (this.faces.length === 0) {
            return null;
        }
        const pieceVertices = Array.from(this.vertices);
        const pieceEdges = Array.from(this.edges);

        const newVertices = pieceVertices.map(v => this.pieceInfo.vertices[v]);
        const oldToNewVertices = new Map(pieceVertices.map((v, i) => [v, i]))

        const newEdges = pieceEdges.map(e => {
            const edge = this.pieceInfo.edges[e]
            return new TwistyPuzzleBuilderEdge(oldToNewVertices.get(edge.startVertex)!, oldToNewVertices.get(edge.endVertex)!, edge.isCut);
        })
        const oldToNewEdges = new Map(pieceEdges.map((e, i) => [e, i]))

        const newFaces = this.faces.map(f => new TwistyPuzzleBuilderFace(f.map(e => oldToNewEdges.get(e)!)));
        return new TwistyPuzzleBuilderPiece(newVertices, newEdges, newFaces);
    }
}