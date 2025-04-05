import { mockWithImage } from "./camera-mock.js";

document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("#myScene");
  const renderer = sceneEl.renderer;
  const cameraEl = document.querySelector("a-camera");
  const camera = cameraEl.getObject3D("camera");

  console.log("A-Frame Scene Element:", sceneEl);
  console.log("Three.js Renderer:", renderer);
  console.log("A-Frame Camera:", camera);

  // คุณสามารถใช้ sceneEl, renderer, และ camera ในโค้ด A-Frame ของคุณได้
});

const startButton = document.querySelector("#startButton");
startButton.addEventListener("click", () => {
  mindarThree.start();
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    for (const mixer of mixers) {
      mixer.update(delta);
    }
    renderer.render(scene, camera);
  });
});

const stopButton = document.querySelector("#stopButton");
stopButton.addEventListener("click", () => {
  mindarThree.stop();
  mindarThree.renderer.setAnimationLoop(null);
});

const captureAFrame = () => {
  const sceneEl = document.querySelector("#myScene");
  const renderer = sceneEl.renderer;
  const renderCanvas = renderer.domElement;
  const videoEl = document.querySelector("video"); // ค้นหา <video> element (ถ้ามี)

  if (!renderCanvas) {
    console.error("A-Frame Canvas not found.");
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = renderCanvas.width;
  canvas.height = renderCanvas.height;

  if (videoEl) {
    // คำนวณตำแหน่งและขนาดของวิดีโอให้เหมาะสมกับ Canvas ของ A-Frame
    const videoAspectRatio = videoEl.videoWidth / videoEl.videoHeight;
    const canvasAspectRatio = canvas.width / canvas.height;
    let sx = 0,
      sy = 0,
      sWidth = videoEl.videoWidth,
      sHeight = videoEl.videoHeight;
    let dx = 0,
      dy = 0,
      dWidth = canvas.width,
      dHeight = canvas.height;

    if (videoAspectRatio > canvasAspectRatio) {
      sWidth = videoEl.videoHeight * canvasAspectRatio;
      sx = (videoEl.videoWidth - sWidth) / 2;
    } else {
      sHeight = videoEl.videoWidth / canvasAspectRatio;
      sy = (videoEl.videoHeight - sHeight) / 2;
    }

    context.drawImage(
      videoEl,
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      dWidth,
      dHeight
    );
  }

  // วาด A-Frame Canvas ลงบน Canvas Output
  context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);

  const data = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "aframe_capture.png";
  link.href = data;
  link.click();
};

const screenshotButton = document.querySelector("#screenshot");
if (screenshotButton) {
  screenshotButton.addEventListener("click", captureAFrame);
} else {
  console.error("Screenshot button not found.");
}
