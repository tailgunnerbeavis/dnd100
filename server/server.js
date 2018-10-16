require('dotenv').load();
import express from 'express';
const path = require('path');
const app = express();
const production = process.env.NODE_ENV === 'production'

// Constants
const PORT = !production ? 3001 : 3000;
const HOST = '0.0.0.0';

app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

// Include server routes as a middleware
app.use(function(req, res, next) {
  require('./api/server')(req, res, next);
});

if(!production) {
  const chokidar = require('chokidar')
  var watcher = chokidar.watch('./api')
  watcher.on('ready', function() {
    watcher.on('all', function() {
      console.log("Clearing /api/ module cache from server")
      Object.keys(require.cache).forEach(function(id) {
        if (/[\/\\]api[\/\\]/.test(id)) delete require.cache[id]
      })
    })
  })
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);