var urlParse = require('url').parse,
    httpGet = require('http').get;
    
var VIDMATCH = /http[s]?:\/\/www\.youtube\.com\/(v\/|watch\?v=)([a-zA-Z0-9_\-]+)/gm;
        
function FindVideos(url, cbk) {
    var parsed = urlParse(url);
    
    if (VIDMATCH.test(url)) return cbk([url]);
    
    httpGet({
        host: parsed['host'],
        path: parsed['pathname'],
        port: 80
    }, function httpResponse(r) {
        var html = '';
        
        r.on('data', function(h) {
            html+= h;
        });
        
        r.on('end', function httpResponseEnd() {
            var matches = html.match(VIDMATCH),
                videos = {},
                vids = [];

            matches.forEach(function(match) { videos[match] = true; });

            for (var vid in videos) vids.push(vid);
            
            return cbk(vids);
        });
    });
}

exports.FindVideos = FindVideos;