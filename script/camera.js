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
  let mediaRecorder; // Declare mediaRecorder
  let recordedChunks = [];
  let videoURL; // To store the URL of the recorded video

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
      canvas.width = 1280; // Define width for landscape
      canvas.height = 720; // Define height for 16:9 aspect ratio
    } else {
      canvas.width = 720; // Define width for portrait
      canvas.height = 1280; // Define height for 9:16 aspect ratio
    }

    requestAnimationFrame(() => {
      if (videoEl) {
        // Adjust video size to match canvas with correct aspect ratio
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
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
      alpha: false,
    });

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "medium";

    console.log("Creating encoder...");
    encoder = await HME.createH264MP4Encoder();
    encoder.width = canvas.width;
    encoder.height = canvas.height;
    encoder.frameRate = 24; // Use 24fps
    encoder.quantizationParameter = 26;
    encoder.speed = 7;
    encoder.groupOfPictures = 20;
    encoder.kbps = 5000;
    encoder.initialize();
    console.log("Encoder initialized");

    const stream = canvas.captureStream(30); // Capture stream at 30fps
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      videoURL = URL.createObjectURL(blob); // Store the URL
      // Clear recorded chunks for next recording
      recordedChunks = [];

      try {
        // Create a new canvas to draw the recorded video frame
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempContext = tempCanvas.getContext("2d");

        // Draw the video frame onto the temporary canvas
        const tempVideo = document.createElement("video");
        tempVideo.src = videoURL;

        // Ensure video is loaded before proceeding
        tempVideo.addEventListener("loadeddata", async () => {
          tempContext.drawImage(
            tempVideo,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          const imageData = tempContext.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );

          try {
            encoder.addFrameRgba(imageData.data); // Pass the RGBA data from the temporary canvas
          } catch (error) {
            console.error("Error adding frame to encoder:", error);
          }

          encoder.finalize();
          const mp4Data = encoder.FS.readFile(encoder.outputFilename);
          const mp4Blob = new Blob([mp4Data], { type: "video/mp4" });
          const mp4URL = URL.createObjectURL(mp4Blob);

          // Display the MP4 video
          let previewVideo = document.getElementById("previewVideo");
          if (!previewVideo) {
            previewVideo = document.createElement("video");
            previewVideo.id = "previewVideo";
            previewVideo.controls = false;
            previewVideo.autoplay = true;
            previewVideo.muted = true;
            previewVideo.loop = true;
            previewVideo.style.cssText =
              "max-width: 100%; border: 3px solid white; border-radius: 8px;";
            document.getElementById("previewModal").appendChild(previewVideo);
          }
          previewVideo.src = mp4URL;
          document.getElementById("previewModal").style.display = "block";
          previewVideo.onloadedmetadata = () => {
            previewVideo.play();
          };
          // Store the mp4URL
          previewVideo.setAttribute("data-mp4-url", mp4URL);

          // Clean up
          encoder.delete();
          encoder = null;

          // Clean up temp video and URL
          tempVideo.src = "";
          URL.revokeObjectURL(videoURL);
        });
      } catch (error) {
        console.error("Encoding error:", error);
        // Handle the error (e.g., show a message to the user)
      }
    };

    mediaRecorder.start();

    // Function to update canvas with the latest video and scene content
    const drawVideo = () => {
      if (!isRecording) return;
      try {
        if (videoEl && videoEl.readyState >= 2) {
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

          const offsetX = Math.floor((canvas.width - drawWidth) / 2);
          const offsetY = Math.floor((canvas.height - drawHeight) / 2);

          context.drawImage(videoEl, offsetX, offsetY, drawWidth, drawHeight);
        }

        context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error("Error drawing video:", error);
      }

      if (isRecording) requestAnimationFrame(drawVideo);
    };

    drawVideo();

    const switchButton = document.getElementById("switchButton");
    if (switchButton) switchButton.style.display = "none";
    circle.classList.add("recording");
    ring.classList.add("recording");
  };

  const stopVideoRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    isRecording = false;

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
    toggleUIVisibility(true); // Show UI again
  });

  // ปุ่มโหลด
  downloadImage.addEventListener("click", () => {
    const link = document.createElement("a");
    let urlToDownload;

    if (isVideoMode) {
      const videoElement = document.getElementById("previewVideo");
      urlToDownload = videoElement.getAttribute("data-mp4-url");
      link.href = urlToDownload;
      link.download = "recorded_video.mp4";
    } else {
      urlToDownload = previewImage.src;
      link.href = urlToDownload;
      link.download = "captured_image.png";
    }
    link.click();
  });

  // ปุ่มแชร์
  shareImage.addEventListener("click", () => {
    let urlToShare;
    if (isVideoMode) {
      const videoElement = document.getElementById("previewVideo");
      urlToShare = videoElement.getAttribute("data-mp4-url");
    } else {
      urlToShare = previewImage.src;
    }
    if (!urlToShare) {
      console.error("URL to share is undefined.");
      return;
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
