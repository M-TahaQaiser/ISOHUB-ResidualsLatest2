import React, { useState } from 'react';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ImageModal = ({
  open,
  onClose,
  image,
  zoomStyles,
  handleMouseMove,
  handleTouchMove,
}) => {
  const [isZoomed, setIsZoomed] = useState(false); // Track zoom state

  // Toggle zoom state on click
  const toggleZoom = () => {
    setIsZoomed((prevZoom) => !prevZoom);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setIsZoomed(false); // Reset zoom state on close
        onClose();
      }}
      maxWidth="lg"
      sx={{
        '& .MuiDialog-paper': {
          width: 'fit-content', // Modal width adapts to the image
          height: '100vh', // Modal height is full viewport height
          background: 'black',
        },
      }}
    >
      <DialogContent
        sx={{
          position: 'relative',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%', // Ensure content height fills the modal
        }}
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            setIsZoomed(false); // Reset zoom state
            onClose();
          }}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: '#fff',
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
        {image && (
          <Box
            sx={{
              position: 'relative',
              cursor: isZoomed ? 'zoom-out' : 'zoom-in',
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              style={{
                height: '100vh', // Image height fills the viewport
                width: 'auto', // Maintain aspect ratio
                objectFit: 'contain',
                transition: 'transform 0.2s ease',
                ...(isZoomed ? zoomStyles : { transform: 'scale(1)' }), // Apply zoom styles or reset
              }}
              onClick={toggleZoom} // Toggle zoom on click
              onMouseMove={isZoomed ? handleMouseMove : null} // Enable mouse tracking if zoomed
              onTouchMove={isZoomed ? handleTouchMove : null} // Enable touch tracking if zoomed
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
