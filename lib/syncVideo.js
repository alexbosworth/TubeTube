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

function SyncVideo(storage, tmpdir, url) {        
    this.storage = storage;
    this.tmpdir = tmpdir;
    this.url = url;
    this.filename = null;
    
    this.storageSettings = {
        readStream: true,
        acl: 'public-read',
        storageType: 'REDUCED_REDUNDANCY'
    };
    
    this.steps = [
        this.getVideoId,
        this.getVideoMetadata,
        this.downloadVideo,
        this.makeThumbnail,
        this.storeThumbnail,
        this.storeVideo
    ];
    
    this.step();
}

SyncVideo.prototype.step = function() {
    var proxy = function(f, obj) { return function() { return f.apply(obj, arguments); }};
    
    proxy(this.steps.shift(), this)();
};

SyncVideo.prototype.getVideoId = function() { 
    var self = this,
        output = '';
        
    var args = [
        '-o', '%(id)s',
        '--get-filename',
        self.url
    ];
    
    var getId = spawnChildProcess(__dirname + '/../youtube-dl/youtube-dl', args);
    
    getId.stdout.on('data', function(chunk) { output+= chunk+''; });
    
    getId.on('exit', function getIdComplete() {
        self.videoId = output.replace(/\n/,'');
        
        self.step();
    });
};

SyncVideo.prototype.getVideoMetadata = function() {
    var self = this;
    
    httpGet({
        host: 'gdata.youtube.com',
        path: '/feeds/api/videos/' + self.videoId + '?v=2&alt=jsonc',
        port: 80,
    },
    
    function videoMetadataResponse(r) {
        var meta = '';
        
        r.on('data', function(chunk) { meta+= chunk });
        
        r.on('end', function storeVideoMetadata() { 
            var key = 'meta/' + self.videoId + '.json';
            
            self.storage().put(key, JSON.parse(meta), {acl: 'public-read'}).
            
            success(function() {                 
                return self.step();
            }).
            
            failure(function() { 
                console.log('FAILED TO STORE METADATA');
            })
        })
    });
}

SyncVideo.prototype.downloadVideo = function() {
    var self = this,
        output = '';
        
    var args = [
        '-f', '22',
        '-o', '%(stitle)s-%(id)s.%(ext)s',
        self.url
    ];
    
    var sync = spawnChildProcess(__dirname + '/../youtube-dl/youtube-dl', args);
    
    sync.stdout.on('data', function downloadingCbk(chunk) { 
        output += chunk+'';
        console.log(chunk+'');
    });
    
    sync.stderr.on('data', function(err) { 
        console.log(err+'');
    });
    
    sync.on('exit', function downloadingComplete() {        
        output.split('\n').forEach(function checkLine(line) {
            if (/\[download\] Destination: /gim.test(line) == false) return;
            
            self.filename = line.slice(24);            
        });
                
        if (!self.filename) return console.log("NO VIDEO FOUND");
        
        self.step();
    });
}

SyncVideo.prototype.filepath = function() {
    return this.tmpdir + '/' + this.filename;
};

SyncVideo.prototype.makeThumbnail = function() {    
    var self = this;
    
    var args = [
        '-ss', 2, // screenshot seconds offset
        '-i', this.filepath(),
        '-vcodec', 'mjpeg',
        '-vframes', 1,
        '-an',
        '-f', 'image2',
        '-s', '274x154',
        this.filepath() + '_thumbnail.jpg'
    ];

    var ffmpeg = spawnChildProcess('ffmpeg', args);

    ffmpeg.on('exit', function() {
        self.storeThumbnail();
    });
};

SyncVideo.prototype.storeThumbnail = function() {
    var self = this,
        storage = this.storage,
        thumb = createReadStream(this.filepath() + '_thumbnail.jpg');
        
    self.storageSettings.headers = {'Content-Type': 'image/jpeg'};

    storage().put('thumbs/' + self.filename + '_thumb.jpg', thumb, self.storageSettings).
    
    success(function storeThumbnailSuccess() {
        unlinkFile(self.filepath() + '_thumbnail.jpg', function thumbUnlinked() {
            self.storeVideo();
        });
    });
};
  
SyncVideo.prototype.storeVideo = function() { 
    var self = this,
        video = createReadStream(this.filepath());
        
    this.storageSettings.headers = {'Content-Type': 'video/mp4'};
    this.storageSettings.meta = {videoId: self.videoId};
        
    self.storage().put('videos/' + self.filename, video, this.storageSettings).
    
    success(function storageResponse() {
        unlinkFile(self.filepath(), function videoUnlinked() {
            console.log(self.filename + ' successfully synced');
        });
    });
};

exports.SyncVideo = SyncVideo;