import React from 'react'
//import * as cannon from 'cannon';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin'
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'
import { Vector3, Color3,Vector4,Quaternion } from '@babylonjs/core/Maths/math'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { SpotLight } from '@babylonjs/core/Lights/spotLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator'
import { ShadowGeneratorSceneComponent } from '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import {SceneLoader} from '@babylonjs/core/Loading/';


import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial'
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
    const gravityVector = new Vector3(0,-9.81, 0);
    const physicsPlugin = new CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);
    // camera
    this.camera = this.createCamera(scene,canvas);
    // sky (https://doc.babylonjs.com/extensions/sky)
    //this.createSky(scene);
    // create light
    this.createLights(scene);
    this.createDirectionalLight(scene);
    this.createHemisphericLight(scene);
    // scene
    this.createStaticMesh(scene)
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
    skyMaterial.luminance = 1
    skyMaterial.inclination = 0.3
    skyMaterial.azimuth = .4
    const skybox = BoxBuilder.CreateBox('skybox', { size: 1000 }, scene)
    skybox.material = skyMaterial
  }

  createDirectionalLight(scene){
    const direct = new DirectionalLight("direct",new Vector3(-1,-3,3),scene);
    direct.intensity = 1.3;
    direct.position = new Vector3(10,this.levelHeight,-10);
    this.sg = new ShadowGenerator(1024,direct);
    this.sg.usePoissonSampling = true;
  }

  createHemisphericLight(scene){
    const hemi = new HemisphericLight("hemi",new Vector3(0,0,-1),scene);
    hemi.intensity = .15;
  }

  createLights(scene){
    const num = 2;
    this.flickers = new Map();
    for(let i = 1;i<=num;i++){
      const light = new SpotLight('pointlight'+i,
        new Vector3(
          this.levelWidth*i/num-3*this.levelWidth/4,
          this.levelHeight/2,
          this.levelDepth/2-1.5
        ),
        new Vector3(0,1,.3),
        Math.PI,
        10, scene);
      console.log(light);
      this.ssg = new ShadowGenerator(512,light);
      this.ssg.usePoissonSampling = true;
      //light.range = 5;
      light.diffuse = new Color3(1,0.4,0.2);
      light.intensity = 500;
      this.startLightFlicker(light);
    }
  }

  startLightFlicker(light){
    this.flickers[light] = {
      interval:setInterval(()=>this.flickerLight(light),50),
      position:light.position.clone()
    };
  }

  //TODO make it more natural / random
  flickerLight(light){
    const now = Date.now();
    const angle = now*Math.PI/600;
    const zAngle = now*Math.PI/400;
    const intensityAngle = now*Math.PI/100;
    light.intensity = 400 + Math.cos(intensityAngle)*50
    light.position.x = this.flickers[light].position.x + Math.cos(angle)/8;
    light.position.z = this.flickers[light].position.z - Math.sin(zAngle)/8;
  }

  createStaticMesh (scene){
    this.loadModels(scene);
    this.concreteMaterial = this.createConcreteMaterial(scene);
    this.pbr = this.createBricksMaterial(scene);
    this.land = this.createGround(scene);
    this.createFloor(scene);
    this.ceiling = this.createCeiling(scene);
    this.createLeftWall(scene);
    this.createRightWall(scene);
    this.createBackWall(scene);
    this.createFrontWall(scene);
    this.platform = this.createPlatform(scene);    
    this.egg = this.createEgg(scene);
    this.player = this.createPlayer(scene);
    //this.setEggImpostor();
  }

  createGround(scene){
    const land = GroundBuilder.CreateGround(
      'land',
      { 
        width: this.levelWidth,
        height: this.levelDepth,
        sideOrientation: Mesh.DOUBLESIDE
      },
      scene
    );
    //land.material = defaultMaterial;
    land.physicsImpostor = new PhysicsImpostor(
      land,
      PhysicsImpostor.PlaneImpostor,
      {mass:0, restitution: 0,stiffness:0,friction:1},
      scene
    );
    land.visibility = 0;
    return land;
  }

  createFloor(scene){
    const faceUV = this.getBoxWrapUV(this.levelWidth,2,this.levelDepth,5);
    const floor = BoxBuilder.CreateBox(
      'land',
      { 
        width: this.levelWidth,
        height: 2,
        depth:this.levelDepth,
        sideOrientation: Mesh.DOUBLESIDE,
        faceUV:faceUV
      },
      scene
    )
    //floor.rotation.x = Math.PI/2;
    floor.position.y = -1;
    floor.material = this.concreteMaterial;
    floor.receiveShadows = true;
  }

  createCeiling(scene){
    const wallHeight = 2;
    const faceUV = this.getBoxWrapUV(this.levelWidth,wallHeight,this.levelDepth,5);
    const ceiling = BoxBuilder.CreateBox(
      'ceiling',
      { width: this.levelWidth,
        depth: this.levelDepth,
        height: wallHeight,
        faceUV:faceUV
      },
      scene
    )
    
    ceiling.position.y = 40 + wallHeight/2;
    ceiling.material = this.concreteMaterial;
    ceiling.physicsImpostor = new PhysicsImpostor(
      ceiling,
      PhysicsImpostor.BoxImpostor,
      {mass:0},
      scene
    );
    return ceiling;
  }

  createLeftWall(scene){
    const wallWidth = 2;
    const faceUV = this.getBoxWrapUV(wallWidth,this.levelHeight,this.levelDepth,5);
    const leftWall = BoxBuilder.CreateBox(
      'leftWall',
      { width: wallWidth,
        depth: this.levelDepth,
        height: this.levelHeight,
        faceUV:faceUV
      },
      scene
    );
    leftWall.position.y = this.levelHeight/2;
    leftWall.position.x = -this.levelWidth/2 + wallWidth/2;
    leftWall.material = this.concreteMaterial;
    leftWall.physicsImpostor = new PhysicsImpostor(
      leftWall,
      PhysicsImpostor.BoxImpostor,
      {mass:0, restitution: 0.9},
      scene
    );
    leftWall.receiveShadows = true;
  }

  createRightWall(scene){
    const wallWidth = 2;
    const faceUV = this.getBoxWrapUV(wallWidth,this.levelHeight,this.levelDepth,5);
    const rightWall = BoxBuilder.CreateBox(
      'rightWall',
      { width: wallWidth,
        depth: this.levelDepth,
        height: this.levelHeight,
        faceUV:faceUV
      },
      scene
    )
    rightWall.position.y = this.levelHeight/2;
    rightWall.position.x = this.levelWidth/2 - wallWidth/2;;
    rightWall.material = this.concreteMaterial;
    rightWall.physicsImpostor = new PhysicsImpostor(
      rightWall,
      PhysicsImpostor.BoxImpostor,
      {mass:0, restitution: 0.9},
      scene
    );
    rightWall.receiveShadows = true;
  }

  createBricksMaterial(scene){
    const pbr = new PBRMaterial('bricks', scene);
    pbr.forceIrradianceInFragment = true;
    pbr.albedoTexture = new Texture("textures/bricks_rustic_albedo.png", scene);
    pbr.bumpTexture = new Texture("textures/bricks_rustic_normal.png", scene);
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;
    pbr.metallicTexture = new Texture(
      "textures/bricks_rustic_metallic_roughness.png",
      scene
    );
    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;
    return pbr;
  }

  createBackWall(scene){
    const wallWidth = 20;
    const wallHeight = 20;
    const backWall = GroundBuilder.CreateGroundFromHeightMap(
      'backWall','textures/bricks_rustic_height.png',
      { height:  wallHeight,width:wallWidth,
        subdivisions:200,maxHeight:0.2,
        onReady:(backWall)=>{
          backWall.rotation.x= -Math.PI/2;
    
          backWall.material = this.pbr;
          backWall.receiveShadows = true;
          //this.ssg.getShadowMap().renderList.push(backWall);
          const tmpBackWall = this.createBackWallGrid(
            backWall,
            scene,
            wallWidth,
            wallHeight
          );
          tmpBackWall.position.z = this.levelDepth/2;
          tmpBackWall.position.y = this.levelHeight/2 - wallHeight/2;
          tmpBackWall.position.x= -this.levelWidth/2;
          tmpBackWall.physicsImpostor = new PhysicsImpostor(
            tmpBackWall,
            PhysicsImpostor.BoxImpostor,
            {mass:0, restitution: 0.1,friction:0.01},
            scene
          );
        }
      },
      scene
    );
    
  }

  createBackWallGrid(backWall,scene,wallWidth,wallHeight){
    const tmpBackWall = new Mesh("tmpBackWall",scene);
    for(let x = 0;x<this.levelWidth;x += wallWidth){
      for(let y = 0;y<this.levelHeight;y += wallHeight){
        if(x === 0 && y === 0){
          backWall.parent = tmpBackWall;
          backWall.position = new Vector3(x,y,0);
        }else{
          const newWall = backWall.createInstance("wallTile"+x+"_"+y);
          newWall.parent = tmpBackWall;
          newWall.position = new Vector3(x,y,0);
        }
      }
    }
    return tmpBackWall;
  }

  createFrontWall(scene){
    const frontWall = PlaneBuilder.CreatePlane(
      'frontWall',
      { height: this.levelWidth,width: this.levelHeight},
      scene
    )
    frontWall.visibility = 0;
    frontWall.rotation.z= Math.PI/2;
    frontWall.position.z = -this.levelDepth/2;
    frontWall.position.y = this.levelHeight/2;
    /*frontWall.physicsImpostor = new PhysicsImpostor(
      frontWall,
      PhysicsImpostor.BoxImpostor,
      {mass:0, restitution: 0.1,friction:0.01},
      scene
    );*/
  }

  createConcreteMaterial(scene){
    const pbr = new PBRMaterial('concrete', scene)
    pbr.forceIrradianceInFragment = true;
    pbr.albedoTexture = new Texture("textures/concrete_worn_albedo.png",scene);
    pbr.bumpTexture = new Texture("textures/concrete_worn_normal.png",scene);
    pbr.useRoughnessFromMetallicTextureAlpha = false;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;
    pbr.metallicTexture = new Texture(
      "textures/concrete_worn_metallic_roughness.png",
      scene
    );
    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;
    return pbr;
  }

  getBoxWrapUV(width,height,depth,textureSize){
    /*
    side 0 faces the positive z direction
    side 1 faces the negative z direction
    side 2 faces the positive x direction
    side 3 faces the negative x direction
    side 4 faces the positive y direction
    side 5 faces the negative y direction
    */
    const faceUV = new Array(6);

    for (let i = 0; i < 6; i++) {
      if(i === 0 || i === 1){
        faceUV[i] = new Vector4(0, 0,width/textureSize,height/textureSize);
      }else if(i === 2 || i === 3){
        faceUV[i] = new Vector4(0, 0,height/textureSize,depth/textureSize);
      }else if(i === 4 || i === 5){
        faceUV[i] = new Vector4(0, 0,depth/textureSize,width/textureSize);
      }
    }
    return faceUV;
  }

  createPlatform(scene){
    const width = 20;
    const height = 2;
    const faceUV = this.getBoxWrapUV(width,height,this.levelDepth,5);
    const platform = BoxBuilder.CreateBox(
      'ceiling',
      { width: width,depth: this.levelDepth,height: height ,faceUV:faceUV},
      scene
    )
    
    platform.position.y = 10;
    platform.material = this.concreteMaterial;
    platform.physicsImpostor = new PhysicsImpostor(
      platform,
      PhysicsImpostor.BoxImpostor,
      {mass:0, restitution: 0.1,friction:0.01},
      scene
    );
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
    egg.position.y = 15;
    //egg.position.z = -this.levelDepth/2;
    this.sg.getShadowMap().renderList.push(egg);
    return egg;
  }

  rotatePlayer(direction,lastQuaternion){
    console.log(direction);
    if(direction === 0) {
      this.model.rotationQuaternion = lastQuaternion;
    }else{
      const axis = new Vector3(0, 1, 0);
      const angle = direction * (Math.PI / 2) - (Math.PI / 2);
      const quaternion = Quaternion.RotationAxis(axis, angle);
      this.model.rotationQuaternion = quaternion;
    }
  }

  loadModels(scene){
    this.assetsNum = 4;
    SceneLoader.ImportMesh('walking_left','models/','walking_left.babylon',
      scene,(meshes)=>{
        this.walkingLeft = meshes[0];
        this.checkAssets(this.walkingLeft);
      },
      (e)=>console.log('progress'+e),
      (scene,message)=>console.log('error'+message)
    );

    SceneLoader.ImportMesh('flying','models/','flying.babylon',
      scene,(meshes)=>{
        this.flying = meshes[0];
        this.checkAssets(this.flying);
      },
      (e)=>console.log('progress'+e),
      (scene,message)=>console.log('error'+message)
    );

    SceneLoader.ImportMesh('running','models/','running.babylon',
      scene,(meshes)=>{
        this.running = meshes[0];
        this.checkAssets(this.running);
      },
      (e)=>console.log('progress'+e),
      (scene,message)=>console.log('error'+message)
    );

    SceneLoader.ImportMesh('flapping','models/','flapping.babylon',
      scene,(meshes)=>{
        this.flapping = meshes[0];
        this.checkAssets(this.flapping);
      },
      (e)=>console.log('progress'+e),
      (scene,message)=>console.log('error'+message)
    );
        
  }

  checkAssets(model){
    model.visibility = 0;
    model.position.x = 5 * this.assetsNum;
    model.position.y = 3.3;
    this.sg.getShadowMap().renderList.push(model);
    this.assetsNum--;
    if(this.assetsNum === 0){
      console.log("checkAssets finish");
    }
  }

  changePlayerModel(model){
    if(model === this.model){
      return;
    }
    this.model.parent = null;
    this.model.visibility = 0;
    model.visibility = 1;
    const lastQuaternion = this.model.rotationQuaternion;
    this.model = model;
    this.player.addChild(model);
    model.position = new Vector3(0,0.3,0);
    this.rotatePlayer(this.keyDirection,lastQuaternion);
  }

  createPlayer(scene){
    const player = BoxBuilder.CreateBox(
      "player",
      {width:4,height:6.1,depth:2},
      scene
    );
    player.visibility = 0;
    const loader = SceneLoader.ImportMesh('walking','models/',
      'walking.babylon',
      scene,
      (meshes)=>{
        const model = meshes[0];
        model.receiveShadows = true;
        model.position.y = 0.3;
        this.walking = this.model = model;
        player.addChild(model);
        player.position.y = 3;
        player.position.z = 0;
        player.physicsImpostor = new PhysicsImpostor(
          player,
          PhysicsImpostor.SphereImpostor,
          {mass:0.2,restitution: 0,friction:1,stiffness:0},
          scene
        );
        player.physicsImpostor.registerOnPhysicsCollide(
          [this.platform.physicsImpostor,this.land.physicsImpostor],
          this.onPlayerHitGround
        );
        this.sg.getShadowMap().renderList.push(model);
        this.setEggImpostor();
      },
      (e)=>console.log('progress'+e),
      (scene,message)=>console.log('error'+message)
    );  

    if(ATTACH_CAMERA){
      this.attachCameraToPlayer(player);
    }
    return player;
  }

  attachCameraToPlayer(player){
    if(this.player){
      player = this.player;
    }
    this.camera.parent = player;
    this.camera.position.y = 3;
  }

  setEggImpostor(scene){
    this.egg.physicsImpostor = new PhysicsImpostor(
      this.egg,PhysicsImpostor.SphereImpostor,
      {mass:1, restitution: 0.2,friction:0.3},
      this.scene
    );
    this.player.physicsImpostor.registerOnPhysicsCollide(
      this.egg.physicsImpostor,
      this.onPlayerHitEgg
    );
  }

  onPlayerHitEgg = (main, collided) => {
    this.egg.physicsImpostor.dispose();
    this.egg.parent = this.player;
    this.egg.position = new Vector3((2+1.5)/2,0,0);
  }

  onPlayerHitGround = (main, collided) => {
    //this.player.getBoundingInfo.
    if(main.object.position.y > collided.object.position.y){
      this.changePlayerModel(this.walking);
    }
    
    if(Math.abs(this.player.physicsImpostor.getLinearVelocity().y) < 4){
      this.touching = true;
    }
  }

  onSpacePressed = () =>{
    this.changePlayerModel(this.flapping);
    this.resetPlayerVelocity();
    this.sendPlayerFlapImpulse();
    this.touching = false;
  }

  sendPlayerFlapImpulse(){
    const boost = this.getBoost();
    console.log("sendPlayerFlapImpulse boost"+boost);
    this.player.physicsImpostor.applyImpulse(
      new Vector3(this.keyDirection*0.7*boost, 1, 0),
      this.player.getAbsolutePosition()
    );
  }

  getBoost(){
    const vel = this.player.physicsImpostor.getLinearVelocity().x;
    return vel/Math.abs(vel) === this.keyDirection ? 1 : 2;
  }

  isNotSpeeding(){
    return this.player.physicsImpostor.getLinearVelocity().x*this.keyDirection < 7;
  }

  isTouchingGround(){
    return this.touching;
  }

  setLowPlayerFriction(){
    this.player.physicsImpostor.friction = 0.1;
    this.land.physicsImpostor.friction = 0.1;
  }

  setHighPlayerFriction(){
    this.player.physicsImpostor.friction = 1;
    this.land.physicsImpostor.friction = 1;
  }

  startPlayerMoveInterval(){
    if(!this.accelerateInterval){
      const self = this;
      this.accelerateInterval = setInterval(()=>{
        //console.log("setInterval accelerate");
        self.accelerate.apply(self);
      },200);
    }
  }

  endPlayerMoveInterval(){
    if(this.accelerateInterval){
      console.log("clearInterval");
      clearInterval(this.accelerateInterval);
      this.accelerateInterval = null;
    }
  }

  playerHasEgg(){
    return this.player.getChildren().includes(this.egg)
  }

  launchEgg(){
    this.egg.parent = null;
    this.egg.position = this.player.getAbsolutePosition();
    this.egg.position.x += 5*this.keyDirection;
    this.setEggImpostor();
    this.egg.position.z = 0;
    const vel = this.egg.physicsImpostor.getLinearVelocity();
    vel.z = 0;
    this.egg.physicsImpostor.setLinearVelocity(vel);
    this.egg.physicsImpostor.setAngularVelocity(new Vector3(0,0,0));
    this.egg.rotation = new Vector3(0,0,0);
    this.egg.physicsImpostor.applyImpulse(
      new Vector3(this.keyDirection*20, 0, 0),
      this.egg.getAbsolutePosition()
    );
  }

  onKeyDown = (e) => {
    e.preventDefault();
    if (e.key === " ") {
      this.onSpacePressed();
    }else if(e.key === "ArrowRight"){
      this.keyDirection = 1;
      this.rotatePlayer(this.keyDirection);
      this.setLowPlayerFriction();
      this.startPlayerMoveInterval();
    }else if(e.key === "ArrowLeft"){
      this.keyDirection = -1;
      this.rotatePlayer(this.keyDirection);
      this.setLowPlayerFriction();
      this.startPlayerMoveInterval();
    }else if(e.key === "AltGraph"){
      if(this.playerHasEgg()){
        console.log("AltGraph");
        this.launchEgg();
      }
    }
  }

  onKeyUp = (e) => {
    e.preventDefault();
    if(e.key === "ArrowRight" || e.key === "ArrowLeft"){
      this.keyDirection = 0;
      this.endPlayerMoveInterval();
      this.setHighPlayerFriction();
    }else if(e.key === " "){
      this.changePlayerModel(this.flying);
    }
  }

  resetPlayerVelocity = () => {
    if(!this.player || !this.player.physicsImpostor){
      return;
    }
    const vel = this.player.physicsImpostor.getLinearVelocity();
    vel.z = 0;
    this.player.physicsImpostor.setLinearVelocity(vel);
    //this.player.position.z = this.levelDepth/2;
    this.player.physicsImpostor.setAngularVelocity(new Vector3(0,0,0));
    //this can't work, must use quaternion
    this.player.rotation = new Vector3(0,0,0);
  }

  accelerate(){
    this.resetPlayerVelocity();
    if( this.keyDirection !== 0 &&
          this.isNotSpeeding() &&
          this.isTouchingGround() ){
      this.sendPlayerStepImpulse();
    }
  }

  sendPlayerStepImpulse(){
    const boost = this.getBoost();
    this.player.physicsImpostor.applyImpulse(
      new Vector3(this.keyDirection*1*boost, 0, 0),
      this.player.getAbsolutePosition()
    );
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
    return <BabylonScene 
              onSceneMount={this.onSceneMount}
              onKeyDown={this.onKeyDown}
              onKeyUp={this.onKeyUp}
              onRender={this.resetPlayerVelocity}
            />
  }
}

export default Playground
