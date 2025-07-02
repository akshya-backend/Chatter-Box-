import { sendfriendRequest } from "../../modules/friends/send-friendRequest.js";

 export function AddFriendModal() {
    // Check if modal already exists
    if (document.getElementById("add-friend-modal")) return;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "add-friend-modal";

    const modal = document.createElement("div");
    modal.className = "modal";

    const header = document.createElement("div");
    header.className = "modal-header";

    const title = document.createElement("div");
    title.className = "modal-title";
    title.textContent = "Add Friend";

   
    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "modal-body";

    const group1 = document.createElement("div");
    group1.className = "form-group";

    const label1 = document.createElement("label");
    label1.className = "form-label";
    label1.textContent = "Email Address";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control";
    input.id = "friend-username";
    input.placeholder = "Enter email address";
    input.required = true;

    group1.appendChild(label1);
    group1.appendChild(input);

    const group2 = document.createElement("div");
    group2.className = "form-group";

    const label2 = document.createElement("label");
    label2.className = "form-label";
    label2.textContent = "Message (Optional)";

    const textarea = document.createElement("textarea");
    textarea.className = "form-control";
    textarea.id = "friend-message";
    textarea.rows = 3;
    textarea.placeholder = "Add a personal message";

    group2.appendChild(label2);
    group2.appendChild(textarea);

    body.appendChild(group1);
    body.appendChild(group2);

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.id = "cancel-add-friend";
    cancelBtn.textContent = "Cancel";

    const sendBtn = document.createElement("button");
    sendBtn.className = "btn btn-primary";
    sendBtn.id = "send-friend-request";
    sendBtn.textContent = "Send Request";
    sendBtn.addEventListener("click", () => {

        const email = input.value;
        const message = textarea.value;
        sendfriendRequest(email, message,overlay);
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(sendBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

  
    cancelBtn.addEventListener("click", () => {
              overlay.remove()

    });
}
