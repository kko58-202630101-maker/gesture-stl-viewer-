import * as THREE from "https://unpkg.com/three@0.166.1/build/three.module.js";

import { STLLoader }
from "https://unpkg.com/three@0.166.1/examples/jsm/loaders/STLLoader.js";

import {
FilesetResolver,
HandLandmarker
}
from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
let scene;
let camera;
let renderer;
let model;

initThree();
initSTLUpload();
initHandTracking();

function initThree(){

scene = new THREE.Scene();

scene.background =
new THREE.Color(0x111111);

camera =
new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
);

camera.position.z = 120;

renderer =
new THREE.WebGLRenderer({
antialias:true
});

renderer.setSize(
window.innerWidth,
window.innerHeight
);

document.body.appendChild(
renderer.domElement
);

const ambient =
new THREE.AmbientLight(
0xffffff,
2
);

scene.add(ambient);

const directional =
new THREE.DirectionalLight(
0xffffff,
3
);

directional.position.set(
50,
50,
50
);

scene.add(directional);

animate();

}

function animate(){

requestAnimationFrame(
animate
);

renderer.render(
scene,
camera
);

}

window.addEventListener(
"resize",
()=>{

camera.aspect =
window.innerWidth /
window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(
window.innerWidth,
window.innerHeight
);

}
);

function initSTLUpload(){

const fileInput =
document.getElementById(
"fileInput"
);

fileInput.addEventListener(
"change",
(event)=>{

const file =
event.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload =
(e)=>{

const loader =
new STLLoader();

const geometry =
loader.parse(
e.target.result
);

geometry.computeVertexNormals();

geometry.computeBoundingBox();

const center =
geometry.boundingBox.getCenter(
new THREE.Vector3()
);

geometry.translate(
-center.x,
-center.y,
-center.z
);

const material =
new THREE.MeshStandardMaterial({
color:0x00ffaa
});

if(model){

scene.remove(model);

}

model =
new THREE.Mesh(
geometry,
material
);

scene.add(model);

};

reader.readAsArrayBuffer(
file
);

}
);

}

async function initHandTracking(){

const video =
document.getElementById(
"video"
);

const stream =
await navigator.mediaDevices
.getUserMedia({
video:true
});

video.srcObject =
stream;

const vision =
await FilesetResolver
.forVisionTasks(
"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
);

const handLandmarker =
await HandLandmarker
.createFromOptions(
vision,
{
baseOptions:{
modelAssetPath:
"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
},
runningMode:"VIDEO",
numHands:1
}
);

async function detect(){

if(
video.readyState >= 2
){

const result =
handLandmarker
.detectForVideo(
video,
performance.now()
);

if(
result.landmarks &&
result.landmarks.length > 0 &&
model
){

const hand =
result.landmarks[0];

const index =
hand[8];

const thumb =
hand[4];

const middle =
hand[12];

model.position.x =
(index.x - 0.5)
*120;

model.position.y =
-(index.y - 0.5)
*120;

const pinchDistance =
Math.hypot(
index.x-thumb.x,
index.y-thumb.y
);

if(
pinchDistance < 0.05
){

model.rotation.y += 0.05;

}

const spread =
Math.hypot(
middle.x-thumb.x,
middle.y-thumb.y
);

const scale =
Math.max(
0.5,
Math.min(
4,
spread*6
)
);

model.scale.set(
scale,
scale,
scale
);

}

}

requestAnimationFrame(
detect
);

}

detect();

}
