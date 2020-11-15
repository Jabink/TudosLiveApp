import { Box, IconButton, Tooltip } from "@material-ui/core";
import React, { useEffect, useRef } from "react";
import { BiEraser ,BiPen} from "react-icons/bi";
import { MdClear } from "react-icons/md"; 
import "../css/WhiteBoard.css";

export default function WhiteBoard() {
  const canvas = useRef();
  const ctx = useRef();

  var flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;

  var inkColor = "black",penWidth = 2;

  ////////////////////////////////////INITIAL FUNCTIONS////////////////////////////////////////////////////
  useEffect(() => {
    canvas.current.width = window.innerWidth;
    canvas.current.height = window.innerHeight;
    ctx.current = canvas.current.getContext("2d");
    canvas.current.addEventListener("mousemove",(e) => findxy("move", e),false);
    canvas.current.addEventListener("mousedown",(e) => findxy("down", e),false);
    canvas.current.addEventListener("mouseup", (e) => findxy("up", e), false);
    canvas.current.addEventListener("mouseout", (e) => findxy("out", e), false);
  }, []);
  function findxy(res, e) {
    if (res === "down") {
      prevX = currX;
      prevY = currY;
      currX = e.clientX - canvas.current.offsetLeft;
      currY = e.clientY - canvas.current.offsetTop;

      flag = true;
      dot_flag = true;
      if (dot_flag) {
        ctx.current.beginPath();
        ctx.current.fillStyle = inkColor;
        ctx.current.fillRect(currX, currY, 2, 2);
        ctx.current.closePath();
        dot_flag = false;
      }
    } else if (res === "move") {
      if (flag) {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.current.offsetLeft;
        currY = e.clientY - canvas.current.offsetTop;
        draw();
      }
    } else if (res === "up" || res === "out") {
      flag = false;
    }
  }

  function draw() {
    ctx.current.beginPath();
    ctx.current.moveTo(prevX, prevY);
    ctx.current.lineTo(currX, currY);
    ctx.current.strokeStyle = inkColor;
    ctx.current.lineWidth = penWidth;
    ctx.current.stroke();
    ctx.current.closePath();
  }

  ////////////////////////////////////WIDGET FUNCTIONS/////////////////////////////////////////////////////
  const erase=()=> {ctx.current.clearRect(0, 0, canvas.current.width, canvas.current.height)}

  const color=(color) =>{
    switch (color) {
        case "green":
          inkColor = "green";
            break;
        case "blue":
          inkColor = "blue";
            break;
        case "red":
          inkColor = "red";
            break;
        case "yellow":
          inkColor = "yellow";
            break;
        case "orange":
          inkColor = "orange";
            break;
        case "black":
          inkColor = "black";
            break;
        case "white":
          inkColor = "white";
            break;
    }
    if (inkColor == "white") penWidth = 14;
    else penWidth = 2;
}

  ///////////////////////////////////////////WIDGET///////////////////////////////////////////////
  return (
    <Box
      className="WhiteBoard"
      width="100%"
      height="100%"
      bgcolor="white"
      position="absolute">

       <Box  position="absolute" right="0">
       <input type="color"/>
       <Tooltip title="Pen"><IconButton color="primary" aria-label="upload picture" component="span"  onClick={()=>color("black")}><BiPen/></IconButton></Tooltip>
       <Tooltip title="Eraser"><IconButton color="primary" aria-label="upload picture" component="span"  onClick={()=>color("white")}><BiEraser/></IconButton></Tooltip>
       <Tooltip title="Clear"><IconButton color="primary" aria-label="upload picture" component="span"  onClick={erase}><MdClear/></IconButton></Tooltip>
      </Box>


      <canvas ref={canvas}></canvas>
     
    </Box>
  );
}
