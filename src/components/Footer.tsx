import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: '#8F3DD0',
                height: '80px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                mt: 'auto', // Pushes to bottom if inside a flex container
            }}
        >
            <Container maxWidth="lg">
                <Typography
                    variant="body1"
                    sx={{
                        fontSize: '14px',
                        textAlign: 'center',
                        color: 'white',
                    }}
                >
                    Built differently. This site was vibe coded. Explore more of my work at{' '}
                    <Link
                        href="https://www.dannyvigil.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: 'white',
                            textDecoration: 'underline',
                            '&:hover': {
                                color: '#E8DEF8', // Secondary main for hover contrast
                            },
                        }}
                    >
                        DannyVigil.com
                    </Link>
                    .
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
