import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import "./profilePage.scss";

function ProfilePage() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingChat, setStartingChat] = useState(null);

  const normalizePosts = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => item.post || item);
  };

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [postsRes, savedRes, chatsRes, usersRes] = await Promise.all([
          apiRequest.get("/users/posts"),
          apiRequest.get("/posts/saved"),
          apiRequest.get("/chats"),
          apiRequest.get("/users"), // ✅ GET /api/users → getAllUsers
        ]);

        setUserPosts(normalizePosts(postsRes.data?.data?.posts ?? []));
        setSavedPosts(normalizePosts(savedRes.data?.data ?? []));
        setChats(chatsRes.data?.data ?? []);
        setUsers(usersRes.data?.data ?? []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          updateUser(null);
          navigate("/login");
        } else {
          setError("Failed to load profile data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // ✅ Create or open existing chat then scroll chat panel into view
  const handleStartChat = async (receiverId) => {
    setStartingChat(receiverId);
    try {
      const res = await apiRequest.post("/chats", { receiverId });
      const newChat = res.data?.data;

      setChats((prev) => {
        const exists = prev.find((c) => c.id === newChat.id);
        if (exists) return prev;
        return [newChat, ...prev];
      });
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setStartingChat(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      updateUser(null);
      navigate("/");
    }
  };

  if (!currentUser) return <p className="loading">Not logged in.</p>;

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          {/* ── User Info ───────────────────────────── */}
          <div className="title">
            <h1>User Information</h1>
            <Link to="/profile/update">
              <button>Update Profile</button>
            </Link>
          </div>
          <div className="info">
            <span>
              Avatar: <img src={currentUser.avatar || "/noavatar.jpg"} alt="" />
            </span>
            <span>
              Username: <b>{currentUser.username}</b>
            </span>
            <span>
              E-mail: <b>{currentUser.email}</b>
            </span>
            <button onClick={handleLogout}>Logout</button>
          </div>

          {/* ── My Posts ────────────────────────────── */}
          <div className="title">
            <h1>My List</h1>
            <Link to="/add">
              <button>Create New Post</button>
            </Link>
          </div>
          {loading ? (
            <p>Loading posts...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <List items={userPosts} />
          )}

          {/* ── Saved Posts ─────────────────────────── */}
          <div className="title">
            <h1>Saved List</h1>
          </div>
          {loading ? (
            <p>Loading saved...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <List items={savedPosts} />
          )}

          {/* ── All Users ───────────────────────────── */}
          <div className="title">
            <h1>People</h1>
          </div>
          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p className="noData">No other users found.</p>
          ) : (
            <div className="usersList">
              {users.map((user) => (
                <div className="userCard" key={user.id}>
                  <div className="userInfo">
                    <img src={user.avatar || "/noavatar.jpg"} alt="" />
                    <span>{user.username}</span>
                  </div>
                  <button
                    className="chatBtn"
                    disabled={startingChat === user.id}
                    onClick={() => handleStartChat(user.id)}
                  >
                    {startingChat === user.id ? "Opening…" : "💬 Message"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Panel ──────────────────────────────── */}
      <div className="chatContainer">
        <div className="wrapper">
          <Chat chats={chats} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
