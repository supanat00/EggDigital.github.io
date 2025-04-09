export const SmokeComponent = {
  init() {
    this.textures = [];
    this.currentTextureIndex = 0;
    this.currentSet = 0;
    this.loader = new THREE.TextureLoader();
    this.intervalId = null;
    this.preloadedTextures = [];

    // รอ Event 'model-loaded' ก่อนที่จะโหลด textures
    this.el.addEventListener("model-loaded", () => {
      this.loadTexturePaths();
      this.preloadAllTextures();
    });
  },
  loadTexturePaths() {
    this.textures = [
      [
        document.getElementById("imageFileSet101").src,
        document.getElementById("imageFileSet102").src,
        document.getElementById("imageFileSet103").src,
        document.getElementById("imageFileSet104").src,
        document.getElementById("imageFileSet105").src,
        document.getElementById("imageFileSet106").src,
        document.getElementById("imageFileSet107").src,
        document.getElementById("imageFileSet108").src,
        document.getElementById("imageFileSet109").src,
        document.getElementById("imageFileSet110").src,
        document.getElementById("imageFileSet111").src,
        document.getElementById("imageFileSet112").src,
        document.getElementById("imageFileSet113").src,
        document.getElementById("imageFileSet114").src,
        document.getElementById("imageFileSet115").src,
        document.getElementById("imageFileSet116").src,
        document.getElementById("imageFileSet117").src,
        document.getElementById("imageFileSet118").src,
        document.getElementById("imageFileSet119").src,
        document.getElementById("imageFileSet120").src,
        document.getElementById("imageFileSet121").src,
        document.getElementById("imageFileSet122").src,
        document.getElementById("imageFileSet123").src,
        document.getElementById("imageFileSet124").src,
        document.getElementById("imageFileSet125").src,
        document.getElementById("imageFileSet126").src,
        document.getElementById("imageFileSet127").src,
        document.getElementById("imageFileSet128").src,
        document.getElementById("imageFileSet129").src,
        document.getElementById("imageFileSet130").src,
      ],
    ];
  },
  // Pre Download Textures
  preloadAllTextures() {
    const loadPromises = [];
    this.textures.forEach((set, setIndex) => {
      this.preloadedTextures[setIndex] = [];
      set.forEach((texturePath, textureIndex) => {
        const promise = new Promise((resolve, reject) => {
          this.loader.load(
            texturePath,
            (texture) => {
              texture.flipY = false;
              this.preloadedTextures[setIndex][textureIndex] = texture;
              resolve();
            },
            undefined,
            reject
          );
        });
        loadPromises.push(promise);
      });
    });

    Promise.all(loadPromises)
      .then(() => {
        console.log("All textures preloaded.");
        this.startImageSequence(); // เริ่ม Sequence หลังจาก Preload เสร็จ
      })
      .catch((error) => {
        console.error("Error preloading textures:", error);
      });
  },

  setTexture(index) {
    this.currentSet = index;
    this.startImageSequence();
  },

  startImageSequence() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const model = this.el.getObject3D("mesh").getObjectByName("smoke");
    const texturesInSet = this.preloadedTextures[this.currentSet];
    let count = 0;

    this.intervalId = setInterval(() => {
      if (model && texturesInSet[count]) {
        const texture = texturesInSet[count];
        model.material.map = texture;
        model.material.map.flipY = false;
        model.material.needsUpdate = true; // Ensure the material updates
      }

      count++;
      if (count >= texturesInSet.length) {
        count = 0; // Loop
      }
    }, 100);
  },

  remove() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
};
