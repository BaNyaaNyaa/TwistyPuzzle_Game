import * as THREE from 'three'
import MathUtil from "../utils/MathUtil";
import {Rotation} from "../puzzle/PuzzleDefinition";
import {MoveHandler} from "../puzzle/MoveHandler";

interface PuzzleMoveControlsEventMap extends THREE.ControlsEventMap {
    'movestart': {}
    'moveend': {}
}

export class PuzzleMoveControls extends THREE.Controls<PuzzleMoveControlsEventMap, THREE.Camera> {

    private readonly moveHandler: MoveHandler
    private readonly currentPointerPosition: THREE.Vector2;

    private readonly raycaster: THREE.Raycaster;
    private clickData: ClickData | null
    private dragData: DragData | null

    
    constructor(moveHandler: MoveHandler, camera: THREE.Camera, domElement?: HTMLElement | SVGElement | null) {
        super(camera, domElement);

        this.moveHandler = moveHandler
        this.currentPointerPosition = new THREE.Vector2();

        this.raycaster = new THREE.Raycaster()
        this.clickData = null
        this.dragData = null

        if (domElement !== undefined && domElement !== null) {
            this.connect(domElement);
        }
    }

    connect(element: HTMLElement | SVGElement) {
        super.connect(element)

        this.domElement?.addEventListener('pointerdown', this.onPointerDown);
        this.domElement?.addEventListener('pointermove', this.onPointerMove);
        this.domElement?.addEventListener('pointerup', this.onPointerUp);
    }

    disconnect() {
        super.disconnect();

        this.domElement?.removeEventListener('pointerdown', this.onPointerDown);
        this.domElement?.removeEventListener('pointermove', this.onPointerMove);
        this.domElement?.removeEventListener('pointerup', this.onPointerUp);
    }

    get hasFocus(): boolean {
        return this.clickData !== null
    }

    get isDragging(): boolean {
        return this.dragData !== null
    }

    stopDrag() {
        if (this.hasFocus) {
            this.dispatchEvent({type: 'moveend'})
            if (this.isDragging) {
                const draggingData = this.dragData!
                this.moveHandler.completeRotation(draggingData.rotation, draggingData.angle)
            }
        }
        this.clickData = null;
        this.dragData = null
    }

    private onPointerDown = (event: PointerEventInit) => {
        if (this.moveHandler.isBusy || (event.pointerType === 'mouse' && event.buttons !== 1)) {
            return;
        }
        this.updatePointer(event);

        const hits = this.raycaster.intersectObjects(this.moveHandler.puzzle.objects3d);
        if (hits.length === 0) {
            return
        }

        const intersection = hits[0]
        this.clickData = new ClickData(intersection, this.raycaster)
        this.dispatchEvent({type: 'movestart'})

    }

    private onPointerMove = (event: PointerEventInit) => {
        if (!this.hasFocus) {
            return;
        }

        this.updatePointer(event);

        const delta = this.clickData!.getDeltaForNewPosition(this.raycaster)

        if (delta === null) {
            return;
        }

        // If the cursor was moved far enough, find the correct rotation to use
        if (delta.lengthSq() > 0.01 && !this.isDragging) {
            const rotations = this.moveHandler.puzzle.rotations
                .filter(r => r.positionEvaluator(this.clickData!.worldPosition)) // All the possible rotations for the clicked stickers
                .filter(r => !MathUtil.equalFloat(Math.abs(r.axis.dot(this.clickData!.faceNormal)), 1)); // Exclude the one perpendicular to it (makes for weird UX otherwise)
            const dragDirection = delta.clone().normalize();

            let bestRotation = rotations[0];
            let best = 2;
            for (const rotation of rotations) {
                const dotProduct = Math.abs(rotation.axis.dot(dragDirection))
                if (dotProduct < best) {
                    best = dotProduct
                    bestRotation = rotation;
                }
            }

            this.dragData = new DragData(
                bestRotation,
                new THREE.Vector3().crossVectors(bestRotation.axis, this.clickData!.faceNormal).normalize()
            )
            this.moveHandler.selectRotationObjects(this.dragData.rotation)
        }

        if (this.isDragging) {
            const dragging = this.dragData!
            dragging.setAngleFromDeltaVector(delta)
            this.moveHandler.rotateGroup(dragging.rotation, dragging.angle);
        }
    }

    private onPointerUp = (event: PointerEventInit) => {
        if (this.hasFocus && this.isDragging) {
            this.updatePointer(event);

            const delta = this.clickData!.getDeltaForNewPosition(this.raycaster)
            if (delta === null) {
                return
            }
            this.dragData!.setAngleFromDeltaVector(delta)
        }
        this.stopDrag()
    }

    private updatePointer(event: PointerEventInit) {
        this.currentPointerPosition.set(2*event.clientX! / window.innerWidth - 1, -(2*event.clientY! / window.innerHeight - 1))

        this.raycaster.setFromCamera(this.currentPointerPosition, this.object)
    }
}

class ClickData {
    private readonly intersection: THREE.Intersection
    private readonly facePlane: THREE.Plane
    private readonly positionOnPlane: THREE.Vector3;
    public readonly worldPosition: THREE.Vector3


    constructor(intersection: THREE.Intersection, raycaster: THREE.Raycaster) {
        this.intersection = intersection;

        this.facePlane = new THREE.Plane()
        this.facePlane.normal.copy(new THREE.Vector3().copy(intersection.face!.normal)
            .transformDirection(intersection.object.matrixWorld)
            .normalize())
        this.facePlane.constant = -this.facePlane.distanceToPoint(this.intersection.point)

        this.positionOnPlane = new THREE.Vector3()
        raycaster.ray.intersectPlane(this.facePlane, this.positionOnPlane)

        this.worldPosition = new THREE.Vector3()
        this.intersection.object.getWorldPosition(this.worldPosition)
    }

    getDeltaForNewPosition(raycaster: THREE.Raycaster): THREE.Vector3 | null {
        const newPlanePosition = raycaster.ray.intersectPlane(this.facePlane, new THREE.Vector3());
        if (newPlanePosition === null) {
            return null;
        }

        return new THREE.Vector3().subVectors(newPlanePosition, this.positionOnPlane);
    }

    get faceNormal(): THREE.Vector3 {
        return this.facePlane.normal
    }
}

class DragData {
    public readonly rotation: Rotation
    private readonly rotationDirection: THREE.Vector3
    private _angle: number

    constructor(rotation: Rotation, rotationDirection: THREE.Vector3) {
        this.rotation = rotation;
        this.rotationDirection = rotationDirection;
        this._angle = 0;
    }

    get angle(): number {
        return this._angle
    }

    setAngleFromDeltaVector(delta: THREE.Vector3) {
        this._angle = delta.dot(this.rotationDirection)
    }
}