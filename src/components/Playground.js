import React from 'react'
//import * as cannon from 'cannon';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin'
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'
import { Vector3, Color3 } from '@babylonjs/core/Maths/math'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator'
import { ShadowGeneratorSceneComponent } from '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'


import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'

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

const SHOW_WORLD_AXIS = false;
const ATTACH_CAMERA = true;

class Playground extends React.Component{
  constructor(props){
    super(props);
    this.keyDirection = 0;
    this.touching = true;
    this.levelHeight = 40;
    this.levelWidth = 150;
    this.levelDepth = 4;
  }

  
  // scene setup
  onSceneMount = ({ canvas, scene, engine }) => {
    window.scene = scene // for debug
    this.scene = scene;
    var gravityVector = new Vector3(0,-9.81, 0);
    var physicsPlugin = new CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);
    // camera
    this.camera = this.createCamera(scene,canvas);
    // sky (https://doc.babylonjs.com/extensions/sky)
    this.createSky(scene);
    // create light
    //this.createLights(scene);
    this.createDirectionalLight(scene);
    this.createHemisphericLight(scene);
    // scene
    this.createStaticMesh({ scene })
    // debug
    if (SHOW_WORLD_AXIS) {
      this.showWorldAxis({ size: 5, scene })
    }
  }

  

  createCamera(scene,canvas){
    const camera = new ArcRotateCamera(
      'arc-camera',
      -Math.PI/2,
      Math.PI/2,
      60,
      new Vector3(0,0,0),
      scene
    )
    camera.fov = 0.6;
    if(!ATTACH_CAMERA){
      camera.setTarget(Vector3.Zero())
      camera.attachControl(canvas, true)
    }
    camera.minZ = 0;
    //camera.keysUp = [];camera.keysDown = [];
    return camera;
  }

  createSky(scene){
    const skyMaterial = new SkyMaterial('sky-material', scene)
    skyMaterial.backFaceCulling = false
    skyMaterial.luminance = 0.8
    skyMaterial.inclination = 0.18
    skyMaterial.azimuth = 0.27
    const skybox = BoxBuilder.CreateBox('skybox', { size: 1000 }, scene)
    skybox.material = skyMaterial
  }

  createDirectionalLight(scene){
    const direct = new DirectionalLight("direct",new Vector3(-1,-3,3),scene);
    direct.position = new Vector3(10,this.levelHeight,-10);
    this.sg = new ShadowGenerator(1024,direct);
    this.sg.usePoissonSampling = true;
  }

  createHemisphericLight(scene){
    const hemi = new HemisphericLight("hemi",new Vector3(1,2,1),scene);
    hemi.intensity = 0.3;
  }

  createLights(scene){
    const light = new PointLight('light', new Vector3(this.levelWidth*3/4, 9, -200), scene)
    const light2 = new PointLight('light', new Vector3(-this.levelWidth*3/4, 32, -200), scene)
    /*const lightDistance = 2
    light.position = new Vector3(
      lightDistance,
      2 * lightDistance,
      lightDistance
    )*/
    light.intensity = .7
    light2.intensity = 0.3
  }

  createStaticMesh = ({ scene }) => {
    this.land = this.createGround(scene);
    this.ceiling = this.createCeiling(scene);
    this.createLeftWall(scene);
    this.createRightWall(scene);
    this.createBricksTexture(scene);
    this.createBackWall(scene);
    this.createFrontWall(scene);
    this.platform = this.createPlatform(scene);    
    this.egg = this.createEgg(scene);
    this.sphere = this.createSphere(scene);
    this.setEggImpostor();
  }

  createGround(scene){
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const land = GroundBuilder.CreateGround(
      'land',
      { width: this.levelWidth,height: this.levelDepth, sideOrientation: Mesh.DOUBLESIDE },
      scene
    )
    land.material = defaultMaterial;
    land.physicsImpostor = new PhysicsImpostor(land,PhysicsImpostor.PlaneImpostor,{mass:0, restitution: 0,stiffness:0,friction:1}, scene);
    land.receiveShadows = true;
    return land;
  }

  createCeiling(scene){
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const ceiling = BoxBuilder.CreateBox(
      'ceiling',
      { width: this.levelWidth,depth: this.levelDepth,height: 0.2 },
      scene
    )
    
    ceiling.position.y = 40;
    ceiling.material = defaultMaterial;
    ceiling.physicsImpostor = new PhysicsImpostor(ceiling,PhysicsImpostor.BoxImpostor,{mass:0}, scene);
    return ceiling;
  }

  createLeftWall(scene){
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const leftWall = BoxBuilder.CreateBox(
      'leftWall',
      { width: this.levelHeight,depth: this.levelDepth,height: 0.2 },
      scene
    )
    leftWall.rotation.z = Math.PI/2;
    leftWall.position.y = 20;
    leftWall.position.x = -this.levelWidth/2;
    leftWall.material = defaultMaterial;
    leftWall.physicsImpostor = new PhysicsImpostor(leftWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.9}, scene);
    leftWall.receiveShadows = true;
  }

  createRightWall(scene){
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const rightWall = BoxBuilder.CreateBox(
      'rightWall',
      { width: this.levelHeight,depth: this.levelDepth,height: 0.2 },
      scene
    )
    rightWall.rotation.z = Math.PI/2;
    rightWall.position.y = 20;
    rightWall.position.x = this.levelWidth/2;
    rightWall.material = defaultMaterial;
    rightWall.physicsImpostor = new PhysicsImpostor(rightWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.9}, scene);
    rightWall.receiveShadows = true;
  }

  createBricksTexture(scene){
    const pbr = new PBRMaterial('default-material', scene)
    //pbr.albedoColor = new Color3(0.7, .7, 0.7);
    /*pbr.metallic = 0;
    pbr.roughness = .7;*/
    pbr.forceIrradianceInFragment = true;
    pbr.albedoTexture = new Texture("textures/bricks_rustic_albedo.png", scene);
    pbr.bumpTexture = new Texture("textures/bricks_rustic_normal.png", scene);
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;
    pbr.metallicTexture = new Texture("textures/bricks_rustic_roughness.png", scene);
    
    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;
    this.pbr = pbr;
  }

  createBackWall(scene){
    let wallWidth = 20;
    let wallHeight = 20;
    const backWall = GroundBuilder.CreateGroundFromHeightMap(
      'backWall','textures/bricks_rustic_height.png',
      { height:  wallHeight,width:wallWidth,
        subdivisions:200,maxHeight:0.2,
        onReady:(backWall)=>{
          backWall.rotation.x= -Math.PI/2;
    
          backWall.material = this.pbr;
          backWall.receiveShadows = true;
          let tmpBackWall = new Mesh("tmpBackWall",scene);
          for(let x = 0;x<this.levelWidth;x += wallWidth){
            for(let y = 0;y<this.levelHeight;y += wallHeight){
              if(x === 0 && y === 0){
                backWall.parent = tmpBackWall;
                backWall.position = new Vector3(x,y,0);
              }else{
                //let newWall = backWall.clone("wallTile"+x+"_"+y,tmpBackWall,true,false);
                let newWall = backWall.createInstance("wallTile"+x+"_"+y);
                newWall.parent = tmpBackWall;
                newWall.position = new Vector3(x,y,0);
              }
            }
          }
          tmpBackWall.position.z = this.levelDepth/2;
          tmpBackWall.position.y = this.levelHeight/2 - wallHeight/2;
          tmpBackWall.position.x= -this.levelWidth/2;
          tmpBackWall.physicsImpostor = new PhysicsImpostor(tmpBackWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
        }
      },
      scene
    );
    
  }

  createFrontWall(scene){
    const frontWall = PlaneBuilder.CreatePlane(
      'frontWall',
      { height: this.levelWidth,width: this.levelHeight,sideOrientation: Mesh.BACKSIDE},
      scene
    )
    frontWall.rotation.z= Math.PI/2;
    frontWall.position.z = -this.levelDepth/2;
    frontWall.position.y = this.levelHeight/2;
    frontWall.physicsImpostor = new PhysicsImpostor(frontWall,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
  }

  createPlatform(scene){
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const platform = BoxBuilder.CreateBox(
      'ceiling',
      { width: 20,depth: this.levelDepth,height: 0.2 },
      scene
    )
    
    platform.position.y = 10;
    platform.material = defaultMaterial;
    platform.physicsImpostor = new PhysicsImpostor(platform,PhysicsImpostor.BoxImpostor,{mass:0, restitution: 0.1,friction:0.01}, scene);
    this.sg.getShadowMap().renderList.push(platform);
    platform.receiveShadows = true;
    return platform;
  }

  createEgg(scene){
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const egg = SphereBuilder.CreateSphere(
      'egg',
      { diameter: 1.5, segments: 16 },
      scene
    );
    egg.material = defaultMaterial;
    egg.position.y = 12;
    //egg.position.z = -this.levelDepth/2;
    this.sg.getShadowMap().renderList.push(egg);
    return egg;
  }

  createSphere(scene){
    const defaultMaterial = new PBRMaterial('default-material', scene)
    defaultMaterial.albedoColor = new Color3(1, 0, 0);
    defaultMaterial.metallic = .9;
    defaultMaterial.roughness = .3;
    const sphere = SphereBuilder.CreateSphere('sphere', { diameter: 2 }, scene)
    sphere.position.y = 2;
    //sphere.position.z = -this.levelDepth/2;
    sphere.material = defaultMaterial;
    if(ATTACH_CAMERA){
      this.camera.parent = sphere;
    }
    sphere.physicsImpostor = new PhysicsImpostor(sphere,PhysicsImpostor.SphereImpostor,{mass:0.2,restitution: 0,friction:1,stiffness:0}, scene);
    sphere.physicsImpostor.registerOnPhysicsCollide([this.platform.physicsImpostor,this.land.physicsImpostor], this.onSphereHitGround);
    this.sg.getShadowMap().renderList.push(sphere);

    return sphere;
  }

  setEggImpostor(scene){
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
      this.sphere.physicsImpostor.friction = 0.1;
      this.land.physicsImpostor.friction = 0.1;
      if(!this.accelerateInterval){
        let self = this;
        this.accelerateInterval = setInterval(()=>{
          //console.log("setInterval accelerate");
          self.accelerate.apply(self);
        },200);
      }
    }else if(e.key === "ArrowLeft"){
      this.keyDirection = -1;
      this.sphere.physicsImpostor.friction = 0.1;
      this.land.physicsImpostor.friction = 0.1;
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
      this.land.physicsImpostor.friction = 1;
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
    this.resetPosAndAngle();
    if( this.keyDirection !== 0 &&
        this.isNotSpeeding() &&
        this.isTouchingGround() ){
      let boost = this.getBoost();
      this.sphere.physicsImpostor.applyImpulse(new Vector3(this.keyDirection*1*boost, 0, 0), this.sphere.getAbsolutePosition());
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
