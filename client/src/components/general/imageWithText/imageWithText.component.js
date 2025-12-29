import React from 'react';
import { Container, Box, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const ImageWithText = ({ imageSrc, imageAlt, title, content = [], buttonText, buttonLink }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Mobile breakpoint

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 6,
        px: 3,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row', // Stack for mobile, row for desktop
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'transparent',
      }}
    >
      {/* Image Section */}
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          flex: '1 1 auto',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={imageAlt}
          sx={{
            width: isMobile ? '80%' : '100%',
            maxWidth: '400px',
            mx: isMobile ? 'auto' : 'inherit', // Center image on mobile
            borderRadius: 2,
            boxShadow: 3,
          }}
        />
      </motion.div>

      {/* Text Section */}
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{ flex: '1 1 auto' }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          {title}
        </Typography>

        {content.map((paragraph, index) => (
          <Typography
            key={index}
            variant="body1"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              color: theme.palette.text.secondary,
              textAlign: isMobile ? 'center' : 'left',
            }}
          >
            {paragraph}
          </Typography>
        ))}

        {buttonText && buttonLink && (
          <Box
            sx={{
              textAlign: isMobile ? 'center' : 'left',
              mt: 4,
            }}
          >
            <Button
              href={buttonLink}
              variant="contained"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {buttonText}
            </Button>
          </Box>
        )}
      </motion.div>
    </Container>
  );
};

export default ImageWithText;
