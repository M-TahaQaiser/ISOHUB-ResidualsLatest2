// src/components/aftercare/SectionHeader/SectionHeader.component.js
import React from 'react';
import { Typography } from '@mui/material';

const SectionHeader = ({ title }) => (
  <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
    {title}
  </Typography>
);

export default SectionHeader;
