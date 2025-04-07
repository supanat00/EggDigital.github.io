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
  let isRecording = false;
  let encoder; // Declare encoder here to make it accessible globally
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
    const context = canvas.getContext("2d", { willReadFrequently: true });
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
      previewImage.style.display = "block"; // Ensure image is visible
      toggleUIVisibility(false);
    });
  };

  /* === Video Record Function === */
  /* === Video Record Function === */
  const startVideoRecording = async () => {
    const sceneEl = document.querySelector("#myScene");
    if (!sceneEl) {
      console.error("A-Frame scene element not found.");
      return null;
    }

    const renderer = sceneEl.renderer;
    const renderCanvas = renderer.domElement;
    const videoEl = document.querySelector("video");
    const isLandscape = window.innerWidth > window.innerHeight;

    const canvas = document.createElement("canvas");
    canvas.width = isLandscape ? 1280 : 720;
    canvas.height = isLandscape ? 720 : 1280;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    // Create and initialize the encoder
    encoder = await HME.createH264MP4Encoder();
    encoder.width = canvas.width;
    encoder.height = canvas.height;

    // ตั้งค่าเฟรมเรตที่ต้องการ
    const targetFPS = 30;
    encoder.frameRate = targetFPS;
    encoder.quantizationParameter = 25; // Better quality (lower = better, range 10-51)
    encoder.speed = 10; // Balance between encoding speed and compression (1-10)
    encoder.groupOfPictures = 30; // Keyframe interval
    encoder.kbps = 8000; // Higher bitrate for better quality
    encoder.initialize();

    // จำกัดการเรียกฟังก์ชัน drawVideo ให้ทำงานตามเฟรมเรตที่กำหนด
    let lastFrameTime = Date.now();
    const frameInterval = 1000 / targetFPS; // time between frames in ms
    let frameCount = 0;
    let startTime = Date.now();

    const drawVideo = () => {
      if (!isRecording) return;

      const now = Date.now();
      const elapsed = now - lastFrameTime;

      // ตรวจสอบว่าถึงเวลาในการเพิ่มเฟรมใหม่หรือยัง
      if (elapsed >= frameInterval) {
        // ปรับเวลาการเพิ่มเฟรมถัดไปโดยคำนวณเวลาที่เกินมา
        // ช่วยให้การเพิ่มเฟรมสอดคล้องกับเฟรมเรตที่ต้องการมากขึ้น
        lastFrameTime = now - (elapsed % frameInterval);

        context.clearRect(0, 0, canvas.width, canvas.height);

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

        // วาด AR scene บน canvas
        context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);

        // เพิ่มเฟรมลงใน encoder
        encoder.addFrameRgba(
          context.getImageData(0, 0, canvas.width, canvas.height).data
        );

        // นับจำนวนเฟรมที่เพิ่มเข้าไป (สำหรับตรวจสอบ)
        frameCount++;

        // แสดงข้อมูล FPS จริงในคอนโซล (ทุก 1 วินาที)
        const timeSinceStart = now - startTime;
        if (timeSinceStart >= 1000) {
          const realFPS = frameCount / (timeSinceStart / 1000);
          console.log(`Actual FPS: ${realFPS.toFixed(2)}`);
          frameCount = 0;
          startTime = now;
        }
      }

      // ใช้ requestAnimationFrame เพื่อทำงานต่อเนื่อง
      requestAnimationFrame(drawVideo);
    };

    drawVideo();

    // ซ่อนปุ่มสลับและอัปเดตสถานะ
    const switchButton = document.getElementById("switchButton");
    if (switchButton) switchButton.style.display = "none";
    circle.classList.add("recording");
    ring.classList.add("recording");

    return true;
  };

  const stopVideoRecording = async () => {
    if (!encoder) {
      console.error("Encoder is not initialized.");
      return;
    }

    // Stop recording loop
    isRecording = false;

    // Finalize recording
    encoder.finalize();
    const uint8Array = encoder.FS.readFile(encoder.outputFilename);
    const url = URL.createObjectURL(
      new Blob([uint8Array], { type: "video/mp4" })
    );

    let previewVideo = document.getElementById("previewVideo");
    if (!previewVideo) {
      previewVideo = document.createElement("video");
      previewVideo.id = "previewVideo";
      previewVideo.controls = true;
      previewVideo.autoplay = true;
      previewVideo.loop = true;
      previewVideo.style.cssText =
        "max-width: 100%; border: 3px solid white; border-radius: 8px;";
      document.getElementById("previewModal").appendChild(previewVideo);
    }
    previewVideo.src = url;
    document.getElementById("previewModal").style.display = "block";

    // Clean up encoder
    encoder.delete();
    encoder = null;

    // Reset UI
    const photoButton = document.getElementById("photoButton");
    photoButton.style.display = "none";
    const circle = document.querySelector(".circle");
    const ring = document.querySelector(".ring");
    circle.classList.remove("recording");
    ring.classList.remove("recording");
  };

  // กำหนดฟังก์ชันเริ่มต้นของปุ่มถ่ายภาพ
  photoButton.onclick = captureAFrameCombined;

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงโหมด
  // Toggle mode function
  toggleInput.addEventListener("change", () => {
    isVideoMode = toggleInput.checked;
    if (isVideoMode) {
      circle.style.backgroundImage =
        "linear-gradient(145deg, #ff5252, #d50000)";
      ring.style.animation = "pulse 2s infinite";
      photoButton.onclick = () => {
        if (!isRecording) {
          startVideoRecording();
          isRecording = true;
        } else {
          stopVideoRecording();
          isRecording = false;
        }
      };
    } else {
      circle.style.backgroundImage =
        "linear-gradient(145deg, #ffffff, #ffffff)";
      ring.style.animation = "none";
      photoButton.onclick = captureAFrameCombined;
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
    console.log(isVideoMode ? "Video button clicked" : "Photo button clicked");
  });

  function removePreviewVideoElement() {
    let existingPreviewVideo = document.getElementById("previewVideo");
    if (existingPreviewVideo && previewModal.contains(existingPreviewVideo)) {
      previewModal.removeChild(existingPreviewVideo); // แก้ไขที่นี่
    }
  }

  // ปุ่มปิดหน้าต่างพรีวิว
  closePreview.addEventListener("click", () => {
    previewModal.style.display = "none";
    previewImage.style.display = "none"; // Hide image

    removePreviewVideoElement();

    toggleUIVisibility(true); // แสดง UI อีกครั้ง
  });

  // ปุ่มโหลด
  downloadImage.addEventListener("click", () => {
    const link = document.createElement("a");
    if (isVideoMode) {
      link.href = previewVideo.src;
      link.download = "recorded_video.mp4"; // เปลี่ยนเป็น .mp4
    } else {
      link.href = previewImage.src;
      link.download = "captured_image.png";
    }
    link.click();
  });

  // ปุ่มแชร์
  shareImage.addEventListener("click", () => {
    let urlToShare;
    if (isVideoMode) {
      const previewVideo = document.getElementById("previewVideo");
      if (previewVideo) {
        urlToShare = previewVideo.src;
      } else {
        console.error("Preview video element not found");
        return;
      }
    } else {
      urlToShare = previewImage.src;
    }

    fetch(urlToShare)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], isVideoMode ? "video.mp4" : "image.png", {
          type: blob.type,
        });
        const shareData = {
          files: [file],
          title: "Shared Content",
          text: "Check out this content I captured!",
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
      });
  });
});
