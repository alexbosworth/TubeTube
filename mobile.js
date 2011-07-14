var http = require('http'),
    crypto = require('crypto');

function startHtmlResponse(res, title, buttons) {
    title = title || 'TubeTube';
    buttons = buttons || ['<a href="/" data-icon="home">Home</a>'];
    
    res.writeHead(200, {'content-type': 'text/html; charset=utf-8;'});
    
    res.write('<!DOCTYPE html><html><head><title>' + title + '</title>');
    
    res.write('<meta name="viewport" content="width=device-width, initial-scale=1">');	

    // jquery mobile
    res.write('<link rel="stylesheet" href="http://code.jquery.com/mobile/latest/jquery.mobile.min.css"><script src="http://code.jquery.com/jquery-1.6.2.min.js"></script><script src="http://code.jquery.com/mobile/latest/jquery.mobile.min.js"></script>');
        
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

function showCasts(req, res) {
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
            
            var items = [],
                focus = null;
            
            dates.forEach(function(d, i) {
                var md5 = crypto.createHash('md5').update(links[i + 1]).digest("hex");
                
                var item = {
                    title: titles[i + 1],
                    link: links[i + 1],
                    desc: descs[i],
                    date: new Date(dates[i]),
                    md5: md5
                };
                
                items.push(item);
                
                if (req.url.substring(6) == md5) focus = item
            });
            
            var title = (focus) ? focus.title : 'TubeTube';
            
            startHtmlResponse(res, title);
            
            if (focus) focusHtmlResponse(res, focus);
            else itemsHtmlResponse(res, items);

            finishHtmlResponse(res);
        });        
    });
}

function focusHtmlResponse(res, focus) {    
    res.write('<h2>' + focus.title + '</h2><p>' + focus.desc + '</p>');
    
    res.write('<form>');
    
    res.write('<input type="submit" value="Sync">');
    
    res.write('</form>');
}

function itemsHtmlResponse(res, items) {
    res.write('<ul data-role="listview">');
    
    var date = null;
    
    items.forEach(function(item) {
        var d = item.date.toISOString().substring(0, 10);
        
        if (d != date) {
            res.write('<li data-role="list-divider">' + d + '</li>');
        }
        
        date = d;
        
        res.write('<li><a href="/link/' + item.md5 + '"><h2>' + item.title + '</h2><p>' + item.desc + '</p></a></li>');
    });
    
    res.write('</ul>');
}

function incoming(req, res) {
    var parts = req.url.split('/');
    
    showCasts(req, res);
}

http.createServer(incoming).listen(process.argv[2]);