import React, { useRef, useState } from 'react';
import './App.css';
import { Canvas } from '.';
import { HandleProps } from '../src/components/Handle/Handle';


function App() {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState<any>('');
  const [canCrop, setCanCrop] = useState<any>(false);
  const [previousHandles, setPreviousHandles] = useState<Array<Array<HandleProps>>>([]);
  const [selectedHandle, setSelectedHandle] = useState<number>(-1)

  const buttonRef = useRef(null);
  const resetRef = useRef(null);
  const rescaleRef = useRef(null);
  const saveRef = useRef(null);
  const undoRef = useRef(null);
  const redoRef = useRef(null);

  const saveCallback = (imageUrl: any) => setUrl(imageUrl);


  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      if (event.target) setSource(event.target.result);
    };
    if (e.target.files) reader.readAsDataURL(e.target.files[0]);
  };

  return (
    <div className="App">
      <Canvas
        width={500}
        height={500}
        source={source}
        radius={20}
        color="#FDFD05"
        canCrop={canCrop}
        cropEvent={{ elementRef: buttonRef, eventType: 'click' }}
        rescaleEvent={{ elementRef: rescaleRef, eventType: 'click' }}
        resetEvent={{ elementRef: resetRef, eventType: 'click' }}
        undoEvent={{ elementRef: undoRef, eventType: 'click' }}
        redoEvent={{ elementRef: redoRef  , eventType: 'click' }}
        saveProps={{ saveRef, saveCallback }}
        previousHandles={previousHandles}
        setPreviousHandles={setPreviousHandles}
        selectedHandle={selectedHandle}
        setSelectedHandle={setSelectedHandle}
        styles={{
          border: '1px solid red',
          display: 'flex',
          alignItems: 'center',
        }}
      />
      <input type="file" accept="image/jpeg" onChange={(e) => handleImage(e)} />
      <button onClick={() => setCanCrop(true)}>Start Cropping</button>
      <button ref={buttonRef}>Crop</button>
      <button ref={rescaleRef}>Rescale</button>
      <button ref={resetRef}>Reset</button>
      <button ref={saveRef}>Save</button>
      <button ref={undoRef} disabled={selectedHandle < 0} >Undo</button>
      <button ref={redoRef}>Redo</button>
      <img src={url} />
    </div>
  );
}

export default App;
