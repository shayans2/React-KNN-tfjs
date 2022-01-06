import React from 'react';
import styled from 'styled-components';
import LoadingBG from '@components/LoadingBG';

const LoadingText = styled.h2`
  position: absolute;
  color: #121212;
  font-size: 40px;
  top: 45%;
  right: 0;
  left: 0;
  text-align: center;
  z-index: 100;
`;

const Loading = () => {
  return (
    <>
      <LoadingBG />
      <LoadingText>{String('Loading...').toUpperCase()}</LoadingText>
    </>
  );
};

export default Loading;
