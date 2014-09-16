/**
 * @fileoverview JavaScript for a simple image processor, for the purpose of autograding
 * @author Zuhair AlSader 
 */

/**
 * Image processing for the autograder
 * @type object
 */
var ImageProcess = {};

/**
 * gets the image data from an external image
 */
ImageProcess.getImageData = function(imageSrc) {
    var ctx = document.createElement("canvas").getContext("2d");
    var img = document.createElement("img");
    img.src = imageSrc;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
};

/**
 * compares the data for two images.
 * @param {ImageData} imageData1
 * @param {ImageData} imageData2
 * @returns {ImageProcess.compare.ret} an object containing some information about the image
 */
ImageProcess.compareData = function(imageData1, imageData2) {
    var x, y, i1, i2, idiff;
    var width = imageData1.width < imageData2.width ? imageData1.width : imageData2.width;
    var height = imageData1.height < imageData2.height ? imageData1.height : imageData2.height;

    var ctxDiff = document.createElement('canvas').getContext('2d');//needs resolving
    var diffImageData = ctxDiff.createImageData(width, height);

    var ret = {};
    //counter for similar non-transparent pixels, AND
    ret.similarAlpha = 0;
    //counter for similar color pixels, AND
    ret.similarColor = 0;
    //counter for non-transparent pixels in either photo, OR
    ret.common = 0;

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            i1 = 4 * (x + y * imageData1.width);
            i2 = 4 * (x + y * imageData2.width);
            idiff = 4 * (x + y * diffImageData.width);
            if (imageData1.data[i1 + 3] !== 0 || imageData2.data[i2 + 3] !== 0) {
                ret.common++;
                for (var c = 0; c < 4; c++)
                    diffImageData[idiff + c] = (imageData1.data[i1 + c] + imageData2.data[i2 + c]) / 2;
            }
            if (imageData1.data[i1 + 3] !== 0 && imageData2.data[i2 + 3] !== 0) {
                ret.similarAlpha++;
                var diff = 0;
                for (var c = 0; c < 3; c++)
                    diff += Math.abs(imageData1.data[i1 + c] - imageData2.data[i2 + c]);
                if (diff < 30) {
                    ret.similarColor++;
                    for (var c = 0; c < 3; c++)
                        diffImageData[idiff + c] = (imageData1.data[i1 + c] + imageData2.data[i2 + c]) / 2;
                    diffImageData[idiff + 3] = 255;
                }
                else {
                    for (var c = 0; c < 3; c++)
                        diffImageData[idiff + c] = (imageData1.data[i1 + c] + imageData2.data[i2 + c])*(ImageProcess.differenceColor[c]/255) / 4 + ImageProcess.differenceColor[c] / 2;
                    diffImageData[idiff + 3] = ImageProcess.differenceColor[3];
                }
            }
        }
    }
    ctxDiff.canvas.width = width;
    ctxDiff.canvas.height = height;
    ctxDiff.putImageData(diffImageData, 0, 0);
    ret.diffImageSrc = ctxDiff.canvas.toDataURL();

    /**
     * returns the percent of the difference between images.
     * @param {boolean} color whether to consider color differences or not.
     */
    ret.percentSimilar = function(color) {
        if (color)
            return ret.similarColor / ret.common;
        else
            return ret.similarAlpha / ret.common;
    };

    return ret;
};

ImageProcess.compareDataTrimmed = function(imageData1, imageData2){
    var timageData1 = ImageProcess.trim(imageData1);
    var timageData2 = ImageProcess.trim(imageData2);
    return ImageProcess.compareData(timageData1, timageData2);
};

ImageProcess.trim = function(pixels) {
    var ctx = document.createElement('canvas').getContext('2d');
    ctx.putImageData(data);
    var i, x, y;
    var bound = {
        top: null,
        left: null,
        right: null,
        bottom: null
    };
    
    for (i = 0; i < pixels.data.length; i += 4) {
        if (pixels.data[i + 3] !== 0) {
            x = (i / 4) % pixels.width;
            y = ~~((i / 4) / pixels.width);

            if (bound.top === null) {
                bound.top = y;
            }

            if (bound.left === null) {
                bound.left = x;
            } else if (x < bound.left) {
                bound.left = x;
            }

            if (bound.right === null) {
                bound.right = x;
            } else if (bound.right < x) {
                bound.right = x;
            }

            if (bound.bottom === null) {
                bound.bottom = y;
            } else if (bound.bottom < y) {
                bound.bottom = y;
            }
        }
    }

    var trimHeight = bound.bottom - bound.top,
            trimWidth = bound.right - bound.left,
            trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);
    // open new window with trimmed image:
    return trimmed;
};

ImageProcess.differenceColor = [255, 0, 255 , 255];