document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("#myScene");
  console.log("A-Frame Scene Element:", sceneEl);
  // คุณสามารถใช้ sceneEl, renderer, และ camera ในโค้ด A-Frame ของคุณได้
});

/* === Capture Image Function === */
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

  renderCanvas.toBlob((blob) => {
    if (!blob) {
      console.error("Failed to capture blob from canvas.");
      return;
    }
    const file = new File([blob], "image.png", { type: "image/png" });
    const shareData = {
      files: [file],
      title: "Check out this cool image!",
      text: "I captured this cool A-Frame scene!",
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share(shareData)
        .then(() => console.log("Share successful"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      console.error("Web Share API not available or file cannot be shared.");
    }
  }, "image/png");

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
    previewImage.src = data; // Set path to the captured image
    previewModal.style.display = "block";
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const photoButton = document.getElementById("photoButton");
  const previewModal = document.getElementById("previewModal");
  const previewImage = document.getElementById("previewImage");
  const closePreview = document.getElementById("closePreview");
  const downloadImage = document.getElementById("downloadImage");
  const shareImage = document.getElementById("shareImage");

  photoButton.addEventListener("click", function () {
    console.log("Photo button was clicked!");
    captureAFrameCombined(); // Capture and show preview
  });

  closePreview.addEventListener("click", function () {
    previewModal.style.display = "none";
  });

  downloadImage.addEventListener("click", function () {
    const link = document.createElement("a");
    link.href = previewImage.src;
    link.download = "egg-digital.png";
    link.click();
  });

  shareImage.addEventListener("click", function () {
    if (navigator.share) {
      navigator
        .share({
          title: "Shared Image",
          text: "Check out this cool image!",
          url: previewImage.src,
        })
        .catch(console.error);
    } else {
      alert("Sharing not supported");
    }
  });
});

/* === Video Record Function === */
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
