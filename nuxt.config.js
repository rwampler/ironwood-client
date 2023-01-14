// import webpack from 'webpack'


export default defineNuxtConfig({
  css: [
    'bulma',
    { src: '~/assets/stylesheets/ironwood.sass', lang: 'sass' }
  ],
  app: {
    head: {
      title: 'Ironwood',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=VT323&display=swap' }
      ]
    },
  },
  // loading: { color: '#000' },
  render: {
    resourceHints: false
  },
  generate: {
    fallback: false
  },
  telemetry: false,
  target: 'static',
  build: {
    // analyze: true,
    publicPath: '/assets/',
    loaders: {
      sass: {
        implementation: require('sass')
      }
    },
    standalone: true,
    // transpile: [
    //   'postprocessing',
    //   'three'
    // ],
  },
  buildModules: ['@nuxt/typescript-build'],
  plugins: [
    // { src: '~/plugins/font-awesome', mode: 'client' }
  ]
})
