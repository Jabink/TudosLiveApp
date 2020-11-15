import {
  Box,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@material-ui/core";
import React, { useState } from "react";
import { CgScreenMirror } from "react-icons/cg";
import { RiLiveLine, RiLiveFill } from "react-icons/ri";
import { HiOutlineViewBoards } from "react-icons/hi";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import { FiMicOff, FiUsers, FiVideoOff } from "react-icons/fi";
import { BsFillCameraVideoFill, BsFillMicFill } from "react-icons/bs";

export default function FacultyBottomToolbar({
  toggleLive,
  switchView,
  toggleParticipantsPopup,
  setImage,
  viewType,
  handleMediaChange,
  audio,
  video,
  shareScreen
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [live, setlive] = useState(false);

  ////////////////////menu items
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLiveChange = () => {
    if (window.confirm(
        !live
          ? "Would you like to start live class?"
          : "Would you like to end class?"
      )
    ) {
      toggleLive(!live);
      setlive(!live);
    }
  };
  const handleImageChange=(e)=>{
    if(e.target.files.length!==0){
      const file = URL.createObjectURL(e.target.files[0])
      URL.revokeObjectURL(e.target.files[0])
      setImage(file);
      if(viewType===1) switchView();
    }
  }

  return (
    <Box
      bgcolor="rgb(25 25 25)"
      position="absolute"
      width="100%"
      height="10vh"
      color="white"
      bottom="0"
      display="flex"
      zIndex="10"
      alignItems="center"
      // justifyContent="space-between"
    >


      <Box display="flex" alignItems="center">
        {/* add item menu */}
        <div>
          <IconButton
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={handleClick}
          >
            <AiOutlineAppstoreAdd color="white" />
          </IconButton>
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <input type="file" id="image" hidden onChange={handleImageChange} onClick={(e)=>e.target.value=null}  accept="image/*"/>
              <label htmlFor="image">Import image</label>
            </MenuItem>
            {/* <MenuItem onClick={handleClose}>Open Pdf</MenuItem>
            <MenuItem onClick={handleClose}>Add interaction</MenuItem> */}
          </Menu>
        </div>

        {/* shareScreen */}
        <Tooltip title="Share screen">
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="span"
            onClick={shareScreen}
          >
            <CgScreenMirror color="white" />
          </IconButton>
        </Tooltip>
        {/* Switch views */}
        <Tooltip title="Switch views">
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="span"
            onClick={switchView}
          >
            <HiOutlineViewBoards color="white" />
          </IconButton>
        </Tooltip>

        {/* Participants */}
        <Tooltip title="Participants">
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="span"
            onClick={toggleParticipantsPopup}
          >
            <FiUsers color="white" />
          </IconButton>
        </Tooltip>
      </Box>

      <div>
          <Checkbox
            checkedIcon={<BsFillMicFill color="white" />}
            icon={<FiMicOff color="white" />}
            checked={audio}
            name="audio"
            onChange={handleMediaChange}
          />

          <Checkbox
            checkedIcon={<BsFillCameraVideoFill color="white" />}
            icon={<FiVideoOff color="white" />}
            checked={video}
            name="video"
            onChange={handleMediaChange}
          />
        </div>


      {/* go live */}
      <Tooltip title={live ? "End class" : "Start class"}>
        <Checkbox
          checked={live}
          icon={<RiLiveLine color="white" />}
          checkedIcon={<RiLiveFill color="red" />}
          onChange={handleLiveChange}
        />
      </Tooltip>

     


    </Box>
  );
}
