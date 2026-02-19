import React from 'react';
import { Card, CardMedia, Typography } from '@mui/material';

const VideoStream = () => {
  return (
    <Card>
      <Typography variant="h5" component="div" sx={{ p: 2 }}>
        Live Video Stream
      </Typography>
      <CardMedia
        component="img"
        image="http://localhost:8000/stream"
        alt="Live video stream"
      />
    </Card>
  );
};

export default VideoStream;
