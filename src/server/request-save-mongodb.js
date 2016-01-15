module.exports=function(){
	var request = require('request');
	var fs=require('fs');
	var cheerio=require('cheerio');
	var constant=require('./constant');
	var MongoClient = require('mongodb').MongoClient
	, assert = require('assert');

	// Connection URL 
	var url = 'mongodb://localhost:27017/ladders';
	// Use connect method to connect to the Server 
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected correctly to mongodb");

		var date=new Date();
		date=date.getFullYear()+'-'+((date.getMonth()+1)<10?'0'+''+(date.getMonth()+1):(date.getMonth()+1))+'-'+(date.getDate()<10?'0'+''+date.getDate():date.getDate());
		var start,end;

		var RACE=constant.RACE;
		var CLASS=constant.CLASS;
		var TALENT=constant.TALENT;

		var saveFinishedCount={
			'jjc2v2':0,
			'jjc3v3':0,
			'jjc5v5':0,
			'rbg':0
		}
		var saveFinished={
			'jjc2v2':false,
			'jjc3v3':false,
			'jjc5v5':false,
			'rbg':false
		};

		start=new Date();
		start={
			'time':start.getFullYear()+'-'+(start.getMonth()+1+'-')+start.getDate()+'-'+start.getHours()+'-'+start.getMinutes()+'-'+start.getSeconds(),
			'ms':start.getTime()
		};
		log('---请求数据开始---');
		log('开始请求jjc2v2数据');
		request('http://www.battlenet.com.cn/wow/zh/pvp/leaderboards/2v2', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				log('请求jjc2v2数据成功');
				var $=cheerio.load(body);
				var player=$('.ladder-record');
				var len=player.length;
				log('加载jjc2v2数据成功');
				player.each(function(index,ele){
					processPlayer($,$(this),index,'jjc2v2',len);
				});
			}
			else{
				console.log(response);
				console.log(body);
			}
		});
		log('开始请求jjc3v3数据');
		request('http://www.battlenet.com.cn/wow/zh/pvp/leaderboards/3v3', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				log('请求jjc3v3数据成功');
				var $=cheerio.load(body);
				var player=$('.ladder-record');
				var len=player.length;
				log('加载jjc3v3数据成功');
				player.each(function(index,ele){
					processPlayer($,$(this),index,'jjc3v3',len);
				});
			}
			else{
				console.log(response);
				console.log(body);
			}
		});
		log('开始请求jjc5v5数据');
		request('http://www.battlenet.com.cn/wow/zh/pvp/leaderboards/5v5', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				log('请求jjc5v5数据成功');
				var $=cheerio.load(body);
				var player=$('.ladder-record');
				var len=player.length;
				log('加载jjc5v5数据成功');
				player.each(function(index,ele){
					processPlayer($,$(this),index,'jjc5v5',len);
				});
			}
			else{
				console.log(response);
				console.log(body);
			}
		});
		log('开始请求评级战场数据');
		request('http://www.battlenet.com.cn/wow/zh/pvp/leaderboards/rbg', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				log('请求评级战场数据成功');
				var $=cheerio.load(body);
				var player=$('.ladder-record');
				var len=player.length;
				log('加载评级战场数据成功');
				player.each(function(index,ele){
					processPlayer($,$(this),index,'rbg',len);
				});
			}
			else{
				console.log(response);
				console.log(body);
			}
		});

		function processPlayer($,player,index,table,len){
			var row={};
			var items={};
			var str='';
			row.date=date;
			row.href=player.find('a').attr('href');
			row.rank=parseInt(player.attr('id').split('-')[1]);

			row.name=player.find('.player').attr('data-raw').split(' ')[0];
			row.server=row.href.split('/')[4];
			row.faction=player.find('span[data-tooltip]').attr('data-tooltip');
			items=player.find('img');
			items.each(function(index,ele){
				switch(index)
				{
					case 0:
					str=$(this).attr('src');
					str=str.substring(str.indexOf('icons')+9,str.indexOf('jpg')-1);
					row.race=RACE[str];
					break;
					case 1:
					str=$(this).attr('src');
					str=str.substring(str.indexOf('icons')+9,str.indexOf('jpg')-1);
					row['class']=CLASS[str];
					break;
					case 2:
					str=$(this).attr('src');
					str=str.substring(str.indexOf('icons')+9,str.indexOf('jpg')-1);
					row.telant=TALENT[str];
					break;
					default:
				}
			});
			row.win=player.find('.win').text();
			row.loss=player.find('.loss').text();
			row.rating=player.find('.rating').text();
			
			var collection=db.collection(table);
			collection.insertMany([row], function(err,result){
				saveFinishedCount[table]++;
				if(saveFinishedCount[table]==len){
					saveFinished[table]=true;
					log(table+'添加成功，共添加'+len+'条数据');
				}
				if(saveFinished['jjc2v2']&&saveFinished['jjc3v3']&&saveFinished['jjc5v5']&&saveFinished['rbg'])
				{
					end=new Date();
					end={
						'time':end.getFullYear()+'-'+(end.getMonth()+1+'-')+end.getDate()+'-'+end.getHours()+'-'+end.getMinutes()+'-'+end.getSeconds(),
						'ms':end.getTime()
					};
					log('---请求数据结束---'+'耗时: '+ ((end['ms']-start['ms'])/1000)+'秒');
					db.close();
				}
			});
		}
	});

	function log(msg){
	    var date=new Date();
	    date=date.getFullYear()+'-'+
	    ((date.getMonth()+1)<10?'0'+''+(date.getMonth()+1):(date.getMonth()+1))+'-'+(date.getDate()<10?'0'+''+
	      date.getDate():date.getDate())+' '+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds();
		console.log(date+'  '+msg);
		fs.appendFileSync('./request-save.log', date+' '+msg+'\r\n', 'utf8',function(){});
	}
};