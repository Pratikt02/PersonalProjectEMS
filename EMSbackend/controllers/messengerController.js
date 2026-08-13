import mongoose from "mongoose";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import cloudinary from "../config/cloudinary.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const safeUserFields =
  "name employeeId role department designation profileImage status";

/*
|--------------------------------------------------------------------------
| GET ALL MESSENGER USERS
|--------------------------------------------------------------------------
| Shows ALL non-admin employees.
| status is only used to calculate activeCount.
|--------------------------------------------------------------------------
*/
export const getMessengerUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
    })
      .select(safeUserFields)
      .sort({ name: 1 })
      .lean();

    const activeCount = users.filter(
      (user) => user.status === "active"
    ).length;

    res.json({
      count: users.length,
      activeCount,
      users,
    });
  } catch (error) {
    console.error("Messenger users error:", error);

    res.status(500).json({
      message: "Unable to load Messenger users",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET CONVERSATIONS
|--------------------------------------------------------------------------
*/
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", safeUserFields)
      .populate("admins", safeUserFields)
      .populate("createdBy", "name employeeId role")
      .sort({
        lastMessageAt: -1,
        updatedAt: -1,
      })
      .lean();

    const data = await Promise.all(
      conversations.map(async (conversation) => {
        const latest = await Message.findOne({
          conversation: conversation._id,
        })
          .sort({ createdAt: -1 })
          .populate(
            "sender",
            "name employeeId role profileImage"
          )
          .lean();

        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });

        return {
          ...conversation,
          latestMessage: latest,
          unreadCount,
        };
      })
    );

    res.json({
      conversations: data,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      message: "Unable to load conversations",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE PRIVATE CONVERSATION
|--------------------------------------------------------------------------
| Employees can chat with any employee, even if currently offline.
|--------------------------------------------------------------------------
*/
export const createPrivateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Valid employee is required",
      });
    }

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        message: "You cannot start a chat with yourself",
      });
    }

    const target = await User.findOne({
      _id: userId,
      role: { $ne: "admin" },
    }).select(safeUserFields);

    if (!target) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    let conversation = await Conversation.findOne({
      type: "private",
      participants: {
        $all: [currentUserId, userId],
        $size: 2,
      },
    })
      .populate("participants", safeUserFields)
      .populate("createdBy", "name employeeId role");

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [
          currentUserId,
          userId,
        ],
        createdBy: currentUserId,
      });

      conversation = await Conversation.findById(
        conversation._id
      )
        .populate("participants", safeUserFields)
        .populate(
          "createdBy",
          "name employeeId role"
        );
    }

    res.status(201).json({
      conversation,
    });
  } catch (error) {
    console.error(
      "Create private conversation error:",
      error
    );

    res.status(500).json({
      message: "Unable to start chat",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE BROADCAST
|--------------------------------------------------------------------------
| Admin can send a message to:
| 1. All employees
| 2. Selected employees
|--------------------------------------------------------------------------
*/
export const createBroadcast = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can send company broadcasts",
      });
    }

    const {
      recipientIds = [],
      message,
      title = "Company Announcement",
    } = req.body;

    const cleanMessage = String(
      message || ""
    ).trim();

    if (!cleanMessage) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    let ids = [
      ...new Set(
        (recipientIds || [])
          .filter(isValidId)
          .map(String)
      ),
    ];

    /*
    |--------------------------------------------------------------------------
    | No selected recipients = send to ALL employees
    |--------------------------------------------------------------------------
    */
    if (ids.length === 0) {
      const staff = await User.find({
        role: { $ne: "admin" },
      })
        .select("_id")
        .lean();

      ids = staff.map((item) =>
        item._id.toString()
      );
    }

    if (ids.length === 0) {
      return res.status(400).json({
        message:
          "No employees are available",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate selected employees
    |--------------------------------------------------------------------------
    */
    const validRecipients =
      await User.find({
        _id: { $in: ids },
        role: { $ne: "admin" },
      }).select("_id");

    const recipientObjectIds =
      validRecipients.map(
        (user) => user._id
      );

    if (recipientObjectIds.length === 0) {
      return res.status(400).json({
        message:
          "No valid employees were selected",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Admin + employees
    |--------------------------------------------------------------------------
    */
    const participants = [
      req.user._id,
      ...recipientObjectIds,
    ];

    /*
    |--------------------------------------------------------------------------
    | Create broadcast conversation
    |--------------------------------------------------------------------------
    */
    const conversation =
      await Conversation.create({
        type: "broadcast",

        title: String(
          title ||
            "Company Announcement"
        )
          .trim()
          .slice(0, 120),

        participants,

        createdBy: req.user._id,
      });

    /*
    |--------------------------------------------------------------------------
    | Create message
    |--------------------------------------------------------------------------
    */
    const sentMessage =
      await Message.create({
        conversation:
          conversation._id,

        sender:
          req.user._id,

        text:
          cleanMessage,

        readBy: [
          req.user._id,
        ],
      });

    /*
    |--------------------------------------------------------------------------
    | Update latest message
    |--------------------------------------------------------------------------
    */
    await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        lastMessageText:
          cleanMessage,

        lastMessageAt:
          sentMessage.createdAt,
      }
    );

    const populated =
      await Message.findById(
        sentMessage._id
      ).populate(
        "sender",
        "name employeeId role profileImage"
      );

    res.status(201).json({
      message:
        "Message sent successfully",

      conversationId:
        conversation._id,

      message:
        populated,

      recipientCount:
        recipientObjectIds.length,
    });
  } catch (error) {
    console.error(
      "Broadcast error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to send company message",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE GROUP
|--------------------------------------------------------------------------
| Admins can create team/group conversations with a title and members.
*/
export const createGroup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create groups" });
    }

    const { title = "Group", participantIds = [] } = req.body;

    const cleanTitle = String(title || "").trim().slice(0, 120);

    let ids = [
      ...new Set((participantIds || []).filter(isValidId).map(String)),
    ];

    if (ids.length === 0) {
      return res.status(400).json({ message: "Select at least one member for the group" });
    }

    const validParticipants = await User.find({ _id: { $in: ids }, role: { $ne: "admin" } }).select("_id");

    const participantObjectIds = validParticipants.map((u) => u._id);

    if (participantObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid employees were selected" });
    }

    const participants = [req.user._id, ...participantObjectIds];

    const conversation = await Conversation.create({
      type: "group",
      title: cleanTitle || "Group",
      participants,
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", safeUserFields)
      .populate("createdBy", "name employeeId role");

    res.status(201).json({ conversation: populated });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ message: "Unable to create group" });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE CONVERSATION (GROUP)
|--------------------------------------------------------------------------
| Allow admins or the conversation creator to delete a group conversation.
*/
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!isValidId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Only group conversations can be deleted via this endpoint" });
    }

    // Only admins or the creator can delete
    if (String(req.user.role) !== "admin" && String(conversation.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to delete this group" });
    }

    // Delete messages and conversation
    await Message.deleteMany({ conversation: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });

    res.json({ message: "Conversation deleted", conversationId: conversation._id });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: "Unable to delete conversation" });
  }
};

/*
|--------------------------------------------------------------------------
| ADD PARTICIPANT TO GROUP
|--------------------------------------------------------------------------
*/
export const addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { participantId } = req.body;

    if (!isValidId(conversationId) || !isValidId(participantId)) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.type !== "group") return res.status(400).json({ message: "Can only add participants to groups" });

    // Only admins or creator can add
    const isGroupAdmin = (conversation.admins || []).map(String).includes(String(userId));
    if (String(req.user.role) !== "admin" && !isGroupAdmin && String(conversation.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to modify group members" });
    }

    // Validate user exists and is not admin
    const user = await User.findOne({ _id: participantId, role: { $ne: "admin" } }).select("_id name");
    if (!user) return res.status(404).json({ message: "User not found or invalid" });

    // Prevent duplicates
    if (conversation.participants.map(String).includes(String(participantId))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    conversation.participants.push(participantId);
    await conversation.save();

    const populated = await Conversation.findById(conversation._id).populate("participants", safeUserFields).populate("admins", safeUserFields).populate("createdBy", "name employeeId role");

    res.json({ conversation: populated });
  } catch (error) {
    console.error("Add participant error:", error);
    res.status(500).json({ message: "Unable to add participant" });
  }
};

/*
|--------------------------------------------------------------------------
| ADD ADMIN TO GROUP
|--------------------------------------------------------------------------
*/
export const addAdmin = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { adminId } = req.body;

    if (!isValidId(conversationId) || !isValidId(adminId)) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.type !== "group") return res.status(400).json({ message: "Can only add admins to groups" });

    // Only system admins can assign group admins
    if (String(req.user.role) !== "admin") {
      return res.status(403).json({ message: "Only system admins can assign group admins" });
    }

    // Ensure the user is a participant
    if (!conversation.participants.map(String).includes(String(adminId))) {
      return res.status(400).json({ message: "User must be a participant to be made admin" });
    }

    // Prevent duplicates
    if (conversation.admins.map(String).includes(String(adminId))) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Max 5 admins
    if ((conversation.admins || []).length >= 5) {
      return res.status(400).json({ message: "Maximum of 5 admins allowed for a group" });
    }

    conversation.admins.push(adminId);
    await conversation.save();

    const populated = await Conversation.findById(conversation._id).populate("participants", safeUserFields).populate("admins", safeUserFields).populate("createdBy", "name employeeId role");

    res.json({ conversation: populated });
  } catch (error) {
    console.error("Add admin error:", error);
    res.status(500).json({ message: "Unable to add admin" });
  }
};

/*
|--------------------------------------------------------------------------
| REMOVE ADMIN FROM GROUP
|--------------------------------------------------------------------------
*/
export const removeAdmin = async (req, res) => {
  try {
    const { conversationId, adminId } = req.params;

    if (!isValidId(conversationId) || !isValidId(adminId)) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.type !== "group") return res.status(400).json({ message: "Can only remove admins from groups" });

    // Only system admins can remove group admins
    if (String(req.user.role) !== "admin") {
      return res.status(403).json({ message: "Only system admins can remove group admins" });
    }

    // Prevent removing creator
    if (String(conversation.createdBy) === String(adminId)) {
      return res.status(400).json({ message: "Cannot remove the group creator from admins" });
    }

    const exists = (conversation.admins || []).map(String).includes(String(adminId));
    if (!exists) return res.status(404).json({ message: "Admin not found" });

    conversation.admins = (conversation.admins || []).filter((a) => String(a) !== String(adminId));
    await conversation.save();

    const populated = await Conversation.findById(conversation._id).populate("participants", safeUserFields).populate("admins", safeUserFields).populate("createdBy", "name employeeId role");

    res.json({ conversation: populated });
  } catch (error) {
    console.error("Remove admin error:", error);
    res.status(500).json({ message: "Unable to remove admin" });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE GROUP NAME
|--------------------------------------------------------------------------
*/
export const updateGroupName = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { title } = req.body;

    if (!isValidId(conversationId)) return res.status(400).json({ message: "Invalid conversation" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.type !== "group") return res.status(400).json({ message: "Only groups can be renamed" });

    // Only system admins, group admins, or the creator can rename
    const isGroupAdmin = (conversation.admins || []).map(String).includes(String(userId));
    if (String(req.user.role) !== "admin" && !isGroupAdmin && String(conversation.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to rename group" });
    }

    const clean = String(title || "").trim().slice(0, 120);
    if (!clean) return res.status(400).json({ message: "Title cannot be empty" });

    conversation.title = clean;
    await conversation.save();

    const populated = await Conversation.findById(conversation._id).populate("participants", safeUserFields).populate("admins", safeUserFields).populate("createdBy", "name employeeId role");

    res.json({ conversation: populated });
  } catch (error) {
    console.error("Update group name error:", error);
    res.status(500).json({ message: "Unable to update group name" });
  }
};

/*
|--------------------------------------------------------------------------
| REMOVE PARTICIPANT FROM GROUP
|--------------------------------------------------------------------------
*/
export const removeParticipant = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user._id;

    if (!isValidId(conversationId) || !isValidId(participantId)) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.type !== "group") return res.status(400).json({ message: "Can only remove participants from groups" });

    // Only admins or creator can remove
    const isGroupAdminRemove = (conversation.admins || []).map(String).includes(String(userId));
    if (String(req.user.role) !== "admin" && !isGroupAdminRemove && String(conversation.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to modify group members" });
    }

    // Prevent removing the creator
    if (String(conversation.createdBy) === String(participantId)) {
      return res.status(400).json({ message: "Cannot remove the group creator" });
    }

    const exists = conversation.participants.map(String).includes(String(participantId));
    if (!exists) return res.status(404).json({ message: "Participant not found in group" });

    conversation.participants = conversation.participants.filter((p) => String(p) !== String(participantId));
    await conversation.save();

    const populated = await Conversation.findById(conversation._id).populate("participants", safeUserFields).populate("admins", safeUserFields).populate("createdBy", "name employeeId role");

    res.json({ conversation: populated });
  } catch (error) {
    console.error("Remove participant error:", error);
    res.status(500).json({ message: "Unable to remove participant" });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE GROUP PROFILE IMAGE
|--------------------------------------------------------------------------
*/
export const updateGroupProfileImage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!isValidId(conversationId)) return res.status(400).json({ message: "Invalid conversation" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.type !== "group") return res.status(400).json({ message: "Only groups can have profile images" });

    // Only admins or creator can update image
    if (String(req.user.role) !== "admin" && String(conversation.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to modify group" });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploaded = await cloudinary.uploader.upload(dataUri, { resource_type: "image" });
      conversation.profileImage = uploaded.secure_url;
      await conversation.save();

      const populated = await Conversation.findById(conversation._id).populate("participants", safeUserFields).populate("admins", safeUserFields).populate("createdBy", "name employeeId role");

      return res.json({ conversation: populated });
    } catch (err) {
      console.error("Profile image upload failed:", err);
      return res.status(500).json({ message: "Image upload failed" });
    }
  } catch (error) {
    console.error("Update group profile image error:", error);
    res.status(500).json({ message: "Unable to update profile image" });
  }
};

/*
|--------------------------------------------------------------------------
| GET MESSAGES
|--------------------------------------------------------------------------
*/
export const getMessages = async (
  req,
  res
) => {
  try {
    const {
      conversationId,
    } = req.params;

    const userId =
      req.user._id;

    if (!isValidId(conversationId)) {
      return res.status(400).json({
        message:
          "Invalid conversation",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check whether user belongs to conversation
    |--------------------------------------------------------------------------
    */
    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

    if (!conversation) {
      return res.status(404).json({
        message:
          "Conversation not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Get messages
    |--------------------------------------------------------------------------
    */
    const messages =
      await Message.find({
        conversation:
          conversationId,
      })
        .sort({
          createdAt: 1,
        })
        .limit(300)
        .populate(
          "sender",
          "name employeeId role profileImage"
        )
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Mark messages as read
    |--------------------------------------------------------------------------
    */
    await Message.updateMany(
      {
        conversation:
          conversationId,

        sender: {
          $ne: userId,
        },

        readBy: {
          $ne: userId,
        },
      },
      {
        $addToSet: {
          readBy: userId,
        },
      }
    );

    res.json({
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to load messages",
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE MESSAGE
|--------------------------------------------------------------------------
| Only the sender can delete their own message.
|--------------------------------------------------------------------------
*/
export const deleteMessage = async (
  req,
  res
) => {
  try {
    const {
      messageId,
    } = req.params;

    const userId =
      req.user._id;

    /*
    |--------------------------------------------------------------------------
    | Validate message ID
    |--------------------------------------------------------------------------
    */
    if (!isValidId(messageId)) {
      return res.status(400).json({
        message:
          "Invalid message",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find only the message owned by current user
    |--------------------------------------------------------------------------
    */
    const message =
      await Message.findOne({
        _id: messageId,
        sender: userId,
      });

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found or you are not allowed to delete it",
      });
    }

    const conversationId =
      message.conversation;

    /*
    |--------------------------------------------------------------------------
    | Delete message permanently
    |--------------------------------------------------------------------------
    */
    await Message.deleteOne({
      _id: message._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Find previous/latest message
    |--------------------------------------------------------------------------
    */
    const previousMessage =
      await Message.findOne({
        conversation:
          conversationId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Update conversation preview
    |--------------------------------------------------------------------------
    */
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessageText:
          previousMessage?.text ||
          "",

        lastMessageAt:
          previousMessage?.createdAt ||
          new Date(),
      }
    );

    res.json({
      message:
        "Message deleted successfully",

      messageId,

      conversationId,
    });
  } catch (error) {
    console.error(
      "Delete message error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to delete message",
    });
  }
};

/*
|--------------------------------------------------------------------------
| EDIT MESSAGE
|--------------------------------------------------------------------------
| Only the sender can edit their own message. If the edited message is the
| latest in the conversation, update the conversation preview as well.
*/
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!isValidId(messageId)) {
      return res.status(400).json({ message: "Invalid message" });
    }

    const newText = String(req.body?.text || "").trim();

    if (!newText) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = await Message.findOne({ _id: messageId, sender: userId });

    if (!message) {
      return res.status(404).json({ message: "Message not found or you are not allowed to edit it" });
    }

    message.text = newText;
    message.edited = true;
    await message.save();

    // If this is the latest message for the conversation, update conversation preview.
    const latest = await Message.findOne({ conversation: message.conversation }).sort({ createdAt: -1 }).lean();

    if (latest && String(latest._id) === String(message._id)) {
      await Conversation.findByIdAndUpdate(message.conversation, { lastMessageText: newText });
    }

    const populated = await Message.findById(message._id).populate("sender", "name employeeId role profileImage");

    res.json({ message: populated });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({ message: "Unable to edit message" });
  }
};

/*
|--------------------------------------------------------------------------
| SEND MESSAGE
|--------------------------------------------------------------------------
*/
export const sendMessage = async (
  req,
  res
) => {
  try {
    const {
      conversationId,
    } = req.params;

    const userId =
      req.user._id;

    const text = String(
      req.body?.text || ""
    ).trim();

    /*
    |--------------------------------------------------------------------------
    | Validate conversation
    |--------------------------------------------------------------------------
    */
    if (!isValidId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }

    /*
    |--------------------------------------------------------------------------
    | Check conversation membership
    |--------------------------------------------------------------------------
    */
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const files = req.files || [];
    const attachments = [];

    if (files.length > 0) {
      for (const file of files) {
        try {
          const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
          const uploaded = await cloudinary.uploader.upload(dataUri, { resource_type: "auto" });
          attachments.push({ url: uploaded.secure_url, filename: file.originalname, mimetype: file.mimetype });
        } catch (err) {
          console.error("Attachment upload failed:", err);
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Validate text or attachments
    |--------------------------------------------------------------------------
    */
    if (!text && attachments.length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    /*
    |--------------------------------------------------------------------------
    | Create message
    |--------------------------------------------------------------------------
    */
    const message =
      await Message.create({
        conversation: conversationId,
        sender: userId,
        text,
        attachments,
        readBy: [userId],
      });

    /*
    |--------------------------------------------------------------------------
    | Update conversation
    |--------------------------------------------------------------------------
    */
    conversation.lastMessageText =
      text;

    conversation.lastMessageAt =
      message.createdAt;

    await conversation.save();

    /*
    |--------------------------------------------------------------------------
    | Populate sender
    |--------------------------------------------------------------------------
    */
    const populated =
      await Message.findById(
        message._id
      ).populate(
        "sender",
        "name employeeId role profileImage"
      );

    res.status(201).json({
      message:
        populated,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to send message",
    });
  }
};