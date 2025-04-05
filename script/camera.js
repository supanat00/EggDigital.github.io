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

  if (!renderCanvas) {
    console.error("A-Frame Canvas not found.");
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = renderCanvas.width;
  canvas.height = renderCanvas.height;

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
