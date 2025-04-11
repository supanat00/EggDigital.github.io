// Import the necessary modules
import { updateImageSrc } from "./updateimagesrc.js";

const engineId = "stable-diffusion-v1-6";
const apiHost = "https://api.stability.ai";
// IMPORTANT: Keep your API key secure and do not commit it directly into public code.
// Consider using environment variables or a secure configuration method.
const apiKey = "sk-X3CXmg6ulIiXic2iiADHvmdquwc8MjUqQXLohjCXZ3VpSFnd";

if (!apiKey) throw new Error("Missing Stability API key.");

export const textureGenComponent = {
  init() {
    const button = document.getElementById("generateButton");
    const input = document.getElementById("promptInput");
    const inputContainer = document.getElementById("input-container"); // Get the container
    const cameraControls = document.getElementById("cameraControls"); // <<< ADD THIS LINE: Get camera controls

    // Check if all required elements exist
    if (!input || !button || !inputContainer || !cameraControls) {
      console.error(
        "One or more required UI elements (promptInput, generateButton, input-container, cameraControls) not found in the DOM."
      );
      return; // Stop initialization if elements are missing
    }

    // Initial state: button disabled if input is empty
    button.disabled = true;
    button.style.opacity = "0.5";

    input.addEventListener("input", () => {
      button.disabled = input.value.trim() === "";
      button.style.opacity = button.disabled ? "0.5" : "1";
    });

    button.addEventListener("click", async () => {
      const userPrompt = input.value.trim();
      if (!userPrompt) return; // Don't proceed if prompt is empty

      // Optionally: Disable button during processing
      button.disabled = true;
      button.textContent = "..."; // Indicate loading (optional)
      button.style.opacity = "0.5";
      input.disabled = true; // Disable input during processing

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
          // Try to get more specific error from Stability AI response
          let errorDetails = `Status: ${response.status}`;
          try {
            const errorJson = await response.json();
            errorDetails += `, Message: ${
              errorJson.message || JSON.stringify(errorJson)
            }`;
          } catch (e) {
            errorDetails += `, Body: ${await response.text()}`;
          }
          throw new Error(
            `Non-200 response from Stability AI: ${errorDetails}`
          );
        }

        const responseJSON = await response.json();

        if (responseJSON.artifacts && responseJSON.artifacts.length > 0) {
          responseJSON.artifacts.forEach((image, index) => {
            if (image.base64) {
              const imageUrl = `data:image/png;base64,${image.base64}`;
              // Update the image src in the HTML
              updateImageSrc(imageUrl);
              // Dispatch an event to notify that the texture is generated
              const event = new CustomEvent("texture-generated", {
                detail: { imageUrl },
              });
              // Ensure the target element exists before dispatching
              const texSwapElement =
                document.querySelector("a-entity[tex-swap]");
              if (texSwapElement) {
                texSwapElement.dispatchEvent(event);
              } else {
                console.warn(
                  "Target element for 'texture-generated' event (a-entity[tex-swap]) not found."
                );
              }
              console.log(`Image ${index + 1} generated and updated.`);
            } else {
              console.warn(
                `Artifact ${index} did not contain base64 image data.`
              );
            }
          });

          // --- UI Update on Success ---
          inputContainer.style.display = "none"; // Hide input container
          cameraControls.style.display = "flex"; // <<< ADD THIS LINE: Show camera controls
          // --- End UI Update ---
        } else {
          console.warn(
            "API response successful, but no image artifacts found."
          );
          // Handle case where API returns OK but no image (optional: show message to user)
          // Keep input enabled if no image was actually generated/applied
          input.disabled = false;
          button.disabled = input.value.trim() === ""; // Re-evaluate button state
          button.textContent = "ตกลง"; // Reset button text
          button.style.opacity = button.disabled ? "0.5" : "1";
        }
      } catch (error) {
        console.error("Error generating image:", error);
        // Optionally: Show an error message to the user in the UI
        alert(`เกิดข้อผิดพลาดในการสร้างรูปภาพ: ${error.message}`); // Simple alert, consider a better UI notification
        // Re-enable input/button on error so user can try again
        input.disabled = false;
        button.disabled = input.value.trim() === ""; // Re-evaluate button state
        button.textContent = "ตกลง"; // Reset button text
        button.style.opacity = button.disabled ? "0.5" : "1";
      } finally {
        // This block runs regardless of success or error,
        // but we only want to reset IF the process didn't successfully transition state.
        // The successful state transition handles its own UI state.
        // The error state handles its own UI state.
        // So, the finally block might not be the best place for resetting anymore,
        // OR it needs conditional logic.
        // Let's remove the reset from finally, as it's handled in success/error paths now.
        // Original code from user request:
        // input.disabled = false;
        // input.value = ""; // Clear input only on success? Maybe not always desired.
        // button.disabled = true;
        // button.style.opacity = "0.5";
        // button.textContent = "ตกลง"; // Reset button text
      }
    });
  },
};

// Ensure the DOM is fully loaded before initializing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", textureGenComponent.init);
} else {
  // DOMContentLoaded has already fired
  textureGenComponent.init();
}
