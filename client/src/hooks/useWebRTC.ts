import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
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
  const peerRef = useRef<SimplePeer.Instance | null>(null);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setConnectionStatus('connecting');

      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: true,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peer.on('signal', (data) => {
        if (data.type === 'offer') {
          socket?.emit('rtc_offer', { gameId, signal: data });
        } else if (data.type === 'answer') {
          socket?.emit('rtc_answer', { gameId, signal: data });
        } else {
          socket?.emit('ice_candidate', { gameId, candidate: data });
        }
      });

      peer.on('stream', (remote) => {
        setRemoteStream(remote);
        setConnectionStatus('connected');
      });

      peer.on('error', () => setConnectionStatus('disconnected'));
      peer.on('close', () => setConnectionStatus('disconnected'));

      socket?.on('rtc_offer', ({ signal }: { signal: SimplePeer.SignalData }) => peer.signal(signal));
      socket?.on('rtc_answer', ({ signal }: { signal: SimplePeer.SignalData }) => peer.signal(signal));
      socket?.on('ice_candidate', ({ candidate }: { candidate: SimplePeer.SignalData }) => peer.signal(candidate));

      peerRef.current = peer;
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [socket, gameId, isInitiator]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  }, [localStream]);

  const endCall = useCallback(() => {
    peerRef.current?.destroy();
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  }, [localStream]);

  useEffect(() => () => { endCall(); }, []);

  return { localStream, remoteStream, isVideoEnabled, isAudioEnabled, connectionStatus, startCall, toggleVideo, toggleAudio, endCall };
};
