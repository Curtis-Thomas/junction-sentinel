"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import landingBg from "../../public/landing_page_background.jpg";
import { loginUrl } from "../app/utils/miscellaneous";

export default function HeroSection() {
  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${landingBg.src})`, // replace with your bg
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
        textAlign: "center",
        overflow: "hidden",
        p: -6,
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", // opacity 50%
          zIndex: 1,
        }}
      />

      {/* Content */}
      <Container sx={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <Typography variant="h2" fontWeight="bold" gutterBottom>
          Junction Sentinel
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ opacity: 0.8 }}>
          The Vigilant Guardian of Your Drone Fleet Data.
        </Typography>
        <Typography
          variant="body1"
          sx={{ maxWidth: "650px", mx: "auto", mb: 3, opacity: 0.8 }}
        >
          Absolute Data Integrity. Zero Information Leakage. Uncompromised
          Mission Readiness.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="contained"
            color="inherit"
            href={loginUrl}
            sx={{
              fontWeight: "bold",
              px: 3,
              borderRadius: 2,
              bgcolor: "#C59D5F",
              color: "black",
            }}
          >
            Secure Your Data Now
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{
              fontWeight: "bold",
              px: 3,
              borderRadius: 2,
              borderColor: "#fff",
              color: "#fff",
            }}
          >
            Watch Demo
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
