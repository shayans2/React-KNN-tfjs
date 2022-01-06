import React, { useCallback } from 'react';
import styled from 'styled-components';

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

import { CameraChangeIcon } from '@components/CameraChange';

const WebcamContainer = styled.video`
  height: 100%;
  width: 100vw;
  object-fit: cover;
`;

const WebcamSideBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;

  padding: 10px 15px;
  background-color: #121212;
  border: none;
  border-radius: 18px;

  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const Container = styled.div`
  position: fixed;
  top: auto;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  right: 0;
  bottom: 0;
  left: 0;
  height: auto;
  padding: 20px 50px;
`;

const AddSampleBtn = styled.button`
  padding: 10px 15px;
  width: 100%;
  margin-top: 15px;
  background-color: #121212;
  border: none;
  border-radius: 5px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`;

export const Input = styled.input`
  padding: 10px 15px;
  width: 100%;
  border-radius: 5px;
  border: none;
  background-color: #fff;
  color: #121212;
  outline: none;
  font-size: 18px;
  font-weight: bold;
  ::placeholder {
    color: #121212;
  }
`;

const App = () => {
  const [classes, setClasses] = React.useState([]);

  // Model And Classifier
  const [isModelLoaded, setIsModelLoaded] = React.useState(false);
  const [model, setModel] = React.useState(null);
  const [classifier, setClassifier] = React.useState(null);

  // WEBCAM
  const webcamRef = React.createRef(null);
  const [webcamSide, setWebcamSide] = React.useState('environment');
  const [webcamInput, setWebcamInput] = React.useState(null);

  // TAG INPUT
  const [tag, setTag] = React.useState('');

  const [resultRef, setResultRef] = React.useState(null);

  const checkResultRef = (ref) => {
    if (ref) setResultRef(ref);
    else setResultRef(null);
  };

  React.useEffect(() => {
    const init = async () => {
      setModel(await mobilenet.load());
      setClassifier(await knnClassifier.create());
    };
    init();
    return () => {
      setModel(null);
      setClassifier(null);
    };
  }, []);

  React.useEffect(() => {
    const init = async () => {
      await magic();
    };
    isModelLoaded && init();
  }, [isModelLoaded]);

  React.useEffect(() => {
    if (classifier && model) setIsModelLoaded(true);
  }, [classifier, model]);

  React.useEffect(() => {
    setWebcamInput(createWebcamInput(webcamSide));

    return () => {
      setWebcamInput(null);
    };
  }, [webcamSide]);

  const createWebcamInput = useCallback(
    async (webcamSide) => {
      const webcam = await tf.data.webcam(webcamRef.current, {
        facingMode: webcamSide,
      });
      return webcam;
    },
    [webcamRef.current, webcamSide],
  );

  const addDatasetClass = useCallback(
    async (classId) => {
      setClasses((prevState) => [...prevState, classId]);
      const inputWebcam = await webcamInput;
      const img = await inputWebcam.capture();
      const activation = model.infer(img, 'conv_preds');
      classifier.addExample(activation, classId);
      img.dispose();
    },
    [webcamInput, model, classifier],
  );

  const magic = React.useCallback(async () => {
    const inputWebcam = await webcamInput;
    while (true) {
      if (classifier.getNumClasses() > 0) {
        const img = await inputWebcam.capture();
        const activation = model.infer(img, 'conv_preds');
        const result = await classifier.predictClass(activation);
        resultRef.innerText = `
          Prediction: ${result.label}
          Probability: ${result.confidences[result.label] * 100}%
          
        `;
        img.dispose();
      }
      await tf.nextFrame();
    }
  }, [webcamInput, model, classifier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addDatasetClass(tag);
  };

  return (
    <>
      <WebcamContainer
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        id="webcam"
        width="800"
        height="800"
      />

      <WebcamSideBtn
        onClick={() =>
          setWebcamSide((prevState) =>
            prevState === 'user' ? 'environment' : 'user',
          )
        }
      >
        <CameraChangeIcon />
      </WebcamSideBtn>

      <Container>
        <div ref={checkResultRef}></div>

        {isModelLoaded ? (
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Tag what you see..."
              onChange={(e) => setTag(e.target.value)}
              value={tag}
              required
            />
            <AddSampleBtn type="submit">
              Add Sample ({classes.length})
            </AddSampleBtn>
          </form>
        ) : (
          'Loading model...'
        )}
      </Container>
    </>
  );
};

export default App;
