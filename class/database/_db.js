 global.connection_count = 0;
  
    
var DB_Connect = function(){
    const mysql     = require('mysql');
    const option    = {
      host     : '193.124.206.129',
      user     : 'movitop_bot',
      password : 'H5r3O8z2',
      database : 'movitop_bot'
    }
    global.connection_count++

    global.connection = mysql.createConnection(option); // Пересоздание соединения
    global.connection.timeout = 0;                      // так как прошлое соединение использовать невозможно
    global.connection.connect(function(err) {           // Сервер либо не работает
    if(err) {                                          // либо перезагружается(может занять некоторое время)
        // console.log('\x1b[41m \x1b[30mОшибка при подключении к Базе Данных: \x1b[0m',err);
        setTimeout(DB_Connect, 2000);       // Мы делаем небольшую задержку перед попыткой переподключения
    }                                     // чтобы избежать перемешанной петли и чтобы наш скрипт обрабатывал
    });                                   // Асинхронные запросы
    global.connection.on('error', function(err) {
    // console.log('\x1b[41m \x1b[37mОшибка Базы Данных: \x1b[33m ПРЕВЫШЕННО ВРЕМЯ ПРОСТОЯ\x1b[0m');

    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Cоединение с сервером MySQL обычно
        DB_Connect();                               // теряется из-за перезапуска или из-за
    } else {                                      // тайм-аута простоя соединения
        throw err;                                  // (переменная сервера wait_timeout настраивает это).
    }
    });

    global.connection.on('connect', function(data){
        // console.log('Подключение к Базе Данных прошло успешно');
        if(global.connection_count == 1){
            console.log('подключение успешно')
        }
    });
}

var CHECK_CONNECT = function(){
    var connect = global.connection;

    if(connect.state == 'disconnected'){
        return false;
    }else{
        return true;
    }
}




// Экспортируем Модули

module.exports.DB_Connect    = DB_Connect;
module.exports.CHECK_CONNECT = CHECK_CONNECT;