import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { WhatsAppOutlined, CloseOutlined } from "@ant-design/icons";
import { useChat } from "../context/chat";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [hasManualEdit, setHasManualEdit] = useState(false);
  const [adminWhatsApp, setAdminWhatsApp] = useState("");
  const { chatProduct, selectedColor } = useChat();

  useEffect(() => {
    const getWhatsappNumber = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API}/api/v1/settings/whatsapp`,
        );

        if (data?.success) {
          setAdminWhatsApp(data.whatsappNumber || "");
        }
      } catch (error) {
        console.log(error);
      }
    };

    getWhatsappNumber();
  }, []);

  const generateMessage = useMemo(() => {
    if (chatProduct) {
      return [
        "Hi 👋",
        "",
        "I'm interested in this product.",
        "",
        `🛍 Product: ${chatProduct.name}`,
        `💰 Price: ₹${chatProduct.price}`,
        `🎨 Color: ${selectedColor || "Not selected"}`,
        "",
        "Please provide more details.",
        "",
      ].join("\n");
    }

    return "Hi 👋 I need help regarding your products.";
  }, [chatProduct, selectedColor]);

  useEffect(() => {
    if (!hasManualEdit) {
      setMessage(generateMessage);
    }
  }, [generateMessage, hasManualEdit]);

  // ⏱ Auto popup after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // 💬 APPEND quick reply instead of replacing
  const addQuickReply = (text) => {
    setMessage((prev) => {
      const trimmedPrev = prev.trim();
      const trimmedText = text.trim();

      if (!trimmedPrev) return trimmedText;
      if (trimmedPrev.endsWith(trimmedText)) return trimmedPrev;

      return `${trimmedPrev}\n${trimmedText}`;
    });
    setHasManualEdit(true);
  };

  const quickReplies = [
    "Is this available?",
    "What is the price?",
    "Do you offer delivery?",
    "I want to order this",
  ];

  // 📍 Include product share URL in WhatsApp message
  const openWhatsApp = (customMsg) => {
    if (!adminWhatsApp) return;

    const finalMessage = customMsg || message;

    const shareUrl = chatProduct
      ? `${window.location.origin}/product/${chatProduct.slug}`
      : window.location.href;

    const fullMessage = `${finalMessage}

🌐 View Product: ${shareUrl}`;

    const url = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(
      fullMessage,
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="chat-v3-wrapper">
      {/* Floating Button */}
      <div className="chat-fab" onClick={() => setOpen(!open)}>
        {open ? <CloseOutlined /> : <WhatsAppOutlined />}
        <span className="pulse-ring"></span>
      </div>

      {/* Panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">💬 Chat Support</div>

          <div className="chat-body">
            <p className="welcome">👋 Welcome to Sweetie Ayman</p>
            <p className="welcome">Enquire the products before buying</p>

            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setHasManualEdit(true);
              }}
              rows={4}
              className="chat-input"
            />

            {/* QUICK REPLIES (APPEND MODE) */}
            <div className="quick-replies">
              {quickReplies.map((q, i) => (
                <button
                  key={i}
                  onClick={() => addQuickReply(q)}
                  className="quick-btn"
                >
                  {q}
                </button>
              ))}
            </div>

            <button className="send-btn" onClick={() => openWhatsApp()}>
              Send on WhatsApp
            </button>

            <p className="note">⚡ Fast reply within minutes</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
