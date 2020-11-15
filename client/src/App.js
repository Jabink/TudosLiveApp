import React from 'react';
import './App.css';
import {BrowserRouter,Switch,Route} from 'react-router-dom';


import FaculityRoom from './components/FaculityRoom';
import HomePage from './components/HomePage';
import JoinRoom from './components/JoinRoom';

function App() {
  return (
    <React.Fragment>
    <BrowserRouter>
    <Switch>
      <Route path="/" exact component={HomePage}/>
      <Route path="/room/:roomId" exact component={FaculityRoom}/>
      <Route path="/join/:roomId/:name" exact component={JoinRoom}/>
    </Switch>
    </BrowserRouter>
    </React.Fragment>
  );
}

export default App;