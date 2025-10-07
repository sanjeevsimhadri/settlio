import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, LoadingButton } from '../ui';
import './ImageCropper.css';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageDimensions {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  selectedImage: File | null;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  selectedImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Load image when selectedImage changes
  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageDataUrl(e.target.result as string);
          setError(null);
        }
      };
      reader.onerror = () => {
        setError('Failed to load image');
      };
      reader.readAsDataURL(selectedImage);
    }
  }, [selectedImage]);

  // Initialize crop area when image loads
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const imageRect = img.getBoundingClientRect();
      
      setImageDimensions({
        width: imageRect.width,
        height: imageRect.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });

      // Center the crop area and make it responsive to image size
      const size = Math.min(imageRect.width, imageRect.height, 300) * 0.8;
      const x = (imageRect.width - size) / 2;
      const y = (imageRect.height - size) / 2;
      
      setCropArea({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: size,
        height: size,
      });

      // Update preview
      updatePreview();
    }
  }, []);

  // Update preview canvas
  const updatePreview = useCallback(() => {
    if (!previewCanvasRef.current || !imageRef.current || !imageDimensions) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    const previewSize = 120;
    canvas.width = previewSize;
    canvas.height = previewSize;

    // Calculate scale factors
    const scaleX = imageDimensions.naturalWidth / imageDimensions.width;
    const scaleY = imageDimensions.naturalHeight / imageDimensions.height;

    // Clear canvas and create circular clip
    ctx.clearRect(0, 0, previewSize, previewSize);
    ctx.save();
    ctx.beginPath();
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw cropped image
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      previewSize,
      previewSize
    );

    ctx.restore();
  }, [cropArea, imageDimensions]);

  // Update preview when crop area changes
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking inside crop area
    if (
      x >= cropArea.x && 
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y && 
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageDimensions) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;

    // Constrain to image boundaries
    const maxX = imageDimensions.width - cropArea.width;
    const maxY = imageDimensions.height - cropArea.height;

    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    }));
  }, [isDragging, dragStart, cropArea.width, cropArea.height, imageDimensions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Handle crop size change
  const handleSizeChange = useCallback((newSize: number) => {
    if (!imageDimensions) return;

    const maxSize = Math.min(imageDimensions.width, imageDimensions.height);
    const size = Math.min(newSize, maxSize);

    setCropArea(prev => ({
      ...prev,
      width: size,
      height: size,
      x: Math.max(0, Math.min(prev.x, imageDimensions.width - size)),
      y: Math.max(0, Math.min(prev.y, imageDimensions.height - size)),
    }));
  }, [imageDimensions]);

  // Handle crop operation
  const handleCrop = async () => {
    if (!selectedImage || !canvasRef.current || !imageRef.current || !imageDimensions) return;

    setIsProcessing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;

      if (!ctx) throw new Error('No canvas context');

      // Calculate scale factors
      const scaleX = imageDimensions.naturalWidth / imageDimensions.width;
      const scaleY = imageDimensions.naturalHeight / imageDimensions.height;

      // Set output size (consistent for profile photos)
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Clear canvas and create circular clip
      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.save();
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw cropped image
      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        outputSize,
        outputSize
      );

      ctx.restore();

      // Convert to blob with high quality
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        } else {
          setError('Failed to create cropped image');
        }
      }, 'image/jpeg', 0.95);

    } catch (err: any) {
      setError(err.message || 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset crop area to center
  const handleReset = () => {
    if (!imageDimensions) return;
    
    const size = Math.min(imageDimensions.width, imageDimensions.height) * 0.8;
    const x = (imageDimensions.width - size) / 2;
    const y = (imageDimensions.height - size) / 2;
    
    setCropArea({
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: size,
      height: size,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Profile Photo"
      size="large"
    >
      <div className="advanced-image-cropper">
        {error && (
          <div className="cropper-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className="cropper-content">
          {/* Main cropping area */}
          <div className="cropper-main">
            <div className="cropper-instructions">
              <p>🎯 <strong>Position your photo</strong></p>
              <ul>
                <li>Click and drag the crop area to reposition</li>
                <li>Use the size slider to adjust the crop area</li>
                <li>The final image will be circular</li>
              </ul>
            </div>

            {imageDataUrl && (
              <div 
                ref={containerRef}
                className="cropper-image-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={imageDataUrl}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  className="cropper-image"
                  draggable={false}
                />
                
                {/* Overlay mask */}
                <div className="cropper-overlay-mask">
                  {/* Dark overlay with circular cutout */}
                  <div className="cropper-mask-layer" />
                  
                  {/* Crop area */}
                  <div
                    className={`cropper-crop-area ${isDragging ? 'dragging' : ''}`}
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                  >
                    <div className="cropper-crop-border" />
                    <div className="cropper-crop-guides">
                      <div className="guide-line guide-vertical-1" />
                      <div className="guide-line guide-vertical-2" />
                      <div className="guide-line guide-horizontal-1" />
                      <div className="guide-line guide-horizontal-2" />
                    </div>
                    
                    {/* Resize handles */}
                    <div className="cropper-resize-handles">
                      <div className="resize-handle handle-nw" />
                      <div className="resize-handle handle-ne" />
                      <div className="resize-handle handle-sw" />
                      <div className="resize-handle handle-se" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with controls and preview */}
          <div className="cropper-sidebar">
            <div className="cropper-preview-section">
              <h4>Preview</h4>
              <div className="cropper-preview-container">
                <canvas 
                  ref={previewCanvasRef}
                  className="cropper-preview-canvas"
                  width={120}
                  height={120}
                />
                <div className="preview-label">Final Result</div>
              </div>
            </div>

            {/* Controls */}
            <div className="cropper-controls">
              <div className="control-group">
                <label className="control-label">
                  <span>📏 Crop Size</span>
                  <span className="control-value">{Math.round(cropArea.width)}px</span>
                </label>
                <input
                  type="range"
                  min={imageDimensions ? 80 : 100}
                  max={imageDimensions ? Math.min(imageDimensions.width, imageDimensions.height) : 300}
                  value={cropArea.width}
                  onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                  className="control-slider"
                />
              </div>

              <div className="control-group">
                <button 
                  onClick={handleReset}
                  className="control-button reset-button"
                  disabled={isProcessing}
                >
                  🎯 Reset Position
                </button>
              </div>

              <div className="cropper-stats">
                <div className="stat-item">
                  <span className="stat-label">Position:</span>
                  <span className="stat-value">
                    {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Size:</span>
                  <span className="stat-value">
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="cropper-hidden-canvas" />

        {/* Action buttons */}
        <div className="cropper-actions">
          <LoadingButton
            variant="secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            variant="primary"
            onClick={handleCrop}
            isLoading={isProcessing}
            disabled={!selectedImage || !imageDimensions}
          >
            {isProcessing ? 'Processing...' : '✂️ Crop & Save'}
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropperModal;