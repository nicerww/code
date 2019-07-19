function divEscapedContentElement (message) {
  return $('<div></div>').text(message)
}
function divSystemContentElement (message) {
  return $('<div></div>').html('<i>' + message + '</i>')
}
// 处理原始的用户输入
function processUserInput (chatApp, socket) {
  var message = $('#send-message').val()
  var systemMessage
  // 如果用户输入的内容以斜杠（/）开头，将其作为聊天命令
  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processUserInput(message)
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage))
    }
  } else {
    // 将飞命令输入广播给其他用户
    chatApp.sendMessage($('#room').text(), message)
    $('#messages').append(divEscapedContentElement(message))
    $('#messages').scrollTop($('#message').prop('scrollHeight'))
  }
  $('#send-message').val('')
}

var socket = io.connect();

$(document).ready(function() {
  var chatApp = new Chat(socket);

  socket.on('nameResult', function(result) {
    var message;

    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', function(result) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  socket.on('message', function (message) {
    var newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);
  });

  socket.on('rooms', function(rooms) {
    $('#room-list').empty();

    for(var room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
