/* === UI Controller === */
document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("#myScene");
  console.log("A-Frame Scene Element:", sceneEl);

  const photoButton = document.getElementById("photoButton");
  const toggleInput = document.getElementById("toggleInput"); // Switch Camera/Video mode
  const circle = document.querySelector(".circle");
  const ring = document.querySelector(".ring");
  const previewModal = document.getElementById("previewModal");
  const previewImage = document.getElementById("previewImage"); // Assume this exists for image preview
  // const previewVideo = document.getElementById("previewVideo"); // Defined later for video
  const closePreview = document.getElementById("closePreview");
  const previewContentWrapper = previewModal.querySelector(
    ".preview-content-wrapper"
  );
  const shareImage = document.getElementById("shareImage");
  const switchButton = document.getElementById("switchButton"); // Get switch button element

  // --- เพิ่ม Element ที่เกี่ยวข้องกับการย้อนกลับ ---
  const bottomOverlay = document.querySelector(".bottom-overlay");
  const backButton = document.getElementById("backButton");
  const cameraControls = document.getElementById("cameraControls");
  const inputContainer = document.getElementById("input-container");
  const promptInput = document.getElementById("promptInput");
  const generateButton = document.getElementById("generateButton");
  // --- สิ้นสุดการเพิ่ม Element ---

  let isVideoMode = false;
  let isRecording = false;
  let mediaRecorder;
  let recordedChunks = [];

  // --- ตรวจสอบว่า Element ที่จำเป็นทั้งหมดมีอยู่จริง ---
  if (
    !sceneEl ||
    !photoButton ||
    !toggleInput ||
    !circle ||
    !ring ||
    !previewModal ||
    !previewImage ||
    !closePreview ||
    !shareImage ||
    !switchButton ||
    !backButton ||
    !bottomOverlay ||
    !cameraControls ||
    !inputContainer ||
    !previewContentWrapper ||
    !promptInput ||
    !generateButton
  ) {
    console.error(
      "One or more essential UI elements could not be found. Please check IDs and HTML structure."
    );
    // Optionally, disable functionality or show an error message
    return; // Stop execution if critical elements are missing
  }
  // --- สิ้นสุดการตรวจสอบ ---

  /* === Capture Image Function === */
  const captureAFrameCombined = () => {
    // ... (โค้ด captureAFrameCombined เหมือนเดิม) ...
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

      // <<< MODIFY: Use image onload handler >>>
      previewImage.onload = () => {
        // *** ADD ONLOAD ***
        console.log("Preview image loaded.");
        if (previewContentWrapper) {
          // Remove/hide existing video within wrapper
          const existingVideo =
            previewContentWrapper.querySelector("video#previewVideo");
          if (
            existingVideo &&
            existingVideo.parentNode === previewContentWrapper
          ) {
            existingVideo.pause();
            existingVideo.src = "";
            previewContentWrapper.removeChild(existingVideo);
          }
          previewImage.style.display = "block"; // Show image
        }
        // Show modal AFTER image is loaded
        if (bottomOverlay) bottomOverlay.style.display = "none";
        previewModal.style.display = "flex";
        toggleUIVisibility(false);
      };
      previewImage.onerror = () => {
        // <<< ADD Error Handling >>>
        console.error("Preview image failed to load.");
        alert("ไม่สามารถโหลดรูปภาพตัวอย่างได้");
      };

      previewImage.src = data; // Set path to the captured image
      previewModal.style.display = "flex";
      previewImage.style.display = "block"; // Ensure image is visible
      bottomOverlay.style.display = "none";
      toggleUIVisibility(false); // Pass the specific elements to hide
    });
  };

  // Helper function to remove the video preview element
  function removePreviewVideoElement() {
    // <<< MODIFY: Ensure checks wrapper >>>
    if (previewContentWrapper) {
      let existingPreviewVideo =
        previewContentWrapper.querySelector("video#previewVideo");
      if (existingPreviewVideo) {
        // Check parent again before removing
        if (existingPreviewVideo.parentNode === previewContentWrapper) {
          existingPreviewVideo.pause();
          existingPreviewVideo.src = "";
          previewContentWrapper.removeChild(existingPreviewVideo);
        }
        return; // Removed or already gone from wrapper
      }
    }
    // No fallback needed if wrapper logic is primary
  }

  // <<< (ต้องมี helper function นี้) >>>
  // Helper to reset UI elements related to recording state
  const resetUIAfterRecordingAttempt = () => {
    circle.classList.remove("recording");
    ring.classList.remove("recording");
    if (switchButton) switchButton.style.display = "inline-block"; // Use inline-block for switch
    isRecording = false; // Ensure state is reset
  };

  /* === Video Record Function === */
  const startVideoRecording = () => {
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
      mimeType: "video/mp4; codecs=avc1.42E01E,mp4a.40.2",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      previewVideo.src = url;
      previewModal.style.display = "flex";
      recordedChunks = []; // Reset chunks for new recordings
    };

    mediaRecorder.start();

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

    const switchButton = document.getElementById("switchButton");
    if (switchButton) switchButton.style.display = "none";
    circle.classList.add("recording");
    ring.classList.add("recording");
  };

  const stopVideoRecording = () => {
    mediaRecorder.stop();

    // Finalize recording
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/mp4" });
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
      previewModal.style.display = "flex"; // แสดง modal ที่มี video
      bottomOverlay.style.display = "none";
      // Clean up encoder
      recordedChunks = []; // รีเซ็ต chunks สำหรับบันทึกครั้งถัดไป
    };

    // Reset UI
    const photoButton = document.getElementById("photoButton");
    photoButton.style.display = "none";
    const circle = document.querySelector(".circle");
    const ring = document.querySelector(".ring");
    circle.classList.remove("recording");
    ring.classList.remove("recording");
  };

  // กำหนดฟังก์ชันเริ่มต้นของปุ่มถ่ายภาพ (จะถูก override โดย toggle)
  photoButton.onclick = captureAFrameCombined;

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงโหมด
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

  // ปุ่มปิดหน้าต่างพรีวิว
  closePreview.addEventListener("click", () => {
    previewModal.style.display = "none";
    previewImage.style.display = "none"; // Hide image preview

    // Stop and remove video preview if exists
    let existingPreviewVideo = document.getElementById("previewVideo");
    if (existingPreviewVideo) {
      existingPreviewVideo.pause(); // Stop playback
      existingPreviewVideo.src = ""; // Release resource
      removePreviewVideoElement(); // Remove from DOM
    }

    bottomOverlay.style.display = "flex";
    toggleUIVisibility(true); // แสดง UI กล้องหลักอีกครั้ง
  });

  // ปุ่มแชร์
  shareImage.addEventListener("click", async () => {
    // Make async for await fetch
    let blob = null;
    let filename = "shared_content";
    let fileType = "application/octet-stream"; // Default type

    const currentPreviewVideo = document.getElementById("previewVideo");
    const isVideoPreviewActive =
      currentPreviewVideo &&
      currentPreviewVideo.src &&
      previewModal.style.display === "block";

    try {
      if (isVideoPreviewActive) {
        filename = "video.mp4"; // Adjust extension based on recording mimeType
        fileType = "video/mp4"; // Adjust type
        // Fetch the blob from the Blob URL
        const response = await fetch(currentPreviewVideo.src);
        if (!response.ok) throw new Error("Failed to fetch video blob");
        blob = await response.blob();
      } else if (
        previewImage.src &&
        previewImage.style.display !== "none" &&
        previewModal.style.display === "block"
      ) {
        filename = "image.png";
        fileType = "image/png";
        // Convert Data URL to Blob
        const response = await fetch(previewImage.src);
        if (!response.ok) throw new Error("Failed to fetch image blob");
        blob = await response.blob();
      } else {
        console.warn("No active preview found to share.");
        return; // Exit if nothing to share
      }

      if (!blob) {
        console.error("Could not get Blob data for sharing.");
        return;
      }

      const file = new File([blob], filename, { type: fileType });
      const shareData = {
        files: [file],
        title: "Look what I made!",
        text: "Check this out!",
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        console.log("Share successful");
      } else {
        // Fallback or error message
        alert(
          "Sharing files is not supported on this browser, or this file type cannot be shared."
        );
        console.error("navigator.canShare returned false or threw an error.");
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      alert(`Sharing failed: ${error.message}`);
    }
  });

  // --- เพิ่ม Event Listener สำหรับปุ่ม Back ---
  if (backButton) {
    // ตรวจสอบอีกครั้งเผื่อกรณี Element หายไป
    backButton.addEventListener("click", () => {
      console.log("Back button clicked"); // Debug log

      // 1. ซ่อน Camera Controls
      if (cameraControls) {
        cameraControls.style.display = "none";
      }

      // 2. แสดง Input Container
      if (inputContainer) {
        inputContainer.style.display = "flex"; // ใช้ display ตาม CSS เดิม
      }

      // 3. รีเซ็ตสถานะ Input และ Generate Button
      if (promptInput) {
        promptInput.value = ""; // เคลียร์ค่า input
        promptInput.disabled = false; // ทำให้ input กลับมาใช้งานได้ (ถ้าเคย disable)
      }
      if (generateButton) {
        generateButton.disabled = true; // ปิดการใช้งานปุ่ม "ตกลง"
        generateButton.style.opacity = "0.5"; // ทำให้ปุ่มดูเหมือนปิดใช้งาน
        generateButton.textContent = "ตกลง"; // รีเซ็ตข้อความปุ่ม (ถ้ามีการเปลี่ยน)
      }

      // 4. ถ้ากำลังอยู่ในโหมดวิดีโอและกำลังบันทึก ให้หยุดบันทึกก่อน
      if (isRecording) {
        console.log("Stopping recording because back button was pressed.");
        stopVideoRecording(); // หยุดการบันทึก
        // การรีเซ็ต UI การบันทึกจะเกิดขึ้นใน stopVideoRecording หรือฟังก์ชัน helper
      }
    });
  } else {
    console.warn("Back button element not found, cannot add listener.");
  }
  // --- สิ้นสุดการเพิ่ม Event Listener ---

  // <<< (ต้องมี helper function นี้ หรือนำมาจากโค้ดก่อนหน้า) >>>
  // Helper to display the video preview
  const displayVideoPreview = (videoUrl) => {
    removePreviewVideoElement(); // remove old video first

    let previewVideo = document.createElement("video");
    previewVideo.id = "previewVideo";
    previewVideo.controls = false;
    previewVideo.autoplay = true;
    previewVideo.loop = true;
    previewVideo.muted = true; // Important for autoplay
    previewVideo.style.cssText = `
        display: block; max-width: 100%; max-height: 100%; height: auto;
        border: 3px solid white; border-radius: 18px;
    `; // Apply styles matching CSS
    previewVideo.onclick = () => {
      if (previewVideo.paused) previewVideo.play();
      else previewVideo.pause();
    };

    previewVideo.onloadedmetadata = () => {
      console.log("Preview video metadata loaded.");
      if (previewContentWrapper) {
        // Hide image within wrapper
        const imgPreview = previewContentWrapper.querySelector("#previewImage");
        if (imgPreview) imgPreview.style.display = "none";
        previewVideo.style.display = "block"; // Ensure video visible
      }
      // Show modal AFTER metadata is loaded
      if (bottomOverlay) bottomOverlay.style.display = "none";
      previewModal.style.display = "flex";
      toggleUIVisibility(false);
      resetUIAfterRecordingAttempt(); // Reset button style etc.
    };
    previewVideo.onerror = (event) => {
      console.error("Preview video failed to load:", event);
      alert("ไม่สามารถโหลดวิดีโอตัวอย่างได้");
      if (previewModal.style.display !== "none") closePreview.click();
    };

    // Append video to wrapper *BEFORE* setting src
    if (previewContentWrapper) {
      // <<< *** Ensure appending to wrapper *** >>>
      previewContentWrapper.insertBefore(
        previewVideo,
        previewContentWrapper.firstChild
      );
      previewVideo.src = videoUrl; // Set src AFTER appending and attaching handlers
    } else {
      console.error("Preview content wrapper not found! Cannot display video.");
    }
  };
}); // End of DOMContentLoaded listener
