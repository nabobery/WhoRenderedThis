/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"]
      },
      zIndex: {
        overlay: "999999",
        panel: "1000000"
      }
    }
  },
  plugins: []
}
