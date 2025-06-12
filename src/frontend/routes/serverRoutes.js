import Home from '../containers/Home';
import Detail from '../containers/Detail';
import Player from '../containers/Player';
import Login from '../containers/Login';
import Register from '../containers/Register';
import NotFount from '../containers/NotFount';

export default (isLogged) => [
  { path: '/', exact: true, component: Home },
  { path: '/product/:id', exact: true, component: Detail },
  { path: '/player/:id', exact: true, component: isLogged ? Player : Login },
  { path: '/login', exact: true, component: Login },
  { path: '/register', exact: true, component: Register },
  { component: NotFount }
];