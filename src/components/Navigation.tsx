import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { loginUrl } from "../app/utils/miscellaneous";

export default function ButtonAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="sticky"
        sx={{ bgcolor: "#0A1C29", color: "#F2F2F2", top: 0 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
            Junction Sentinel
          </Typography>
          <Button component="a" color="inherit" href={loginUrl}>
            Login
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
