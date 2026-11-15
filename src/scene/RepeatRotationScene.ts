import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {type IPuzzleHandler, PuzzleHandler} from "../puzzle/Handler";
import TwistyPuzzleDefinition from "../puzzle/definition/twisty_puzzle/TwistyPuzzleDefinition";
import {Rotation} from "../puzzle/PuzzleDefinition";
import MathUtil from "../utils/MathUtil";

/**
 * Scene used to debug puzzle and rotation systems
 */
export default class RepeatRotationScene {
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer : THREE.WebGLRenderer;
    private group: THREE.Object3D;
    private tween: TWEEN.Tween | null;
    private puzzleHandler: IPuzzleHandler | null;

    private currentMousePosition: THREE.Vector2
    private previousMousePosition: THREE.Vector2
    private raycaster: THREE.Raycaster
    private clickedObject: THREE.Object3D | null
    private rotationDrag: Rotation | null
    private plane: THREE.Plane
    private planePosition: THREE.Vector3

    public constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10 );
        this.renderer = new THREE.WebGLRenderer();
        this.group = new THREE.Object3D();
        this.tween = null;
        this.puzzleHandler = null;
        this.currentMousePosition = new THREE.Vector2()
        this.previousMousePosition = new THREE.Vector2()
        this.raycaster = new THREE.Raycaster();
        this.clickedObject = null
        this.rotationDrag = null;
        this.plane = new THREE.Plane()
        this.planePosition = new THREE.Vector3()
    }

    public setup(puzzle: TwistyPuzzleDefinition) {
        // Setup canvas
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );

        // Add axes
        this.scene.add(new THREE.AxesHelper(1).setColors(0xff0000, 0x00ff00, 0x0000ff));

        // Add lights
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new THREE.AmbientLight(color, intensity)
        this.scene.add(light);

        // Add camera controls and position it
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.set(4, 4, 4)
        controls.update();

        // Add the group used to store rotated stickers
        this.scene.add(this.group);

        this.puzzleHandler = new PuzzleHandler(puzzle);

        for (const o of this.puzzleHandler.get3dObjects()) {
            this.scene.attach(o);
        }

        window.addEventListener("mouseup", (event: MouseEvent) => {
            controls.enableRotate = true;
            if (this.clickedObject === null || this.rotationDrag === null) {
                this.clickedObject = null;
                this.rotationDrag = null;
                return;
            }

            this.previousMousePosition.copy(this.currentMousePosition);
            this.currentMousePosition.set(2*event.clientX / window.innerWidth - 1, -(2*event.clientY / window.innerHeight - 1))


            this.raycaster.setFromCamera(this.currentMousePosition, this.camera)
            const newPlanePosition = this.raycaster.ray.intersectPlane(this.plane, new THREE.Vector3());
            if (newPlanePosition === null) {
                return;
            }

            const delta = new THREE.Vector3().subVectors(newPlanePosition, this.planePosition);

            const stepAngle = 2* Math.PI / this.rotationDrag!.nbPositions;
            const rotationVector = new THREE.Vector3().crossVectors(this.plane.normal, this.rotationDrag!.axis).normalize()
            const deltaProjected = delta.clone()
            deltaProjected.projectOnVector(rotationVector)

            const angle = -deltaProjected.dot(rotationVector)
            this.group.setRotationFromAxisAngle(this.rotationDrag!.axis, Math.round(angle/stepAngle)*stepAngle);

            while (this.group.children.length > 0) {
                this.scene.attach(this.group.children.pop()!);
            }
            this.clickedObject = null;
            this.rotationDrag = null;
        });

        window.addEventListener("mousemove", (event: MouseEvent) => {
            if (this.clickedObject === null) {
                return;
            }

            this.previousMousePosition.copy(this.currentMousePosition);
            this.currentMousePosition.set(2*event.clientX / window.innerWidth - 1, -(2*event.clientY / window.innerHeight - 1))

            this.raycaster.setFromCamera(this.currentMousePosition, this.camera)
            const newPlanePosition = this.raycaster.ray.intersectPlane(this.plane, new THREE.Vector3());
            if (newPlanePosition === null) {
                return;
            }

            const delta = new THREE.Vector3().subVectors(newPlanePosition, this.planePosition);
            const normalizedDelta = delta.clone().normalize()

            if (delta.lengthSq() > 0.01 && this.rotationDrag === null) {
                const rotations = this.puzzleHandler!.getAllRotations()
                    .filter(r => r.positionEvaluator(this.clickedObject!.getWorldPosition(new THREE.Vector3())))
                    .filter(r => !MathUtil.equalFloat(Math.abs(r.axis.dot(this.plane.normal)), 1))
                let bestRotation = rotations[0];
                let best = 2;
                for (const rotation of rotations) {
                    const dotProduct = Math.abs(rotation.axis.dot(normalizedDelta))
                    if (dotProduct < best) {
                        best = dotProduct
                        bestRotation = rotation;
                    }
                }

                this.rotationDrag = bestRotation
                const objects = this.puzzleHandler!.get3dObjects()!.filter(o => this.rotationDrag!.positionEvaluator(o.getWorldPosition(new THREE.Vector3())))
                this.group.add(...objects)
            }

            if (this.rotationDrag !== null) {
                const rotationVector = new THREE.Vector3().crossVectors(this.plane.normal, this.rotationDrag!.axis).normalize()
                const deltaProjected = delta.clone()
                deltaProjected.projectOnVector(rotationVector)

                this.group.setRotationFromAxisAngle(this.rotationDrag!.axis, -deltaProjected.dot(rotationVector));
            }
        });

        window.addEventListener("mousedown", (event: MouseEvent) => {
            this.currentMousePosition.x = 2*event.clientX / window.innerWidth - 1
            this.currentMousePosition.y = -(2*event.clientY / window.innerHeight - 1)

            this.raycaster.setFromCamera(this.currentMousePosition, this.camera)

            const hits = this.raycaster.intersectObjects(this.puzzleHandler!.get3dObjects());
            const hit = hits.length === 0 ? null : hits[0]
            this.clickedObject = hit === null ? null : hit.object
            if (this.clickedObject === null) {
                return;
            }
            controls.enableRotate = false;
            const n = new THREE.Vector3()
            n.copy(hit!.face!.normal)
            n.transformDirection(hit!.object.matrixWorld)
            this.plane.normal.copy(hit!.face!.normal)
            this.plane.normal.transformDirection(hit!.object.matrixWorld)
            this.raycaster.ray.intersectPlane(this.plane, this.planePosition)

        });
    }

    public startNewTween() {
        this.tween = this.generateTween();
        if (this.tween !== null) {
            this.tween.start();
        }
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    private generateTween(): TWEEN.Tween | null {
        if (this.puzzleHandler === null) {
            return null;
        }
        const move = this.puzzleHandler.getRandomMove();
        const finalAngle = Math.PI * 2 * move.position / move.rotation.nbPositions;
        const pieces = this.puzzleHandler.get3dObjects().filter(o => move.rotation.positionEvaluator(o.position));
        if (pieces.length > 0) {
            this.group.add(...pieces);
        }
        return new TWEEN.Tween({angle: 0})
            .easing(TWEEN.Easing.Back.Out)
            .to({angle: (finalAngle > 0 ? '+' : '') + finalAngle}, 500)
            .onUpdate(({angle}) => {
                this.group.setRotationFromAxisAngle(move.rotation.axis, angle)
            })
            .onComplete(() => {
                for (const piece of pieces) {
                    this.scene.attach(piece);
                }
                this.group.rotation.copy(new THREE.Euler())
            })
    }
}