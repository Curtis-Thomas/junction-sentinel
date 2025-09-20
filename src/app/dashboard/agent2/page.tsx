"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function Agent1Page() {
  const [search, setSearch] = useState<string>("");
  const handleSearch = () => {
    console.log(search);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Agent 2
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <TextField
            id="outlined-basic"
            fullWidth
            label="Input your data"
            variant="outlined"
            sx={{ width: "100%", fontSize: "18px" }}
            name="search"
            onChange={(e) => setSearch(e.target.value)}
            required
          />
          <Button
            variant="outlined"
            type="submit"
            sx={{
              width: "100%",
              height: "100%",
              fontSize: "15px",
              py: 1,
              fontWeight: 600,
            }}
            fullWidth
          >
            Search
          </Button>
        </form>
      </Box>
      <Typography variant="body1" sx={{ marginBottom: 2, fontSize: "19px" }}>
        Output:
      </Typography>
    </Box>
  );
}
