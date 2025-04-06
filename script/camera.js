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

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    previewVideo.src = url;
    previewModal.style.display = "block";
    recordedChunks = []; // Reset chunks for new recordings
  };

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

const stopVideoRecording = () => {
  mediaRecorder.stop();
};

/* === UI Controller === */
document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("#myScene");
  console.log("A-Frame Scene Element:", sceneEl);
  const photoButton = document.getElementById("photoButton");
  const toggleInput = document.getElementById("toggleInput");
  const circle = document.querySelector(".circle");
  const ring = document.querySelector(".ring");
  const previewModal = document.getElementById("previewModal");
  const previewImage = document.getElementById("previewImage");
  const closePreview = document.getElementById("closePreview");
  const downloadImage = document.getElementById("downloadImage");
  const shareImage = document.getElementById("shareImage");
  let isVideoMode = false;

  // กำหนดฟังก์ชันเริ่มต้นของปุ่มถ่ายภาพ
  photoButton.onclick = captureAFrameCombined;

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงโหมด
  toggleInput.addEventListener("change", () => {
    isVideoMode = toggleInput.checked; // อัปเดตสถานะตามสถานะของ input
    if (isVideoMode) {
      console.log("Switched to Video Mode");
      circle.style.backgroundColor = "#f00c0c";
      ring.style.animation = "pulse 2s infinite";
      photoButton.onclick = startVideoRecording; // ตั้งค่าใหม่เป็นฟังก์ชันถ่ายวิดีโอ
    } else {
      console.log("Switched to Photo Mode");
      circle.style.backgroundColor = "#ffffff";
      ring.style.animation = "none";
      photoButton.onclick = captureAFrameCombined; // ตั้งค่าใหม่เป็นฟังก์ชันถ่ายภาพ
    }
  });
  // ฟังก์ชันซ่อน UI กล้อง
  const toggleUIVisibility = (isVisible) => {
    const uiElements = [photoButton, switchButton]; // เพิ่ม ID สลับโหมดถ้าจำเป็น
    uiElements.forEach((el) => {
      el.style.display = isVisible ? "block" : "none";
    });
  };

  // กำหนดฟังก์ชันเริ่มต้นสำหรับปุ่มถ่ายภาพ
  photoButton.addEventListener("click", function () {
    if (isVideoMode) {
      console.log("Video recording started.");
      startVideoRecording();
    } else {
      console.log("Photo capturing started.");
      captureAFrameCombined();
    }
    toggleUIVisibility(false);
  });

  // ปุ่มปิดหน้าต่างพรีวิว
  closePreview.addEventListener("click", function () {
    previewModal.style.display = "none";
    toggleUIVisibility(true); // แสดง UI เมื่อปิด preview
  });

  // ปุ่มโหลด
  downloadImage.addEventListener("click", function () {
    const link = document.createElement("a");
    link.href = previewImage.src;
    link.download = "egg-digital.png";
    link.click();
  });

  // ปุ่มแชร์
  shareImage.addEventListener("click", function () {
    fetch(previewImage.src)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], "shared_image.png", {
          type: "image/png",
        });
        const shareData = {
          files: [file],
          title: "Shared Image",
          text: "Check out this cool image!",
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          navigator
            .share(shareData)
            .then(() => console.log("Share successful"))
            .catch((error) => console.error("Error sharing:", error));
        } else {
          console.error(
            "Sharing not supported or the file type is not supported for sharing."
          );
        }
      })
      .catch(console.error);
  });
});
