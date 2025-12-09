// src/pages/MessagesPage.jsx
import React from "react";
import GlobalChat from "../components/GlobalChat";

function MessagesPage({ user }) {
  return <GlobalChat user={user} />;
}

export default MessagesPage;
