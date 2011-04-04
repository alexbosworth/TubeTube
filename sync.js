var readFileSync = require('fs').readFileSync,
    KEYS = require('./config/keys'),
    S3 = require('./Node-S3/amazon-s3').S3;

function storage() {
    return new S3(KEYS.AWS_KEY, KEYS.AWS_PASS, 
        {acl: 'public-read', defaultBucket: KEYS.S3_BUCKET });
};

console.log(__dirname + '/' + process.argv[2])

var buffer = readFileSync(__dirname + '/' + process.argv[2]);

storage().put('test', {binaryBuffer: buffer})