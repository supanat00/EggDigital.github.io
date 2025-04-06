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
      previewImage.style.display = "block"; // Ensure image is visible
      toggleUIVisibility(false);
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

    // ซ่อนปุ่ม switch
    const switchButton = document.getElementById("switchButton");
    switchButton.style.display = "none"; // ซ่อนปุ่ม
    // เปลี่ยนสถานะของปุ่มเพื่อบ่งบอกว่ากำลังบันทึก
    const circle = document.querySelector(".circle");
    const ring = document.querySelector(".ring");
    circle.classList.add("recording");
    ring.classList.add("recording");
  };

  const stopVideoRecording = () => {
    mediaRecorder.stop();

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      toggleUIVisibility(true);
      const circle = document.querySelector(".circle");
      const ring = document.querySelector(".ring");
      circle.classList.remove("recording");
      ring.classList.remove("recording");
      // แสดงปุ่ม switch อีกครั้ง
      const switchButton = document.getElementById("switchButton");
      switchButton.style.display = "block"; // แสดงปุ่ม

      // สร้างหรือค้นหาองค์ประกอบ video สำหรับ preview
      let previewVideo = document.getElementById("previewVideo");
      if (!previewVideo) {
        previewVideo = document.createElement("video");
        previewVideo.id = "previewVideo";
        previewVideo.controls = false;
        previewVideo.autoplay = true;
        previewVideo.loop = true;
        previewVideo.style.cssText =
          "max-width: 100%; border: 3px solid white; border-radius: 8px;";
        // ตรวจสอบว่า previewModal มีใน DOM แล้วเพิ่ม previewVideo ในนั้น
        const previewModal = document.getElementById("previewModal");
        if (previewModal) {
          previewModal.appendChild(previewVideo);
        }
      }
      previewVideo.src = url;
      toggleUIVisibility(false);
      previewModal.style.display = "block"; // แสดง modal ที่มี video
      recordedChunks = []; // รีเซ็ต chunks สำหรับบันทึกครั้งถัดไป
    };
  };

  // กำหนดฟังก์ชันเริ่มต้นของปุ่มถ่ายภาพ
  photoButton.onclick = captureAFrameCombined;

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงโหมด
  toggleInput.addEventListener("change", () => {
    isVideoMode = toggleInput.checked;
    if (isVideoMode) {
      circle.style.backgroundColor = "#f00c0c";
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
      circle.style.backgroundColor = "#ffffff";
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
      link.download = "recorded_video.webm";
    } else {
      link.href = previewImage.src;
      link.download = "captured_image.png";
    }
    link.click();
  });

  // ปุ่มแชร์
  shareImage.addEventListener("click", () => {
    const urlToShare = isVideoMode ? previewVideo.src : previewImage.src;
    fetch(urlToShare)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File(
          [blob],
          isVideoMode ? "video.webm" : "image.png",
          { type: blob.type }
        );
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
