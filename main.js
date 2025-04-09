import { textureSwapComponent } from "./script/tex-swap.js";
AFRAME.registerComponent("tex-swap", textureSwapComponent);

import { updateImageSrc } from "./script/updateimagesrc.js";
AFRAME.registerComponent("updateimagesrc", updateImageSrc);

import { SmokeComponent } from "./script/smoke.js";
AFRAME.registerComponent("smoke", SmokeComponent);

import { textureGenComponent } from "./script/tex-gen.js";
AFRAME.registerComponent("tex-gen", textureGenComponent);
