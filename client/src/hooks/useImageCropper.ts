import { useState, useCallback } from 'react';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseImageCropperReturn {
  croppedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  cropImage: (imageFile: File, cropArea: CropArea) => Promise<string>;
  reset: () => void;
}

export const useImageCropper = (): UseImageCropperReturn => {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    fileName: string = 'cropped.jpg'
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to cropped area size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        resolve(croppedImageUrl);
      }, 'image/jpeg', 0.95);
    });
  };

  const cropImage = useCallback(async (imageFile: File, cropArea: CropArea): Promise<string> => {
    try {
      setIsProcessing(true);
      setError(null);

      const imageDataUrl = URL.createObjectURL(imageFile);
      const croppedImageUrl = await getCroppedImg(imageDataUrl, cropArea, imageFile.name);
      
      setCroppedImage(croppedImageUrl);
      URL.revokeObjectURL(imageDataUrl); // Clean up
      
      return croppedImageUrl;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to crop image';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (croppedImage) {
      URL.revokeObjectURL(croppedImage);
    }
    setCroppedImage(null);
    setError(null);
    setIsProcessing(false);
  }, [croppedImage]);

  return {
    croppedImage,
    isProcessing,
    error,
    cropImage,
    reset,
  };
};

export default useImageCropper;