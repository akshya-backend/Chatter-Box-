import { getFriendList } from "../../modules/friends/get-friendList.js";
import { createGroup } from "../../modules/groups/get-groupList.js";
import { indexedDBLoad } from "../../utils/encryption/create_key.js";
import { encryptGroupKeyForMembers } from "../../utils/encryption/groupEncryption.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

export async function createGroupModal() {
  if (document.getElementById("create-group-modal")) return;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "create-group-modal";

  const modal = document.createElement("div");
  modal.className = "modal";

  // Header
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("div");
  title.className = "modal-title";
  title.textContent = "Create Group";
  header.appendChild(title);

  // Body
  const body = document.createElement("div");
  body.className = "modal-body";

  // Group Name
  const groupNameGroup = document.createElement("div");
  groupNameGroup.className = "form-group";
  groupNameGroup.innerHTML = `
    <label class="form-label">Group Name</label>
    <input type="text" class="form-control" id="group-name" placeholder="Enter group name">
  `;

  // Group Description
  const groupDescGroup = document.createElement("div");
  groupDescGroup.className = "form-group";
  groupDescGroup.innerHTML = `
    <label class="form-label">Group Description (Optional)</label>
    <textarea class="form-control" id="group-description" rows="2" placeholder="Add a description"></textarea>
  `;

  // Add Members
  const addMembersGroup = document.createElement("div");
  addMembersGroup.className = "form-group";
  const addMembersLabel = document.createElement("label");
  addMembersLabel.className = "form-label";
  addMembersLabel.textContent = "Add Members";

  const friendsContainer = document.createElement("div");
  friendsContainer.className = "friends-to-add";
  friendsContainer.id = "friends-to-add";

  const { all } = await getFriendList();
  
  all.forEach(friend => {
    const friendDiv = document.createElement("div");
    friendDiv.className = "friend-option";
    friendDiv.style.display = "flex";
    friendDiv.style.alignItems = "center";
    friendDiv.style.gap = "30px";
    friendDiv.style.marginBottom = "8px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = friend.id;
    checkbox.id = friend.key;
    checkbox.className = "friend-checkbox";

    const avatar = document.createElement("img");
    avatar.src = friend.avatar.url || "/assets/images/user.png";
    avatar.alt = `${friend.name} avatar`;
    avatar.style.width = "32px";
    avatar.style.height = "32px";
    avatar.style.borderRadius = "50%";

    const name = document.createElement("span");
    name.textContent = friend.name;

    friendDiv.appendChild(checkbox);
    friendDiv.appendChild(avatar);
    friendDiv.appendChild(name);
    friendsContainer.appendChild(friendDiv);
  });

  addMembersGroup.appendChild(addMembersLabel);
  addMembersGroup.appendChild(friendsContainer);

  body.appendChild(groupNameGroup);
  body.appendChild(groupDescGroup);
  body.appendChild(addMembersGroup);

  // Footer
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.id = "cancel-create-group";
  cancelBtn.textContent = "Cancel";

  const createBtn = document.createElement("button");
  createBtn.className = "btn btn-primary";
  createBtn.id = "create-group-btn";
  createBtn.textContent = "Create Group";
  createBtn.addEventListener("click", async () => {
    // Get group name and description
    const name = document.getElementById("group-name").value;
    const description = document.getElementById("group-description").value;
    
    // Get selected members 
    const checkboxes = document.querySelectorAll('.friend-checkbox:checked');
    const selectedMembers = Array.from(checkboxes).map(checkbox => checkbox.value);
    const selectedMembersKeyMap = {};

    if (!name) {
      showAlertNotification("Please enter a group name", false);
      return;
    }
    if (selectedMembers.length === 0) {
      showAlertNotification("Please select at least one member", false);
      return;
    }
    
    checkboxes.forEach(checkbox => {
      selectedMembersKeyMap[checkbox.value] = checkbox.id;
    });

    const { userId } = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const myKey = await indexedDBLoad("publicKey");

    const updatedKeyMap = {
      ...selectedMembersKeyMap,
      [userId]: myKey
    };

    const privateKey = await indexedDBLoad("privateKey");
    let encryptedMembers = [];
    let groupKeyraw;
    try {
      if (privateKey) {
        const { encryptedKeys, groupKey } = await encryptGroupKeyForMembers({
          ownPrivateKeyBase64: privateKey,
          memberPublicKeysBase64: updatedKeyMap
        });
        encryptedMembers = encryptedKeys;
        groupKeyraw = groupKey;
      }
  
      // Create group
      const res = await createGroup(
        name,
        description,
        encryptedMembers,
        groupKeyraw,
      );

      if (res.status) {
        showAlertNotification(res.message);
        overlay.remove();
        // destroy session storage
        sessionStorage.removeItem("currentChat");
        // set new current chat
        sessionStorage.setItem("currentChat", JSON.stringify({
          isGroup: true,
          id: res.data._id,
          chatId: res.data.chatId,
          name: res.data.groupName,
          avatar: res.data.picture,
          email: null
        }));
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating group:", error);
      showAlertNotification("Failed to create group. Please try again.", false);
    }
  });

  footer.appendChild(cancelBtn);
  footer.appendChild(createBtn);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  cancelBtn.addEventListener("click", () => {
    overlay.remove();
  });
}