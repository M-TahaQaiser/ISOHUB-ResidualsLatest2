import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const FeatureCard = ({ title, description, icon, moreInfo }) => {
  const theme = useTheme();

  return (
    <motion.div
      whileHover={{ rotateY: 180 }}
      style={{
        width: '250px',
        height: '350px',
        perspective: '1000px',
        margin: '20px',
        position: 'relative',
      }}
    >
      {/* Front Side */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderRadius: 2,
          boxShadow: 4,
        }}
      >
        <Box sx={{ fontSize: '3rem', mb: 2 }}>{icon}</Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            px: 2,
            textAlign: 'center',
            color: theme.palette.primary.contrastText,
          }}
        >
          {description}
        </Typography>
      </Box>

      {/* Back Side */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: 2,
          boxShadow: 4,
          padding: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          More Info
        </Typography>
        <Typography
          variant="body2"
          sx={{ textAlign: 'center', px: 2 }}
        >
          {moreInfo}
        </Typography>
      </Box>
    </motion.div>
  );
};

const FeatureCardsGrid = ({ features }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
      }}
    >
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          moreInfo={feature.moreInfo}
        />
      ))}
    </Box>
  );
};

export default FeatureCardsGrid;
