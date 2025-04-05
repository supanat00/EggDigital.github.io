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

const captureAFrameCombined = () => {
  const sceneEl = document.querySelector("#myScene");
  if (!sceneEl) {
    console.error("A-Frame scene element not found.");
    return;
  }

  const renderer = sceneEl.renderer;
  const renderCanvas = renderer.domElement;

  if (!renderCanvas) {
    console.error("A-Frame Canvas not found.");
    return;
  }

  const videoEl = document.querySelector("video");

  // ใช้ requestAnimationFrame เพื่อให้แน่ใจว่าทุกอย่างเรนเดอร์เสร็จสิ้น
  requestAnimationFrame(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = renderCanvas.width;
    canvas.height = renderCanvas.height;

    // วาดภาพจาก Video ก่อน (ถ้ามี)
    if (videoEl) {
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

    // วาด A-Frame Render Canvas ตามที่มีในฉาก
    context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);

    // สร้างลิงก์สำหรับดาวน์โหลดภาพ
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "combined_capture.png";
    link.href = data;
    link.click();
  });
};

const screenshotButton = document.querySelector("#screenshot");
if (screenshotButton) {
  screenshotButton.addEventListener("click", captureAFrameCombined);
} else {
  console.error("Screenshot button not found.");
}
