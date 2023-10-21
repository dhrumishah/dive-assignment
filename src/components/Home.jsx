import { useState, useEffect } from "react";
import { auth, database } from "../Firebase";
import { signOut } from "firebase/auth";
import uniqid from "uniqid";
import Avatar from "../assets/avatar.png";
import { push } from "firebase/database";
import { ref, child, get, update, set } from "firebase/database";

const Home = () => {
  const [users, setUsers] = useState([]);
  const [user2, setUser2] = useState(null);
  const [messageInputText, setMessageInputText] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [authenticated, setauthenticated] = useState(false);
  const [check, setCheck] = useState(true);

  // logout function
  const logoutUser = async () => {
    localStorage.clear();
    const updates = {};
    updates["/users/" + auth.currentUser.uid] = {
      email: auth.currentUser.email,
      isActive: false,
      uid: auth.currentUser.uid,
    };
    try {
      await signOut(auth);
      await update(ref(database), updates);
      window.location.href = "/";
    } catch (error) {
      console.log(error);
    }
  };

  // rearranges the list of users - online users come on top of the list
  function showActiveUsers() {
    const activeUsers = users.filter((user) => user.isActive === true);
    const inactiveUsers = users.filter((user) => user.isActive !== true);
    const final = activeUsers.concat(inactiveUsers);
    setUsers(final);
  }

  // gets the list of users registered on the website
  const getUsers = async () => {
    const dbRef = ref(database);
    try {
      let usersArr = [];
      await get(child(dbRef, "/users/")).then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
          usersArr.push(childSnapshot.val());
        });
      });
      setUsers(usersArr);
    } catch (error) {
      console.error("Error fetching users: ", error);
      throw error;
    }
  };

  // first function to handle the deliver receipt
  // gets the user from firebase for which deliver receipts are to be handled
  const handleDeliveryOfMessages = async (email) => {
    const chatsRef = ref(database, "chats");
    const snapshot = await get(chatsRef);

    snapshot.forEach((childSnapshot) => {
      const chatData = childSnapshot.val();
      if (chatData.user1 === email || chatData.user2 === email) {
        const undeliveredForUser = chatData.user1 === email ? "user1" : "user2";
        deleteUndeliveredMessages(childSnapshot.key, undeliveredForUser, email);
      }
    });
  };

  // handles the deliver receipt of messages for a user
  // changes the status of messages to delivered
  const deleteUndeliveredMessages = async (
    chatId,
    undeliveredForUser,
    email
  ) => {
    const chatRef = ref(database, `chats/${chatId}`);
    const currentChatData = (await get(chatRef)).val();
    const type = "undeliveredMessagesBy" + undeliveredForUser;
    const undeliveredMessages = currentChatData[type] || [];
    const messages = Object.values(currentChatData.messages);

    for (const message of messages)
      if (message.receiver === email)
        if (message.status === "sent") message.status = "delivered";

    if (undeliveredMessages.length > 0) currentChatData[type] = [];

    currentChatData.messages = messages;
    set(chatRef, currentChatData);
  };

  // handles the read receipt of messages for a user
  const deleteUnReadMessages = async (chatId, unReadForUser, email) => {
    console.log(chatId, unReadForUser, email);
    const chatRef = ref(database, `chats/${chatId}`);
    const currentChatData = (await get(chatRef)).val();
    const type = "unReadMessagesFor" + unReadForUser;
    const unReadMessages = currentChatData[type] || [];
    const messages = Object.values(currentChatData.messages);

    for (const message of messages)
      if (message.receiver === email) message.status = "read";

    if (unReadMessages.length > 0) currentChatData[type] = [];

    currentChatData.messages = messages;
    set(chatRef, currentChatData);
  };

  // called when a logged in user clicks any user on the left
  const clickUserAndOpenChatBox = async (user2) => {
    const current = auth.currentUser.email;
    if (user2.email === current) {
      alert("You cannot message yourself");
      setUser2(null);
    } else {
      setUser2(user2);
      setChatMessages([]);
      const chatsRef = ref(database, "chats");
      const snapshot = await get(chatsRef);
      snapshot.forEach((childSnapshot) => {
        const chatData = childSnapshot.val();
        if (chatData.user1 === current || chatData.user2 === current) {
          const unReadForUser = chatData.user1 === current ? "user1" : "user2";
          deleteUnReadMessages(childSnapshot.key, unReadForUser, current);
        }
      });
      getChatMessages(user2);
    }
  };

  // called when user presses send button in message input
  const sendMessage = async (receiver, messageInput) => {
    const sender = auth.currentUser;
    let chatId = "";

    if (sender.email < receiver.email) chatId = `${sender.uid}-${receiver.uid}`;
    else chatId = `${receiver.uid}-${sender.uid}`;

    const chatRef = ref(database, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);

    if (chatSnapshot.exists()) {
      // The chat already exists, so add the message to the existing chat.
      const messageObject = {
        id: uniqid(),
        message: messageInput,
        time: Date.now(),
        status: "sent",
        sender: sender.email,
        receiver: receiver.email,
      };
      if (chatSnapshot.val().user1 === sender.email) {
        const undeliveredMessagesRef = child(
          chatRef,
          "undeliveredMessagesByuser1"
        );
        const unReadMessagesRef = child(chatRef, "unReadMessagesForuser1");

        const currentUndeliveredMessages = await get(
          undeliveredMessagesRef
        ).then((snapshot) => {
          if (snapshot.exists()) {
            return snapshot.val();
          } else {
            return [];
          }
        });

        const currentUnReadMessages = await get(unReadMessagesRef).then(
          (snapshot) => {
            if (snapshot.exists()) {
              return snapshot.val();
            } else {
              return [];
            }
          }
        );
        currentUndeliveredMessages.push(messageObject.id);
        set(undeliveredMessagesRef, currentUndeliveredMessages);

        currentUnReadMessages.push(messageObject.id);
        set(unReadMessagesRef, currentUnReadMessages);
      } else {
        const undeliveredMessagesRef = child(
          chatRef,
          "undeliveredMessagesByuser2"
        );
        const unReadMessagesRef = child(chatRef, "unReadMessagesForuser2");
        const currentUndeliveredMessages = await get(
          undeliveredMessagesRef
        ).then((snapshot) => {
          if (snapshot.exists()) {
            return snapshot.val();
          } else {
            return [];
          }
        });

        const currentUnReadMessages = await get(unReadMessagesRef).then(
          (snapshot) => {
            if (snapshot.exists()) {
              return snapshot.val();
            } else {
              return [];
            }
          }
        );
        currentUndeliveredMessages.push(messageObject.id);
        set(undeliveredMessagesRef, currentUndeliveredMessages);

        currentUnReadMessages.push(messageObject.id);
        set(unReadMessagesRef, currentUnReadMessages);
      }
      const messagesRef = child(chatRef, "messages");
      const newMessageRef = push(messagesRef);
      set(newMessageRef, messageObject);
    } else {
      // The chat doesn't exist, so create a new chat and add the message.
      const messageObject = {
        id: uniqid(),
        message: messageInput,
        time: Date.now(),
        status: "sent",
        sender: sender.email,
        receiver: receiver.email,
      };
      const commonData = {
        user1: sender.email,
        user2: receiver.email,
        undeliveredMessagesByuser1: [messageObject.id],
        unReadMessagesForuser1: [messageObject.id],
      };

      set(chatRef, commonData);
      const messagesRef = child(chatRef, "messages");
      const newMessageRef = push(messagesRef);
      set(newMessageRef, messageObject);
    }
    getChatMessages(receiver);
    setMessageInputText("");
  };

  // gets the chat messages from firebase 
  // called after `clickUserAndOpenChatBox`
  const getChatMessages = async (receiver) => {
    const sender = auth.currentUser;

    let chatId = "";
    if (sender.email < receiver.email) chatId = `${sender.uid}-${receiver.uid}`;
    else chatId = `${receiver.uid}-${sender.uid}`;

    const chatRef = ref(database, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);

    if (chatSnapshot.exists()) {
      const users = [chatSnapshot.val().user1, chatSnapshot.val().user2];
      if (users.includes(sender.email) && users.includes(receiver.email)) {
        const messagesObject = chatSnapshot.val().messages;
        const chat = Object.values(messagesObject);
        setChatMessages(chat);
      }
    }
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem("authenticated");
    const userEmail = localStorage.getItem("userEmail");

    if (loggedInUser) {
      setauthenticated(true);
      handleDeliveryOfMessages(userEmail);
    }
    setCheck(false);
    getUsers();
  }, []);

  if (!authenticated && !check) {
    return <Navigate replace to="/" />;
  } else {
    return (
      <>
        <div className="flex justify-between w-full gap-12 px-8 py-4 my-auto">
          <div className="w-1/3 flex flex-col">
            <div
              onClick={showActiveUsers}
              className="flex px-6 py-2 mx-auto bg-red-500 text-white rounded-md mb-2 w-fit font-semibold hover:cursor-pointer"
            >
              Show Active Users
            </div>
            <div className="flex justify-center">
              <div className="w-fit rounded-lg h-3/4">
                {users.map((user) => (
                  <div
                    onClick={() => clickUserAndOpenChatBox(user)}
                    className={`w-full p-4 text-lime-500 rounded-md hover:cursor-pointer ${
                      user.isActive ? "bg-green-300" : "bg-white"
                    } shadow dark:bg-gray-800 dark:text-gray-400 ${
                      user2 === user
                        ? "border-orange-500 border-solid border-4"
                        : ""
                    }`}
                  >
                    <div className="flex">
                      <img
                        className="w-8 h-8 rounded-full shadow-lg"
                        src={Avatar}
                      />
                      <div className="ml-3 mt-1">
                        <span className="text-sm text-center font-semibold text-gray-900 dark:text-white">
                          {user.email}
                        </span>
                        <div className=" mt-2 text-xs font-normal text-blue-600"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-3/4 justify-start h-screen">
            <button
              type="submit"
              onClick={() => logoutUser()}
              className="w-2/12 absolute right-4 text-gray-900 bg-gradient-to-r
             from-lime-200 via-lime-400 to-lime-500 hover:bg-blue-800 focus:ring-4 font-semibold focus:outline-none focus:ring-blue-300 rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Sign Out
            </button>

            {user2 && (
              <div className="flex w-full relative mt-12 h-3/4 rounded-lg flex-col bg-orange-300 p-2">
                <div className="overflow-scroll h-fit mb-20 mt-2 px-2 relative flex flex-col w-full">
                  {chatMessages.length > 0 &&
                    chatMessages.map((chatMessage) => (
                      <div
                        className={`flex ${
                          chatMessage.receiver === auth.currentUser.email
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div className="flex mt-2 w-[40%] bg-gray-300 rounded-md p-2">
                          <div className="relative w-full">
                            <p className="text-sm">{chatMessage.message}</p>
                            <div className="flex flex-row justify-end align-middle w-full ">
                              <p className=" text-red-400 text-xs mr-1 mt-1">
                                {chatMessage.time}
                              </p>
                              <div className="flex flex-col">
                                {chatMessage.sender ===
                                  auth.currentUser.email && (
                                  <i
                                    className={`w-4 h-4 visible ${
                                      chatMessage.status === "read"
                                        ? "text-blue-500"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    &#10003;
                                  </i>
                                )}
                                {(chatMessage.sender ===
                                  auth.currentUser.email &&
                                  chatMessage.status === "delivered") ||
                                  (chatMessage.status === "read" && (
                                    <i
                                      className={`w-4 h-4 visible -mt-2.5 ${
                                        chatMessage.status === "read"
                                          ? "text-blue-500"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      &#10003;
                                    </i>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="absolute bottom-4 w-[90%] mx-auto inset-x-0">
                  <input
                    type="text"
                    className="rounded-lg h-12 w-full px-2"
                    onChange={(e) => setMessageInputText(e.target.value)}
                    value={messageInputText}
                    placeholder="Type your message"
                  />
                  <button
                    className="right-3 top-2 absolute font-semibold  px-2 py-1"
                    onClick={() => sendMessage(user2, messageInputText)}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
};
export default Home;
