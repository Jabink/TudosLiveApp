import { Box, IconButton, Tooltip } from "@material-ui/core";
import React from "react";
import { FiMicOff } from "react-icons/fi";

export default function AudioDoubt({user,unMuteUser}) {
    const borderColor = "#3a3a3a";
    const border = `0.1em solid ${borderColor}`;

  return (
    <Box
      border={border}
      margin="4px"
      borderRadius="0.25em"
      padding="8px"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <span style={{ fontSize: "0.7em" }}>{user.name} asking doubt</span>

      <Tooltip title="Unmute">
        <IconButton
          color="primary"
          aria-label="upload picture"
          component="span"
          onClick={()=>unMuteUser(user.id,user.userID)}
          >
          <FiMicOff color="white" size="16px" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
