import * as THREE from "three";
import PuzzleHandler from "../puzzle/Handler";
import * as TWEEN from "@tweenjs/tween.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {IPuzzle} from "../puzzle/PuzzleDefinition";

/**
 * Scene used to debug puzzle and rotation systems
 */
export default class RepeatRotationScene {
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer : THREE.WebGLRenderer;
    private group: THREE.Object3D;
    private tween: TWEEN.Tween | null;
    private puzzleHandler: PuzzleHandler | null;


    public constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10 );
        this.renderer = new THREE.WebGLRenderer();
        this.group = new THREE.Object3D();
        this.tween = null;
        this.puzzleHandler = null;
    }

    public setup(puzzle: IPuzzle) {
        // Setup canvas
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );

        // Add axes
        this.scene.add(new THREE.AxesHelper(1).setColors(0xff0000, 0x00ff00, 0x0000ff));

        // Add lights
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        const light2 = new THREE.DirectionalLight(color, intensity);
        light.position.set(2, 2, 2);
        light2.position.set(-3, -3, -3);
        this.scene.add(light, light2);

        // Add camera controls and position it
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.set(4, 4, 4)
        controls.update();

        // Add the group used to store rotated stickers
        this.scene.add(this.group);

        this.puzzleHandler = new PuzzleHandler((puzzle));

        for (const o of this.puzzleHandler.get3dObjects()) {
            this.scene.attach(o);
        }
    }

    public startNewTween() {
        this.tween = this.generateTween();
        if (this.tween !== null) {
            this.tween.start();
        }
    }

    public render() {
        if(this.tween !== null && !this.tween.update()) {
            this.startNewTween()
        }
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