import * as THREE from "three";

export class Solid {
    public readonly vertices: ReadonlyArray<THREE.Vector3>
    public readonly edges: ReadonlyArray<EdgeSolid>
    public readonly faces: ReadonlyArray<FaceSolid>

    constructor(vertices: ReadonlyArray<THREE.Vector3>, edges: ReadonlyArray<EdgeSolid>, faces: ReadonlyArray<FaceSolid>) {
        this.vertices = vertices;
        this.edges = edges;
        this.faces = faces;
    }
}

export class FaceSolid {
    public readonly edges: ReadonlyArray<number>;

    constructor(edges: number[]) {
        this.edges = edges;
    }
}

export class EdgeSolid {
    public readonly startVertex: number;
    public readonly endVertex: number

    constructor(startVertex: number, endVertex: number) {
        this.startVertex = startVertex;
        this.endVertex = endVertex;
    }
}