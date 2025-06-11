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
import path from 'path';

const session = require("express-session");

dotenv.config();

const app = express();
const { ENV, PORT } = process.env;

app.use(express.json());
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    })
);

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

    const serverConfig = {
        publicPath: webPackConfig.output.publicPath,
        stats: 'minimal',
        serverSideRender: true
    };

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

app.use(express.static(path.join(__dirname, 'public')));

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
            window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\u003c')}
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
        let movieList = await axios({
            url: `${process.env.API_URL}/api/movies`,
            method: 'get',
        });

        let userMovies = [];
        if (token && id) {
            try {
                const response = await axios({
                    url: `${process.env.API_URL}/api/user/${id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    method: 'get',
                });
                userMovies = response.data.data.movies;
            } catch (err) {
                console.warn('No se pudieron obtener películas del usuario:', err.message);
            }
        }

        movieList = movieList.data.data;

        initialState = {
            user: { id: id || '', email: email || '', name: name || '' },
            mySearch: [],
            myList: movieList.filter((movie) => userMovies.includes(movie._id)),
            trends: movieList.filter(movie => movie.contentRating === 'PG' && movie._id),
            originals: movieList.filter(movie => movie.contentRating === 'G' && movie._id)
        };
    } catch (err) {
        console.error('Error cargando películas:', err.message);
        initialState = {
            user: {},
            mySearch: [],
            myList: [],
            trends: [],
            originals: []
        };
    }

    const store = createStore(reducer, initialState);
    const preloadedState = store.getState();
    const isLogged = !!initialState.user.id;
    const html = renderToString(
        <Provider store={store}>
            <StaticRouter location={req.url} context={{}}>
                <Layout>
                    {renderRoutes(serverRoutes(isLogged))}
                </Layout>
            </StaticRouter>
        </Provider>
    );
    res.send(setResponse(html, preloadedState, req.hashManifest));
};

app.get("/movies/:movieId", async function (req, res, next) {
    try {
        const { movieId } = req.params;
        const { token } = req.cookies;

        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const { data, status } = await axios({
            url: `${process.env.API_URL}/api/movies/${movieId}`,
            headers,
            method: "get"
        });

        if (status !== 200) {
            return next(boom.badImplementation());
        }
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
});

app.get(/.*/, renderApp);

app.listen(PORT, (err) => {
    if (err) console.log(err);
    else console.log(`${ENV} server running on Port ${PORT}`);
});

console.log(`CARGANDO SERVER JS ///////////////////////////// ${process.env.API_URL}`);