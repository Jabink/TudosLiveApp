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

  var x = "black",y = 2;

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
        ctx.current.fillStyle = x;
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
    ctx.current.strokeStyle = x;
    ctx.current.lineWidth = y;
    ctx.current.stroke();
    ctx.current.closePath();
  }

  ////////////////////////////////////WIDGET FUNCTIONS/////////////////////////////////////////////////////
  const erase=()=> {ctx.current.clearRect(0, 0, canvas.current.width, canvas.current.height) }

  const color=(color) =>{
    switch (color) {
        case "green":
            x = "green";
            break;
        case "blue":
            x = "blue";
            break;
        case "red":
            x = "red";
            break;
        case "yellow":
            x = "yellow";
            break;
        case "orange":
            x = "orange";
            break;
        case "black":
            x = "black";
            break;
        case "white":
            x = "white";
            break;
    }
    if (x == "white") y = 14;
    else y = 2;

}

  ///////////////////////////////////////////WIDGET///////////////////////////////////////////////
  return (
    <Box
      className="WhiteBoard"
      width="100%"
      height="100%"
      bgcolor="white"
      color="black"
    >

       <Box  position="absolute" right="0" margin="1em 1.5em">
       {/* <Tooltip title="Pen"><IconButton color="primary" aria-label="upload picture" component="span"  onClick={()=>color("black")}><BiPen/></IconButton></Tooltip> */}
       {/* <Tooltip title="Eraser"><IconButton color="primary" aria-label="upload picture" component="span"  onClick={()=>color("white")}><BiEraser/></IconButton></Tooltip> */}
       <Tooltip title="Clear"><IconButton color="primary" aria-label="upload picture" component="span"  onClick={erase}><MdClear/></IconButton></Tooltip>
      </Box>


      <canvas ref={canvas}></canvas>
     
    </Box>
  );
}
