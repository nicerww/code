var Chat = function (socket) {
  this.socket = socket
}
// 发送聊天消息
Chat.prototype.sendMessage = function (room, text) {
  var message = {
    room: room,
    text: text
  }
  this.socket.emit('message', message)
}
// 变更房间的函数
Chat.prototype.changeRoom = function (room) {
  this.socket.emit('join', {
    newRoom: room
  })
}
// 处理聊天命令
Chat.prototype.processCommand = function (command) {
  var words = command.split(' ')
  // 从第一个单词开始解析命令
  var command = word[0].substring(1, word[0].length).toLowerCase()
  var message = false
  switch (command) {
    case 'join':
      word.shift()
      var room = words.join(' ')
      // 处理房间变更创建
      this.changeRoom(room)
      break
    case 'nick':
      word.shift()
      var name = words.join(' ')
      // 处理更名尝试
      this.socket.emit('nameAttempt', name)
      break
    default:
      // 如果命令无法识别，返回错误信息
      message = 'Unrecognized command.'
      break
  }
}