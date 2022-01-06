import React, { useCallback } from 'react';
import styled from 'styled-components';

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

import { CameraFlipIcon } from '@components/Icons/CameraFlip';

const WebcamContainer = styled.video`
  height: 100%;
  width: 100vw;
  object-fit: cover;
`;

const HeaderBtnContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row-reverse;
  position: absolute;
  top: 20px;
  right: 16px;
  left: 16px;
  z-index: 1000;
`;

const HeaderBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 10px 15px;
  background-color: #121212;
  color: #fff;
  border: none;
  border-radius: 18px;
`;

const Container = styled.div`
  position: fixed;
  top: auto;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
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

  // Refs
  // Upload Input
  const [hiddenInputRef, setHiddenInputRef] = React.useState(null);

  const checkHiddenInputRef = (ref) => {
    if (ref) setHiddenInputRef(ref);
    else setHiddenInputRef(null);
  };

  // Results
  const [resultRef, setResultRef] = React.useState(null);
  const checkResultsRef = (ref) => {
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
    setWebcamInput(createWebcamInput());
    return () => {
      setWebcamInput(null);
    };
  }, [webcamSide]);

  const createWebcamInput = useCallback(async () => {
    const webcam = await tf.data.webcam(webcamRef.current, {
      facingMode: webcamSide,
    });
    return webcam;
  }, [webcamRef.current, webcamSide]);

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
        try {
          const img = await inputWebcam.capture();
          const activation = model.infer(img, 'conv_preds');
          const result = await classifier.predictClass(activation);
          resultRef.innerText = `
            Prediction: ${result.label}
            Probability: ${result.confidences[result.label] * 100}%
            
          `;
          img.dispose();
        } catch (err) {
          console.error(err, 'ERROR');
        }
      }
      await tf.nextFrame();
    }
  }, [webcamInput, model, classifier]);

  const downloadModel = useCallback(async (classifierModel) => {
    let datasets = await classifierModel.getClassifierDataset();
    let datasetObject = {};
    Object.keys(datasets).forEach((key) => {
      let data = datasets[key].dataSync();
      datasetObject[key] = Array.from(data);
    });
    let jsonModel = JSON.stringify(datasetObject);

    let downloader = document.createElement('a');
    downloader.download = 'model.json';
    downloader.href =
      'data:text/text;charset=utf-8,' + encodeURIComponent(jsonModel);
    document.body.appendChild(downloader);
    downloader.click();
    downloader.remove();
  }, []);

  const uploadModel = useCallback(async (classifierModel, event) => {
    let inputModel = event.target.files;
    let fileReader = new FileReader();
    if (inputModel.length > 0) {
      fileReader.onload = async () => {
        const dataset = fileReader.result;
        const tensorObj = JSON.parse(dataset);

        Object.keys(tensorObj).forEach((key) => {
          tensorObj[key] = tf.tensor(tensorObj[key], [
            tensorObj[key].length / 1024,
            1024,
          ]);
        });

        classifierModel.setClassifierDataset(tensorObj);
      };
    }
    await fileReader.readAsText(inputModel[0]);
  }, []);

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
      <HeaderBtnContainer>
        <HeaderBtn
          onClick={() =>
            setWebcamSide((prevState) =>
              prevState === 'user' ? 'environment' : 'user',
            )
          }
        >
          <CameraFlipIcon />
        </HeaderBtn>
        <div style={{ display: 'flex', gap: '4px' }}>
          <HeaderBtn onClick={() => downloadModel(classifier)}>
            Get Model
          </HeaderBtn>
          <HeaderBtn onClick={() => hiddenInputRef.click()}>
            Upload Model
          </HeaderBtn>
          <input
            ref={checkHiddenInputRef}
            style={{ display: 'none' }}
            name="file"
            type="file"
            onChange={(e) => uploadModel(classifier, e)}
            accept="json"
          />
        </div>
      </HeaderBtnContainer>

      <Container>
        <div ref={checkResultsRef}></div>

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
