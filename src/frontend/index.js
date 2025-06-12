import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Router } from 'react-router-dom'; // usar react-router-dom v6+
import { createBrowserHistory } from 'history';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore, compose, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import App from './routes/App';
import reducer from './reducers';

// Soporte para Redux DevTools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Cargamos el estado inicial inyectado por el SSR
const preloadedState = window.__PRELOADED_STATE__;

// Creamos el store con middleware
const store = createStore(
  reducer,
  preloadedState,
  composeEnhancers(applyMiddleware(thunk))
);

// Eliminamos la variable global
delete window.__PRELOADED_STATE__;

// Historial del navegador
const history = createBrowserHistory();

// Contenedor HTML donde montaremos la app
const container = document.getElementById('app');

// Hidratamos la app con React 18+
hydrateRoot(
  container,
  <Provider store={store}>
    <Router history={history}>
      <App isLogged={!!preloadedState?.user?.id} />
    </Router>
  </Provider>
);