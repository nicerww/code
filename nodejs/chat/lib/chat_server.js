var socketio = require('socket.io')
var io
var guestNumber = 1
var nickNames = {}
var namesUsed = []
var currentRoom = {}

exports.listen = function (server) {
  // 启动socket.io服务器 允许它搭载在已有的http服务器上
  io = socketio.listen(server)
  io.set('log level', 1)
  // 定义每个用户连接的处理逻辑
  io.sockets.on('connection', function (socket) {
    // 在用户连接上来时赋予其一个访客名
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed)
    // 在用户连接上来时把他放入聊天室Lobby里
    joinRoom(socket, 'Lobby')
    // 处理用户的消息更名，以及聊天室的创建和变更
    handleMessgaeBroadcasting(socket, nickNames)
    handleNameChangeAttempts(socket, nickNames, namesUsed)
    handleRoomJoining(socket)
    // 用户发出请求时，向其提供已经被占用的聊天室的列表
    socket.on('rooms', function () {
      socket.emit('room', io.sockets.manager.rooms)
    })
    // 定义用户断开连接后的清除逻辑
    handleClientDisconnection(socket, nickNames, namesUsed)
  })
}

// 分配用户昵称
function assignGuestName (socket, guestNumber, nickNames, namesUsed ) {
  // 生成新昵称
  var name = 'Guest' + guestNumber
  // 把用户昵称跟客户端连接的ID关联上
  nickNames[socket.id] = name
  // 让用户知道他们的昵称
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  // 存放已经被占用的昵称
  namesUsed.push(name)
  // 增加用来生成昵称的计数器
  return guestNumber + 1
}
// 与进入聊天室相关逻辑
function joinRoom (socket, room) {
  // 让用户进入房间
  socket.join(room)
  // 记录用户的房间
  currentRoom[socket.id] = room
  // 让用户知道他们进入了新房间
  socket.emit('joinResult', { room: room })
  // 让房间里的其他用户知道有新用户进入了房间
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + 'has joined' + room + '.'
  })
  // 确认有哪些用户在这个房间里
  var usersInRoom = io.sockets.clients(room)
  // 如果不止一个用户在这个房间 汇总下都是谁
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': '
    for (var i in usersInRoom) {
      var userSocketId = usersInRoom[i].id
      if (userSocketId != socket.id) {
        if (i > 0) {
          usersInRoomSummary += ', '
        }
        usersInRoomSummary += nickNames[userSocketId]
      }
    }
    usersInRoomSummary += '.'
    // 将用户汇总发送给这个用户
    socket.emit('message', { text: usersInRoomSummary})
  }
}
// 更名请求处理逻辑
function handleNameChangeAttempts (socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    // 昵称不能以Guest开头
    if (name.indexOf ('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      })
    } else {
      if (namesUsed.indexOf(name) == -1) {
        // 如果昵称未被使用
        var previousName = nickNames[socket.id]
        var previousNameIndex = namesUsed.indexOf(previousName)
        namesUsed.push(name)
        nickNames[socket.id] = name
        delete namesUsed[previousNameIndex]
        // 删掉之前用的昵称，让其他用户可以使用
        socket.emit('nameResult', {
          success: true,
          name: name
        })
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + 'is now known as ' + name + '.'
        })
      } else {
        // 昵称被占用，发送错误消息
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use'
        })
      }
    }
  })
}
// 转发消息
function handleMessgaeBroadcasting (socket) {
  socket.on('message', function (message) {
      socket.broadcast.to(message.room).emit('message', {
        text: nickNames[socket.id] + ': ' + message.text
      })
  })
}
// 更换房间
function handleRoomJoining (socket) {
  socket.on('join', function (room) {
    socket.leave(currentRoom[socket.id])
    joinRoom(socket, room.newRoom)
  })
}
// 用户离开房间 删除nickNames namesUsed中的对应昵称
function handleClientDisconnection (socket) {
  socket.on('disconnect', function () {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id])
    delete namesUsed[nameIndex]
    delete nickNames[socket.id]
  })
}