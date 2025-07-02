import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

export function groupProfile(data) {
  console.log("Group Profile Data:", data);

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "group-profile-modal";

  const modal = document.createElement("div");
  modal.className = "modal";

  // Header
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("div");
  title.className = "modal-title";
  title.textContent = "Group Profile";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.id = "close-group-profile-modal";
  closeBtn.innerHTML = '<i class="ri-close-line"></i>';
  closeBtn.addEventListener("click", () => overlay.remove());

  header.append(title, closeBtn);

  // Body
  const body = document.createElement("div");
  body.className = "modal-body";

  const groupHeader = document.createElement("div");
  groupHeader.className = "group-profile-header";

  const groupImg = document.createElement("img");
  groupImg.style.maxWidth = "150px";
  groupImg.src = data.avatar;
  groupImg.alt = "Group Avatar";
  groupImg.style.cursor = "pointer";
  groupImg.id="group-img";
  groupImg.style.borderRadius = "50%";

  // Create hidden file input for avatar change
  const avatarInput = document.createElement("input");
  avatarInput.type = "file";
  avatarInput.accept = "image/*";
  avatarInput.style.display = "none";
  
  // Add click handler to open file dialog when image is clicked
  groupImg.addEventListener("click", () => {
    if (data.isAdmin) {
      avatarInput.click();
    }
  });

  // Handle avatar change
  avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Create or select spinner
  let spinner = groupImg.parentElement.querySelector(".avatar-spinner");
  if (!spinner) {
    spinner = document.createElement("div");
    spinner.className = "avatar-spinner";
    spinner.style.position = "absolute";
    spinner.style.top = "23%";
    spinner.style.left = "50%";
    spinner.style.transform = "translate(-50%, -50%)";
    spinner.style.width = "60px";
    spinner.style.height = "60px";
    spinner.style.border = "4px solid #f3f3f3";
    spinner.style.borderTop = "4px solid #3498db";
    spinner.style.borderRadius = "50%";
    spinner.style.animation = "spin 1s linear infinite";
    groupImg.parentElement.appendChild(spinner);

    // Inject keyframes if not already present
    if (!document.getElementById("avatar-spinner-style")) {
      const style = document.createElement("style");
      style.id = "avatar-spinner-style";
      style.innerHTML = `
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Show spinner
  spinner.style.display = "block";
  
  const formData = new FormData();
  formData.append("picture", file);
  formData.append("groupId", data._id);

  try {
    const res = await fetch("/api/v1/chat/group-update-avatar", {
      method: "POST",
      body: formData,
    });
    const reply = await res.json();

    if (reply.status) {
      const sidelistImg = document.getElementById(`contact-avatar-${data._id}`);
      if (sidelistImg) {
        sidelistImg.innerHTML = `<img src="${reply.url}" class="list-avatar-img" alt="Group Avatar">`;
      }

      const headerImg = document.getElementById("chat-avatar-img");
      if (headerImg) headerImg.src = reply.url;

      groupImg.src = reply.url;

      sessionStorage.setItem("currentChat", JSON.stringify({
        isGroup: 'group',
        id: data._id,
        name: data.name,
        avatar: reply.url
      }));

      showAlertNotification("Group avatar updated successfully", true);
    } else {
      showAlertNotification(reply.message, false);
    }
  } catch (err) {
    console.error(err);
    showAlertNotification("Failed to update group avatar. Please try again later.", false);
  } finally {
    // Hide spinner
    spinner.style.display = "none";
  }
});


  const groupName = document.createElement("div");
  groupName.className = "group-name";
  groupName.textContent = data.name;

  const groupDescription = document.createElement("div");
  groupDescription.className = "group-description";
  groupDescription.textContent = data.description;

  const groupMembersCount = document.createElement("div");
  groupMembersCount.className = "group-members-count";
  groupMembersCount.textContent = `${data.totalMembers} members`;

  groupHeader.append(groupImg, groupName, groupMembersCount, groupDescription);
  document.body.appendChild(avatarInput); // Add the hidden input to DOM

  // Edit & Save
  if (data.isAdmin) {
    const editBtn = document.createElement("button");
    editBtn.id = "edit-group-btn";
    editBtn.className = "btn btn-secondary";
    editBtn.innerHTML = '<i class="ri-pencil-line"></i> Edit Group';

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.style.display = "none";
    saveBtn.innerHTML = '<i class="ri-check-line"></i> Save';

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "editable-group";

    const descInput = document.createElement("textarea");
    descInput.className = "editable-group";
    descInput.style.width = "400px";

    editBtn.addEventListener("click", () => {
      nameInput.value = groupName.textContent;
      descInput.value = groupDescription.textContent;

      groupHeader.replaceChild(nameInput, groupName);
      groupHeader.replaceChild(descInput, groupDescription);

      editBtn.remove();
      saveBtn.style.display = "inline-block";
    });

    saveBtn.addEventListener("click", async () => {
      const newName = nameInput.value.trim();
      const newDesc = descInput.value.trim();

      try {
        const res = await fetch("/api/v1/chat/group-update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: data._id,
            name: newName,
            description: newDesc,
          }),
        });
        const reply = await res.json();
        if (reply.status) {
          // Update the group header with new name and description
          const sidelistName = document.getElementById(`contact-name-${data._id}`);
          if (sidelistName) {            
            sidelistName.textContent = newName;
          }
          const  headerName = document.getElementById("chat-name");
          headerName.textContent = newName;
          groupName.textContent = newName;
          groupDescription.textContent = newDesc;
          groupHeader.replaceChild(groupName, nameInput);
          groupHeader.replaceChild(groupDescription, descInput);
          saveBtn.style.display = "none";
          groupHeader.appendChild(editBtn);
          sessionStorage.setItem("currentChat", JSON.stringify({isGroup : 'group', id : data._id, name : newName,avatar:data.avatar }));
          showAlertNotification("Group updated successfully", true);
        } else {
          showAlertNotification(reply.message, false);
        }
      } catch (err) {
        console.error(err);
        showAlertNotification("Failed to update group. Please try again later.", false);
      }
    });

    groupHeader.append(editBtn, saveBtn);
    nameInput.focus();
  }

  // Members list
  const memberList = document.createElement("div");
  memberList.className = "group-members-list";

  const membersTitle = document.createElement("div");
  membersTitle.className = "settings-section-title";
  membersTitle.innerHTML = '<i class="ri-group-line"></i> Members';

  memberList.appendChild(membersTitle);

  const memberListHeader = document.createElement("div");
  memberListHeader.id= "group-member-list-header";
  data.members.forEach((member) => {
    const isSelf = member._id === data.userId;

    const memberDiv = document.createElement("div");
    memberDiv.className = "group-member";
    memberDiv.id = `group-main-${member._id}`;
    const avatar = document.createElement("div");
    avatar.className = "group-member-avatar";
    avatar.innerHTML = `<img src="${member.avatar}" alt="Member">`;

    const info = document.createElement("div");
    info.className = "group-member-info";
    info.innerHTML = `<div class="group-member-name">${member.name}</div>
                      <span id="group-member-${member._id}" style="color:${member.isAdmin ? "#ef4444" : "#4f46e5"}" class="group-member-status">${member.isAdmin ? "Admin" : "Member"}</span>
                      ${ data.userId == member._id ? '<span class="group-member-status" style="margin-left:5px">(You)</span>' : ""}`;


    const actions = document.createElement("div");
    actions.className = "group-member-actions";

    if (!isSelf) {
      if (!member.isFriend) {
    
        const friendRequestBtn = document.createElement("button");
        friendRequestBtn.className = "group-member-action";
        friendRequestBtn.title = "Send Friend Request";
        friendRequestBtn.innerHTML = `<i class="ri-user-add-line"></i>`;
        friendRequestBtn.addEventListener("click", async () => {
          const res = await fetch("/api/v1/user/send-friend-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: member.email }),
          });
          const reply = await res.json();
          if (reply.status) {
            showAlertNotification("Friend request sent", true);
          } else {
            showAlertNotification(reply.message, false);
          }
        });
        actions.appendChild(friendRequestBtn);
      }

      if (data.isAdmin && !member.isAdmin) {
        const promoteBtn = document.createElement("button");
        promoteBtn.className = "group-member-action promote";
        promoteBtn.title = "Promote to Admin";
        promoteBtn.innerHTML = '<i class="ri-arrow-up-line"></i>';
        promoteBtn.addEventListener("click", async () => {
          const res = await fetch("/api/v1/chat/group-promote", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId: data._id,
              newAdminId: member._id,
            }),
          });
          const reply = await res.json();
          if (reply.status) {
                        showAlertNotification("Member promoted to admin", true);
            const addMemberbtn=document.getElementById("add-members-btn");
            addMemberbtn.style.display = "none";
            const previousAdmin = document.getElementById(`group-member-${data.userId}`);
            previousAdmin.style.color = "#4f46e5";
            previousAdmin.textContent = "Member";
            const newAdmin = document.getElementById(`group-member-${member._id}`);
            newAdmin.style.color = "#ef4444"; 
            newAdmin.textContent = "Admin";
            const editBtn = document.getElementById("edit-group-btn");
            editBtn.style.display = "none";
            const  promotebtn =document.getElementsByClassName("promote")
             const  kickbtn =document.getElementsByClassName("kick")
              for (let i = 0; i < kickbtn.length; i++) {
                kickbtn[i].style.display = "none";
                promotebtn[i].style.display = "none";

              }
              
          } else {
            showAlertNotification(reply.message, false);
          }
        });

        const kickBtn = document.createElement("button");
        kickBtn.className = "group-member-action kick";
        kickBtn.title = "Remove from Group";
        kickBtn.innerHTML = '<i class="ri-user-unfollow-line"></i>';
        kickBtn.addEventListener("click", async () => {
          const res = await fetch("/api/v1/chat/group-remove-member", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId: data._id,
              userIdToRemove: member._id,
            }),
          });
          const reply = await res.json();
          if (reply.status) {
              const memberDiv = document.getElementById(`group-main-${reply._id}`);
              memberDiv?.remove();
            showAlertNotification("Member removed from group", false);
          } else {
            showAlertNotification(reply.message, false);
          }
        });

        actions.append(promoteBtn, kickBtn);
      }
    }

    memberDiv.append(avatar, info, actions);
    memberListHeader.appendChild(memberDiv);
    memberList.appendChild(memberListHeader);
  });
  
  
  // Add Member Section
  if (data.isAdmin) {
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-secondary";
    addBtn.id = "add-members-btn";
    addBtn.style = "width: 100%; margin-top: 16px;";
    addBtn.innerHTML = '<i class="ri-user-add-line"></i> Add Members';

    const friendsToAdd = document.createElement("div");
    friendsToAdd.className = "friends-to-add";
    friendsToAdd.id = "group-friends-to-add";
    friendsToAdd.style.display = "none";
    friendsToAdd.style.marginTop = "16px";
    friendsToAdd.style.padding = "16px";
    friendsToAdd.style.backgroundColor = "var(--bg-primary)";
    friendsToAdd.style.borderRadius = "8px";
    friendsToAdd.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.gap = "8px";
    inputContainer.style.marginBottom = "8px";

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.placeholder = "Enter friend's email";
    emailInput.className = "input";
    emailInput.style.flex = "1";
    emailInput.style.backgroundColor= "var(--bg-secondary)";
    emailInput.style.padding = "8px 12px";
    emailInput.style.borderRadius = "4px";
    emailInput.style.border = 'none';

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "8px";

    const addMemberConfirmBtn = document.createElement("button");
    addMemberConfirmBtn.className = "btn btn-primary";
    addMemberConfirmBtn.style.padding = "8px 16px";
    addMemberConfirmBtn.style.borderRadius = "4px";
    addMemberConfirmBtn.innerHTML = '<i class="ri-user-add-line"></i> Add';

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-outline";
    cancelBtn.style.padding = "8px 16px";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.backgroundColor = "red";
    cancelBtn.style.color='var(--text-primary)'
    cancelBtn.innerHTML = "Cancel";

    addBtn.addEventListener("click", () => {
      friendsToAdd.style.display = friendsToAdd.style.display === "none" ? "block" : "none";
    });

    addMemberConfirmBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      if (!email) return showAlertNotification("Please enter an email", false);

      try {
        const res = await fetch("/api/v1/chat/group-add-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: data._id, email }),
        });
        const reply = await res.json();
        if (reply.status) {
          showAlertNotification("Member added successfully", true);
          friendsToAdd.style.display = "none";
          emailInput.value = "";
          const newMember = document.createElement("div");
          newMember.className = "group-member"; 
          newMember.innerHTML = `<div class="group-member-avatar"><img src="${reply.avatar}" alt="Member"></div>
                                 <div class="group-member-info">
                                   <div class="group-member-name">${reply.name}</div>
                                   <span id="group-member-${reply._id}" style="color:#4f46e5" class="group-member-status">Member</span>
                                 </div>`;
          const actions = document.createElement("div");
          actions.className = "group-member-actions";
          const promoteBtn = document.createElement("button");
          promoteBtn.className = "group-member-action promote";   
          promoteBtn.title = "Promote to Admin";
          promoteBtn.innerHTML = '<i class="ri-arrow-up-line"></i>';
            
          promoteBtn.addEventListener("click", async () => {
            const res = await fetch("/api/v1/chat/group-promote", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                groupId: data._id,
                newAdminId: reply._id,
              }),
            });
            const reply = await res.json();
            if (reply.status) {
              showAlertNotification("Member promoted to admin", true);
              const previousAdmin = document.getElementById(`group-member-${data.userId}`);
              previousAdmin.style.color = "#4f46e5";
              previousAdmin.textContent = "Member";
              const newAdmin = document.getElementById(`group-member-${reply._id}`);
              newAdmin.style.color = "#ef4444"; 
              newAdmin.textContent = "Admin";
              const editBtn = document.getElementById("edit-group-btn");
              editBtn.style.display = "none";
            } else {
              showAlertNotification(reply.message, false);
            }
          }
          );
          actions.appendChild(promoteBtn);
          const kickBtn = document.createElement("button");
          kickBtn.className = "group-member-action kick";
          kickBtn.title = "Remove from Group";
          kickBtn.innerHTML = '<i class="ri-user-unfollow-line"></i>';  
          kickBtn.addEventListener("click", async () => {
            const res = await fetch("/api/v1/chat/group-remove-member", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                groupId: data._id,
                userIdToRemove: reply._id,
              }),
            });
            const reply = await res.json();
            if (reply.status) {
              const memberDiv = document.getElementById(`group-main-${reply._id}`);
              memberDiv.remove();
              showAlertNotification("Member removed from group", false);
            } else {
              showAlertNotification(reply.message, false);
            }
          }
          );
          actions.appendChild(kickBtn);
          newMember.appendChild(actions);
          memberListHeader.prepend(newMember);
           showAlertNotification("Member added successfully", true);
        } else {
          showAlertNotification(reply.message, false);
        }
      } catch (err) {
        console.error(err);
        showAlertNotification("Failed to add member", false);
      }
    });

    cancelBtn.addEventListener("click", () => {
      friendsToAdd.style.display = "none";
      emailInput.value = "";
    });

    inputContainer.appendChild(emailInput);
    buttonsContainer.append(cancelBtn, addMemberConfirmBtn);
    friendsToAdd.append(inputContainer, buttonsContainer);
    memberList.append(addBtn, friendsToAdd);
  }

  body.append(groupHeader, memberList);

  // Footer
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const leaveBtn = document.createElement("button");
  leaveBtn.className = "btn btn-danger";
  leaveBtn.id = "leave-group-btn";
  leaveBtn.innerHTML = '<i class="ri-logout-circle-line"></i> Leave Group';
  leaveBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;

    const res = await fetch("/api/v1/chat/group-leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: data._id }),
    });
    const reply = await res.json();
    if (reply.status) {
      sessionStorage.removeItem("currentChat");
      window.location.reload();
    } else {
      showAlertNotification(reply.message, false);
    }
  });

  footer.appendChild(leaveBtn);

  modal.append(header, body, footer);
  overlay.appendChild(modal);
  return overlay;
}