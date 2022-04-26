import { useEffect, useRef, useState } from 'react'
import {
  AudioTrackPublication,
  LocalAudioTrack,
  LocalVideoTrack,
  Participant,
  RemoteAudioTrack,
  RemoteVideoTrack,
  VideoTrackPublication
} from 'twilio-video'

type Props = {
  member: Participant
}

type TrackPublication = VideoTrackPublication | AudioTrackPublication
type MediaTrack = LocalVideoTrack | RemoteVideoTrack | LocalAudioTrack | RemoteAudioTrack | null

const Member = ({ member }: Props) => {
  console.log(member)
  const [videoTracks, setVideoTracks] = useState<any[]>([])
  const [audioTracks, setAudioTracks] = useState<any[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const trackpubsToTracks = (trackMap: Map<string, TrackPublication>): MediaTrack[] =>
    Array.from(trackMap.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null)

  useEffect(() => {
    const trackSubscribed = (track: any) => {
      if (track.kind === 'video') {
        setVideoTracks((videoTracks) => [...videoTracks, track])
      } else {
        setAudioTracks((audioTracks) => [...audioTracks, track])
      }
    }

    const trackUnsubscribed = (track: any) => {
      if (track.kind === 'video') {
        setVideoTracks((videoTracks) => videoTracks.filter((v) => v !== track))
      } else {
        setAudioTracks((audioTracks) => audioTracks.filter((a) => a !== track))
      }
    }

    setVideoTracks(trackpubsToTracks(member.videoTracks))
    setAudioTracks(trackpubsToTracks(member.audioTracks))

    member.on('trackSubscribed', trackSubscribed)
    member.on('trackUnsubscribed', trackUnsubscribed)

    return () => {
      setVideoTracks([])
      setAudioTracks([])
      member.removeAllListeners()
    }
  }, [member])

  useEffect(() => {
    const videoTrack = videoTracks[0]
    if (videoTrack) {
      videoTrack.attach(videoRef.current)
      return () => {
        videoTrack.detach()
      }
    }
  }, [videoTracks])

  useEffect(() => {
    const audioTrack = audioTracks[0]
    if (audioTrack) {
      audioTrack.attach(videoRef.current)
      return () => {
        audioTrack.detach()
      }
    }
  }, [audioTracks])

  return (
    <>
      <h3>{member.identity}</h3>
      <video ref={videoRef} autoPlay={true} />
      <audio ref={audioRef} autoPlay={true} muted={false} />
    </>
  )
}

export default Member
