import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiSettings } from 'react-icons/fi';
import { theme } from '../../styles/GlobalStyles';

const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.loaded ? 'transparent' : theme.colors.gradients.secondary};
  transition: background 0.3s ease;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: ${props => props.loaded ? 1 : 0};
`;

const Placeholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${theme.fontSize.sm};
  text-align: center;
  padding: ${theme.spacing.lg};
  font-weight: 500;
  opacity: ${props => props.loaded ? 0 : 1};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LazyImage = React.memo(({ src, alt, fallbackText = "Imagem não disponível", ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();
  const observerRef = useRef();

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <ImageContainer ref={imgRef} loaded={loaded} {...props}>
      {inView && src && !error && (
        <Image
          src={src}
          alt={alt}
          loaded={loaded}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      <Placeholder loaded={loaded && !error}>
        {!inView || (!src && !error) ? (
          <>
            <FiSettings size={32} style={{ marginBottom: '8px' }} />
            <div>{fallbackText}</div>
          </>
        ) : error ? (
          <>
            <FiSettings size={32} style={{ marginBottom: '8px' }} />
            <div>Erro ao carregar imagem</div>
          </>
        ) : (
          <>
            <LoadingSpinner />
            <div>Carregando...</div>
          </>
        )}
      </Placeholder>
    </ImageContainer>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;