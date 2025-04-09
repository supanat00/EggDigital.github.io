export function updateImageSrc(imageUrl) {
  const imageElement = document.getElementById("imageFile");
  if (imageElement) {
    // Update image element source with the generated image URL
    imageElement.src = imageUrl;

    console.log("Image source updated:", imageUrl);
  } else {
    console.error("Image element not found");
  }
}
