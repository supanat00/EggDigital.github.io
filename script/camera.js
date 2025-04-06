document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("#myScene");
  console.log("A-Frame Scene Element:", sceneEl);
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

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape) {
    canvas.width = 1280; // กำหนดความกว้างสำหรับแนวนอน
    canvas.height = 720; // กำหนดความสูงสำหรับอัตราส่วน 16:9
  } else {
    canvas.width = 720; // กำหนดความกว้างสำหรับแนวตั้ง
    canvas.height = 1280; // กำหนดความสูงสำหรับอัตราส่วน 9:16
  }

  requestAnimationFrame(() => {
    if (videoEl) {
      // ปรับขนาดวิดีโอให้ตรงกับ canvas โดยคำนวณอัตราส่วนที่ถูกต้อง
      const sourceWidth = videoEl.videoWidth;
      const sourceHeight = videoEl.videoHeight;
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = canvas.width / canvas.height;

      let drawWidth, drawHeight;
      if (sourceRatio > targetRatio) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * sourceRatio;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / sourceRatio;
      }

      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      context.drawImage(videoEl, offsetX, offsetY, drawWidth, drawHeight);
    }

    context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);

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

let mediaRecorder;
let recordedChunks = [];

const startVideoRecording = () => {
  const sceneEl = document.querySelector("#myScene");
  if (!sceneEl) {
    console.error("A-Frame scene element not found.");
    return;
  }

  const renderer = sceneEl.renderer;
  const renderCanvas = renderer.domElement;
  const videoEl = document.querySelector("video");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const isLandscape = window.innerWidth > window.innerHeight;

  canvas.width = isLandscape ? 1280 : 720;
  canvas.height = isLandscape ? 720 : 1280;

  const stream = canvas.captureStream(30); // 30 FPS
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm; codecs=vp9",
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };

  mediaRecorder.onstop = exportVideo;

  mediaRecorder.start();

  // Function to update canvas with the latest video and scene content
  const drawVideo = () => {
    if (videoEl) {
      const sourceWidth = videoEl.videoWidth;
      const sourceHeight = videoEl.videoHeight;
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = canvas.width / canvas.height;

      let drawWidth, drawHeight;
      if (sourceRatio > targetRatio) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * sourceRatio;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / sourceRatio;
      }

      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      context.drawImage(videoEl, offsetX, offsetY, drawWidth, drawHeight);
    }

    context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(drawVideo);
  };

  drawVideo();
};

const exportVideo = () => {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "recorded_video.webm";
  link.click();
  recordedChunks = []; // Reset chunks for new recordings
};

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startVideoRecording);

const stopButton = document.getElementById("stopButton");
stopButton.addEventListener("click", () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
});
