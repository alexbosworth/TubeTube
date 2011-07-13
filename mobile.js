var http = require('http');

function startHtmlResponse(res, title, buttons) {
    title = title || 'TubeTube';
    buttons = buttons || ['<a href="/" data-icon="home">Home</a>'];
    
    res.writeHead(200, {'content-type': 'text/html; charset=utf-8;'});
    
    res.write('<!DOCTYPE html><html><head><title>' + title + '</title>');
    
    res.write('<meta name="viewport" content="width=device-width, initial-scale=1">');	

    // jquery mobile
    res.write('<link rel="stylesheet" href="http://code.jquery.com/mobile/1.0b1/jquery.mobile-1.0b1.min.css"><script src="http://code.jquery.com/jquery-1.6.1.min.js"></script><script src="http://code.jquery.com/mobile/1.0b1/jquery.mobile-1.0b1.min.js"></script>');
        
    res.write('</head><body>');
    
    res.write('<div data-role="page">');
    
    res.write('<div data-role="header">');
    
    buttons.forEach(function(button) { res.write(button); });
    
    res.write('<h1>' + title + '</h1>');
    
	res.write('</div><!-- /header -->'); 
	
	res.write('<div data-role="content">');
}

function finishHtmlResponse(res) {
    res.write('</div><!-- /content -->');
    
    res.write('<div data-role="footer"><h4>Developed by Alex Bosworth</h4></div>');
    
    res.end('</div><!-- /page --></body></html>');
}

function showCasts(res) {
    var rss = '';
    
    http.get({
        host: 'sc2casts.com',
        path: '/rss'
    },
    function(rssRes) {
        rssRes.on('data', function(d) { rss+=d; });
        
        rssRes.on('end', function() { 
            var lines = rss.split('\n'),
                titles = [],
                links = [],
                descs = [],
                dates = [];
            
            lines.forEach(function(l) { 
                var title = /<title>(.*)<\/title>/.exec(l),
                    link = /<link>(.*)<\/link>/.exec(l),
                    desc = /<description><!\[CDATA\[(.*)\]\]><\/description>/.exec(l),
                    date = /<pubDate>(.*)<\/pubDate>/.exec(l);
                
                if (title && title.length > 1) return titles.push(title[1]);
                if (link && link.length > 1) return links.push(link[1]);
                if (desc && desc.length > 1) return descs.push(desc[1]);
                if (date && date.length > 1) return dates.push(date[1]);
            });
            
            var items = [];
            
            dates.forEach(function(d, i) { 
                items.push({
                    title: titles[i + 1],
                    link: links[i + 1],
                    desc: descs[i],
                    date: dates[i]
                });
            });
            
            startHtmlResponse(res, 'TubeTube');
            
            res.write('<ul data-role="listview" data-inset="true">');
            
            items.forEach(function(item) { 
                res.write('<li>' + item.title + '</li>');
            });
            
            res.write('</ul>');

            finishHtmlResponse(res);
        });        
    });
}

function incoming(req, res) {
    var parts = req.url.split('/');
    
    showCasts(res)    
}

http.createServer(incoming).listen(process.argv[2]);