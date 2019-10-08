import React from 'react'
//import * as cannon from 'cannon';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin'
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor'
import { Vector3, Color3 } from '@babylonjs/core/Maths/math'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
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

const Playground = () => {
  // scene setup
  const onSceneMount = ({ canvas, scene, engine }) => {
    console.log('Babylon scene mounted')
    window.scene = scene // for debug
    var gravityVector = new Vector3(0,-9.81, 0);
    var physicsPlugin = new CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);
    // camera
    const camera = new ArcRotateCamera(
      'arc-camera',
      -Math.PI / 2,
      Math.PI / 4,
      25,
      new Vector3(6, 0, -1.5),
      scene
    )
    camera.setTarget(Vector3.Zero())
    camera.attachControl(canvas, true)
    // sky (https://doc.babylonjs.com/extensions/sky)
    const skyMaterial = new SkyMaterial('sky-material', scene)
    skyMaterial.backFaceCulling = false
    skyMaterial.luminance = 0.8
    skyMaterial.inclination = 0.18
    skyMaterial.azimuth = 0.27
    const skybox = BoxBuilder.CreateBox('skybox', { size: 1000 }, scene)
    skybox.material = skyMaterial
    // create light
    const light = new DirectionalLight('light', new Vector3(-1, -2, 1), scene)
    const lightDistance = 20
    light.position = new Vector3(
      lightDistance,
      2 * lightDistance,
      lightDistance
    )
    light.intensity = 1.5
    // scene
    createStaticMesh({ scene })
    // debug
    if (SHOW_WORLD_AXIS) {
      showWorldAxis({ size: 5, scene })
    }
  }

  const createStaticMesh = ({ scene }) => {
    const defaultMaterial = new StandardMaterial('default-material', scene)
    defaultMaterial.diffuseColor = new Color3(1, 1, 1)
    const land = GroundBuilder.CreateGround(
      'land',
      { width: 20,height: 20, sideOrientation: Mesh.DOUBLESIDE },
      scene
    )

    //land.rotation = new Vector3(Math.PI / 2, 0, 0)
    land.material = defaultMaterial
    


    const sphere = SphereBuilder.CreateSphere(
      'sphere',
      { diameter: 2, segments: 16 },
      scene
    )
    sphere.material = defaultMaterial
    sphere.position.y = 2
    sphere.position.z = -1

    const cube = BoxBuilder.CreateBox('cube', { size: 1, height: 3 }, scene)
    cube.position = new Vector3(0, 5, 1)
    cube.material = defaultMaterial

    land.physicsImpostor = new PhysicsImpostor(land,PhysicsImpostor.PlaneImpostor,{mass:0, restitution: 0.9}, scene);
    sphere.physicsImpostor = new PhysicsImpostor(sphere,PhysicsImpostor.SphereImpostor,{mass:0.2}, scene);
    cube.physicsImpostor = new PhysicsImpostor(cube,PhysicsImpostor.BoxImpostor,{mass:.1, restitution: 0.9}, scene);
  }

  const showWorldAxis = ({ size, scene }) => {
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
  return <BabylonScene onSceneMount={onSceneMount} />
}

export default Playground
