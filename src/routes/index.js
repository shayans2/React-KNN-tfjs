import React from 'react';
import { BrowserRouter, Routes as Switch, Route } from 'react-router-dom';

const App = React.lazy(() => import('@containers/App'));

import Loading from '@containers/Loading';

export const Routes = () => {
  return (
    <React.Suspense fallback={<Loading />}>
      <BrowserRouter>
        <Switch>
          <Route path="/" element={<App />} />
        </Switch>
      </BrowserRouter>
    </React.Suspense>
  );
};
