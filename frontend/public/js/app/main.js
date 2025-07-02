import { setupIncomingCallHandler } from "../modules/video-Call/video-calling.js"
import { initSocketConnection, socket } from "../socket/socket-connection.js"
import { initActivePanel } from "./active-panel.js"
import { initSideNav } from "./contact-panel-handler.js"
import { globalEventListners } from "./global-eventlisteners.js"
import initThemeChanger from "./theme-changer.js"
 
 export let peer = null;
 document.addEventListener('DOMContentLoaded', () => {
     
 initThemeChanger()
 initSideNav()
 globalEventListners()
 initSocketConnection()
 initActivePanel() 
  // Initialize PeerJS
  const userId = sessionStorage.getItem('userInfo');
  if (!userId) {
    console.error('❌ User ID not found in session storage.');
    return;
  }
  const parseData = JSON.parse(userId);
  
  peer = new Peer(parseData.userId);
  const peerjs= peer.on('open', (id) => {
    console.log('📡 PeerJS connected with ID:', id);
    setupIncomingCallHandler(peer, userId, socket);

  });

 })