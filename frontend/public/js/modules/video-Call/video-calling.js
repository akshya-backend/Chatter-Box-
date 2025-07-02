import { peer } from "../../app/main.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

// Global call state
let activeCall = null;
let activeCallUI = null;
let callTimeout = null;

// Socket event handlers
export function setupSocketHandlers(socket) {
  // Handle call declined notification
  socket.on('call-declined-friend', ({ callerId }) => {
    const videoUI = document.getElementById('video-call-ui');
    if (videoUI) {
      videoUI.remove();
    }  
    showAlertNotification('Call has been declined', false);
    activeCall = null;
    activeCallUI = null;
  });

  // Handle call busy notification
  socket.on('call-busy', ({ callerId }) => {
    if (activeCall && activeCall.peer === callerId) {
      activeCallUI?.endCall();
      showNotification('User is busy');
      activeCall = null;
      activeCallUI = null;
    }
  });

  // Handle call timeout notification
  socket.on('call-timeout', ({ callerId }) => {
    if (activeCall && activeCall.peer === callerId) {
      activeCallUI?.endCall();
      showNotification('Call timed out');
      activeCall = null;
      activeCallUI = null;
    }
  });
}

// Create call popup for incoming calls
function createIncomingCallPopup(call, currentUserId, socket) {  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'call-popup-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '1000';

  // Popup container
  const popup = document.createElement('div');
  popup.className = 'call-popup';
  popup.style.backgroundColor = 'var(--bg-secondary)';
  popup.style.borderRadius = 'var(--border-radius)';
  popup.style.padding = '24px';
  popup.style.width = '320px';
  popup.style.maxWidth = '90vw';
  popup.style.boxShadow = 'var(--shadow-lg)';
  popup.style.textAlign = 'center';

  // Caller info
  const callerName = document.createElement('div');
  callerName.textContent = call.metadata?.callerName || 'Incoming Call';
  callerName.style.fontSize = '1.25rem';
  callerName.style.fontWeight = '600';
  callerName.style.marginBottom = '8px';
  callerName.style.color = 'var(--text-primary)';

  const callType = document.createElement('div');
  callType.textContent = 'Video Call';
  callType.style.color = 'var(--text-secondary)';
  callType.style.marginBottom = '24px';
  callType.style.fontSize = '0.875rem';

  // Avatar
  const avatar = document.createElement('img');
  avatar.src = call.metadata?.avatarUrl || '/assets/images/user.png';
  avatar.style.width = '80px';
  avatar.style.height = '80px';
  avatar.style.borderRadius = '50%';
  avatar.style.objectFit = 'cover';
  avatar.style.margin = '0 auto 20px';
  avatar.style.border = '3px solid var(--primary-color)';

  // Buttons container
  const buttons = document.createElement('div');
  buttons.style.display = 'flex';
  buttons.style.justifyContent = 'center';
  buttons.style.gap = '16px';
  buttons.style.marginTop = '24px';

  // Decline button
  const declineBtn = document.createElement('button');
  declineBtn.innerHTML = '<i class="ri-phone-line"></i> Decline';
  declineBtn.style.backgroundColor = 'var(--danger-color)';
  declineBtn.style.color = 'white';
  declineBtn.style.border = 'none';
  declineBtn.style.padding = '10px 20px';
  declineBtn.style.borderRadius = 'var(--border-radius-sm)';
  declineBtn.style.cursor = 'pointer';
  declineBtn.style.display = 'flex';
  declineBtn.style.alignItems = 'center';
  declineBtn.style.gap = '8px';

  // Accept button
  const acceptBtn = document.createElement('button');
  acceptBtn.innerHTML = '<i class="ri-phone-line"></i> Accept';
  acceptBtn.style.backgroundColor = 'var(--success-color)';
  acceptBtn.style.color = 'white';
  acceptBtn.style.border = 'none';
  acceptBtn.style.padding = '10px 20px';
  acceptBtn.style.borderRadius = 'var(--border-radius-sm)';
  acceptBtn.style.cursor = 'pointer';
  acceptBtn.style.display = 'flex';
  acceptBtn.style.alignItems = 'center';
  acceptBtn.style.gap = '8px';

  buttons.appendChild(declineBtn);
  buttons.appendChild(acceptBtn);
  popup.appendChild(avatar);
  popup.appendChild(callerName);
  popup.appendChild(callType);
  popup.appendChild(buttons);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Auto decline after 30 seconds
  const timeout = setTimeout(() => {
    if (document.body.contains(overlay)) {
      handleDecline();
      socket.emit('call-timeout', {
        callerId: call.peer,
        recipientId: currentUserId
      });
    }
  }, 30000);

  async function handleAccept() {
    try {
      clearTimeout(timeout);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Store stream reference on call object for cleanup

      // Remove popup
      overlay.remove();

      // Set active call before creating UI
      activeCall = call;

      // Initialize video call UI
      activeCallUI = renderVideoCallUI({
        participantName: call.metadata?.callerName || 'Caller',
        participantId: call.peer,
        avatarUrl: call.metadata?.avatarUrl || '/assets/images/user.png',
        isIncoming: true,
        call: call,
        onCallEnd: () => {
          if (activeCall) {
            // Clean up media streams
            if (activeCall.localStream) {
              activeCall.localStream.getTracks().forEach(track => track.stop());
            }
            activeCall.close();
          }
          activeCall = null;
          activeCallUI = null;
        }
      });

      // Update both local and remote streams
      activeCallUI.updateLocalStream(stream);
      activeCallUI.updateRemoteStream(null);

      // Answer the call
      call.answer(stream);

      // Set up call handlers
      call.on('stream', remoteStream => {
        activeCallUI.updateRemoteStream(remoteStream);
      });

      call.on('close', () => {
        activeCallUI?.endCall();
        activeCall = null;
        activeCallUI = null;
      });

      call.on('error', err => {
        console.error('Call error:', err);
        activeCallUI?.endCall();
        activeCall = null;
        activeCallUI = null;
      });

    } catch (err) {
      console.error('Error accepting call:', err);
      overlay.remove();
      if (call) {
        call.close();
        if (call.localStream) {
          call.localStream.getTracks().forEach(track => track.stop());
        }
      }
      activeCall = null;
      activeCallUI = null;
    }
  }

  function handleDecline() {
    clearTimeout(timeout);
    overlay.remove();
    if (call) {
      call.close();
      if (call.localStream) {
        call.localStream.getTracks().forEach(track => track.stop());
      }
      socket.emit('call-declined', {
        callerId: call.peer,
        recipientId: currentUserId
      });
    }
    activeCall = null;
    activeCallUI = null;
  }

  acceptBtn.addEventListener('click', handleAccept);
  declineBtn.addEventListener('click', handleDecline);

  return {
    element: overlay,
    end: () => {
      clearTimeout(timeout);
      overlay.remove();
      if (call && call.localStream) {
        call.localStream.getTracks().forEach(track => track.stop());
      }
      activeCall = null;
      activeCallUI = null;
    }
  };
}

// Video call UI component
function renderVideoCallUI(options = {}) {
  const {
    participantName = 'Participant',
    participantId,
    avatarUrl = '/assets/images/user.png',
    isIncoming = false,
    call = null,
    onCallEnd = () => {},
    onCallAccepted = () => {},
    onCallRejected = () => {},
    onError = () => {}
  } = options;
 
  // Main container
  const overlay = document.createElement('div');
  overlay.className = 'video-call-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'var(--bg-primary)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.zIndex = '1000';
  overlay.style.transition = 'all 0.3s ease';
  overlay.id = 'video-call-ui';

  // Videos container
  const videosContainer = document.createElement('div');
  videosContainer.className = 'videos-container';
  videosContainer.style.flex = '1';
  videosContainer.style.display = 'flex';
  videosContainer.style.position = 'relative';
  videosContainer.style.overflow = 'hidden';

  // Remote Video
  const remoteVideoContainer = document.createElement('div');
  remoteVideoContainer.className = 'remote-video-container';
  remoteVideoContainer.style.flex = '1';
  remoteVideoContainer.style.display = 'flex';
  remoteVideoContainer.style.alignItems = 'center';
  remoteVideoContainer.style.justifyContent = 'center';
  remoteVideoContainer.style.position = 'relative';

  const remoteVideo = document.createElement('video');
  remoteVideo.className = 'remote-video';
  remoteVideo.autoplay = true;
  remoteVideo.muted = false;
  remoteVideo.playsInline = true;
  remoteVideo.style.width = 'auto';
  remoteVideo.style.height = '100%';
  remoteVideo.style.objectFit = 'contain';
  remoteVideo.style.transform = 'scaleX(-1)';
  
  // Avatar container
  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'avatar-container';
  avatarContainer.style.display = 'flex';
  avatarContainer.style.flexDirection = 'column';
  avatarContainer.style.alignItems = 'center';
  avatarContainer.style.justifyContent = 'center';
  avatarContainer.style.position = 'absolute';
  avatarContainer.style.top = '0';
  avatarContainer.style.left = '0';
  avatarContainer.style.width = '100%';
  avatarContainer.style.height = '100%';
  avatarContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
  avatarContainer.style.zIndex = '5';

  const avatarImg = document.createElement('img');
  avatarImg.className = 'call-avatar';
  avatarImg.src = avatarUrl;
  avatarImg.style.width = '120px';
  avatarImg.style.height = '120px';
  avatarImg.style.borderRadius = '50%';
  avatarImg.style.objectFit = 'cover';
  avatarImg.style.border = '3px solid rgba(255,255,255,0.1)';

  const connectingText = document.createElement('div');
  connectingText.className = 'connecting-text';
  connectingText.textContent = isIncoming ? 'Incoming call...' : 'Calling...';
  connectingText.style.color = 'white';
  connectingText.style.marginTop = '20px';
  connectingText.style.fontSize = '16px';
  connectingText.style.fontWeight = '500';

  const nameText = document.createElement('div');
  nameText.className = 'participant-name';
  nameText.textContent = participantName;
  nameText.style.color = 'rgba(255,255,255,0.7)';
  nameText.style.marginTop = '8px';
  nameText.style.fontSize = '14px';

  // Connection status indicator
  const connectionStatus = document.createElement('div');
  connectionStatus.className = 'connection-status';
  connectionStatus.style.display = 'flex';
  connectionStatus.style.alignItems = 'center';
  connectionStatus.style.marginTop = '16px';
  
  const statusDot = document.createElement('div');
  statusDot.className = 'status-dot';
  statusDot.style.width = '8px';
  statusDot.style.height = '8px';
  statusDot.style.borderRadius = '50%';
  statusDot.style.backgroundColor = '#ffcc00';
  statusDot.style.marginRight = '8px';
  statusDot.style.animation = 'pulse 1.5s infinite';

  const statusText = document.createElement('div');
  statusText.className = 'status-text';
  statusText.textContent = isIncoming ? 'Waiting to accept...' : 'Waiting for answer...';
  statusText.style.color = 'rgba(255,255,255,0.7)';
  statusText.style.fontSize = '12px';

  connectionStatus.appendChild(statusDot);
  connectionStatus.appendChild(statusText);

  avatarContainer.appendChild(avatarImg);
  avatarContainer.appendChild(connectingText);
  avatarContainer.appendChild(nameText);
  avatarContainer.appendChild(connectionStatus);

  remoteVideoContainer.appendChild(remoteVideo);
  remoteVideoContainer.appendChild(avatarContainer);

  // Local Video
  const localVideoContainer = document.createElement('div');
  localVideoContainer.className = 'local-video-container';
  localVideoContainer.style.position = 'absolute';
  localVideoContainer.style.top = '20px';
  localVideoContainer.style.right = '20px';
  localVideoContainer.style.height = '40%';
  localVideoContainer.style.aspectRatio = '16/9';
  localVideoContainer.style.borderRadius = '8px';
  localVideoContainer.style.overflow = 'hidden';
  localVideoContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  localVideoContainer.style.cursor = 'move';
  localVideoContainer.style.transition = 'all 0.3s ease';
  localVideoContainer.style.zIndex = '10';
  localVideoContainer.style.border = '2px solid rgba(255,255,255,0.1)';

  const localVideo = document.createElement('video');
  localVideo.className = 'local-video';
  localVideo.autoplay = true;
  localVideo.muted = true;
  localVideo.playsInline = true;
  localVideo.style.width = '100%';
  localVideo.style.height = '100%';
  localVideo.style.objectFit = 'cover';
  localVideo.style.transform = 'scaleX(-1)'; 
  localVideoContainer.appendChild(localVideo);

  // Minimized View
  const minimizedView = document.createElement('div');
  minimizedView.className = 'minimized-view';
  minimizedView.style.position = 'fixed';
  minimizedView.style.bottom = '60px';
  minimizedView.style.left = '105px';
  minimizedView.style.width = '18%';
  minimizedView.style.height = '40%';
  minimizedView.style.aspectRatio = '16/9';
  minimizedView.style.borderRadius = '8px';
  minimizedView.style.overflow = 'hidden';
  minimizedView.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  minimizedView.style.cursor = 'move';
  minimizedView.style.display = 'none';
  minimizedView.style.zIndex = '9999';
  minimizedView.style.backgroundColor = '#000';
  minimizedView.style.transition = 'all 0.3s ease';

  const minimizedVideo = document.createElement('video');
  minimizedVideo.className = 'minimized-video';
  minimizedVideo.autoplay = true;
  minimizedVideo.muted = false;
  minimizedVideo.playsInline = true;
  minimizedVideo.style.width = '100%';
  minimizedVideo.style.height = '100%';
  minimizedVideo.style.objectFit = 'cover';
  
  const minimizedAvatar = document.createElement('div');
  minimizedAvatar.className = 'minimized-avatar';
  minimizedAvatar.style.position = 'absolute';
  minimizedAvatar.style.top = '0';
  minimizedAvatar.style.left = '0';
  minimizedAvatar.style.width = '100%';
  minimizedAvatar.style.height = '100%';
  minimizedAvatar.style.display = 'flex';
  minimizedAvatar.style.alignItems = 'center';
  minimizedAvatar.style.justifyContent = 'center';
  minimizedAvatar.style.backgroundColor = 'rgba(0,0,0,0.5)';

  const minimizedAvatarImg = document.createElement('img');
  minimizedAvatarImg.src = avatarUrl;
  minimizedAvatarImg.style.width = '50px';
  minimizedAvatarImg.style.height = '50px';
  minimizedAvatarImg.style.borderRadius = '50%';
  minimizedAvatarImg.style.objectFit = 'cover';

  minimizedAvatar.appendChild(minimizedAvatarImg);
  minimizedView.appendChild(minimizedVideo);
  minimizedView.appendChild(minimizedAvatar);

  const minimizedLabel = document.createElement('div');
  minimizedLabel.className = 'minimized-label';
  minimizedLabel.textContent = participantName;
  minimizedLabel.style.position = 'absolute';
  minimizedLabel.style.bottom = '0';
  minimizedLabel.style.left = '0';
  minimizedLabel.style.right = '0';
  minimizedLabel.style.backgroundColor = 'rgba(0,0,0,0.6)';
  minimizedLabel.style.color = 'white';
  minimizedLabel.style.padding = '6px 12px';
  minimizedLabel.style.fontSize = '12px';
  minimizedLabel.style.textAlign = 'center';

  minimizedView.appendChild(minimizedLabel);

  // Minimize/Restore button
  const minMaxButton = document.createElement('button');
  minMaxButton.className = 'min-max-button';
  minMaxButton.innerHTML = '<i class="ri-fullscreen-line"></i>';
  minMaxButton.title = 'Minimize';
  minMaxButton.style.position = 'absolute';
  minMaxButton.style.top = '20px';
  minMaxButton.style.right = '20px';
  minMaxButton.style.background = 'rgba(0,0,0,0.5)';
  minMaxButton.style.border = 'none';
  minMaxButton.style.borderRadius = '50%';
  minMaxButton.style.color = 'white';
  minMaxButton.style.width = '32px';
  minMaxButton.style.height = '32px';
  minMaxButton.style.display = 'flex';
  minMaxButton.style.alignItems = 'center';
  minMaxButton.style.justifyContent = 'center';
  minMaxButton.style.cursor = 'pointer';
  minMaxButton.style.zIndex = '10';

  // Minimize/Restore button for minimized view
  const minimizedMinMaxButton = document.createElement('button');
  minimizedMinMaxButton.className = 'minimized-min-max-button';
  minimizedMinMaxButton.innerHTML = '<i class="ri-fullscreen-line"></i>';
  minimizedMinMaxButton.title = 'Maximize';
  minimizedMinMaxButton.style.position = 'absolute';
  minimizedMinMaxButton.style.top = '8px';
  minimizedMinMaxButton.style.right = '8px';
  minimizedMinMaxButton.style.background = 'rgba(0,0,0,0.5)';
  minimizedMinMaxButton.style.border = 'none';
  minimizedMinMaxButton.style.borderRadius = '50%';
  minimizedMinMaxButton.style.color = 'white';
  minimizedMinMaxButton.style.width = '28px';
  minimizedMinMaxButton.style.height = '28px';
  minimizedMinMaxButton.style.display = 'flex';
  minimizedMinMaxButton.style.alignItems = 'center';
  minimizedMinMaxButton.style.justifyContent = 'center';
  minimizedMinMaxButton.style.cursor = 'pointer';
  minimizedMinMaxButton.style.zIndex = '10';

  minimizedView.appendChild(minimizedMinMaxButton);

  // Participant name label
  const nameLabel = document.createElement('div');
  nameLabel.className = 'name-label';
  nameLabel.textContent = participantName;
  nameLabel.style.position = 'absolute';
  nameLabel.style.bottom = '80px';
  nameLabel.style.left = '20px';
  nameLabel.style.backgroundColor = 'rgba(0,0,0,0.6)';
  nameLabel.style.color = 'white';
  nameLabel.style.padding = '6px 12px';
  nameLabel.style.borderRadius = '20px';
  nameLabel.style.fontSize = '14px';
  nameLabel.style.zIndex = '10';
  nameLabel.style.display = 'none';
  remoteVideoContainer.appendChild(nameLabel);

  // Controls bar
  const controls = document.createElement('div');
  controls.className = 'call-controls';
  controls.style.display = 'flex';
  controls.style.justifyContent = 'center';
  controls.style.alignItems = 'center';
  controls.style.gap = '16px';
  controls.style.padding = '12px';
  controls.style.backgroundColor = 'rgba(0,0,0,0.4)';
  controls.style.backdropFilter = 'blur(10px)';
  controls.style.borderRadius = '40px';
  controls.style.marginBottom = '20px';
  controls.style.zIndex = '10';

  // Create control buttons
  function createControlButton(icon, title, isDanger = false) {
    const button = document.createElement('button');
    button.className = 'control-button';
    button.innerHTML = `<i class="ri-${icon}"></i>`;
    button.title = title;
    
    button.style.background = isDanger ? 'var(--danger-color)' : 'rgba(255,255,255,0.1)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50%';
    button.style.width = '48px';
    button.style.height = '48px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s ease';
    
    if (isDanger) {
      button.style.transform = 'scale(1.1)';
    }
    
    button.addEventListener('mouseenter', () => {
      button.style.background = isDanger ? '#dc2626' : 'rgba(255,255,255,0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = isDanger ? 'var(--danger-color)' : 'rgba(255,255,255,0.1)';
    });
    
    return button;
  }

  // Timer display
  const timerDisplay = document.createElement('div');
  timerDisplay.className = 'call-timer';
  timerDisplay.style.position = 'absolute';
  timerDisplay.style.top = '20px';
  timerDisplay.style.left = '50%';
  timerDisplay.style.transform = 'translateX(-50%)';
  timerDisplay.style.backgroundColor = 'rgba(0,0,0,0.6)';
  timerDisplay.style.color = 'white';
  timerDisplay.style.padding = '6px 12px';
  timerDisplay.style.borderRadius = '20px';
  timerDisplay.style.fontSize = '14px';
  timerDisplay.style.zIndex = '10';
  overlay.appendChild(timerDisplay);

  // Call state
  let currentCall = call;
  let callTimer;
  let callStartTime = 0;
  let localStream = null;

  // Add CSS animation for connection status
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(style);

  // Make elements draggable
  makeDraggable(localVideoContainer, videosContainer);
  makeDraggable(minimizedView, document.body);

  // Minimize/Restore functionality
  function toggleMinimize() {
    const isMinimizing = !overlay.classList.contains('minimized');
    
    if (isMinimizing) {
      overlay.classList.add('minimized');
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      minimizedView.style.display = 'block';
      minMaxButton.innerHTML = '<i class="ri-fullscreen-exit-line"></i>';
      minMaxButton.title = 'Maximize';
      
      minimizedVideo.srcObject = remoteVideo.srcObject || null;
      if (!minimizedVideo.srcObject && remoteVideo.src) {
        minimizedVideo.src = remoteVideo.src;
      }
      
      if (remoteVideo.srcObject || remoteVideo.src) {
        minimizedAvatar.style.display = 'none';
      } else {
        minimizedAvatar.style.display = 'flex';
      }
    } else {
      overlay.classList.remove('minimized');
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
      minimizedView.style.display = 'none';
      minMaxButton.innerHTML = '<i class="ri-fullscreen-line"></i>';
      minMaxButton.title = 'Minimize';
    }
  }

  minMaxButton.addEventListener('click', toggleMinimize);
  minimizedMinMaxButton.addEventListener('click', toggleMinimize);

  // Responsive adjustments
  function handleResize() {
    if (window.innerWidth < 768) {
      localVideoContainer.style.width = '30%';
      localVideoContainer.style.maxWidth = 'none';
    } else {
      localVideoContainer.style.width = '20%';
      localVideoContainer.style.maxWidth = '250px';
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // Setup functions
  function setupOutgoingCall(name, avatar) {
    const micButton = createControlButton('mic-line', 'Mute');
    const cameraButton = createControlButton('video-line', 'Camera Off');
    const endButton = createControlButton('phone-line', 'End Call', true);
    const moreButton = createControlButton('more-2-line', 'More options');

    controls.appendChild(micButton);
    controls.appendChild(cameraButton);
    controls.appendChild(moreButton);
    controls.appendChild(endButton);

    // Button handlers
    micButton.addEventListener('click', () => {
      micButton.classList.toggle('active');
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !micButton.classList.contains('active');
        });
      }
    });

    cameraButton.addEventListener('click', () => {
      cameraButton.classList.toggle('active');
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = !cameraButton.classList.contains('active');
        });
      }
    });

    endButton.addEventListener('click', endCall);

    // Start the call
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;  
        localVideo.play().catch(e => console.error('Local video play error:', e));
        const userInfo = sessionStorage.getItem('userInfo');
        const parseData = JSON.parse(userInfo);
         
        currentCall = peer.call(participantId, stream, {
          metadata: {
            callerName: parseData.name || 'Caller',
            avatarUrl: parseData.avatar || '/assets/images/user.png'
          }
        });

        // Store stream reference for cleanup
        activeCall = currentCall;

        callTimeout = setTimeout(() => {
          if (!remoteVideo.srcObject) {
            updateStatus('Call timed out', 'error');
            endCall();
            if (window.socket) {
              window.socket.emit('call-timeout', {
                callerId: participantId,
                recipientId: peer.id
              });
            }
          }
        }, 30000);

        currentCall.on('stream', remoteStream => {
          clearTimeout(callTimeout);
          handleRemoteStream(remoteStream);
          onCallAccepted();
        });

        currentCall.on('close', endCall);
        currentCall.on('error', err => {
          updateStatus(`Call failed: ${err.message}`, 'error');
          onError(err);
          endCall();
        });
      })
      .catch(err => {
        updateStatus('Failed to access media devices', 'error');
        onError(err);
        endCall();
      });
  }

  function setupIncomingCall() {
    if (currentCall) {
      // Show active call controls immediately if call is already accepted
      const micButton = createControlButton('mic-line', 'Mute');
      const cameraButton = createControlButton('video-line', 'Camera Off');
      const endButton = createControlButton('phone-line', 'End Call', true);

      controls.appendChild(micButton);
      controls.appendChild(cameraButton);
      controls.appendChild(endButton);

      micButton.addEventListener('click', () => {
        micButton.classList.toggle('active');
        if (localStream) {
          localStream.getAudioTracks().forEach(track => {
            track.enabled = !micButton.classList.contains('active');
          });
        }
      });

      cameraButton.addEventListener('click', () => {
        cameraButton.classList.toggle('active');
        if (localStream) {
          localStream.getVideoTracks().forEach(track => {
            track.enabled = !cameraButton.classList.contains('active');
          });
        }
      });

      endButton.addEventListener('click', endCall);
    } else {
      // Show accept/decline buttons for new incoming calls
      const acceptButton = createControlButton('phone-line', 'Accept');
      acceptButton.style.background = 'var(--success-color)';
      
      const declineButton = createControlButton('phone-line', 'Decline', true);
      declineButton.style.background = 'var(--danger-color)';

      controls.appendChild(acceptButton);
      controls.appendChild(declineButton);

      acceptButton.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStream = stream;
          localVideo.srcObject = stream;
          localVideo.play().catch(e => console.error('Local video play error:', e));

          // Store stream reference on call object
         

          // Switch to active call controls
          controls.removeChild(acceptButton);
          controls.removeChild(declineButton);

          const micButton = createControlButton('mic-line', 'Mute');
          const cameraButton = createControlButton('video-line', 'Camera Off');
          const endButton = createControlButton('phone-line', 'End Call', true);

          controls.appendChild(micButton);
          controls.appendChild(cameraButton);
          controls.appendChild(endButton);

          // Button handlers
          micButton.addEventListener('click', () => {
            micButton.classList.toggle('active');
            localStream.getAudioTracks().forEach(track => {
              track.enabled = !micButton.classList.contains('active');
            });
          });

          cameraButton.addEventListener('click', () => {
            cameraButton.classList.toggle('active');
            localStream.getVideoTracks().forEach(track => {
              track.enabled = !cameraButton.classList.contains('active');
            });
          });

          endButton.addEventListener('click', endCall);

          // Answer the call
          if (currentCall) {
            currentCall.answer(stream);
            updateStatus('Call connected', 'connected');
            onCallAccepted();
          }
        } catch (err) {
          updateStatus('Failed to access media devices', 'error');
          onError(err);
          endCall();
        }
      });

      declineButton.addEventListener('click', () => {
        if (currentCall) {
          currentCall.close();
          if (currentCall.localStream) {
            currentCall.localStream.getTracks().forEach(track => track.stop());
          }
          if (window.socket) {
            window.socket.emit('call-declined', {
              callerId: currentCall.peer,
              recipientId: peer.id
            });
          }
        }
        onCallRejected();
        endCall();
      });
    }
  }

  // Core functions
  function handleRemoteStream(remoteStream) {
    remoteVideo.srcObject = remoteStream;
    remoteVideo.play().catch(e => console.error('Remote video play error:', e));
    minimizedVideo.srcObject = remoteStream;
    minimizedVideo.play().catch(e => console.error('Minimized video play error:', e));
    
    // Update UI
    avatarContainer.style.display = 'none';
    minimizedAvatar.style.display = 'none';
    nameLabel.style.display = 'block';
    updateStatus('Call connected', 'connected');
    startCallTimer();
  }

  function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - callStartTime) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerDisplay.textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }, 1000);
  }

 function endCall() {
  // 1. First stop all media tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  // 2. Then close the PeerJS connection
  if (currentCall) {
    currentCall.close();
  }
  
  // 3. Finally remove UI elements
  overlay.remove();
  minimizedView.remove();
  
  onCallEnd();
}
  function updateStatus(message, type = 'info') {
    statusText.textContent = message;
    
    switch (type) {
      case 'connected':
        statusDot.style.backgroundColor = 'var(--online-status)';
        statusDot.style.animation = 'none';
        connectingText.textContent = 'Connected';
        break;
      case 'error':
        statusDot.style.backgroundColor = 'var(--danger-color)';
        statusDot.style.animation = 'pulse 0.8s infinite';
        connectingText.textContent = 'Call ended';
        break;
      default:
        statusDot.style.backgroundColor = 'var(--warning-color)';
        statusDot.style.animation = 'pulse 1.5s infinite';
    }
  }

  function makeDraggable(element, boundary) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;

    element.onmousedown = function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return;

      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
      isDragging = true;
      element.style.zIndex = '10000';
      element.style.transition = 'none';
      element.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    };

    function elementDrag(e) {
      if (!isDragging) return;
      e.preventDefault();

      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      const boundaryRect = boundary.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const newTop = Math.max(0, Math.min(
        element.offsetTop - pos2, 
        boundaryRect.height - elementRect.height
      ));
      
      const newLeft = Math.max(0, Math.min(
        element.offsetLeft - pos1, 
        boundaryRect.width - elementRect.width
      ));

      element.style.top = newTop + 'px';
      element.style.left = newLeft + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
      isDragging = false;
      element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      setTimeout(() => {
        element.style.zIndex = '10';
        element.style.transition = 'all 0.3s ease';
      }, 100);
    }
  }

  // Initialize based on call type
  if (!isIncoming) {
    setupOutgoingCall(options.participantName, options.avatarUrl);
  } else {
    setupIncomingCall();
  }

  // Add elements to DOM
  videosContainer.appendChild(remoteVideoContainer);
  videosContainer.appendChild(localVideoContainer);
  overlay.appendChild(videosContainer);
  overlay.appendChild(controls);
  overlay.appendChild(minMaxButton);
  document.body.appendChild(overlay);
  document.body.appendChild(minimizedView);

  return {
    element: overlay,
    localVideo,
    remoteVideo,
    setCall: (call) => {
      currentCall = call;
      activeCall = call;
      call.on('stream', handleRemoteStream);
      call.on('close', endCall);
      call.on('error', (err) => {
        updateStatus(`Call failed: ${err.message}`, 'error');
        onError(err);
        endCall();
      });

      if (call.metadata) {
        updateParticipantInfo(
          call.metadata.callerName || participantName,
          call.metadata.avatarUrl || avatarUrl
        );
      }
    },
    updateParticipantInfo: (name, avatar) => {
      nameText.textContent = name;
      nameLabel.textContent = name;
      minimizedLabel.textContent = name;
      avatarImg.src = avatar;
      minimizedAvatarImg.src = avatar;
    },
    updateRemoteStream: (stream) => {
      remoteVideo.srcObject = stream;
      minimizedVideo.srcObject = stream;
      
      if (stream) {
        avatarContainer.style.display = 'none';
        minimizedAvatar.style.display = 'none';
      } else {
        avatarContainer.style.display = 'flex';
        minimizedAvatar.style.display = 'flex';
      }
    },
    updateLocalStream: (stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      localVideo.play().catch(e => console.error('Local video play error:', e));
    },
    endCall,
    toggleMinimize
  };
}

// Handle incoming calls
export function setupIncomingCallHandler(peer, currentUserId, socket) {
  peer.on('call', call => {    
    // Only show popup if no active call
    if (!activeCall) {
      const popup = createIncomingCallPopup(call, currentUserId, socket);
      activeCallUI = popup;
    } else {
      // Busy response
      call.close();
      socket.emit('call-busy', {
        callerId: call.peer,
        recipientId: currentUserId
      });
    }
  });
}

// Make outgoing call
export function startOutgoingCall(peer, targetUserId, targetName, targetAvatar, socket) {
  // Only allow one call at a time
  if (activeCall) {
    console.warn('Already in a call');
    return null;
  }
 
  const callUI = renderVideoCallUI({
    participantName: targetName,
    participantId: targetUserId,
    avatarUrl: targetAvatar,
    isIncoming: false,
    onCallAccepted: () => console.log('Call connected'),
    onCallEnd: () => {
      if (activeCall) {
        if (activeCall.localStream) {
          activeCall.localStream.getTracks().forEach(track => track.stop());
        }
        activeCall.close();
      }
      activeCall = null;
      activeCallUI = null;
    },
    onError: (err) => console.error('Call error:', err)
  });

  activeCall = callUI.currentCall;
  activeCallUI = callUI;
  return callUI;
}

// Helper function to show notifications
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = 'var(--bg-secondary)';
  notification.style.color = 'var(--text-primary)';
  notification.style.padding = '12px 24px';
  notification.style.borderRadius = 'var(--border-radius)';
  notification.style.boxShadow = 'var(--shadow-md)';
  notification.style.zIndex = '10000';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}