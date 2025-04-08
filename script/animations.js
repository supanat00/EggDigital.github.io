// --- ใส่โค้ดนี้ในไฟล์ script/animations.js ---

AFRAME.registerComponent("model-animation-handler", {
  schema: {
    startAnim: { type: "string", default: "start" }, // ชื่อนอนิเมชันเริ่มต้น
    loopAnim: { type: "string", default: "loop" }, // ชื่อนอนิเมชันวนซ้ำ
  },

  init: function () {
    console.log("===== model-animation-handler init (ตามสไตล์ 8thwall) =====");
    this.modelEl = this.el.querySelector("#avatarModelEntity");
    this.targetEntity = this.el;

    if (!this.modelEl) {
      console.error("หา #avatarModelEntity ไม่เจอ!");
      return;
    }

    // สร้างฟังก์ชัน Callback เก็บไว้ เพื่อให้ remove ถูกตัว
    this.onStartFinishedCallback = () => {
      console.log(`'${this.data.startAnim}' animation finished.`);
      this.modelEl.removeEventListener(
        "animation-finished",
        this.onStartFinishedCallback
      ); // ลบ listener ทันที

      // เล่น animation 'loop'
      if (this.modelEl) {
        console.log(
          `Setting animation-mixer for: '${this.data.loopAnim}' (repeat)`
        );
        this.modelEl.setAttribute("animation-mixer", {
          clip: this.data.loopAnim,
          loop: "repeat",
          timeScale: 0.5, // ปรับความเร็วได้
        });
      }
    };
    // Bind 'this' สำหรับ event handlers หลัก
    this.onTargetFound = this.onTargetFound.bind(this);
    this.onTargetLost = this.onTargetLost.bind(this);

    // เพิ่ม MindAR listeners
    console.log("Attaching MindAR listeners.");
    this.targetEntity.addEventListener("targetFound", this.onTargetFound);
    this.targetEntity.addEventListener("targetLost", this.onTargetLost);
  },

  remove: function () {
    console.log("===== model-animation-handler remove =====");
    // Clean up listeners and animation
    this.targetEntity.removeEventListener("targetFound", this.onTargetFound);
    this.targetEntity.removeEventListener("targetLost", this.onTargetLost);
    if (this.modelEl) {
      this.modelEl.removeAttribute("animation-mixer");
      this.modelEl.removeEventListener(
        "animation-finished",
        this.onStartFinishedCallback
      );
    }
  },

  onTargetFound: function () {
    console.log("Target Found");
    if (!this.modelEl) return;

    // 1. สั่งเล่น 'start' (loop: once)
    console.log(`Setting animation-mixer for: '${this.data.startAnim}' (once)`);
    this.modelEl.setAttribute("animation-mixer", {
      clip: this.data.startAnim,
      loop: "once",
      timeScale: 0.5, // ปรับความเร็วได้
    });

    // 2. เพิ่ม Listener รอ 'start' จบ
    // ลบ listener เก่า (ถ้ามี) ออกก่อนเพื่อความปลอดภัย
    this.modelEl.removeEventListener(
      "animation-finished",
      this.onStartFinishedCallback
    );
    console.log("Adding 'animation-finished' listener.");
    // ใช้ callback function ที่เราสร้างและเก็บไว้ใน init
    this.modelEl.addEventListener(
      "animation-finished",
      this.onStartFinishedCallback
    );
  },

  onTargetLost: function () {
    console.log("Target Lost");
    if (!this.modelEl) return;

    // 1. หยุด animation โดยลบ attribute
    console.log("Removing animation-mixer.");
    this.modelEl.removeAttribute("animation-mixer");

    // 2. ลบ listener 'animation-finished' ออกด้วย (สำคัญ)
    console.log("Removing 'animation-finished' listener (on lost).");
    this.modelEl.removeEventListener(
      "animation-finished",
      this.onStartFinishedCallback
    );
  },
});
