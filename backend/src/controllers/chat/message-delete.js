import Message from "../../models/message-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

export const messageDelete = async (req, res) => {
  try {
    const userId = extractAuthenticatedUserId(req);
    const { messageId } = req.body;

    if (!messageId) {
      return res.json({ status: false, message: "Message ID is required" });
    }

    // Fetch the message first
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ status: false, message: "Message not found" });
    }

    // Only the sender can delete the message
    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({ status: false, message: " You can only delete your own messages" });
    }

    message.isdeletedBy = true;
    await message.save();

    res.json({ status: true, message: "Message deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
