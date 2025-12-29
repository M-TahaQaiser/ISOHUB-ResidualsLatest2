import React from 'react';
import { Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const MediaSection = ({ 
    mediaSrc, 
    mediaAlt, 
    mediaType = 'image', // Supports 'image' or 'video'
    sectionTitle = '', 
    content = [] 
}) => {
    return (
        <Container
            maxWidth="lg"
            sx={{
                padding: '60px 0',
                backgroundColor: 'transparent',
                borderRadius: 0,
                boxShadow: 'none',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '40px',
                    alignItems: 'center',
                }}
            >
                {/* Media Section */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    {mediaType === 'image' && (
                        <img 
                            src={mediaSrc} 
                            alt={mediaAlt} 
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                borderRadius: '8px',
                                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
                            }} 
                        />
                    )}
                    {mediaType === 'video' && (
                        <video
                            src={mediaSrc}
                            alt={mediaAlt}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                borderRadius: '8px',
                                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
                            }}
                            controls
                        />
                    )}
                </div>

                {/* Text Section */}
                <div style={{ flex: 2 }}>
                    {sectionTitle && (
                        <Typography 
                            variant="h4" 
                            sx={{ fontWeight: 'bold', marginBottom: '20px' }}
                        >
                            {sectionTitle}
                        </Typography>
                    )}
                    {content.map((paragraph, index) => (
                        <Typography 
                            key={index} 
                            variant="body1" 
                            sx={{
                                marginBottom: '15px',
                                lineHeight: 1.6,
                                color: 'text.secondary',
                            }}
                        >
                            {paragraph}
                        </Typography>
                    ))}
                </div>
            </motion.div>
        </Container>
    );
};

export default MediaSection;
