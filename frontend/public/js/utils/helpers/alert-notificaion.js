        function showAlertNotification(message, type =true) {
            // Create modal elements dynamically
              const existingModal = document.querySelector('#alert-notification-modal');
               if (existingModal) {
                document.body.removeChild(existingModal);
              }
            const modal = document.createElement('div');
            modal.id = 'alert-notification-modal';
            const modalContent = document.createElement('div');
            const alertIcon = document.createElement('i'); // Use <i> for icons
            const alertMessage = document.createElement('p');

            // Add inline styles to modal elements
            modal.style.position = 'fixed';
            modal.style.top = '20px';
            modal.style.left = '50%';
            modal.style.transform = 'translateX(-50%)';
            modal.style.zIndex = '1000';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.width = '100%';
            modal.style.pointerEvents = 'none';

            modalContent.style.display = 'flex';
            modalContent.style.alignItems = 'center';
            modalContent.style.gap = '12px';
            modalContent.style.padding = '10px 32px';
            modalContent.style.borderRadius = '16px';
            modalContent.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
            modalContent.style.color = 'white';
            modalContent.style.fontSize = '16px';
            modalContent.style.fontWeight = '500';
            modalContent.style.animation = 'fadeInScale 0.5s ease-out forwards';
            modalContent.style.maxWidth = '90%';
            modalContent.style.textAlign = 'center';
            modalContent.style.backdropFilter = 'blur(10px)';
            modalContent.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(76, 175, 80, 0.7))'; // Default gradient for success

            alertIcon.style.fontSize = '24px';

            alertMessage.style.margin = '0';
            alertMessage.style.fontSize = '14px';
            alertMessage.style.fontWeight = '600';

            // Set the message and style based on type
            alertMessage.textContent = message;

            // Choose icon and styles based on type
            if (type) {
                alertIcon.classList.add('ri-checkbox-circle-fill'); // Remix success icon
                modalContent.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(76, 175, 80, 0.7))';
            } else  {
                alertIcon.classList.add('ri-close-circle-fill'); // Remix error icon
                modalContent.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(244, 67, 54, 0.7))';
            }

            // Append elements to the modal
            modalContent.appendChild(alertIcon);
            modalContent.appendChild(alertMessage);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Automatically remove the modal after 3 seconds
            setTimeout(() => {
                modalContent.style.animation = 'fadeOutScale 0.5s ease-out forwards';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 500); 
            }, 3000); 
        }
 export default showAlertNotification;