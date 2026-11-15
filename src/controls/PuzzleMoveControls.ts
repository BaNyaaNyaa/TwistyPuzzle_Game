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
    private intersection: THREE.Intersection | null
    private readonly clickedFacePlane: THREE.Plane
    private readonly clickedPlanePosition: THREE.Vector3;
    private dragRotation: Rotation | null
    private readonly rotationDirection: THREE.Vector3
    
    constructor(moveHandler: MoveHandler, camera: THREE.Camera, domElement?: HTMLElement | SVGElement | null) {
        super(camera, domElement);

        this.moveHandler = moveHandler
        this.currentPointerPosition = new THREE.Vector2();

        this.raycaster = new THREE.Raycaster()
        this.intersection = null;
        this.clickedFacePlane = new THREE.Plane();
        this.clickedPlanePosition = new THREE.Vector3();
        this.dragRotation = null;
        this.rotationDirection = new THREE.Vector3();

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

    private onPointerDown = (event: PointerEventInit) => {
        if (this.moveHandler.isBusy || (event.pointerType === 'mouse' && event.buttons !== 1)) {
            return;
        }
        this.updatePointer(event);

        const hits = this.raycaster.intersectObjects(this.moveHandler.puzzle.objects3d);
        this.intersection = hits.length === 0 ? null : hits[0]
        if (this.intersection !== null) {
            const normal = new THREE.Vector3().copy(this.intersection.face!.normal)
            normal.transformDirection(this.intersection.object.matrixWorld)
            normal.normalize()
            this.clickedFacePlane.normal.copy(normal);
            this.clickedFacePlane.constant = 0
            this.clickedFacePlane.constant = -this.clickedFacePlane.distanceToPoint(this.intersection.point)
            this.raycaster.ray.intersectPlane(this.clickedFacePlane, this.clickedPlanePosition);
            this.dispatchEvent({type: 'movestart'})
        }
    }

    private onPointerMove = (event: PointerEventInit) => {
        if (this.intersection === null) {
            return;
        }

        this.updatePointer(event);

        const newPlanePosition = this.raycaster.ray.intersectPlane(this.clickedFacePlane, new THREE.Vector3());
        if (newPlanePosition === null) {
            return;
        }

        const delta = new THREE.Vector3().subVectors(newPlanePosition, this.clickedPlanePosition);

        // If the cursor was moved far enough, find the correct rotation to use
        if (delta.lengthSq() > 0.01 && this.dragRotation === null) {
            const rotations = this.moveHandler.puzzle.rotations
                .filter(r => r.positionEvaluator(this.intersection!.object.getWorldPosition(new THREE.Vector3()))) // All the possible rotations for the clicked stickers
                .filter(r => !MathUtil.equalFloat(Math.abs(r.axis.dot(this.clickedFacePlane.normal)), 1)); // Exclude the one perpendicular to it (makes for weird UX otherwise)
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

            this.dragRotation = bestRotation
            this.rotationDirection.crossVectors(this.dragRotation.axis, this.clickedFacePlane.normal).normalize();
            this.moveHandler.selectRotationObjects(this.dragRotation!)
        }

        if (this.dragRotation !== null) {
            this.moveHandler.rotateGroup(this.dragRotation!, delta.dot(this.rotationDirection));
        }
    }

    private onPointerUp = (event: PointerEventInit) => {
        main: {
            if (this.intersection === null) {
                break main; // Basically works like a cleanup goto
            }
            this.dispatchEvent({type: 'moveend'})
            if (this.dragRotation === null) {
                break main;
            }

            this.updatePointer(event);

            const newPlanePosition = this.raycaster.ray.intersectPlane(this.clickedFacePlane, new THREE.Vector3());
            if (newPlanePosition === null) {
                return;
            }

            const delta = new THREE.Vector3().subVectors(newPlanePosition, this.clickedPlanePosition);

            const angle = delta.dot(this.rotationDirection)

            this.moveHandler.completeRotation(this.dragRotation!, angle)
        }

        this.intersection = null;
        this.dragRotation = null;
    }

    private updatePointer(event: PointerEventInit) {
        this.currentPointerPosition.set(2*event.clientX! / window.innerWidth - 1, -(2*event.clientY! / window.innerHeight - 1))

        this.raycaster.setFromCamera(this.currentPointerPosition, this.object)
    }
}