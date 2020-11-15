import { Box, IconButton, Tooltip } from "@material-ui/core";
import React, { useState } from "react";
import { MdFilterList } from "react-icons/md";
import "../css/Faculity.css";
import AudioDoubt from "./AudioDoubt";
import TextDoubt from "./TextDoubt";

export default function FaculitySideBar({
  viewType,
  qns,
  unMuteUser,
  replyMsg,
  localVideoRef
}) {

  const borderColor = "#3a3a3a";
  const border = `0.1em solid ${borderColor}`;

  const [filterType, setFilterType] = useState(1); ///all,,audio,text
  const totalNoOfFilters = 3;

  ////styles
  const videoHeight = "180px";
  const halfVideo = {
    left: "0",
    transition: "all 0.5s",
    position: "absolute",
    zIndex: 4,
    height: videoHeight,
    width: "20%",
    objectFit: "cover",
  };
  const fullVideo = {
    left: "20%",
    transition: "all 0.5s",
    position: "absolute",
    zIndex: 4,
    maxHeight: "90vh",
    width: "80%",
    objectFit: "cover",
  };
  const hideVideo = {
    left: "-20%",
    transition: "all 0.5s",
    position: "absolute",
    zIndex: 4,
    height: videoHeight,
    width: "20%",
    objectFit: "cover",
  };

  function getVideoStyle() {
    if (viewType === 1) {
      return fullVideo;
    } else if (viewType === 2) {
      return halfVideo;
    }
    return hideVideo;
  }

  const halfChat = { transition: "all 0.5s", left: 0, paddingTop: videoHeight };
  const fullChat = { transition: "all 0.5s", left: 0, paddingTop: 0 };
  const hideChat = {
    transition: "all 0.5s",
    left: "-20%",
    paddingTop: videoHeight,
  };

  function getChatStyle() {
    if (viewType === 1) {
      return fullChat;
    } else if (viewType === 2) {
      return halfChat;
    }
    return hideChat;
  }
  const filterDoubts = () => {
    const typeNo = filterType + 1;
    typeNo > totalNoOfFilters ? setFilterType(1) : setFilterType(typeNo);
  };

  //////////////////////////////////////////////////////////////// WIDGET //////////////////////////////////
  return (
    <Box>
      <video autoPlay muted ref={localVideoRef} style={getVideoStyle()}></video>

      <Box
        bgcolor="rgb(25 25 25)"
        position="absolute"
        width="20%"
        zIndex="3"
        height="90vh"
        color="white"
        display="flex"
        flexDirection="column"
        className="faculitySidebar"
        style={getChatStyle()}
      >
        {/* doubts loop */}
        <Box flexGrow="1" style={{ overflowY: "scroll" }}>
          {qns.map((item) => {
            return item.isQnTypeAudio
              ? filterType !== 2 && <AudioDoubt user={item} key={item.id} unMuteUser={unMuteUser}/>
              : filterType !== 3 && <TextDoubt user={item} key={item.id} replyMsg={replyMsg}/>;
          })}
        </Box>

        {/* pending questions */}

        {qns.length !== 0 ? (
          <Box
            borderBottom={border}
            borderTop={border}
            padding="8px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <span style={{ fontSize: "0.7em" }}>
              {qns.length} questions pending
            </span>
            <Tooltip title="Filter List">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={filterDoubts}
              >
                <MdFilterList color="white" size="16px" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          ""
        )}
        {/* pending questions */}
      </Box>
    </Box>
  );
}
