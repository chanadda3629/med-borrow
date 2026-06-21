const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '../node_modules/leaflet.heat/dist/leaflet-heat.js')
const dest = path.join(__dirname, '../public/leaflet-heat.js')

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest)
}
