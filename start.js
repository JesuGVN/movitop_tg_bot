const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const querystring   = require('querystring');
const { userInfo } = require('os');
const { Console } = require('console');

const token = '1261704732:AAFJfhPdxjJstp4vreOjK8LG1VHVsad-1oM';
const bot = new TelegramBot(token, {polling: true});

global.dataBase = require('./class/database/_db.js');

const dataBase = global.dataBase;
      dataBase.DB_Connect();

const chanelID = '-1001358880435';
const bot_url = 't.me/movitop_films_bot';



bot.on('voice', async(msg) => {

 const audioID = msg.voice.file_id;

  var path = bot.downloadFile(audioID, "./public/audio").then(function (path) {
    // speakMain(path).catch(console.error);
  });
});

bot.on('message', async (msg) => {
  let haveUser = await getUser(msg.from.id);

  // console.log(msg);

  if(msg.text == '/test'){
    
    if(msg.from.id == '239823355'){
      
      global.connection.query('SELECT * FROM users WHERE NTF_2 = ?',0, async function(err,res){
        if(err) throw err;
        else{
          if(res.length > 0){
            console.log('ЗАПУСК РАССЫЛКИ');
            for(const user of res){
              let res = await sendMsg(user.TG_ID);
  
              if(res){
                console.log('ПОЛЬЗОВАТЕЛЬ ' + user.TG_ID + ' ПОЛУЧИЛ НАШЕ СООБЩЕНИЕ');

                global.connection.query('UPDATE users SET ? WHERE TG_ID = ?', [{NTF:1}, user.TG_ID]);
              }else{
                console.log('ПОЛЬЗОВАТЕЛЬ ' + user.TG_ID + ' БЫЛ УДАЛЕН ИЗ БАЗЫ ДАННЫХ');
              }
  
            }
          }
        }
      })
    }

  }

  if(haveUser && msg.text != '/start'){
    await search(msg);
  }

});



bot.on('callback_query', async (query) => {
  
  const data = query.data;
  const msg_id = query.message.message_id;
  const user_id = query.from.id;
  const username = query.from.username;

  // console.log(data);

  if(data == 'check_subs'){
    
    checkUser(user_id,true,query.id, user_id, msg_id, username);
  }
})


async function sendMsg(id){
  return new Promise((resolve) => {

    setTimeout(function(){



      const text = '<b>Что посмотреть сегодня вечером?</b>\n<a href="https://telegra.ph/CHTO-POSMOTRET-V-EHTO-VOSKRESENE-09-27">Читать 2 минуты</a>';
      let opt = {
        parse_mode: 'html',
        disable_web_page_preview: true,
        caption: text,
        reply_markup:{
          inline_keyboard:[
            [{text: '⚡️Посмотреть', url: 'https://telegra.ph/CHTO-POSMOTRET-V-EHTO-VOSKRESENE-09-27'}],
          ]
        }
      }

      const file_id = 'AgACAgIAAxkBAAKLmF9wQ7wo4ynaFofuX8fOMBklBzqXAAIOsTEbsKiAS39S4xdfDgrHDWz7lC4AAwEAAwIAA3kAA433BAABGwQ';

      bot.sendPhoto(id,file_id,opt).then(function(data){

        global.connection.query('UPDATE users SET ? WHERE TG_ID = ?',[{NTF_2: 1}, id],function(err,data){
          if(err) resolve(false)
          else{
            resolve(true);
          }
        });
      }).catch(function(err){
        global.connection.query('DELETE FROM users WHERE TG_ID = ?',id,function(err){
          if(err) throw err;
          else{
            resolve(false);
          }
        })
      });

    },2500);

  });
}

function search(data){

  return new Promise(async (resolve) => {

    const s = data.text;
    const user_id = data.from.id;
    const user_name = data.from.username;

    console.log(user_name + '(' + user_id + ') ИЩЕТ: ' + s);

    if(s == 'после' || s == 'после 2' || s == 'после глава 2' || s == 'После' || s == 'После 2' || s == 'После глава 2' || s == 'После Глава 2'){
      await getFilm('1098154',user_id);
      await getFilm('1281638',user_id);

      resolve(true);
    }else{
      
      if(typeof s != 'undefined'){
        if(s.length > 2){
    
          let mt_url = 'https://movitop.ru/wp-admin/admin-ajax.php';
          let clp_url = 'https://api1600254977.apicollaps.cc/list?token=3c0d770740d076419de1d300f6196112&name=' + encodeURIComponent(s);
    
          bot.sendMessage(user_id,'<b>😉Начинаю искать ...</b>', {parse_mode: 'html'});
          request(clp_url, async function (error, response, body) {
    
            const res = JSON.parse(body);

    
            if(res.results.length > 0){
              for(const movie of res.results){
                await getFilm(movie.kinopoisk_id,user_id);
              }
            }else{
              bot.sendMessage(user_id,'<b>По вашему запросу ничего не найденно😕</b>\n\n\<b>Пример запроса:</b>\n\n<b>✅Правильно:</b>  Ведьмак\n<b>✅Правильно:</b> The Witcher\n❌<b>Неправильно:</b> Ведьмак 2019\n❌<b>Неправильно:</b> Ведьмак 1 сезон\n\n<i>Так-же действует стол заказов, для этого напишите нам сюда 👉@movitop_support и мы добавим ваш фильм/сериал</i>', {parse_mode: 'html'});
            }
    
            resolve(true);
          });
        }else{
          bot.sendMessage(user_id,'<b>Запрос должен состоять из более 2х символов😊</b>', {parse_mode: 'html'});
        }
      }
    }

  });
}

function getFilm(id,u_id){
  return new Promise(async (resolve) => {
    let cpl_url = 'https://api1600260066.apicollaps.cc/franchise/details?token=3c0d770740d076419de1d300f6196112&kinopoisk_id=' + encodeURIComponent(id);

    request(cpl_url, async function (error, response, body) {
      const mov = JSON.parse(body);

      if(mov.poster != null && typeof mov.poster != 'undefined'){

        let name = mov.name;
        let year = mov.year;
        let quality = mov.quality;
        let description = mov.description;
        let poster = mov.poster;
        let mov_url = mov.iframe_url;
  
        let site_url = await getMovieUrl(id);
  
        if(site_url.indexOf('http') > -1){
          mov_url = site_url;
        }
  
        const text = '🎬<b>' + name +' ('+ year +') | ' + quality +'</b>\n\n<b>Описание:</b>\n' + description;
        let opt = {
          parse_mode: 'html',
          disable_web_page_preview: true,
          caption: text,
          reply_markup:{
            inline_keyboard:[
              [{text: '🎬Смотреть Бесплатно', url: mov_url}],
              [{text: '🔥Лучшие Фильмы и Сериалы🔥', url:'t.me/movitop_official'}],
              [{text: '🔍Поиск Фильмов', url: bot_url}]
            ]
          }
        }
        bot.sendPhoto(u_id,poster,opt).catch(function(err){
          resolve(true);
        })
      }


      resolve(true);
    });


  });
}

function getMovieUrl(id){
  return new Promise((resolve) => {

    let formData = {
      action: 'getMovieInfo',
      kp_id: id
    }

    formData = querystring.stringify(formData);
    let contentLength = formData.length;

    const opt = {
      headers: {
        'Content-Length': contentLength,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      uri: 'https://movitop.ru/wp-admin/admin-ajax.php',
      body: formData,
      method: 'POST'
    }

    request(opt, async function (error, response, body) {

      if(body.indexOf('http') > -1){
        resolve(body);
      }else{
        resolve('false');
      }
    });

  })
}

function regUser(id){
  return new Promise((resolve,reject) => {
    global.connection.query('INSERT INTO users SET ?', {TG_ID: id} , function(err,fld){
      if(err) throw err;
      else{
        resolve(true);
      }
    })
  })
}

function getUser(id){

  return new Promise(async (resolve,reject) => {

    connection.query('SELECT * FROM users WHERE TG_ID = ?', id, async function(err,res){
      if(err) throw err;
      else{
        if(res.length == 0){
          let res = await regUser(id);

          if(res){
            console.log('ПОЛЬЗОВАТЕЛЬ ' + id + ' УСПЕШНО ЗАРЕГИСТРИРОВАН');

            let chkUsr = await checkUser(id,999);

         

            if(chkUsr == false){
              resolve(false);
            }
            resolve(true);
          }else{
            resolve(false);
          }
        }else{
          let chkUsr = await checkUser(id,false);


          if(chkUsr == false){
            resolve(false);
          }

          resolve(true);
        }
      }
    })
  })

}

function checkUser(id,type,callback_id, chat_id,msg_id, user_name){

  return new Promise((resolve) => {

    bot.getChatMember(chanelID, id).then(function(data){
      // console.log(data);
      
      if(data.status != 'left'){
        if(type == true){
          const msg = '<b>👋Добро пожаловать в поиск мой друг!</b>Напиши мне название фильма, мультфильма или сериала и я найду их для тебя.\n\n<b>❗️ВАЖНО!</b> Год выпуска, номер сезона или номер серии писать не нужно! Название должно быть правильным (как в Кинопоиске)! В обратном случае, я ничего не смогу найти для тебя. Например:\n\n<b>✅Правильно:</b>  Ведьмак\n✅<b>Правильно:</b> The Witcher\n❌<b>Неправильно:</b> Ведьмак 2019\n❌<b>Неправильно:</b> Ведьмак 1 сезон\n\nЖду от тебя названия фильма👇\nПриятного просмотра!🍿'
          bot.editMessageText(msg,{chat_id: chat_id, message_id: msg_id,parse_mode: 'html', disable_web_page_preview: true})

          console.log(user_name + '(' + chat_id + ') УСПЕШНО АКТИВИРОВАЛ БОТА');
          
        }
        
        if(type == 999){
          const msg = '<b>👋Добро пожаловать в поиск мой друг!</b>Напиши мне название фильма, мультфильма или сериала и я найду их для тебя.\n\n<b>❗️ВАЖНО!</b> Год выпуска, номер сезона или номер серии писать не нужно! Название должно быть правильным (как в Кинопоиске)! В обратном случае, я ничего не смогу найти для тебя. Например:\n\n<b>✅Правильно:</b>  Ведьмак\n✅<b>Правильно:</b> The Witcher\n❌<b>Неправильно:</b> Ведьмак 2019\n❌<b>Неправильно:</b> Ведьмак 1 сезон\n\nЖду от тебя названия фильма👇\nПриятного просмотра!🍿'
          bot.sendMessage(id,msg,{parse_mode: 'html', disable_web_page_preview: true});
        }
        resolve(true);
      }
      else{
  
        if(type == true){
  
          const msg = '❌Вы не подписались на наш канал, подпишитесь и попробуйте попытку снова';
          bot.answerCallbackQuery(callback_id, msg, true);
          // console.log(callback_id);
          resolve(true);
        }
        const opt = {
          reply_markup:{
            inline_keyboard: [
              [{text: '⚡️Наш канал', url: 't.me/movitop_official'}],
              [{text: '✅Проверить подписку', callback_data: 'check_subs'}]
  
            ]
          },
          parse_mode: 'html',
          disable_web_page_preview: true
        }
  
        const msg = '<b>Привет мой друг!\n</b>Наш бот абсолютно бесплатен и без рекламы! Но доступ у него открыт только подписчикам нашего канала👉 <a href="https://t.me/movitop_official">ФИЛЬМЫ | СЕРИАЛЫ - MOVITOP</a> \n\nПодпишитесь, что бы не пропускать новинки! После подписки нажмите кнопку <b>"Проверить подписку". Доступ будет открыт автоматически.</b>';
        bot.sendMessage(id,msg,opt);
        
        resolve(false);
      }
  });
  })

 
}








