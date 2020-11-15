import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { v4 as uuid } from "uuid";

const HomePage = () => {
  const history = useHistory();
  useEffect(() => {
    history.push(`/room/${uuid()}`);
  }, []);

  return <React.Fragment></React.Fragment>;
};
export default HomePage;
