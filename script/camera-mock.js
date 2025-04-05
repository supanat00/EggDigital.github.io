export const mockWithVideo = (path) => {
  navigator.mediaDevices.getUserMedia = () => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");

      video.oncanplay = () => {
        const startButton = document.createElement("button");
        startButton.id = "start-button";
        startButton.innerHTML = "start";
        startButton.style.position = "fixed";
        startButton.style.top = "30px";
        startButton.style.zIndex = 10000;
        document.body.appendChild(startButton);

        startButton.addEventListener("click", () => {
          const stream = video.captureStream();
          video.play();
          document.body.removeChild(startButton);
          resolve(stream);
        });
      };
      video.setAttribute("loop", "");
      video.setAttribute("src", path);
    });
  };
};

export const mockWithImage = (path) => {
  navigator.mediaDevices.getUserMedia = () => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const image = new Image();
      image.onload = () => {
        const startButton = document.createElement("button");
        startButton.id = "start-button";
        startButton.innerHTML = "start";
        startButton.style.position = "fixed";
        startButton.style.top = "30px";
        startButton.style.zIndex = 10000;
        document.body.appendChild(startButton);
        canvas.width = image.width;
        canvas.height = image.height;
        let offsetWidth = image.width / 2;
        let offsetHeight = image.height / 2;
        let imWidth = 1000;
        let imHeight = 1000;
        startButton.addEventListener("click", () => {
          context.drawImage(
            image,
            offsetWidth - imWidth / 2,
            offsetHeight - imHeight / 2,
            imWidth,
            imHeight
          );
          const stream = canvas.captureStream();
          resolve(stream);
          startButton.style.visibility = "invisible";
        });
      };
      image.src = path;
    });
  };
};
