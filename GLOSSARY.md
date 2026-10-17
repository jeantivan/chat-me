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
_Avoid_: Message status, receipt, ack state

**Reaction**:
An emoji glyph affixed to an individual message by a specific user.
_Avoid_: Like, vote, emoji response
