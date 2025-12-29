// src/components/hero/hero.component.js
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

const Hero = ({ title, backgroundImage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if the screen size is small

  return (
    <Box
      sx={{
        position: 'relative',
        height: isMobile ? '300px' : '500px', // Adjust height for mobile
        background: `
          linear-gradient(
            rgba(0, 0, 0, 0.5), 
            rgba(0, 0, 0, 0.5)
          ),
          url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: isMobile ? 'left' : 'center', // Align image left for mobile
        display: 'flex',
        justifyContent: isMobile ? 'flex-start' : 'center', // Align text based on screen size
        alignItems: 'center',
        backgroundColor: theme.palette.background.default,
        paddingLeft: isMobile ? '20px' : 0, // Add padding for left alignment on mobile
      }}
    >
      <Typography
        variant={isMobile ? 'h4' : 'h2'} // Smaller font size for mobile
        sx={{
          color: 'white',
          textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
          textAlign: isMobile ? 'left' : 'center', // Align text based on screen size
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default Hero;
