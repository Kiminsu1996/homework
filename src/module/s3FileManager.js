const { s3, DeleteObjectCommand, PutObjectCommand } = require('../config/awsConfig');

async function uploadFile(file) {
    const key = `${Date.now()}_${file.originalname}`;
    const params = {
        Bucket: 'kiminsu1996',  
        Key: key,  
        Body: file.buffer  
    };
    await s3.send(new PutObjectCommand(params));
    return `https://kiminsu1996.s3.ap-northeast-2.amazonaws.com/${key}`;
}

async function deleteFile(url) {
    const key = url.split('/').pop();
    const deleteParams = {
        Bucket: 'kiminsu1996',
        Key: key
    };
    await s3.send(new DeleteObjectCommand(deleteParams));
}

module.exports = {
    uploadFile,
    deleteFile
};