import './ImageFrame.css'

function ImageFrame({ alt = '', children, className = '', src }) {
  return (
    <figure className={`diary-image-frame ${className}`}>
      <div className="diary-image-frame__braid" aria-hidden="true" />
      <div className="diary-image-frame__inner">
        {src ? <img src={src} alt={alt} /> : children}
      </div>
      <span className="diary-image-frame__stone diary-image-frame__stone--one" aria-hidden="true" />
      <span className="diary-image-frame__stone diary-image-frame__stone--two" aria-hidden="true" />
      <span className="diary-image-frame__stone diary-image-frame__stone--three" aria-hidden="true" />
      <span className="diary-image-frame__charm diary-image-frame__charm--one" aria-hidden="true">★</span>
      <span className="diary-image-frame__charm diary-image-frame__charm--two" aria-hidden="true">★</span>
    </figure>
  )
}

export default ImageFrame
