import Alpine from "alpinejs";

window.Alpine = Alpine;

// Global state
Alpine.store("sidebar", {
  open: false,
  toggle() {
    this.open = !this.open;
  },
  close() {
    this.open = false;
  },
});

// Theme controller
Alpine.data("theme", () => ({
  light: true,

  init() {
    const saved = localStorage.getItem("light");
    if (saved !== null) {
      this.light = saved === "true";
      return;
    }
    this.light = !window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.save();
  },

  toggle() {
    this.light = !this.light;
    this.save();
  },

  save() {
    localStorage.setItem("light", this.light ? "true" : "false");
  },
}));

// Keyboard shortcuts
Alpine.bind("keyboard", () => ({
  // Sidebar
  ["@keydown.window.prevent.ctrl.e"]() {
    this.$store.sidebar.toggle();
  },
  ["@keydown.window.prevent.cmd.e"]() {
    this.$store.sidebar.toggle();
  },
  ["@keydown.window.escape"]($event) {
    if (this.$store.sidebar.open) {
      $event.preventDefault();
      this.$store.sidebar.close();
    }
    if (this.$refs.search) {
      $event.preventDefault();
      this.$refs.search.blur();
    }
  },

  // Search
  ["@keydown.window.prevent.cmd.k"]() {
    if (this.$refs.search) {
      this.$refs.search.focus();
    }
  },
  ["@keydown.window.prevent.ctrl.k"]() {
    if (this.$refs.search) {
      this.$refs.search.focus();
    }
  },
}));

Alpine.start();
