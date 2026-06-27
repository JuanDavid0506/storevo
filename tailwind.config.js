/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Dile a Tailwind que busque clases en todos tus archivos HTML de Thymeleaf
    "./src/main/resources/templates/**/*.html",
    // También en tus archivos JS por si inyectas clases dinámicamente
    "./src/main/resources/static/js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        // Agregamos la fuente Inter que pusimos en el layout
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Aquí puedes definir el color principal de Storevo (Ej: un índigo o violeta)
        storevo: {
          500: '#6366f1', // Color primario
          600: '#4f46e5', // Color hover
        }
      }
    },
  },
  plugins: [],
}