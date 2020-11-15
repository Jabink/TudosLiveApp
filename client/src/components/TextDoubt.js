import { Box, IconButton, Tooltip } from "@material-ui/core";
import React, { useState } from "react";
import { BsFillReplyFill } from "react-icons/bs";
import { v4 as uuid } from "uuid";


export default function TextDoubt({ user, replyMsg }) {
  const borderColor = "#3a3a3a";
  const border = `0.1em solid ${borderColor}`;
  const smallFont = `0.7em`;

  const [reply, setreply] = useState("");
  const replyForMsg = (e) => {
    e.preventDefault();
    replyMsg({id:uuid(),userID:user.userID,msg: reply,msgID:user.id});
    setreply("");
  };
  const handleReplyTextChange = (e) => setreply(e.target.value);

  return (
    <Box
      border={border}
      margin="4px"
      borderRadius="0.25em"
      padding="8px"
      display="flex"
      flexDirection="column"
    >
      <span style={{ fontSize: smallFont }}>{user.qn}</span>
      <form onSubmit={replyForMsg}>
        <input
          type="text"
          required
          onChange={handleReplyTextChange}
          value={reply}
        />
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <span style={{ flexGrow: "1", fontSize: smallFont }}>
            {user.name}
          </span>

          <button
            type="submit"
            style={{ margin: 0, border: 0, background: "none" }}
          >
            <Tooltip title="Reply">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
              >
                <BsFillReplyFill color="white" size="16px" />
              </IconButton>
            </Tooltip>
          </button>
        </Box>
      </form>
    </Box>
  );
}
