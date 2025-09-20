import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Image from 'next/image';
import Logo from "../../public/logo.png"

export default function ButtonAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" sx={{ bgcolor: '#0A1C29', color: '#F2F2F2', top: 0 }}>
        <Toolbar>
          <Image src={Logo} alt="Logo" width={30} height={30} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
            Junction Boxers
          </Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}