exports.Default = {
	port : 8082,
	homePage : 'index.html',
	dirList : true
}

exports.Mime = {
	"css" : "text/css",
  "gif" : "image/gif",
  "html" : "text/html",
  "ico" : "image/x-icon",
  "jpeg" : "image/jpeg",
  "jpg" : "image/jpeg",
  "js" : "text/javascript",
  "json" : "application/json",
  "pdf" : "application/pdf",
  "png" : "image/png",
  "svg" : "image/svg+xml",
  "swf" : "application/x-shockwave-flash",
  "tiff" : "image/tiff",
  "txt" : "text/plain",
  "wav" : "audio/x-wav",
  "wma" : "audio/x-ms-wma",
  "wmv" : "video/x-ms-wmv",
  "xml" : "text/xml"
};

exports.Expires = {
		fileMatch : /^(gif|png|jpg|js|css)$/ig,
		maxAge : 60*60*24*365
};

exports.Compress = {
		match : /css|js|html/ig
};
