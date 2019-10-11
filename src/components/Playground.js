import React from 'react'
//import * as cannon from 'cannon';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin'
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'
import { Vector3, Color3 } from '@babylonjs/core/Maths/math'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { LinesBuilder } from '@babylonjs/core/Meshes/Builders/linesBuilder'
import { PlaneBuilder } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { GroundBuilder } from '@babylonjs/core/Meshes/Builders/groundBuilder'
import { SphereBuilder } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { BoxBuilder } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SkyMaterial } from '@babylonjs/materials/sky'
// required babylon side effects
import '@babylonjs/core/Animations/animatable'
import '@babylonjs/core/Physics/physicsEngineComponent'


import BabylonScene from './BabylonScene'

const SHOW_WORLD_AXIS = false

class Playground extends React.Component{
  constructor(props){
    super(props);
    this.keyDirection = 0;
    this.touching = true;
    this.levelHeight = 40;
    this.levelWidth = 60;
    this.levelDepth = 4;
  }

  onSpacePressed = () =>{
    
    //let horizImpulse = this.isNotSpeeding() ?this.keyDirection/2:0;
    let boost = this.getBoost();
    console.log("spacebar boost"+boost);
    this.sphere.physicsImpostor.applyImpulse(new Vector3(this.keyDirection*0.7*boost, 1, 0), this.sphere.getAbsolutePosition())
    this.resetPosAndAngle();
    this.touching = false;
  }
  getBoost(){
    let vel = this.sphere.physicsImpostor.getLinearVelocity().x;
    return vel/Math.abs(vel) === this.keyDirection ? 1 : 2;
  }
  isNotSpeeding(){
    return this.sphere.physicsImpostor.getLinearVelocity().x*this.keyDirection < 7;
  }
  isTouchingGround(){
    return this.touching;
  }
  onKeyDown = (e) => {
    e.preventDefault();
    if (e.key === " ") {
      this.onSpacePressed();
    }else if(e.key === "ArrowRight"){
      this.keyDirection = 1;
      this.sphere.physicsImpostor.friction = 0.01;
      if(!this.accelerateInterval){
        let self = this;
        this.accelerateInterval = setInterval(()=>{
          //console.log("setInterval accelerate");
          self.accelerate.apply(self);
        },200);
      }
    }else if(e.key === "ArrowLeft"){
      this.keyDirection = -1;
      this.sphere.physicsImpostor.friction = 0.01;
      if(!this.accelerateInterval){
        let self = this;
        this.accelerateInterval = setInterval(()=>{
          //console.log("setInterval accelerate");
          self.accelerate.apply(self);
        },200);
      }
    }else if(e.key === "AltGraph"){
      if(this.sphere.getChildren().includes(this.egg)){
        console.log("AltGraph");
        this.egg.parent = null;
        this.egg.position = this.sphere.getAbsolutePosition();
        this.egg.position.x += 5*this.keyDirection;
        //this.egg.physicsImpostor = new PhysicsImpostor(this.egg,PhysicsImpostor.BoxImpostor,{mass:1, restitution: 0.5,friction:0.01}, this.scene);
        this.setEggImpostor();
        this.egg.position.z = 0;
        let vel = this.egg.physicsImpostor.getLinearVelocity();
        vel.z = 0;
        this.egg.physicsImpostor.setLinearVelocity(vel);
        this.egg.physicsImpostor.setAngularVelocity(new Vector3(0,0,0));
        this.egg.rotation = new Vector3(0,0,0);
        this.egg.physicsImpostor.applyImpulse(new Vector3(this.keyDirection*20, 0, 0), this.egg.getAbsolutePosition());

      }
    }
  }
  onKeyUp = (e) => {
    e.preventDefault();
    if(e.key === "ArrowRight" || e.key === "ArrowLeft"){
      this.keyDirection = 0;
      if(this.accelerateInterval){
        console.log("clearInterval");
        clearInterval(this.accelerateInterval);
        this.accelerateInterval = null;
      }
      this.sphere.physicsImpostor.friction = 1;
    }
  }
  resetPosAndAngle = () => {
    let vel = this.sphere.physicsImpostor.getLinearVelocity();
    vel.z = 0;
    this.sphere.physicsImpostor.setLinearVelocity(vel);
    this.sphere.position.z = 0;
    this.sphere.physicsImpostor.setAngularVelocity(new Vector3(0,0,0));
    this.sphere.rotation = new Vector3(0,0,0);
  }
  accelerate(){
    //console.log(this.sphere.physicsImpostor.pressure);
    //console.log("accelerate velocity = "+this.sphere.physicsImpostor.getLinearVelocity().x+" keyDirection="+this.keyDirection+" sphere.y="+this.sphere.position.y+" diam="+this.sphere.diameter);
    this.resetPosAndAngle();
    if( this.keyDirection !== 0 &&
        this.isNotSpeeding() &&
        this.isTouchingGround() ){
      let boost = this.getBoost();
      this.sphere.physicsImpostor.applyImpulse(new Vector3(this.keyDirection*1*boost, 0, 0), this.sphere.getAbsolutePosition());
    }
  }
  // scene setup
  onSceneMount = ({ canvas, scene, engine }) => {
    //console.log('Babylon scene mounted')
    window.scene = scene // for debug
    this.scene = scene;
    var gravityVector = new Vector3(0,-9.81, 0);
    var physicsPlugin = new CannonJSPlugin();
    
    scene.enablePhysics(gravityVector, physicsPlugin);
    // camera
    const camera = new ArcRotateCamera(
      'arc-camera',
      -Math.PI/2,
      Math.PI/2,
      60,
      new Vector3(0,0,0),
      scene
    )
    camera.fov = 0.6;
    //camera.setTarget(Vector3.Zero())
    
    //camera.attachControl(canvas, true)
    camera.keysUp = [];camera.keysDown = [];
    this.camera = camera;
    // sky (https://doc.babylonjs.com/extensions/sky)
    const skyMaterial = new SkyMaterial('sky-material', scene)
    skyMaterial.backFaceCulling = false
    skyMaterial.luminance = 0.8
    skyMaterial.inclination = 0.18
    skyMaterial.azimuth = 0.27
    const skybox = BoxBuilder.CreateBox('skybox', { size: 1000 }, scene)
    skybox.material = skyMaterial
    // create light
    const light = new PointLight('light', new Vector3(20, 9, -20), scene)
    const light2 = new PointLight('light', new Vector3(-50, 32, -20), scene)
    /*const lightDistance = 2
    light.position = new Vector3(
      lightDistance,
      2 * lightDistance,
      lightDistance
    )*/
    light.intensity = .7
    light2.intensity = 0.3
    // scene
    this.createStaticMesh({ scene })
    // debug
    if (SHOW_WORLD_AXIS) {
      this.showWorldAxis({ size: 5, scene })
    }
  }

  createStaticMesh = ({ scene }) => {
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const land = GroundBuilder.CreateGround(
      'land',
      { width: this.levelWidth,height: this.levelDepth, sideOrientation: Mesh.DOUBLESIDE },
      scene
    )

    const ceiling = BoxBuilder.CreateBox(
      'ceiling',
      { width: this.levelWidth,depth: this.levelDepth,height: 0.2 },
      scene
    )
    
    ceiling.position.y = 40;
    ceiling.material = defaultMaterial;

    const leftWall = BoxBuilder.CreateBox(
      'leftWall',
      { width: this.levelHeight,depth: this.levelDepth,height: 0.2 },
      scene
    )
    leftWall.rotation.z = Math.PI/2;
    leftWall.position.y = 20;
    leftWall.position.x = -this.levelWidth/2;
    leftWall.material = defaultMaterial;

    const backWall = PlaneBuilder.CreatePlane(
      'backWall',
      { height: this.levelWidth,width: this.levelHeight, sideOrientation: Mesh.DOUBLESIDE},
      scene
    )
    backWall.rotation.z= Math.PI/2;
    //backWall.position.z = 10;
    backWall.position.y = this.levelHeight/2;
    backWall.material = defaultMaterial;

    const frontWall = PlaneBuilder.CreatePlane(
      'frontWall',
      { height: this.levelWidth,width: this.levelHeight,sideOrientation: Mesh.BACKSIDE},
      scene
    )
    frontWall.rotation.z= Math.PI/2;
    frontWall.position.z = -this.levelDepth;
    frontWall.position.y = this.levelHeight/2;
    //frontWall.material = defaultMaterial;

    const rightWall = BoxBuilder.CreateBox(
      'rightWall',
      { width: this.levelHeight,depth: this.levelDepth,height: 0.2 },
      scene
    )
    rightWall.rotation.z = Math.PI/2;
    rightWall.position.y = 20;
    rightWall.position.x = this.levelWidth/2;
    rightWall.material = defaultMaterial;

    const platform = BoxBuilder.CreateBox(
      'ceiling',
      { width: 20,depth: this.levelDepth,height: 0.2 },
      scene
    )
    
    platform.position.y = 10;
    platform.material = defaultMaterial;

    //ceiling.rotation = new Vector3(Math.PI / 2, 0, 0);
    land.material = defaultMaterial;

    const egg = SphereBuilder.CreateSphere(
      'egg',
      { diameter: 1.5, segments: 16 },
      scene
    );
    egg.material = defaultMaterial;
    egg.position.y = 12;
    egg.position.z = -this.levelDepth/2;
    this.egg = egg;

    /*const sphere = SphereBuilder.CreateSphere(
      'sphere',
      { diameter: 2, segments: 16 },
      scene
    );
    sphere.material = defaultMaterial;
    sphere.position.y = 2;
    sphere.position.z = -1;*/

    const sphere = BoxBuilder.CreateBox('sphere', { size: 2 }, scene)
    sphere.position.y = 2;
    sphere.position.z = -this.levelDepth/2;
    sphere.material = defaultMaterial;
    this.camera.parent = sphere;

    land.physicsImpostor = new PhysicsImpostor(land,PhysicsImpostor.PlaneImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
    sphere.physicsImpostor = new PhysicsImpostor(sphere,PhysicsImpostor.BoxImpostor,{mass:0.2,restitution: 0.1}, scene);
    //sphere.physicsImpostor.onCollideEvent = (e)=>{console.log(e)};
    ceiling.physicsImpostor = new PhysicsImpostor(ceiling,PhysicsImpostor.BoxImpostor,{mass:0}, scene);
    platform.physicsImpostor = new PhysicsImpostor(platform,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
    backWall.physicsImpostor = new PhysicsImpostor(backWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
    frontWall.physicsImpostor = new PhysicsImpostor(frontWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
    //egg.physicsImpostor = new PhysicsImpostor(egg,PhysicsImpostor.BoxImpostor,{mass:1, restitution: 0.5,friction:0.01}, scene);
    leftWall.physicsImpostor = new PhysicsImpostor(leftWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.9}, scene);
    rightWall.physicsImpostor = new PhysicsImpostor(rightWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.9}, scene);
    let self = this;
    sphere.physicsImpostor.registerOnPhysicsCollide([platform.physicsImpostor,land.physicsImpostor], this.onSphereHitGround);

    //cube.physicsImpostor = new PhysicsImpostor(cube,PhysicsImpostor.BoxImpostor,{mass:.1, restitution: 0.9}, scene);
    this.ceiling = ceiling;
    this.sphere = sphere;
    this.land = land;
    this.setEggImpostor();
  }
  setEggImpostor(){
    this.egg.physicsImpostor = new PhysicsImpostor(this.egg,PhysicsImpostor.SphereImpostor,{mass:1, restitution: 0.2,friction:0.3}, this.scene);
    this.sphere.physicsImpostor.registerOnPhysicsCollide(this.egg.physicsImpostor, this.onSphereHitEgg);
  }
  onSphereHitEgg = (main, collided) => {
    this.egg.physicsImpostor.dispose();
    this.egg.parent = this.sphere;
    this.egg.position = new Vector3((2+1.5)/2,0,0);
  }
  onSphereHitGround = (main, collided) => {
    if(Math.abs(this.sphere.physicsImpostor.getLinearVelocity().y) < 4){
      this.touching = true;
    }
  }


  showWorldAxis = ({ size, scene }) => {
    const axisX = LinesBuilder.CreateLines(
      'axisX',
      {
        points: [Vector3.Zero(), new Vector3(size, 0, 0)]
      },
      scene
    )
    axisX.color = new Color3(1, 0, 0)
    const axisY = LinesBuilder.CreateLines(
      'axisY',
      {
        points: [Vector3.Zero(), new Vector3(0, size, 0)]
      },
      scene
    )
    axisY.color = new Color3(0, 1, 0)
    const axisZ = LinesBuilder.CreateLines(
      'axisZ',
      {
        points: [Vector3.Zero(), new Vector3(0, 0, size)]
      },
      scene
    )
    axisZ.color = new Color3(0, 0, 1)
  }

  // initialise scene rendering
  render(){
    return <BabylonScene onSceneMount={this.onSceneMount} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onRender={this.resetPosAndAngle}/>
  }
}

export default Playground
