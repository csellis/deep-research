/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

const config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{html,js,svelte,ts}',
    '../../packages/ui/src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
  ],
  plugins: [
    typography,
    forms
  ],
};

export default config;
