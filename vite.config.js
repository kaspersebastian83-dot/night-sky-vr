import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs make the production build work from any GitHub
  // Pages project path, e.g. /night-sky-vr/, without hard-coding a username.
  base: './',
});
