var readFileSync = require('fs').readFileSync,
    KEYS = require('./config/keys'),
    httpGet = require('http').get,
    parseUrl = require('url').parse,
    spawnChildProcess = require('child_process').spawn;
    S3 = require('./Node-S3/amazon-s3').S3;

function storage() {
    return new S3(KEYS.AWS_KEY, KEYS.AWS_PASS, 
        {acl: 'public-read', defaultBucket: KEYS.S3_BUCKET });
}

new SyncVideo(process.argv[2]);

function SyncVideo(in_url) {
    var args = [
        '-f',
        '22',
        in_url
    ];
    
    var filename = null;
    
    var sync = spawnChildProcess(__dirname + '/youtube-dl/youtube-dl', [in_url]);
    
    sync.stdout.on('data', function downloadingCbk(chunk) { 
        chunk = chunk+'';
        
        if (/\[download\] Destination: /gim.test(chunk)) {
            filename = chunk.slice(24);
        }
    });
    
    sync.on('exit', function downloadingComplete() {
        var data = readFileSync(__dirname + '/' + filename);
        
        storage().put(filename, data).
        
        on('success', function() { 
            console.log(filename, 'stored on S3');
        })
    });
}
