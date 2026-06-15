import { useEffect, useRef } from 'react'
import { FiMonitor, FiSmartphone, FiVideo } from 'react-icons/fi'
import useMediaQuery from '../hooks/useMediaQuery'
import './HomeFeatureVideo.css'

function HomeFeatureVideo({ desktopSrc, label, mobileSrc, playbackRate = 0.82, t, tone }) {
  const isMobile = useMediaQuery('(max-width: 679px)')
  const videoRef = useRef(null)
  const activeSrc = isMobile ? mobileSrc : desktopSrc
  const DeviceIcon = isMobile ? FiSmartphone : FiMonitor

  useEffect(() => {
    if (!videoRef.current) return

    videoRef.current.playbackRate = playbackRate
    videoRef.current.load()
    videoRef.current.play().catch(() => {})
  }, [activeSrc, playbackRate])

  const startPlayback = () => {
    if (!videoRef.current) return

    videoRef.current.currentTime = Math.min(1.2, videoRef.current.duration || 1.2)
    videoRef.current.playbackRate = playbackRate
    videoRef.current.play().catch(() => {})
  }

  return (
    <figure className={`home-feature-video home-feature-video--${tone}`}>
      <div className="home-feature-video__frame">
        <video
          aria-label={label}
          autoPlay
          data-device={isMobile ? 'mobile' : 'desktop'}
          muted
          onEnded={startPlayback}
          onLoadedMetadata={startPlayback}
          playsInline
          preload="metadata"
          ref={videoRef}
          src={activeSrc}
        />
      </div>
      <figcaption>
        <span><FiVideo aria-hidden="true" />{t('home.realProductVideo')}</span>
        <span><DeviceIcon aria-hidden="true" />{isMobile ? t('home.mobileRecording') : t('home.desktopRecording')}</span>
      </figcaption>
    </figure>
  )
}

export default HomeFeatureVideo
