import TwistyPuzzleDefinition from "../definition/twisty_puzzle/TwistyPuzzleDefinition";
import TwistyPuzzle from "../definition/twisty_puzzle/TwistyPuzzle";
import {TwistyPuzzleBuilderFace, TwistyPuzzleBuilderPiece} from "./TwistyCubeContainer";
import {CutsContainer} from "./cut/CutsContainer";
import * as THREE from 'three'
import MathUtil from "../../utils/MathUtil";

/**
 * Create a twisty puzzle from its definition
 */
export class TwistyPuzzleBuilder {
    private readonly twistyPuzzleDefinition: TwistyPuzzleDefinition
    private readonly geometryContainer: VerticesToGeometryMap

    constructor(twistyPuzzleDefinition: TwistyPuzzleDefinition) {
        this.twistyPuzzleDefinition = twistyPuzzleDefinition;
        this.geometryContainer = new VerticesToGeometryMap()
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

        return new TwistyPuzzle(
            cutContainer.buildRotations(),
            pieces.flatMap(
                p => p.faces.map(
                    f => this.generateFaceObject3d(f, p)
                )
            )
        )
    }

    private faceVerticesInOrder(piece: TwistyPuzzleBuilderPiece, face: TwistyPuzzleBuilderFace): THREE.Vector3[] {
        const remainingEdges = Array.from(face.edges);
        const startEdge = piece.edges[remainingEdges.pop()!];
        const startVertex = startEdge.startVertex
        let currentVertex = startEdge.endVertex
        const vertices = [startVertex, currentVertex];
        while (remainingEdges.length > 1) {
            for (let i = 0 ; i < remainingEdges.length ; i++) {
                const edge = piece.edges[remainingEdges[i]];
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
        return vertices.map(v => piece.vertices[v]);
    }

    private generateFaceObject3d(face: TwistyPuzzleBuilderFace, piece: TwistyPuzzleBuilderPiece): THREE.Object3D {
        const faceVertices = this.faceVerticesInOrder(piece, face)
        const vertex1 = faceVertices[0]
        const vertex2 = faceVertices[1]
        const vertex3 = faceVertices[2]

        const plane = new THREE.Plane().setFromCoplanarPoints(vertex1, vertex2, vertex3).normalize();

        const xAxis = new THREE.Vector3().subVectors(vertex1, vertex2).normalize();
        const yAxis = new THREE.Vector3().crossVectors(xAxis, plane.normal);
        const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, plane.normal);

        const verticesOnXyPlane: THREE.Vector3[] = faceVertices.map(
            (v) => v.clone().applyMatrix4(matrix.clone().invert()));

        const signedArea = verticesOnXyPlane.map((v_i, i) => {
            const v_ip1 = verticesOnXyPlane[(i + 1) % verticesOnXyPlane.length];
            return v_i.x * v_ip1.y - v_ip1.x * v_i.y
        }).reduce((s, v) => s + v, 0) / 2;

        const xCentroid = verticesOnXyPlane.map((v_i, i) => {
            const v_ip1 = verticesOnXyPlane[(i + 1) % verticesOnXyPlane.length];
            return (v_i.x + v_ip1.x) * (v_i.x * v_ip1.y - v_ip1.x * v_i.y)
        }).reduce((s, v) => s + v, 0) / (6 * signedArea);

        const yCentroid = verticesOnXyPlane.map((v_i, i) => {
            const v_ip1 = verticesOnXyPlane[(i + 1) % verticesOnXyPlane.length];
            return (v_i.y + v_ip1.y) * (v_i.x * v_ip1.y - v_ip1.x * v_i.y)
        }).reduce((s, v) => s + v, 0) / (6 * signedArea);

        const vertices2d = verticesOnXyPlane.map(v => new THREE.Vector2(v.x - xCentroid, v.y - yCentroid))

        const geometry = this.geometryContainer.getGeometryForVertices(vertices2d)
        const material = new THREE.MeshPhongMaterial({ color: this.twistyPuzzleDefinition.colorMap.get(face.index)! });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.userData['faceId'] = face.index

        mesh.applyMatrix4(matrix);
        mesh.scale.set(0.9, 0.9, 0.01);

        let position = new THREE.Vector3()
        let quaternion = new THREE.Quaternion()
        let scale = new THREE.Vector3()
        matrix.decompose(position, quaternion, scale);
        mesh.position.addScaledVector(plane.normal, -plane.constant)
            .addScaledVector(xAxis, xCentroid)
            .addScaledVector(yAxis, yCentroid);

        return mesh
    }
}

class VerticesToGeometryMap {
    private readonly map: [THREE.Vector2[], THREE.BufferGeometry][]


    constructor() {
        this.map = []
    }

    getGeometryForVertices(vertices: THREE.Vector2[]): THREE.BufferGeometry {
        for (const [key, geometry] of this.map) {
            if (vertices.length !== key.length) {
                continue
            }

           let isEqual = true;
            for (let i = 0 ; isEqual && i < vertices.length ; i++) {
                const vertex = vertices[i]
                const keyVertex = key[i]
                if (!MathUtil.equalFloat(new THREE.Vector2().subVectors(vertex, keyVertex).lengthSq(), 0)) {
                    isEqual = false
                }
            }

            if (isEqual) {
                return geometry
            }
        }

        const shape = new THREE.Shape();
        shape.moveTo(vertices[vertices.length - 1].x, vertices[vertices.length - 1].y);
        for (const vertex of vertices) {
            shape.lineTo(vertex.x, vertex.y);
        }
        const geometry = new THREE.ExtrudeGeometry(shape, {bevelEnabled: false, depth: 1});
        this.map.push([vertices, geometry])
        return geometry
    }
}