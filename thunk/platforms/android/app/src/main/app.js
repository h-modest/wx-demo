var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var zlib = require('zlib');
//引入配置参数
var config = require('./config');

console.log(">>>>>>>>>>>>|server loading......");

var server = http.createServer(function(req,resp){
	//TODO
	var pathname = url.parse(req.url).pathname;
	//如果以'/'结尾自动加上'index.html'
	if(pathname.slice(-1) === '/') pathname += config.Default.homePage;
	//文件格式化后的真实路径
	var rPath = path.join(__dirname,'/assets',path.normalize(pathname.replace(/\.\./g, "")));
	console.log(">>>>>>>>>>>>|time:"+new Date().format('yyyy-MM-dd hh:mm:ss')+"|ip:"+getClientIp(req)+"|path:"+rPath);
	fs.stat(rPath,function(err,stats){
		if(err){
			resp.writeHead(404,{
				'Content-Type':'text/plain'
			});
			resp.write("This request URL " + pathname + " was not found");
			resp.end();
		} else {
			if(stats.isDirectory()){
				rPath = path.join(rPath,'/',config.Default.homePage);
			}
			//未修改返回304
			var ifModifiedSince = "If-Modified-Since".toLowerCase();
			var lastModified = stats.mtime.toUTCString();
			if(req.headers[ifModifiedSince] && lastModified == req.headers[ifModifiedSince]){
				resp.writeHead(304,"Not Modified");
				resp.end();
			} else {
				//设置返回类型
				var ext = path.extname(rPath);
				var mime = config.Mime;
        ext = ext ? ext.slice(1) : 'unknown';
        var contentType = mime[ext] || "text/plain";
        resp.setHeader("Content-Type", contentType);
				//设置最后更改时间
        var lastModified = stats.mtime.toUTCString();
        var ifModifiedSince = "If-Modified-Since".toLowerCase();
        resp.setHeader("Last-Modified", lastModified);
				//设置过期时间
        if (ext.match(config.Expires.fileMatch)) {
            var expires = new Date();
            expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
            resp.setHeader("Expires", expires.toUTCString());
            resp.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
        }
				//是否直接从缓存中读取
        if (req.headers[ifModifiedSince] && lastModified == req.headers[ifModifiedSince]) {
            resp.writeHead(304, "Not Modified");
            resp.end();
        } else {
        	//是否支持断点续传
        	if(req.headers['range']){
							var range = require('./range').parseRange(request.headers['range'],stats.size);
							if(range){
								resp.setHeader('Content-Range','bytes ' + range.start + '-' + range.end + '/' + stats.size);
								resp.setHeader('Content-Length',(range.end - range.start +1));
								var raw = fs.createReadStream(rPath,{
									'start' : range.start,
									'end' : range.end	
								});
								//支持断点续传
								compressHandle(raw,ext,206,'Partial Content',req,resp);
							} else {
								response.removeHeader('Content-Length');
								//断点续传无效
								response.writeHead(416,'Request Range Not Satisfiable');
								response.end();
							}
					} else {
						var raw = fs.createReadStream(rPath);
						compressHandle(raw,ext,200,'ok',req,resp);
					}
        }
			}
		}
	});
});

server.listen(config.Default.port);

console.log(">>>>>>>>>>>>|server starting......");

//gzip压缩
function compressHandle(raw,ext,statusCode,reasonPhrase,request,response){
  var acceptEncoding = request.headers['accept-encoding'] || "";
  var matched = ext.match(config.Compress.match);

  //浏览器支持gzip压缩
	if(matched && acceptEncoding.match(/\bgzip\b/)){
		response.writeHead(statusCode,reasonPhrase,{
			'Content-Encoding' : 'gzip'	
		});
		raw.pipe(zlib.createGzip()).pipe(response);
	//浏览器支持deflate压缩
	} else if(matched && acceptEncoding.match(/\bdeflate\b/)){
		response.writeHead(statusCode,reasonPhrase,{
			'Content-Encoding' : 'deflate'	
		});
		raw.pipe(zlib.createDeflate()).pipe(response);
	} else {
		response.writeHead(statusCode,reasonPhrase);
		raw.pipe(response);
	}	
}

//获取访问者的ip地址
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
};

//日期格式化 yyyy-MM-dd hh:mm:ss
Date.prototype.format = function(format){ 
  var opt = { 
    "M+" : this.getMonth()+1,
    "d+" : this.getDate(),
    "h+" : this.getHours(), 
    "m+" : this.getMinutes(),
    "s+" : this.getSeconds()
  }
  
  //匹配多个y  RegExp.$1:正则表达式分组的第一组
  if(new RegExp(/(y+)/).test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
  } 

  for(var key in opt) { 
    if(new RegExp("("+ key +")").test(format)) { 
      format = format.replace(RegExp.$1, RegExp.$1.length==1 ? opt[key] : ("00"+ opt[key]).substr((""+ opt[key]).length)); 
    } 
  } 
  return format; 
} 