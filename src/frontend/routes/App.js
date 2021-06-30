import React from 'react';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../containers/Home';
import Player from '../containers/Player';
import Login from '../containers/Login';
import Register from '../containers/Register';
import NotFount from '../containers/NotFount';
import Detail from '../containers/Detail';
import List from '../containers/List'

const App = ({ isLogged }) => (
  <BrowserRouter>
    <Layout>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/product/login" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/auth/google-oauth" render={() => (window.location = "/auth/google-oauth")} />
        <Route path="/auth/twitter" render={() => (window.location = "/auth/twitter")} />
        <Route path="/auth/facebook" render={() => (window.location = "/auth/facebook")} />
        <Route exact path="/player/:id" component={isLogged ? Player : Login} />
        <Route exact path="/list/:name" render={(props ) => <List isHome {...props} />} />
        <Route exact path="/product/:id" component={Detail} />
        <Route exact path="/register" component={Register} />
        <Route component={NotFount} />
      </Switch>
    </Layout>
  </BrowserRouter>
);

export default App;