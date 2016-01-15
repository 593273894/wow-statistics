var getdata=require('./request-save-mongodb');
var schedule=require('node-schedule');
var express = require('express');
var fs=require('fs');
var app = express();
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var rule=new schedule.RecurrenceRule();

rule.hour=23;
rule.minute=30;
var job=schedule.scheduleJob(rule,function(){
  getdata();
});


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('files'));

var url = 'mongodb://localhost:27017/ladders';
// Use connect method to connect to the Server 
MongoClient.connect(url, function(err, db) {
  app.get('/choosedate/:table', function(req, res) {
    log(req);
    var collection=db.collection(req.params['table']);
    collection.distinct('date',function(err,docs){
      res.render('choosedate.ejs',{
        alldates:docs
      });
    });
  });
  app.get('/chooseitem',function(req,res){
    log(req);
    res.render('chooseitem.ejs',{});
  });
  app.get('/showhistorydata/:table',function(req,res){
    log(req);
   var collection=db.collection(req.params['table']);
   collection.aggregate([{
    $match:{
      rank:{
        $lt:500
      }
    }
  },
  {
    $group:{
      _id:{
        date:'$date',
        class:'$class'
      },
      count:{$sum:1}
    }
  },
  {
    $sort:{
      '_id.date':1,
      count:1
    }
  }],function(err,docs){
    res.render('showhistorydata.ejs',{json:docs});
  });
 });
  app.get('/showdaydata/:table/:date',function(req,res){
    log(req);
    var table = req.params['table'];
    var date=req.params['date'];
    var collection=db.collection(table);
    collection.aggregate([{
      $match:{
        rank:{
          $lt:500
        },
        date:date
      }
    },{
      $group:{
        _id:{
          class:'$class'
        },
        count:{$sum:1}
      }
    },{
      $sort:{
        count:1
      }
    }],function(err,docs){
        res.render('showdaydata.ejs',{json:docs});
    });
  });
  app.get('/',function(req,res){
    log(req);
    res.render('chooseitem.ejs',{});
  });
  app.listen(3000);
  console.log('app正在监听3000端口');
});


function log(req){
    var date=new Date();
    date=date.getFullYear()+'-'+
    ((date.getMonth()+1)<10?'0'+''+(date.getMonth()+1):(date.getMonth()+1))+'-'+(date.getDate()<10?'0'+''+
      date.getDate():date.getDate())+' '+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds();
    console.log(date+'  '+ req.ip+'  '+req.originalUrl);
    fs.appendFileSync('./log.log', date+' '+ req.ip+' '+req.originalUrl+'\r\n', 'utf8',function(){});
}
//TODO:
//提高获取数据频率,现在是每天获取一次
//添加用户系统，用户可以要求收录某个玩家的记录
//分页改成svg日历