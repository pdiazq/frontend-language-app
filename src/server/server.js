/* eslint-disable func-names */
/* eslint-disable global-require */
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import webpack from 'webpack';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { renderRoutes } from 'react-router-config';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import cookieParser from 'cookie-parser';
import boom from '@hapi/boom';
import passport from 'passport';
import axios from 'axios';
import reducer from '../frontend/reducers';
import Layout from '../frontend/components/Layout';
import serverRoutes from '../frontend/routes/serverRoutes';
import getManifest from './getManifest';

const session = require("express-session");



dotenv.config();

const app = express();
const { ENV, PORT } = process.env;

app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, cookie: { secure: false } }));
app.use(passport.initialize());
app.use(passport.session());

require('./utils/auth/strategies/basic');
require('./utils/auth/strategies/oauth');
require('./utils/auth/strategies/twitter');
require('./utils/auth/strategies/facebook');

if (ENV === 'development') {
  const webPackConfig = require('../../webpack.config');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const compiler = webpack(webPackConfig);
  const serverConfig = { port: PORT, hot: true };
  app.use(webpackDevMiddleware(compiler, serverConfig));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use((req, res, next) => {
    req.hashManifest = getManifest();
    next();
  });
  app.use(helmet());
  app.use(helmet.permittedCrossDomainPolicies());
  app.disable('x-powered-by');
}

const setResponse = (html, preloadedState, manifest) => {
  const mainStyles = manifest ? manifest['main.css'] : '/assets/app.css';
  const mainBuild = manifest ? manifest['main.js'] : '/assets/app.js';
  const vendorBuild = manifest ? manifest['vendors.js'] : 'assets/vendor.js';
  return (
    `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <meta charset="utf-8" />
          <link rel="stylesheet" href="${mainStyles}" type="text/css"/>
          <title>e-organic</title>
        </head>
        <body>
          <div id="app">${html}</div>
          <script id="preloadedState">
            window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
          </script>
          <script src="${mainBuild}" type="text/javascript"></script>
          <script src="${vendorBuild}" type="text/javascript"></script>
        </body>
      </html>`
  );
};

const renderApp = async (req, res) => {
  let initialState;
  const { token, email, name, id } = req.cookies;

  try {
    console.log(`SERVER TRAYENDO PELIS DE USUARIO ${id}`)
    
    let movieList = await axios({
      url: `${process.env.API_URL}/api/movies`,
      //headers: { Authorization: `Bearer ${token}`},
      method: 'get',
    });

    let userMovies = await axios({
      url: `${process.env.API_URL}/api/user/${id}`,
      headers: { Authorization: `Bearer ${token}`},
      method: 'get',
    })

    userMovies = (userMovies.data.data).movies;   
    movieList = movieList.data.data;

    initialState = {
      user: {id, email, name},
      mySearch:[],
      myList: movieList.filter((movie) => userMovies.includes(movie._id)), 
      trends: movieList.filter(movie => movie.contentRating === 'PG' && movie._id),
      originals: movieList.filter(movie => movie.contentRating === 'G'&& movie._id)
    };
  } catch (err) {
    try {
      console.log(`SERVER TRAYENDO PELIS DE USUARIO ${id}`)
    
      let movieList = await axios({
        url: `${process.env.API_URL}/api/movies`,
        //headers: { Authorization: `Bearer ${token}`},
        method: 'get',
      });  
      movieList = movieList.data.data;
      initialState = {
        user: {id, email, name},
        mySearch:[],
        myList:[],
        trends: movieList.filter(movie => movie.contentRating === 'PG' && movie._id),
        originals: movieList.filter(movie => movie.contentRating === 'G'&& movie._id)
      }

    } catch{
      initialState = {
        user: {},
        mySearch:[],
        myList: [],
        trends: [],
        originals: []
      }
    }
  }
 
  //console.log (`Mi Lista..... :::: ${JSON.stringify(initialState.myList)}`)

  const store = createStore(reducer, initialState);
  const preloadedState = store.getState();
  const isLogged = (initialState.user.id);
  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url} context={{}}>
        <Layout>
          {renderRoutes(serverRoutes(isLogged))}
        </Layout>
      </StaticRouter>
    </Provider>
  )
  res.send(setResponse(html, preloadedState, req.hashManifest));
};

app.post("/auth/sign-in", async function (req, res, next) {
  passport.authenticate("basic", function (error, data) {
    try {
      if (error || !data) {
        next(boom.unauthorized());
      }
      req.login(data, { session: false }, async function (err) {
        if (err) {
          next(err);
        }
        const { token, ...user } = data;
        res.cookie("token", token, {
          httpOnly: !(ENV === 'development'),
          secure: !(ENV === 'development')
        });
        res.status(200).json(user);
      });
    } catch (err) {
      next(err);
    }
  })(req, res, next);
});

app.post("/auth/sign-up", async function (req, res, next) {
  const { body: user } = req;

  try {
    const userData = await axios({
      url: `${process.env.API_URL}/api/auth/sign-up`,
      method: "post",
      data: {
        'email': user.email,
        'name': user.name,
        'password': user.password,
        //'movies': []
      }
    });
    res.status(201).json({
      name: req.body.name,
      email: req.body.email,
      id: userData.data.id
    });
  } catch (error) {
    next(error);
  }
});


//Facebook
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  function(req, res, next) {
    if (!req.user) {
      next(boom.unauthorized());
    }

    const { token, ...user } = req.user;
    res.cookie("token", token, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("id", user.user.id, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("name", user.user.name, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("email", user.user.email, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    return res.redirect('/')

  }
);

//Twitter

app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { session: false }),
  function(req, res, next) {
    if (!req.user) {
      next(boom.unauthorized());
    }

    const { token, ...user } = req.user;

    console.log(` Desde Twitter (token): ${token} usuario: ${user}`)
    res.cookie("token", token, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("id", user.user.id, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("name", user.user.name, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("email", user.user.email, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    return res.redirect('/')
  }
);



//Oauth

app.get(
  "/auth/google-oauth",
  passport.authenticate("google-oauth", {
    scope: ["email", "profile", "openid"]
  })
);

app.get(
  "/auth/google-oauth/callback",
  passport.authenticate("google-oauth", { session: false }),
  function(req, res, next) {
    if (!req.user) {
      next(boom.unauthorized());
    }
    const { token, ...user } = req.user;
    res.cookie("token", token, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("id", user.user.id, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("name", user.user.name, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    res.cookie("email", user.user.email, {
      httpOnly: !(ENV === 'development'),
      secure: !(ENV === 'development')
    });
    //require('../frontend/index2')
    //console.log('usuario logeado como id:', user.user.name)
    //res.status(200).json(user);
    //return <Redirect to='http://localhost:8000/' />
    //res.redirect(300, '/');
    return res.redirect('/')
  }
);



// Agregar películas favoritas

app.put("/user/:userMovieId", async function(req, res, next) {
  try {
    const { userMovieId } = req.params;
    const { body: userMovie } = req;

    console.log(`EN SERVER EL DATA RECIBIDO ES: 
    usuario: ${JSON.stringify(userMovieId)}
    pelicula: ${JSON.stringify(userMovie)}`)
    const { token } = req.cookies;

    const { data, status } = await axios({
      url: `${process.env.API_URL}/api/user/${userMovieId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: "put",
      data: userMovie
    });
    console.log(`traida en server status ${status}`)
    if (status !== 200) {
      return next(boom.badImplementation());
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Traer películas filtradas

app.post("/movies/filter", async function(req, res, next) {
  try {
    const {body: title } = req;
    const {token} = req.cookies;
    //var CircularJSON = require('circular-json');
    //console.log(`EL REQ EN SERVER ES: ${CircularJSON.stringify(title)}`);
    //console.log (`titulo es ${JSON.stringify(req)}`)

    const { data, status } = await axios({
      url: `${process.env.API_URL}/api/movies/filter`,
      //headers: { Authorization: `Bearer ${token}` },
      method: "post",
      data: title
    });
    console.log(`status ${status}`)
    if (status !== 200) {
      return next(boom.badImplementation());
    }
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// Agregar comentarios a las películas

app.put("/movies/:movieId", async function(req, res, next) {
  try {
    const { movieId } = req.params;
    const { body: comment } = req;
    const { token } = req.cookies;

    const { data, status } = await axios({
      url: `${process.env.API_URL}/api/movies/${movieId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: "put",
      data: comment
    });
    console.log(`status ${status}`)
    if (status !== 200) {
      return next(boom.badImplementation());
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Traer comentarios

app.get("/movies/:movieId", async function(req, res, next) {
  try {
    const { movieId } = req.params;
    const {token} = req.cookies;
    const { data, status } = await axios({
      url: `${process.env.API_URL}/api/movies/${movieId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: "get"
    });
    console.log(`status ${status}`)
    if (status !== 200) {
      return next(boom.badImplementation());
    }
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});



// Borrado de Película de favoritas

app.delete("/user/:userMovieId", async function(req, res, next) {
  try {
    const { userMovieId } = req.params;
    const { body: userMovie } = req;

    console.log(`EN SERVER PEDIDO DE BORRADO A: 
    usuario: ${JSON.stringify(userMovieId)}
    pelicula: ${JSON.stringify(userMovie)}`)
    const { token } = req.cookies;

    const { data, status } = await axios({
      url: `${process.env.API_URL}/api/user/${userMovieId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: "delete",
      data: userMovie
    });
    console.log(`status ${status}`)
    if (status !== 200) {
      return next(boom.badImplementation());
    }
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});


app.get('*', renderApp);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log(`${ENV} server running on Port ${PORT}`);
});


console.log (`CARGANDO SERVER JS ///////////////////////////// ${process.env.API_URL}`)