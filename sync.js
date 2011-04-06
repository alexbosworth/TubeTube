var readFileSync = require('fs').readFileSync,
    KEYS = require('./config/keys'),
    httpGet = require('http').get,
    parseUrl = require('url').parse,
    spawnChildProcess = require('child_process').spawn;
    S3 = require('./Node-S3/amazon-s3').S3;

function storage() {
    return new S3(KEYS.AWS_KEY, KEYS.AWS_PASS, 
        {acl: 'public-read', defaultBucket: KEYS.S3_BUCKET });
};

new SyncVideo(process.argv[2]);

function SyncVideo(in_url) {
    var timestamp = new Date().getTime();
    
    var args = [
        '-o',
        timestamp,
        in_url
    ];
    
    var sync = spawnChildProcess(__dirname + '/youtube-dl/youtube-dl', [in_url]);
    
    sync.on('exit', function(r) { 
        var buffer = readFileSync(__dirname + '/' + timestamp);
        
        storage().put(timestamp, {binaryBuffer: buffer});
    });
}