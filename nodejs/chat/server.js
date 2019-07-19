// 内置http模块提供了HTTP服务器和客户端功能
var http = require('http')
// 内置的fs模块提供了与文件系统相关的功能
var fs = require('fs')
// 内置的path模块提供了与文件系统路径相关的功能
var path = require('path')
// 附加的mime模块有根据文件扩展名得出的mime类型的能力
var mime = require('mime')
// cache是用来缓存文件内容的对象
var cache = {};

var chatServer = require('./lib/chat_server.js')

// 错误返回404
function send404 (res) {
  res.writeHead(404, {'Content-Type': 'text/plain'})
  res.write('Error 404: resource not found')
  res.end()
}
// 返回指定文件内容
function sendFile (res, filePath, fileContents) {
  res.writeHead(200, {'content-type': mime.lookup(path.basename(filePath))})
  res.end(fileContents)
}

function serveStatic (res, cache, absPath) {
  // 检查是否有文件缓存
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath])
  } else {
    // 检查文件是否存在
    fs.exists(absPath, function (exists) {
      if (exists) {
        // 从硬盘读取文件
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(res)
          } else {
            cache[absPath] = data;
            // 读取文件之后返回
            sendFile(res, absPath, data)
          }
        })
      } else {
        send404(res)
      }
    })
  }
}

var server = http.createServer(function(req, res) {
  var filePath = false
  if (req.url === '/') {
    // 确定返回的默认HTML文件
    filePath = 'public/index.html'
  } else {
    // 将url路径转为文件的相对路径
    filePath = 'public' + req.url
  }
  var absPath = './' + filePath
  // 返回静态资源
  serveStatic(res, cache, absPath)
})

server.listen(80, function () {
  console.log("server listening on port 80.")
})

chatServer.listen(server)