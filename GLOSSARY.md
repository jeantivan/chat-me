# Real-Time Messaging

The core domain for `chat-me`, a real-time messaging application providing direct and group communication modeled after modern web messengers.

## Language

**Chat**:
A persistent direct (1-on-1) or group conversation between registered participants.
_Avoid_: Room, channel, thread, conversation

**Participant**:
A registered user who is a member of a specific chat and entitled to receive and send messages within it.
_Avoid_: Member, subscriber, listener

**Message**:
A discrete communication payload sent by a participant inside a chat, comprising textual content, optional media attachments, and delivery state.
_Avoid_: Post, entry, item, comment

**Delivery Status**:
The progressive lifecycle state of a message representing whether it is pending dispatch (`idle`), acknowledged by the server (`send`), delivered to recipient devices (`received`), or viewed in the recipient's active viewport (`read`).
_Avoid_: Message status, ack state

**Receipt**:
A record establishing that an individual participant's client has received or read a specific message.
_Avoid_: Confirmation, delivery tag

**Direct Chat**:
A private, two-party chat strictly bound to exactly two participants, where only one unique thread can ever exist between that pair.
_Avoid_: 1-on-1 room, private message, DM

**Read Watermark**:
A timestamp associated with a participant in a chat marking the latest point in the conversation timeline viewed by that user, used to compute unread counts.
_Avoid_: Unread counter, read pointer

**Reaction**:
An emoji glyph affixed to an individual message by a specific user.
_Avoid_: Like, vote, emoji response

**Media Attachment**:
A binary asset (image, video, audio note, or document) associated with a message and stored in object storage.
_Avoid_: File upload, asset, payload blob

**Presigned Upload URL**:
A cryptographically signed, short-lived S3 URL permitting a client to PUT a binary asset directly to object storage without server mediation.
_Avoid_: Upload token, upload ticket

