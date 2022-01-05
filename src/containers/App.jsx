import React from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

export const App = () => {
  const [isReady, setIsReady] = React.useState(false);
  const [classes, setClasses] = React.useState([]);
  const [webcamSide, setWebcamSide] = React.useState('environment');

  const [model, setModel] = React.useState(null);
  const [webcamInput, setWebcamInput] = React.useState(null);
  const [classifier, setClassifier] = React.useState(null);

  const webcamRef = React.createRef(null);
  const resultRef = React.createRef(null);
  const [btnRef, setBtnRef] = React.useState(null);
  const [text, setText] = React.useState('');

  const checkoutBtnRef = (ref) => {
    if (ref) setBtnRef(ref);
    else setBtnRef(null);
  };

  React.useEffect(() => {
    console.log(btnRef);
  }, [btnRef]);

  React.useEffect(() => {
    const init = async () => {
      setModel(await mobilenet.load());
      setClassifier(await knnClassifier.create());
    };
    setWebcamInput(createWebcamInput());
    init();
  }, []);

  React.useEffect(() => {
    if (classifier && model) setIsReady(true);
  }, [classifier, model]);

  React.useEffect(() => {
    const init = async () => {
      await magic();
    };

    isReady && init();
  }, [isReady]);

  const createWebcamInput = async () => {
    const webcam = await tf.data.webcam(webcamRef.current, {
      facingMode: webcamSide,
    });
    // setIsReady(true);
    return webcam;
  };

  const addDatasetClass = async (classId) => {
    console.log('Added class: ', classId);
    setClasses((prevState) => [...prevState, classId]);
    const inputWebcam = await webcamInput;

    const img = await inputWebcam.capture();

    const activation = model.infer(img, 'conv_preds');

    classifier.addExample(activation, classId);

    img.dispose();
  };

  const magic = async () => {
    const inputWebcam = await webcamInput;
    // const mobilenetModel = await model;
    // const knnClassifierModel = await classifier;
    console.log('Machine Learning on the web is ready', classifier);

    while (true) {
      if (classifier.getNumClasses() > 0) {
        const img = await inputWebcam.capture();

        // Get the activation from mobilenet from the webcam.
        const activation = model.infer(img, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
        const result = await classifier.predictClass(activation);
        btnRef.innerText = `
        prediction: ${result.label}
        probability: ${result.confidences[result.label]}
      `;
        console.log(`
        prediction: ${result.label}
        probability: ${result.confidences[result.label]}
      `);
        //Printing results to screen
        // document.getElementById('console-text-output').innerText = `
        //   prediction: ${result.label}
        //   probability: ${result.confidences[result.label]}
        // `;

        // Dispose the tensor to release the memory.
        img.dispose();
      }
      await tf.nextFrame();
    }
  };

  // console.log(resultRef);
  return (
    <div>
      <video
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        id="webcam"
        width="700"
        height="500"
      />
      <div ref={checkoutBtnRef}></div>
      {isReady ? (
        <>
          <input
            type="text"
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <button onClick={() => addDatasetClass(text)}>ADD</button>
        </>
      ) : (
        'Loading...'
      )}
    </div>
  );
};
