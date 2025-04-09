// Import the necessary modules
import { updateImageSrc } from "./updateimagesrc.js";

const engineId = "stable-diffusion-v1-6";
const apiHost = "https://api.stability.ai";
const apiKey = "sk-X3CXmg6ulIiXic2iiADHvmdquwc8MjUqQXLohjCXZ3VpSFnd";

if (!apiKey) throw new Error("Missing Stability API key.");

export const textureGenComponent = {
  init() {
    const button = document.getElementById("generateButton");
    const input = document.getElementById("promptInput");
    const inputContainer = document.getElementById("input-container"); // Get the container

    if (input && button) {
      // Initial state: button disabled if input is empty
      button.disabled = true;
      button.style.opacity = "0.5";

      input.addEventListener("input", () => {
        button.disabled = input.value.trim() === "";
        button.style.opacity = button.disabled ? "0.5" : "1";
      });

      button.addEventListener("click", async () => {
        const userPrompt = input.value.trim();

        try {
          const response = await fetch(
            `${apiHost}/v1/generation/${engineId}/text-to-image`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                text_prompts: [{ text: userPrompt }],
                cfg_scale: 7,
                height: 512,
                width: 512,
                steps: 30,
                samples: 1,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Non-200 response: ${await response.text()}`);
          }

          const responseJSON = await response.json();
          responseJSON.artifacts.forEach((image, index) => {
            const imageUrl = `data:image/png;base64,${image.base64}`;
            // Update the image src in the HTML
            updateImageSrc(imageUrl);
            // Dispatch an event to notify that the texture is generated
            const event = new CustomEvent("texture-generated", {
              detail: { imageUrl },
            });
            document.querySelector("a-entity[tex-swap]").dispatchEvent(event);
          });
          inputContainer.style.display = "none";
        } catch (error) {
          console.error("Error generating image:", error);
        } finally {
          // Reset input and button state
          input.disabled = false;
          input.value = "";
          button.disabled = true;
          button.style.opacity = "0.5";
        }
      });
    } else {
      console.error("Input field or generate button not found in the DOM.");
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  textureGenComponent.init();
});
