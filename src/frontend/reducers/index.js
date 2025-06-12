import { combineReducers } from 'redux';

// Reducer para búsqueda
const mySearch = (state = [], action) => {
  switch (action.type) {
    case 'SEARCH':
      return action.payload;
    default:
      return state;
  }
};

// Reducer para detalle de producto
const product = (state = {}, action) => {
  switch (action.type) {
    case 'GET_MOVIE_DETAIL':
      return action.payload;
    case 'DETAIL':
      return action.payload; // mantiene compatibilidad si lo usas, compatibilidad con acción antigua
    default:
      return state;
  }
};

// Reducer para favoritos (myList)
const myList = (state = [], action) => {
  switch (action.type) {
    case 'SET_FAVORITE':
      return [...state, action.payload];
    case 'DELETE_FAVORITE':
      return state.filter(item => item._id !== action.payload);
    default:
      return state;
  }
};

// Reducer para usuario
const user = (state = {}, action) => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
    case 'LOGOUT_REQUEST':
      return action.payload;
    default:
      return state;
  }
};

// Reducer para video playing
const playing = (state = {}, action) => {
  switch (action.type) {
    case 'GET_VIDEO_SOURCE':
      return action.payload;
    default:
      return state;
  }
};

// Reducer para listas de movies (SSR-inicializadas), Reducers inmutables para listas inicializadas por SSR
const trends = (state = [], action) => state;
const originals = (state = [], action) => state;

export default combineReducers({
  mySearch,
  product,
  myList,
  user,
  playing,
  trends,
  originals
});