import React from 'react';
import { Card, CardContent, CardHeader, Typography, useTheme } from '@mui/material';

const ServiceCard = ({ name, price, duration, details }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[3],
        borderRadius: 2,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: theme.shadows[6],
        },
      }}
    >
      <CardHeader
        title={name}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'white',
        }}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          padding: 2,
        }}
      />
      <CardContent sx={{ flex: 1, textAlign: 'center', padding: 2 }}>
        <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.secondary }}>
          <strong>Starting @ </strong>${price}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
          <strong>Duration:</strong> {duration}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {details}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
