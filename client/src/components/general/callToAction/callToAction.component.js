import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

const CallToAction = ({
  heading,
  description,
  buttonText,
  buttonLink,
  secondaryButtonText,
  secondaryButtonLink,
  backgroundImage,
}) => {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: backgroundImage ? 'rgba(0, 0, 0, 0.5)' : 'var(--accent-color)',
        backgroundBlendMode: backgroundImage ? 'overlay' : 'normal',
        color: '#fff',
        borderRadius: 2,
        boxShadow: 4,
        mt: 6, // Add top margin
        mb: 6, // Add bottom margin
      }}
    >
      <Container maxWidth="md">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.7)',
            }}
          >
            {heading}
          </Typography>
        </motion.div>

        {/* Description */}
        {description && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                fontSize: '1.2rem',
                maxWidth: 700,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          </motion.div>
        )}

        {/* Buttons */}
        {(buttonLink || secondaryButtonLink) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            {buttonLink && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.3 }}>
                <Button
                  href={buttonLink}
                  variant="contained"
                  sx={{
                    backgroundColor: 'var(--section-background)',
                    color: 'var(--accent-color)',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    boxShadow: 3,
                    '&:hover': {
                      backgroundColor: '#fff',
                      color: 'var(--accent-color2)',
                    },
                  }}
                >
                  {buttonText}
                </Button>
              </motion.div>
            )}
            {secondaryButtonLink && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.3 }}>
                <Button
                  href={secondaryButtonLink}
                  variant="outlined"
                  sx={{
                    borderColor: '#fff',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#fff',
                      color: 'var(--accent-color)',
                    },
                  }}
                >
                  {secondaryButtonText}
                </Button>
              </motion.div>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CallToAction;
