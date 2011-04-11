/*
 * Requires: git://github.com/alexbosworth/Node-S3.git
 *           git://github.com/rg3/youtube-dl.git
 */

var readFile = require('fs').readFile,
    KEYS = require('./config/keys'),
    httpGet = require('http').get,
    parseUrl = require('url').parse,
    spawnChildProcess = require('child_process').spawn;
    storage = require('./Node-S3/aws-s3').init(KEYS.AWS_KEY, KEYS.AWS_PASS, KEYS.S3_BUCKET);

new SyncVideo(process.argv[2]);

function SyncVideo(in_url) {
    var args = [
        '-f',
        '22',
        in_url
    ];
    
    var output = '';
    
    var sync = spawnChildProcess(__dirname + '/youtube-dl/youtube-dl', [in_url]);
    
    sync.stdout.on('data', function downloadingCbk(chunk) { 
        output += chunk; 
        
        console.log(chunk+'');
    });
    
    sync.on('exit', function downloadingComplete() {
        var filename = null;
        
        output.split('\n').forEach(function checkLine(line) {
            if (/\[download\] Destination: /gim.test(line) == false) return;
            
            filename = line.slice(24);            
        });
                
        if (!filename) return console.log("NO VIDEO FOUND");
                
        readFile(__dirname + '/' + filename, 
        
        function fileArrived(err, data) {
            storage().put(filename, data, {acl: 'public-read', binaryBuffer: true}).

            success(function() { 
                console.log(filename, 'STORED ON S3');
            });            
        });
    });
}
