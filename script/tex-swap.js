export const textureSwapComponent = {
  init() {
    this.el.addEventListener("model-loaded", () => {
      this.loadInitialTextures();
      this.addTextureGeneratedListener();
    });

    this.el.addEventListener("texture-generated", (event) => {
      const { imageUrl } = event.detail;
      const loader = new THREE.TextureLoader();
      const model = this.el.getObject3D("mesh").getObjectByName("mug_AIGEN");

      if (model) {
        // Load and set the image texture
        loader.load(
          imageUrl,
          (texture) => {
            texture.flipY = false;
            model.traverse((node) => {
              if (node.isMesh) {
                node.material.map = texture;
                node.material.needsUpdate = true;
              }
            });
          },
          undefined,
          (err) => console.error("Error loading image texture:", err)
        );
      } else {
        console.error("Model not found");
      }
    });
  },

  loadInitialTextures() {
    const mugModel = this.el.getObject3D("mesh").getObjectByName("mug_AIGEN");
    const logoModel = this.el.getObject3D("mesh").getObjectByName("logo_A");
    const loader = new THREE.TextureLoader();
    const newTexture1Element = document.getElementById("newTexture1");
    const newTexture2Element = document.getElementById("newTexture2");

    if (newTexture1Element && mugModel) {
      const imageUrl1 = newTexture1Element.getAttribute("src");
      this.loadAndSetTexture(mugModel, imageUrl1);
      console.log("Initial texture applied to mug_AIGEN:", imageUrl1);
    } else {
      console.warn(
        "newTexture1 element or mug_AIGEN model not found for initial texture."
      );
    }

    if (newTexture2Element && logoModel) {
      const imageUrl2 = newTexture2Element.getAttribute("src");
      this.loadAndSetTexture(logoModel, imageUrl2);
      console.log("Initial texture applied to logo_A:", imageUrl2);
    } else {
      console.warn(
        "newTexture2 element or logo_A model not found for initial texture."
      );
    }
  },

  addTextureGeneratedListener() {
    this.el.addEventListener("texture-generated", (event) => {
      const { imageUrl, targetModelName } = event.detail;
      let targetModel = null;

      if (targetModelName === "mug_AIGEN") {
        targetModel = this.el.getObject3D("mesh").getObjectByName("mug_AIGEN");
      } else if (targetModelName === "logo_A") {
        targetModel = this.el.getObject3D("mesh").getObjectByName("logo_A");
      } else {
        console.warn(
          "Target model name not specified or invalid:",
          targetModelName
        );
        return;
      }

      if (targetModel) {
        this.loadAndSetTexture(targetModel, imageUrl);
        console.log(`Texture updated for ${targetModelName}:`, imageUrl);
      }
    });
  },

  loadAndSetTexture(model, imageUrl) {
    const loader = new THREE.TextureLoader();
    if (model) {
      loader.load(
        imageUrl,
        (texture) => {
          texture.flipY = false;
          model.traverse((node) => {
            if (node.isMesh) {
              node.material.map = texture;
              node.material.needsUpdate = true;
            }
          });
        },
        undefined,
        (err) => console.error("Error loading image texture:", err)
      );
    } else {
      console.error(`Model not found`);
    }
  },
};
