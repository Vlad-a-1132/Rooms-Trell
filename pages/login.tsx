import Login from '@/src/components/login';
import { setOrGetStore } from '@/util/initialise-store';
import withStore from '@/src/hoc/with-store';
import isValidUser from '@/util/is-valid-user';
import Router from 'next/router';
import { useEffect } from 'react';

// Компонент-обертка для проверки аутентификации на клиенте
const LoginWithClientCheck = (props) => {
  useEffect(() => {
    // Клиентская проверка, если пользователь уже авторизован
    console.log('Checking if user is already authenticated...');
    const userDetails = isValidUser({});

    if (userDetails && userDetails.isValid) {
      console.log('User already authenticated, redirecting to home');
      Router.push('/home');
    } else {
      console.log('User not authenticated, showing login form');
    }
  }, []);

  return <Login {...props} />;
};

const LoginPageWithStore = withStore(LoginWithClientCheck);

LoginPageWithStore.getInitialProps = async (ctx) => {
  const reduxStore = setOrGetStore();

  const userDetails = isValidUser(ctx);
  console.log('Login page: server-side auth check:', userDetails);

  if (userDetails && userDetails.isValid) {
    if (ctx.res) {
      console.log('User already authenticated, redirecting to home');
      ctx.res.writeHead(307, {
        Location: '/home'
      });
      ctx.res.end();
    } else {
      // Клиентская переадресация будет выполнена в useEffect
    }
  }

  return {
    reduxState: reduxStore.getState()
  };
};

export default LoginPageWithStore;
