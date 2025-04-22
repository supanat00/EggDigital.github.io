import { textureSwapComponent } from "./script/tex-swap.js";
AFRAME.registerComponent("tex-swap", textureSwapComponent);

import { updateImageSrc } from "./script/updateimagesrc.js";
AFRAME.registerComponent("updateimagesrc", updateImageSrc);

import { SmokeComponent } from "./script/smoke.js";
AFRAME.registerComponent("smoke", SmokeComponent);

import { textureGenComponent } from "./script/tex-gen.js";
AFRAME.registerComponent("tex-gen", textureGenComponent);

AFRAME.registerComponent("smooth-position", {
  schema: {
    factor: { type: "number", default: 0.2 },
  },

  init: function () {
    this.originalPosition = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();

    // Store original position
    this.originalPosition.copy(this.el.object3D.position);
    this.targetPosition.copy(this.originalPosition);
  },

  tick: function () {
    const target = this.el.object3D;

    // Update position with smoothing
    target.position.lerp(this.targetPosition, this.data.factor);

    // If target moved externally, update target position
    if (!this.targetPosition.equals(this.el.getAttribute("position"))) {
      this.targetPosition.copy(this.el.getAttribute("position"));
    }
  },
});

AFRAME.registerComponent("smooth-rotation", {
  schema: {
    factor: { type: "number", default: 0.1 },
  },

  init: function () {
    this.originalRotation = new THREE.Euler();
    this.targetRotation = new THREE.Euler();
    this.currentQuaternion = new THREE.Quaternion();
    this.targetQuaternion = new THREE.Quaternion();

    // Store original rotation
    this.originalRotation.copy(this.el.object3D.rotation);
    this.targetRotation.copy(this.originalRotation);
    this.currentQuaternion.setFromEuler(this.originalRotation);
    this.targetQuaternion.setFromEuler(this.targetRotation);
  },

  tick: function () {
    const target = this.el.object3D;

    // Update rotation with smoothing
    target.quaternion.slerp(this.targetQuaternion, this.data.factor);

    // If target rotated externally, update target rotation
    if (!this.targetRotation.equals(this.el.getAttribute("rotation"))) {
      this.targetRotation.setFromVector3(this.el.getAttribute("rotation"));
      this.targetQuaternion.setFromEuler(this.targetRotation);
    }
  },
});
