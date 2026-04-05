import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import upload from "../../upload";
import "./profileUpdatePage.scss";

function ProfileUpdatePage() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // show preview instantly
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      // Upload avatar to Cloudinary first if a new file was selected
      let avatarUrl = currentUser.avatar;
      if (avatarFile) {
        avatarUrl = await upload(avatarFile);
      }

      const res = await apiRequest.put(`/users/${currentUser.id}`, {
        username,
        email,
        ...(password && { password }),
        avatar: avatarUrl,
      });

      // res.data.data is the updated user object from ApiResponse
      updateUser(res.data.data);
      navigate("/profile");
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message || err.message || "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profileUpdatePage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Update Profile</h1>
          <div className="item">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={currentUser.username}
            />
          </div>
          <div className="item">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={currentUser.email}
            />
          </div>

          {/* Hidden file input triggered by clicking the avatar */}
          <div className="item">
            <label htmlFor="avatar">Avatar</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          <button disabled={isLoading}>
            {isLoading ? "Updating..." : "Update"}
          </button>
          {error && <span>{error}</span>}
        </form>
      </div>
      <div className="sideContainer">
        <img
          src={avatarPreview || currentUser.avatar || "/noavatar.jpg"}
          alt="avatar preview"
          className="avatar"
        />
      </div>
    </div>
  );
}

export default ProfileUpdatePage;
