import { nextApp, servers } from './app'
;(async () => {
  await nextApp.prepare()

  const port = parseInt(process.env.PORT, 10) || 3000
  servers.http.listen(port, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})()
