import React from 'react';
import styled from 'styled-components';

const LoadingText = styled.h2`
  height: 100%;
  width: 100vw;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Loading = () => {
  return <LoadingText>LOADING...</LoadingText>;
};

export default Loading;
