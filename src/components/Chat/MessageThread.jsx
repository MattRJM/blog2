import { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot, query, collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { styles } from "../../utils/helpers";

export default function MessageThread({
  conversationId,
  otherUserId,
  otherUserName,
  currentUserId,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [actualConversationId, setActualConversationId] = useState(conversationId);
  const [userNameDisplay, setUserNameDisplay] = useState(otherUserName);

  // ✅ Fetch user name (separately)
  useEffect(() => {
    if (!otherUserId) return;

    const fetchUserName = async () => {
      try {
        const userRef = doc(db, "users", otherUserId);
        const unsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const userData = snap.data();
            setUserNameDisplay(userData.name || userData.email || otherUserId);
          } else {
            setUserNameDisplay(otherUserId);
          }
        });

        return () => unsub();
      } catch (err) {
        console.error("Error fetching name:", err);
        setUserNameDisplay(otherUserId);
      }
    };

    fetchUserName();
  }, [otherUserId]);

  // ✅ If conversationId is null, create new conversation
  useEffect(() => {
    if (conversationId) {
      setActualConversationId(conversationId);
      setLoading(false);
      return;
    }

    // Create new conversation if it doesn't exist
    const createConversation = async () => {
      try {
        // ✅ FIRST: Search for existing conversation (WITHOUT WHERE)
        const conversationsRef = collection(db, "conversations");
        const querySnapshot = await getDocs(conversationsRef);

        let existingConversation = null;
        querySnapshot.forEach((doc) => {
          const members = doc.data().members || [];
          // Check if it has EXACTLY these 2 users
          const hasCurrentUser = members.includes(currentUserId);
          const hasOtherUser = members.includes(otherUserId);
          const onlyTwoMembers = members.length === 2;

          if (hasCurrentUser && hasOtherUser && onlyTwoMembers) {
            existingConversation = doc.id;
          }
        });

        // ✅ If conversation exists, use it
        if (existingConversation) {
          setActualConversationId(existingConversation);
          console.log("Existing conversation found:", existingConversation);
          setLoading(false);
          return;
        }

        // ✅ If it doesn't exist, create new one
        // Create conversation document
        const newConvRef = await addDoc(collection(db, "conversations"), {
          members: [currentUserId, otherUserId],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
        });

        setActualConversationId(newConvRef.id);
        setLoading(false);
        console.log("New conversation created:", newConvRef.id);
      } catch (err) {
        console.error("Error creating conversation:", err);
        setLoading(false);
      }
    };

    createConversation();
  }, [conversationId, currentUserId, otherUserId]);

  // ✅ REAL-TIME listener for messages
  useEffect(() => {
    if (!actualConversationId) return;

    const messagesRef = collection(db, "conversations", actualConversationId, "messages");
    const q = query(messagesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // ✅ Sort by timestamp
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeA - timeB;
      });

      setMessages(msgs);

      // ✅ Scroll to bottom
      setTimeout(() => {
        const messagesDiv = document.getElementById("messages-container");
        if (messagesDiv) {
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [actualConversationId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !actualConversationId) return;

    const messageText = inputValue.trim();
    setInputValue("");

    try {
      // ✅ Add message to subcollection
      const messagesRef = collection(db, "conversations", actualConversationId, "messages");
      await addDoc(messagesRef, {
        sender: currentUserId,
        text: messageText,
        timestamp: serverTimestamp(),
      });

      // ✅ Update last message in conversation
      const convRef = doc(db, "conversations", actualConversationId);
      await updateDoc(convRef, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
      });

      console.log("Message sent successfully!");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Error sending message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && !actualConversationId) {
    return (
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 400,
          height: 600,
          background: "#fff",
          border: "1px solid #ddd",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ padding: 12, textAlign: "center", color: "#999" }}>
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 400,
        height: 600,
        background: "#fff",
        border: "1px solid #ddd",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          background: "#f9f9f9",
        }}
      >
        <span>💬 {userNameDisplay}</span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            padding: 0,
            width: 24,
            height: 24,
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        id="messages-container"
        style={{
          flex: 1,
          padding: 12,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#999", fontSize: 12, textAlign: "center", margin: "auto" }}>
            No messages yet. Start the conversation! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                  marginBottom: 8,
                  paddingRight: isCurrentUser ? 0 : 8,
                  paddingLeft: isCurrentUser ? 8 : 0,
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: isCurrentUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                    background: isCurrentUser ? "#007bff" : "#e9ecef",
                    color: isCurrentUser ? "#fff" : "#333",
                    fontSize: 13,
                    lineHeight: 1.5,
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid #eee",
          display: "flex",
          gap: 8,
        }}
      >
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "inherit",
            resize: "none",
            maxHeight: 80,
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          style={{
            ...styles.button,
            padding: "8px 12px",
            fontSize: 12,
            opacity: inputValue.trim() ? 1 : 0.5,
            cursor: inputValue.trim() ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
