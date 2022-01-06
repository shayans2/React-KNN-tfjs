import React from 'react';

const GlobalState = React.createContext();

export const useGlobalState = () => {
  return React.useContext(GlobalState);
};

export const GlobalStateProvider = ({ children }) => {
  return <GlobalState.Provider value={{}}>{children}</GlobalState.Provider>;
};
