
  export async function fetchGroupList() {
 
     const response = await fetch('/api/v1/chat/group-list', {
             method: 'GET',
             headers: { 'Content-Type': 'application/json' },
         });
 
         const res = await response.json();
         console.log(res);
         
         if (res.status) {
             const  objectELement= groupList(res.data)
             const groupsSection = document.querySelector('.groups-section');
             
             groupsSection.innerHTML=''
             groupsSection.append(objectELement)
             
         }   
} 

export async function renderGroupInfo() {
  const container = document.getElementById("chatArea");
  const id = document.getElementById("groupSetting").getAttribute("data");
  const response = await fetch(`/api/v1/chat/group-info/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  const { isAdmin, myId, ...group } = data.data;

  // Create Wrapper with Animation
  const wrapper = document.createElement("div");
  wrapper.classList.add("group-info-wrapper", "fade-in");
  container.appendChild(wrapper);

  // Back Button
  const backButton = document.createElement("button");
  backButton.classList.add("group-info-back-button");
  backButton.innerHTML = `<i class="ri-arrow-left-line"></i>`;
  backButton.addEventListener("click", () => {
    wrapper.classList.add("fade-out");
    setTimeout(() => wrapper.remove(), 300); // Match animation duration
  });
  wrapper.appendChild(backButton);

  // Settings Icon (Tree Dot)
  const settingsIcon = document.createElement("i");
  settingsIcon.classList.add("ri-more-2-fill", "group-info-settings-icon");
  settingsIcon.style.cursor = "pointer";
  settingsIcon.style.color = "white";
  
  // Settings Dropdown
  const settingsDropdown = document.createElement("div");
  settingsDropdown.classList.add("group-info-settings-dropdown");
  settingsDropdown.id="group-drop-id"
 settingsIcon.onclick = (e) => {
  e.stopPropagation(); // Prevent click event from bubbling to document
  settingsDropdown.style.display = 
  settingsDropdown.style.display === "block" ? "none" : "block";
};
document.addEventListener("click", (e) => {
  if (!settingsDropdown.contains(e.target) && !settingsIcon.contains(e.target)) {
    settingsDropdown.style.display = "none";
  }
});
  if (isAdmin) {
    const changeNameOption = createDropdownOption("Change Group Name", "ri-pencil-line ", () => {
      groupNameDisplay.style.display = "none";
      groupNameInput.style.display = "block";
      groupNameInput.focus();
      settingsDropdown.style.display = "none";
    });

    const changeDescriptionOption = createDropdownOption("Change Description", "ri-file-text-line", () => {
      descriptionDisplay.style.display = "none";
      descriptionInput.style.display = "block";
      descriptionInput.focus();
      settingsDropdown.style.display = "none";
    });

    const changePictureOption = createDropdownOption("Change Group Picture", "ri-image-line", () => {
      document.getElementById("groupInfoInput").click();
      settingsDropdown.style.display = "none";
    });

    const addMemberOption = createDropdownOption("Add Member", "ri-user-add-line", () => {
      showAddMemberModal();
      settingsDropdown.style.display = "none";
    });
    const leaveGroupOption = createDropdownOption("Leave Group", "ri-logout-circle-line", () => {
  leaveGroup();
  settingsDropdown.style.display = "none";
});

// Append the dropdown to the header
    settingsDropdown.appendChild(changeNameOption);
    settingsDropdown.appendChild(changeDescriptionOption);
    settingsDropdown.appendChild(changePictureOption);
    settingsDropdown.appendChild(addMemberOption);
    settingsDropdown.appendChild(leaveGroupOption);

  }

  // Header with Back Button and Settings Icon
  const header = document.createElement("div");
  header.classList.add("group-info-header");
  header.appendChild(backButton);
  header.appendChild(settingsIcon);
  header.appendChild(settingsDropdown);
  wrapper.appendChild(header);

  // Profile Section
  const profileSection = document.createElement("div");
  profileSection.classList.add("group-info-profile");

  const profileImg = document.createElement("div");
  profileImg.classList.add("group-info-img");

  if (group.picture) {
    profileImg.style.backgroundImage = `url(${group.picture})`;
  } else {
    const profileInitials = document.createElement("span");
    profileInitials.id = "groupInfoInitials";
    profileInitials.textContent = group.groupName.substring(0, 2).toUpperCase();
    profileImg.appendChild(profileInitials);
  }

  if (isAdmin) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "groupInfoInput";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profileImg.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
      }
    });
    profileImg.appendChild(fileInput);
  }

  // Group Name with Edit Input
  const groupNameContainer = document.createElement("div");
  groupNameContainer.classList.add("group-info-name-container");

  const groupNameDisplay = document.createElement("h1");
  groupNameDisplay.classList.add("group-info-name");
  groupNameDisplay.textContent = group.groupName;

  const groupNameInput = document.createElement("input");
  groupNameInput.type = "text";
  groupNameInput.classList.add("group-info-name-input");
  groupNameInput.style.display = "none";
  groupNameInput.value = group.groupName;

  groupNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveGroupName(groupNameInput.value.trim(),groupNameDisplay,groupNameInput);
  });

  groupNameInput.addEventListener("blur", () => {
    saveGroupName(groupNameInput.value.trim(),groupNameDisplay,groupNameInput);
  });

  groupNameContainer.appendChild(groupNameDisplay);
  groupNameContainer.appendChild(groupNameInput);

  // Group Description with Edit Input
  const descriptionSection = document.createElement("div");
  descriptionSection.classList.add("group-info-description");

  const descriptionDisplay = document.createElement("p");
  descriptionDisplay.textContent = group.description || "Welcome to the Chatter Box Group";

  const descriptionInput = document.createElement("input");
  descriptionInput.type = "text";
  descriptionInput.classList.add("group-info-description-input");
  descriptionInput.style.display = "none";
  descriptionInput.value = group.description || "";

  descriptionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveGroupDescription(descriptionInput.value.trim(),descriptionDisplay,descriptionInput);
  });

  descriptionInput.addEventListener("blur", () => {
    saveGroupDescription(descriptionInput.value.trim(),descriptionDisplay,descriptionInput);
  });

  descriptionSection.appendChild(descriptionDisplay);
  descriptionSection.appendChild(descriptionInput);

  const groupMembers = document.createElement("p");
  groupMembers.classList.add("group-info-members");
  groupMembers.textContent = `Members: ${group.members.length}`;

  profileSection.appendChild(profileImg);
  profileSection.appendChild(groupNameContainer);
  profileSection.appendChild(descriptionSection);
  profileSection.appendChild(groupMembers);

  // Members List
  const membersList = document.createElement("div");
  membersList.classList.add("group-info-members-list");

  group.members.forEach((member) => {
    const memberCard = createMemberCard(member, isAdmin, myId);
    membersList.appendChild(memberCard);
  });

  wrapper.appendChild(profileSection);
  wrapper.appendChild(membersList);
}

// Helper Functions
function createDropdownOption(text, iconClass, onClick) {
  const option = document.createElement("div");
  option.classList.add("group-info-settings-option");
  option.innerHTML = `<i class="${iconClass}"></i> ${text}`;
  option.addEventListener("click", onClick);
  return option;
}

function createMemberCard(member, isAdmin, myId) {
  const memberCard = document.createElement("div");
  memberCard.classList.add("group-info-member-card");

  // Member Details
  const memberDetails = document.createElement("div");
  memberDetails.classList.add("group-info-member-details");

  const memberAvatar = document.createElement("div");
  memberAvatar.classList.add("group-info-member-avatar");

  if (member.profilePicture) {
    memberAvatar.style.backgroundImage = `url(${member.profilePicture})`;
  } else {
    const memberInitials = document.createElement("span");
    memberInitials.textContent = member.name.substring(0, 2).toUpperCase();
    memberAvatar.appendChild(memberInitials);
  }

  const memberText = document.createElement("div");
  memberText.classList.add("group-info-member-text");

  const memberName = document.createElement("span");
  memberName.classList.add("group-info-member-name");
  memberName.textContent = member.name;

  const memberRole = document.createElement("span");
  memberRole.classList.add("group-info-member-role");
  memberRole.textContent = member.isAdmin ? "Admin" : "User";

  memberText.appendChild(memberName);
  memberText.appendChild(memberRole);
  memberDetails.appendChild(memberAvatar);
  memberDetails.appendChild(memberText);
  memberCard.appendChild(memberDetails);

  // Member Actions
  if (member._id !== myId) {
    const memberActions = document.createElement("div");
    memberActions.classList.add("group-info-member-actions");

    const dropdown = document.createElement("div");
    dropdown.classList.add("group-info-dropdown");

    const moreBtn = document.createElement("button");
    moreBtn.classList.add("group-info-btn", "group-info-more-btn");
    moreBtn.innerHTML = `<i class="ri-more-2-fill"></i>`;

    const dropdownContent = document.createElement("div");
    dropdownContent.classList.add("group-info-dropdown-content");
     
     if (isAdmin && !member.isAdmin) {
      const promoteAdminBtn = document.createElement("button");
      promoteAdminBtn.classList.add("group-info-settings-option", "promote-admin");
      promoteAdminBtn.innerHTML = `<i class="ri-user-star-line"></i> Make Admin`;
      promoteAdminBtn.addEventListener("click", () => promoteToAdmin(member._id));
      dropdownContent.appendChild(promoteAdminBtn);
    }

    if (isAdmin && member._id !== myId) {
      const kickBtn = document.createElement("button");
      kickBtn.classList.add("group-info-settings-option");
      kickBtn.innerHTML = `<i class="ri-user-unfollow-line"></i> Kick`;
      kickBtn.addEventListener("click", () => kickMember(member._id));
      dropdownContent.appendChild(kickBtn);
    }

    if (member.isFriend) {
      const chatBtn = document.createElement("button");
      chatBtn.classList.add("group-info-settings-option");
      chatBtn.innerHTML = `<i class="ri-chat-3-line"></i> Chat`;
      chatBtn.addEventListener("click", () => startChat(member._id));
      dropdownContent.appendChild(chatBtn);
    }

    if (!member.isFriend) {
      const addFriendBtn = document.createElement("button");
      addFriendBtn.classList.add("group-info-settings-option");
      addFriendBtn.innerHTML = `<i class="ri-user-add-line"></i> Add Friend`;
      addFriendBtn.addEventListener("click", () => addFriend(member._id));
      dropdownContent.appendChild(addFriendBtn);
    }

    dropdown.appendChild(moreBtn);
    dropdown.appendChild(dropdownContent);
    memberActions.appendChild(dropdown);
    memberCard.appendChild(memberActions);
  }

  return memberCard;
}

// Function to save group name
async function saveGroupName(newName,groupNameDisplay,groupNameInput) {
  if (!newName) return; // Ignore empty names

  try {
    // const response = await fetch(`/api/v1/chat/update-group-name`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ groupId: id, newName }),
    // });

    // if (response.ok) {
    console.log(groupNameDisplay,groupNameInput);
    
      groupNameDisplay.textContent = newName; // Update displayed name
      groupNameDisplay.style.display = "block"; // Show display text
      groupNameInput.style.display = "none"; // Hide input field
    // } else {
      console.error("Failed to update group name");
    // }
  } catch (error) {
    console.error("Error updating group name:", error);
  }
}

// Function to save group description
async function saveGroupDescription(newDescription) {
  try {
    const response = await fetch(`/api/v1/chat/update-group-description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id, newDescription }),
    });

    if (response.ok) {
      descriptionDisplay.textContent = newDescription; // Update displayed description
      descriptionDisplay.style.display = "block"; // Show display text
      descriptionInput.style.display = "none"; // Hide input field
    } else {
      console.error("Failed to update group description");
    }
  } catch (error) {
    console.error("Error updating group description:", error);
  }
}

// Function to show a modal for adding members
function showAddMemberModal() {
  const modal = document.createElement("div");
  modal.classList.add("group-info-add-member-modal");

  const modalContent = document.createElement("div");
  modalContent.classList.add("group-info-add-member-modal-content");

  const closeButton = document.createElement("span");
  closeButton.classList.add("group-info-add-member-modal-close");
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  const modalHeader = document.createElement("div");
  modalHeader.classList.add("group-info-add-member-modal-header");
  modalHeader.textContent = "Add Member";

  const modalBody = document.createElement("div");
  modalBody.classList.add("group-info-add-member-modal-body");

  // Fetch and display friends to add
  fetchFriendsToAdd().then(friends => {
    friends.forEach(friend => {
      const friendCard = document.createElement("div");
      friendCard.classList.add("group-info-add-member-friend-card");

      const friendAvatar = document.createElement("div");
      friendAvatar.classList.add("group-info-add-member-friend-avatar");

      if (friend.profilePicture) {
        friendAvatar.style.backgroundImage = `url(${friend.profilePicture})`;
      } else {
        const friendInitials = document.createElement("span");
        friendInitials.textContent = friend.name.substring(0, 2).toUpperCase();
        friendAvatar.appendChild(friendInitials);
      }

      const friendName = document.createElement("span");
      friendName.classList.add("group-info-add-member-friend-name");
      friendName.textContent = friend.name;

      const addButton = document.createElement("button");
      addButton.classList.add("group-info-add-member-friend-add-button");
      addButton.textContent = "Add";
      addButton.addEventListener("click", () => {
        addMemberToGroup(friend._id);
      });

      friendCard.appendChild(friendAvatar);
      friendCard.appendChild(friendName);
      friendCard.appendChild(addButton);
      modalBody.appendChild(friendCard);
    });
  });

  modalContent.appendChild(closeButton);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// Function to fetch friends to add
async function fetchFriendsToAdd() {
  try {
    const response = await fetch(`/api/v1/chat/friends-to-add`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data;
    } else {
      console.error("Failed to fetch friends to add");
      return [];
    }
  } catch (error) {
    console.error("Error fetching friends to add:", error);
    return [];
  }
}

// Function to add a member to the group
async function addMemberToGroup(memberId) {
  try {
    const response = await fetch(`/api/v1/chat/add-member-to-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id, memberId }),
    });

    if (response.ok) {
      // Refresh the group info
      renderGroupInfo();
    } else {
      console.error("Failed to add member to group");
    }
  } catch (error) {
    console.error("Error adding member to group:", error);
  }
}
// Function to promote a member to admin
async function promoteToAdmin(memberId) {
  const confirmPromote = confirm("Are you sure you want to promote this member to admin?");
  if (!confirmPromote) return;

  try {
    const response = await fetch(`/api/v1/chat/promote-to-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id, memberId }),
    });

    if (response.ok) {
      alert("Member promoted to admin successfully.");
      window.location.reload(); // Refresh the page to reflect changes
    } else {
      console.error("Failed to promote member to admin");
    }
  } catch (error) {
    console.error("Error promoting member to admin:", error);
  }
}
// Function to handle leaving the group
async function leaveGroup() {
  const confirmLeave = confirm("Are you sure you want to leave this group?");
  if (!confirmLeave) return;

  try {
    const response = await fetch(`/api/v1/chat/leave-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id }),
    });

    if (response.ok) {
      alert("You have left the group.");
      window.location.reload(); // Refresh the page or redirect
    } else {
      console.error("Failed to leave the group");
    }
  } catch (error) {
    console.error("Error leaving the group:", error);
  }
}

 export async function createGroup(groupName, description,encryptedKey,groupKey) {
  console.log("createGroup function called",encryptedKey);
  
  try {
    const response = await fetch(`/api/v1/chat/create-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName, description, members: encryptedKey,groupKey }),
    });
      const data = await response.json();
      return data;

  } catch (error) {
    console.error("Error creating group:", error);
    return null;
  }
}