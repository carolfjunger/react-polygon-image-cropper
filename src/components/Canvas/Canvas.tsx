import React, { useEffect, useRef, useState } from 'react';
import { Handle, HandleProps } from '../Handle/Handle';
import { concat, dropRight } from "lodash"
import './Canvas.css';
import {
  checkProximity,
  clearCanvas,
  cropImage,
  drawLine,
  redrawCropped,
} from '../../utils';

type CustomCallbackProps = (
  imageCanvasRef: React.RefObject<HTMLCanvasElement>,
  cropCanvasRef: React.RefObject<HTMLCanvasElement>,
  finalCanvasRef: React.RefObject<HTMLCanvasElement>
) => unknown;

interface EventListenerProps {
  elementRef: React.RefObject<HTMLElement>;
  eventType: string;
}

interface SaveProps {
  saveRef: React.RefObject<HTMLElement>;
  saveCallback: (imageUrl: string) => any;
}

interface CanvasProps {
  width: number;
  height: number;
  source: string;
  radius: number;
  color: string;
  draggable?: boolean;
  proximity?: number;
  canCrop?: boolean;
  cropEvent?: EventListenerProps;
  resetEvent?: EventListenerProps;
  rescaleEvent?: EventListenerProps;
  undoEvent?: EventListenerProps;
  redoEvent?: EventListenerProps;
  saveProps?: SaveProps;
  styles?: React.CSSProperties;
  customCallback?: CustomCallbackProps;
  previousHandles: Array<Array<HandleProps>>; 
  setPreviousHandles: React.Dispatch<React.SetStateAction<HandleProps[][]>>,
  selectedHandle: number,
  setSelectedHandle: React.Dispatch<React.SetStateAction<number>>
}

const Canvas = ({
  width,
  height,
  source,
  radius,
  color,
  draggable = true,
  proximity,
  canCrop,
  cropEvent,
  resetEvent,
  rescaleEvent,
  undoEvent,
  redoEvent,
  setPreviousHandles,
  previousHandles,
  selectedHandle,
  setSelectedHandle,
  saveProps,
  styles,
  customCallback,
}: CanvasProps) => {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [handles, setHandles] = useState<Array<HandleProps>>([]);
  const [cropped, setCropped] = useState(false);
  const [scaled, setScaled] = useState(false);

  useEffect(() => {
    if (customCallback) {
      customCallback(imageCanvasRef, cropCanvasRef, finalCanvasRef);
    }
  }, []);

  useEffect(() => {
    const handleCrop = () => {
      cropImage(imageCanvasRef, cropCanvasRef, handles, color);
      setCropped(true);
    };
    const cropRef = cropEvent?.elementRef;
    if (cropRef && cropRef.current) {
      cropRef.current.addEventListener('click', handleCrop);
    }
    return () => cropRef?.current?.removeEventListener('click', handleCrop);
  }, [cropEvent, handles]);

  useEffect(() => {
    const handleReset = () => {
      clearCanvas(cropCanvasRef);
      clearCanvas(finalCanvasRef);
      setHandles([]);
      setPreviousHandles([])
      setSelectedHandle(-1)
      setCropped(false);
      setScaled(false);
    };
    const resetRef = resetEvent?.elementRef;
    if (resetRef && resetRef.current) {
      resetRef.current.addEventListener('click', handleReset);
    }
    return () => resetRef?.current?.removeEventListener('click', handleReset);
  }, [resetEvent]);

  useEffect(() => {
    const handleUndo = () => {
      const newSelectedHandle = selectedHandle - 1
      if(newSelectedHandle < 0){
        setHandles([]);
        setPreviousHandles([])
      } else {
        const newHandles = previousHandles[newSelectedHandle]
        setHandles(newHandles)
      }
      setSelectedHandle(newSelectedHandle)
    };
    const undoRef = undoEvent?.elementRef;
    if (undoRef && undoRef.current) {
      undoRef.current.addEventListener('click', handleUndo);
    }
    return () => undoRef?.current?.removeEventListener('click', handleUndo);
  }, [undoEvent]);

  useEffect(() => {
    const handleRedo = () => {
      const newSelectedHandle = selectedHandle + 1
      if(newSelectedHandle < previousHandles.length) {
        const newHandles = previousHandles[newSelectedHandle]
        setHandles(newHandles)
        setSelectedHandle(newSelectedHandle)
      }
    };
    const redoRef = redoEvent?.elementRef;
    if (redoRef && redoRef.current) {
      redoRef.current.addEventListener('click', handleRedo);
    }

    console.log({ previousHandles, selectedHandle, handles })

    return () => redoRef?.current?.removeEventListener('click', handleRedo);
  }, [redoEvent]);

  useEffect(() => {
    const handleScale = () => {
      if (!scaled) {
        redrawCropped(handles, cropCanvasRef, finalCanvasRef);
        setHandles([]);
        setScaled(true);
      }
    };
    const rescaleRef = rescaleEvent?.elementRef;
    if (rescaleRef && rescaleRef.current) {
      rescaleRef.current.addEventListener('click', handleScale);
    }
    return () => rescaleRef?.current?.removeEventListener('click', handleScale);
  }, [rescaleEvent, handles, scaled]);

  useEffect(() => {
    if (saveProps) {
      const saveRef = saveProps.saveRef;
      const handleSave = () => {
        const imageUrl = finalCanvasRef.current?.toDataURL('image/png');
        if (imageUrl) {
          saveProps.saveCallback(imageUrl);
        }
      };
      if (saveRef && saveRef.current) {
        saveRef.current.addEventListener('click', handleSave);
      }

      return () => saveRef?.current?.removeEventListener('click', handleSave);
    }
  }, [saveProps]);

  useEffect(() => {
    const canvas = imageCanvasRef.current;
    if (canvas) {
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      const context = canvas.getContext('2d');
      if (context) {
        const image = new Image();
        image.onload = function () {
          context.imageSmoothingEnabled = false;
          context.drawImage(
            image,
            0,
            0,
            image.width,
            image.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        };
        image.src = source;
      }
    }

    const handleCanvas = cropCanvasRef.current;
    if (handleCanvas) {
      handleCanvas.width = width;
      handleCanvas.height = height;
    }
  }, [source]);

  useEffect(() => {
    const cropCanvas = cropCanvasRef.current;
    if (cropCanvas) {
      const cropContext = cropCanvas.getContext('2d');
      if (cropped) {
        cropImage(imageCanvasRef, cropCanvasRef, handles, color);
      } else {
        cropContext?.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        handles.forEach((_, idx) => drawLine(handles, idx, cropContext, color));
      }
    }
  }, [handles, cropped]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cropCanvas = cropCanvasRef.current;
    if (canCrop && cropCanvas) {
      const rect = cropCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (
        !checkProximity(handles, { x: x, y: y }, proximity || 0) &&
        !cropped
      ) {
        const newHandle = concat(handles, { x: x, y: y, radius: radius, color: color })
        setHandles(newHandle);
        if(selectedHandle == previousHandles.length - 1) { // check if can add handles to memory
          setPreviousHandles((prev) => [...prev, newHandle])
        } else {
          const newPreviousHandles = dropRight(previousHandles, previousHandles.length - (selectedHandle + 1))
          setPreviousHandles([...newPreviousHandles, newHandle])
        }
        setSelectedHandle((prev) => prev + 1)
      }
    }
  };

  const updateHandles = (idx: number, x: number, y: number) => {
    const handlesCopy = Array.from(handles);
    handlesCopy[idx] = { ...handlesCopy[idx], x: x, y: y };
    setHandles(handlesCopy);
  };

  return (
    <div
      className="react-polygon-bounding-box"
      style={{ height: height, width: width, ...styles }}>
      <canvas
        style={{ height: height, width: width}}
        className="react-polygon-image-canvas"
        hidden={cropped}
        ref={imageCanvasRef}
      />
      <canvas
        style={{ height: height, width: width }}
        className="react-polygon-crop-canvas"
        ref={cropCanvasRef}
        onClick={handleClick}
      />
      <canvas className="react-polygon-final-canvas" ref={finalCanvasRef} />
      {handles.map((handle, idx) => (
        <Handle
          key={idx}
          idx={idx}
          {...handle}
          updateHandles={updateHandles}
          draggable={draggable}
          cropCanvasRef={cropCanvasRef}
        />
      ))}
    </div>
  );
};

export default Canvas;
