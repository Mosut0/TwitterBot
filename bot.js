//Constants
const fs = require('fs'),
      Promise = require('bluebird'),
      { auth } = require('./config.js'),
      Twit = require( 'twit' ),
      path = require('path'),
      config = require( path.join( __dirname, 'config2.js' ) ),
      T = new Twit( config ),
      client = auth(),
      directory = "", //Set your own directory
      itemBank = [];

//Video Upload Processes

//Initialize (Make room in backend)
const initMediaUpload = (client, pathToFile) => {
    const mediaType = "video/mp4";
    const mediaSize = fs.statSync(pathToFile).size;
    return new Promise((resolve, reject) => {
        client.post("media/upload", {
            command: "INIT",
            total_bytes: mediaSize,
            media_type: mediaType
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(data.media_id_string);
                console.log("Initiation successful");
            }
        })
    })
}

//Append (Upload to backend)
const appendMedia = (client, mediaId, pathToFile) => {
    const mediaData = fs.readFileSync(pathToFile)
    return new Promise((resolve, reject) => {
        client.post("media/upload", {
            command: "APPEND",
            media_id: mediaId,
            media: mediaData,
            segment_index: 0
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(mediaId)
                console.log("Append successful");
            }
        })
    })
}

//Finalize (Check if uploaded successfully)
const finalizeMediaUpload = (client, mediaId) => {
    return new Promise((resolve, reject) =>  {
        client.post("media/upload", {
            command: "FINALIZE",
            media_id: mediaId
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(mediaId)
                console.log("Finalization successful");
            }
        })
    })
}

//Upload medias
const uploadVideo = (client, mediaFilePath) => {

    initMediaUpload(client, mediaFilePath)
        .then((mediaId) => appendMedia(client, mediaId, mediaFilePath))
        .then((mediaId) => finalizeMediaUpload(client, mediaId))
        .then((mediaId) => {
            let tweet = {
                media_ids: mediaId
            }
            client.post('statuses/update', tweet,(error, response) => {

                //if we get an error print it out
                if (error) {
                    console.log(error);
                }
                console.log("Tweeted!");
            });
        })
}

function uploadImage(mediaPathFile){
    const imagePath = mediaPathFile;
        b64content = fs.readFileSync( imagePath, { encoding: 'base64' } );
  
    T.post( 'media/upload', { media_data: b64content }, function ( err, data, response ) {
        if ( err ){
        console.log( 'error:', err );
        }
        else{
        const image = data;
        console.log( 'Image Uploaded' );

        T.post( 'media/metadata/create', {
            media_id: image.media_id_string,
            alt_text: {
            text: 'Describe the image'
            }            
        }, function( err, data, response ){

            T.post( 'statuses/update', {
            media_ids: [image.media_id_string]
            },
            function( err, data, response) {
                if (err){
                console.log( 'error:', err );
                }
                else{
                }
            }
            );
        } );
        }
    });
}

function randomFromArray( array ) {
    return array[ Math.floor( Math.random() * array.length ) ];
}

//Load medias onto array from directory
const initializeMedias = () => {
    fs.readdirSync(directory).forEach(file => {
        itemBank.push(file);
    });
    console.log("Original bank size: " + itemBank.length);
}

function deleteItemFromMedia(item){
    let index = itemBank.indexOf(item);
    console.log(index)

    itemBank.splice(index, 1);

    console.log("Deleted: " + item);
    console.log("Updated bank size: " + itemBank.length);
}

function tweetMedia(){
    if(itemBank.length == 0){
        throw new Error("No more media to tweet");
    }    
    const item = randomFromArray(itemBank);
    let type = item.slice(item.length-3, item.length);

    if(type.toLowerCase() == "mp4"){
        uploadVideo(client, path.resolve(__dirname, directory + item));
    }else{
        uploadImage(path.resolve(__dirname, directory + item));
    }

    console.log("Tweeted: " + item);
    deleteItemFromMedia(item);
}

module.exports = { auth, uploadVideo, tweetMedia }; 

initializeMedias();
tweetMedia();
//Repeats every 24h
setInterval(tweetMedia, 1000*60*60*24); //Set your own interval time



