import React, { Component } from 'react';
import { setOrGetStore } from '@/util/initialise-store';
import isValidUser from '@/util/is-valid-user';
import { updateUserData, fetchUser } from '@/src/slices/user';
import Router from 'next/router';

const WithAuth = (App) => {
  return class AppWithAuth extends Component {
    constructor(props) {
      super(props);
      this.state = {
        isAuthChecked: false
      };
    }

    componentDidMount() {
      // Клиентская проверка аутентификации
      console.log('Checking auth on client side...');
      const userDetails = isValidUser({});

      if (!userDetails || !userDetails.isValid) {
        console.log('User not authenticated on client side, redirecting to login');
        Router.push('/login');
        return;
      }

      console.log('User authenticated on client side:', userDetails);
      const store = setOrGetStore();
      store.dispatch(updateUserData({ type: 'isValid', value: true }));
      store.dispatch(updateUserData({ type: 'id', value: userDetails.id }));
      store.dispatch(fetchUser());

      this.setState({ isAuthChecked: true });
    }

    static async getInitialProps(ctx) {
      let appProps = {};

      const reduxStore = setOrGetStore();
      const { dispatch } = reduxStore;

      const userDetails = isValidUser(ctx);
      console.log('Server-side auth check:', userDetails);

      if (userDetails && !userDetails.isValid) {
        if (ctx.res) {
          console.log('User not authenticated, redirecting to login');
          ctx.res.writeHead(307, {
            Location: '/login'
          });
          ctx.res.end();
        } else {
          // Если мы на клиенте, используем Router для перенаправления
          Router.push('/login');
        }
      }

      if (App.getInitialProps) {
        appProps = await App.getInitialProps(ctx);
      }

      await dispatch(updateUserData({ type: 'isValid', value: true }));

      if (ctx.req) {
        await dispatch(updateUserData({ type: 'id', value: userDetails && userDetails.id }));
        await dispatch(fetchUser());
      }

      ctx.reduxState = reduxStore.getState();

      return {
        ...appProps
      };
    }

    render() {
      return <App {...this.props} />;
    }
  };
};

export default WithAuth;
