import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseWebRTCOptions {
  socket: Socket | null;
  gameId: string;
  isInitiator: boolean;
}

export const useWebRTC = ({ socket, gameId, isInitiator }: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setConnectionStatus('connected');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', { gameId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setConnectionStatus('disconnected');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [gameId, socket]);

  const startCall = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (err: unknown) {
          const errorMsg = (err as Error)?.message || 'Camera and mic access failed. Please check browser permissions.';
          alert(errorMsg);
          setConnectionStatus('disconnected');
          return;
        }
      }

      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(stream);

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('rtc_offer', { gameId, offer });
      } else {
        socket?.emit('rtc_ready', { gameId });
      }
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [createPeerConnection, gameId, isInitiator, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleRtcReady = async () => {
      if (isInitiator && localStreamRef.current) {
        const pc = peerConnectionRef.current || createPeerConnection(localStreamRef.current);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('rtc_offer', { gameId, offer });
      }
    };

    const handleRtcOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      try {
        let stream = localStreamRef.current;
        if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          }
          setLocalStream(stream);
          localStreamRef.current = stream;
        }

        const pc = createPeerConnection(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('rtc_answer', { gameId, answer });
      } catch {
        setConnectionStatus('disconnected');
      }
    };

    const handleRtcAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch {
        setConnectionStatus('disconnected');
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch {
        return;
      }
    };

    socket.on('rtc_ready', handleRtcReady);
    socket.on('rtc_offer', handleRtcOffer);
    socket.on('rtc_answer', handleRtcAnswer);
    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('rtc_ready', handleRtcReady);
      socket.off('rtc_offer', handleRtcOffer);
      socket.off('rtc_answer', handleRtcAnswer);
      socket.off('ice_candidate', handleIceCandidate);
    };
  }, [socket, gameId, isInitiator, createPeerConnection]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  }, []);

  const endCall = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus('idle');
  }, []);

  useEffect(() => () => { endCall(); }, [endCall]);

  return { localStream, remoteStream, isVideoEnabled, isAudioEnabled, connectionStatus, startCall, toggleVideo, toggleAudio, endCall };
};
