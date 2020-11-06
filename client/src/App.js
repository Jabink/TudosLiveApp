import React from 'react';
import './App.css';
import {BrowserRouter,Switch,Route} from 'react-router-dom';

//
import HomePage from  './components/HomePage'
import CreateRoom from  './components/CreateRoom'
import JoinRoom from  './components/JoinRoom'

function App() {
  return (
    <React.Fragment>
    <BrowserRouter>
    <Switch>
      <Route path="/" exact component={HomePage}/>
      <Route path="/room/:roomId"  component={CreateRoom}/>
      <Route path="/join/:roomId" component={JoinRoom}/>
    </Switch>
    </BrowserRouter>
    </React.Fragment>
  );
}

export default App;
