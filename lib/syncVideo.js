/*
 * Requires: git://github.com/alexbosworth/Node-S3.git
 *           git://github.com/rg3/youtube-dl.git
 */

var readFile = require('fs').readFile,
    httpGet = require('http').get,
    parseUrl = require('url').parse,
    createReadStream = require('fs').createReadStream,
    unlinkFile = require('fs').unlink,
    spawnChildProcess = require('child_process').spawn;

function SyncVideo(storage, tmpdir, in_url) {
    var args = [
        '-f',
        '22',
        '-o',
        '%(stitle)s-%(id)s.%(ext)s',
        in_url
    ];
    
    var output = '';
    
    var sync = spawnChildProcess(__dirname + '/../youtube-dl/youtube-dl', args);
    
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
        
        var stream = createReadStream(tmpdir + '/' + filename);
        
        var storageSettings = {
            readStream: true,
            acl: 'public-read',
            storageType: 'REDUCED_REDUNDANCY'
        };
        
        storage().put(filename, stream, {readStream: true, acl: 'public-read'}).
        
        success(function storageResponse() {
            unlinkFile(tmpdir + '/' + filename, function() { 
                console.log(filename + ' successfully synced.');
            })
        });
    });
}

exports.SyncVideo = SyncVideo;