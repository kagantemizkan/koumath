import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Crops a photo based on the cropping information
 * @param {string} uri - URI of the image to crop
 * @param {Object} cropInfo - Cropping information (left, top, width, height)
 * @param {number} photoWidth - Original photo width
 * @param {number} photoHeight - Original photo height
 * @param {number} screenWidth - Screen width for scaling
 * @param {number} screenHeight - Screen height for scaling
 * @returns {string} Base64 representation of the cropped image
 */
export const handleCropPicture = async (
  uri, 
  cropInfo, 
  photoWidth, 
  photoHeight, 
  screenWidth, 
  screenHeight
) => {
  try {
    const { left, top, width, height } = cropInfo;

    // Calculate crop dimensions based on photo vs screen ratio
    const cropX = left * photoWidth / screenWidth;
    const cropY = top * photoHeight / screenHeight;
    const cropWidth = width * photoWidth / screenWidth;
    const cropHeight = height * photoHeight / screenHeight;

    // Perform the crop operation
    const croppedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: cropX,
            originY: cropY,
            width: cropWidth,
            height: cropHeight,
          },
        },
      ],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
        base64: true,
      }
    );

    console.log('Cropped Photo:', croppedImage.uri);
    return croppedImage.base64;
  } catch (error) {
    console.error("Cropping failed: ", error);
    throw new Error('Failed to crop the image');
  }
};

/**
 * Validates if a file is an image
 * @param {string} uri - URI of the file to validate
 * @returns {boolean} True if the file is a valid image
 */
export const isValidImage = (uri) => {
  if (!uri) return false;
  
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const extension = uri.substring(uri.lastIndexOf('.')).toLowerCase();
  
  return validExtensions.includes(extension);
};

/**
 * Gets image dimensions while handling potential errors
 * @param {string} uri - URI of the image
 * @returns {Promise<Object>} Object containing image width and height
 */
export const getImageDimensions = async (uri) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height
      });
    };
    
    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    image.src = uri;
  });
};