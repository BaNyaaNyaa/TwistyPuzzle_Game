import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import TwistyPuzzleDefinition from "../puzzle/definition/twisty_puzzle/TwistyPuzzleDefinition";
import {PuzzleMoveControls} from "../controls/PuzzleMoveControls";
import TwistyPuzzle from "../puzzle/definition/twisty_puzzle/TwistyPuzzle";
import {TwistyPuzzleBuilder} from "../puzzle/builder/TwistyPuzzleBuilder";
import {MoveHandler} from "../puzzle/MoveHandler";

/**
 * Scene used to debug puzzle and rotation systems
 */
export default class RepeatRotationScene {
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer : THREE.WebGLRenderer;
    private puzzle: TwistyPuzzle | null
    private moveHandler: MoveHandler | null
    private puzzleMoveControls: PuzzleMoveControls | null
    private renderRequested: boolean

    public constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10 );
        this.renderer = new THREE.WebGLRenderer();
        this.puzzle = null;
        this.moveHandler = null
        this.puzzleMoveControls = null
        this.renderRequested = false
    }

    public setup(puzzleDefinition: TwistyPuzzleDefinition) {
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

        const puzzleBuilder = new TwistyPuzzleBuilder(puzzleDefinition);
        this.puzzle = puzzleBuilder.build()
        this.moveHandler = new MoveHandler(this.puzzle, this.scene)

        this.puzzleMoveControls = new PuzzleMoveControls(
            this.moveHandler,
            this.camera,
            this.renderer.domElement
        );

        this.puzzleMoveControls.addEventListener('movestart', () => {
            controls.enabled = false;
        })
        this.puzzleMoveControls.addEventListener('moveend', () => {
            controls.enabled = true;
        })

        controls.addEventListener('change', () => this.requestRender())
        this.moveHandler.addEventListener('move', () => this.requestRender())

        this.requestRender()
    }

    public requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true
            requestAnimationFrame((time) => this.render(time))
        }
    }

    private render(time: number) {
        this.renderRequested = false
        if (this.moveHandler !== null && this.moveHandler.updateTween()) {
            this.requestRender()
        }
        this.renderer.render(this.scene, this.camera);
    }
}
