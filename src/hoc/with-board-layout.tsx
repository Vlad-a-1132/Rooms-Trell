import React, { Component } from 'react';
import { setOrGetStore } from '@/util/initialise-store';
import { fetchColumns } from '@/src/slices/columns';
import { fetchBoard, updateBoardDetail } from '@/src/slices/board';
import { fetchCards } from '@/src/slices/cards';
import { resetServerContext } from 'react-beautiful-dnd';

const WithBoardLayout = (App) => {
  return class AppWithBoardLayout extends Component {
    constructor(props) {
      super(props);
    }

    static async getInitialProps(ctx) {
      let appProps = {};

      // This is important for react-beautifull-dnd to work
      // https://github.com/atlassian/react-beautiful-dnd/issues/1756
      resetServerContext();

      if (App.getInitialProps) {
        appProps = await App.getInitialProps(ctx);
      }

      const reduxStore = setOrGetStore(ctx.reduxState);
      const { dispatch } = reduxStore;

      // Сначала обновляем _id доски в состоянии
      await dispatch(updateBoardDetail({ type: '_id', value: ctx.query.slug.toString() }));
      // Затем вызываем fetchBoard без параметров
      await dispatch(fetchBoard());
      await dispatch(fetchColumns());
      await dispatch(fetchCards());

      ctx.reduxState = reduxStore.getState();

      return {
        ...appProps,
        reduxState: reduxStore.getState()
      };
    }

    render() {
      return <App />;
    }
  };
};

export default WithBoardLayout;
