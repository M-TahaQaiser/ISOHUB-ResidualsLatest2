import React from 'react';
import { Container, Box, Typography, useTheme } from '@mui/material';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const CarouselWithBG = ({
  items,
  title = "Carousel",
  renderItem,
  backgroundImage,
  settingsOverride = {},
}) => {
  const theme = useTheme();

  const defaultSettings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    ...settingsOverride, // Allow overriding settings via prop
  };

  return (
    <Box
      sx={{
        py: 6,
        backgroundColor: theme.palette.background.default,
        borderRadius: 2,
        position: 'relative',
        height: '500px',
        background: backgroundImage
          ? `
            linear-gradient(
              rgba(0, 0, 0, 0.5), 
              rgba(0, 0, 0, 0.5)
            ),
            url(${backgroundImage})`
          : theme.palette.background.default,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        {title && (
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              color: 'white',
            }}
          >
            {title}
          </Typography>
        )}
        <Slider {...defaultSettings}>
          {items.map((item, index) => (
            <Box
              key={index}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                color: 'white',
              }}
            >
              {renderItem ? renderItem(item) : <Typography>{item}</Typography>}
            </Box>
          ))}
        </Slider>
      </Container>
    </Box>
  );
};

export default CarouselWithBG;
