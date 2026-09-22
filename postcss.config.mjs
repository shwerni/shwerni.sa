const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Tailwind 4.3.1's Lightning CSS optimize step emits invalid CSS for this project.
      // Next/Turbopack still minifies the final CSS in production.
      optimize: false,
    },
  },
};

export default config;