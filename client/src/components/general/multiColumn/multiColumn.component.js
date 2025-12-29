import React from 'react';
import { Link } from 'react-router-dom';
import Grid from '@mui/material/Grid2';
import { Box, Typography, Button, Container, useTheme } from '@mui/material';

const MultiColumn = ({ cards }) => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid
        container
        spacing={6}
        justifyContent="center" // Center the entire grid
        alignItems="stretch" // Ensure cards align evenly
      >
        {cards.map((card, index) => (
          <Grid
            key={index}
            item
            xs={12}
            sm={6}
            md={4}
            display="flex"
            justifyContent="center" // Center each grid item horizontally
          >
            <Box
              sx={{
                width: '100%', // Ensure box fills its grid
                maxWidth: 300, // Constrain max size
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: 4,
                backgroundColor: card.backgroundImage
                  ? `url(${card.backgroundImage})`
                  : theme.palette.background.paper,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 2,
                boxShadow: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 10,
                },
              }}
            >
              {/* Icon Section */}
              {card.icon && (
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 30,
                    mb: 2,
                  }}
                >
                  {card.icon}
                </Box>
              )}

              {/* Title */}
              {card.title && (
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {card.title}
                </Typography>
              )}

              {/* Description */}
              {card.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    mb: 3, // Margin below description
                  }}
                >
                  {card.description}
                </Typography>
              )}

              {/* Button Link */}
              {card.link && (
                <Button
                  component={Link}
                  to={card.link}
                  variant="contained"
                  color="primary"
                >
                  {card.buttonText || 'Learn More'}
                </Button>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MultiColumn;
