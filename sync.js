var KEYS = require('./config/keys'),
    storage = require('./Node-S3/aws-s3').init(KEYS.AWS_KEY, KEYS.AWS_PASS, KEYS.S3_BUCKET),
    SyncVideo = require('./lib/syncVideo').SyncVideo,
    FindVideos = require('./lib/findVideos').FindVideos;
  
new FindVideos(process.argv[2], __dirname, function foundVideos(vids) {
    vids.forEach(function(vid) {
        new SyncVideo(storage, vid)
    });
})
