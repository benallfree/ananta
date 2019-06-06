import { nextApp, servers } from './app'
import path from 'path'

var chokidar = require('chokidar')

function watchModules(watchPath) {
  var watcher = chokidar.watch(watchPath)
  watcher.on('ready', function() {
    console.log(`Watching ${watchPath}`)
    watcher.on('all', function() {
      console.log(`Clearing ${watchPath} module cache from server`)
      Object.keys(require.cache).forEach(function(id) {
        const regex = new RegExp(`^${watchPath}/`, 'i')
        if (regex.test(id)) {
          delete require.cache[id]
        }
      })
    })
  })
}
watchModules(path.resolve(__dirname, 'Engine'))
watchModules(path.resolve(__dirname, '../universes'))
watchModules(path.resolve(__dirname, 'endpoints'))
;(async () => {
  await nextApp.prepare()

  const port = parseInt(process.env.PORT, 10) || 3000
  servers.http.listen(port, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})()
