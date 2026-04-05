import axios from "axios";

const getUploadUrl = (file) => {
  if (file.type.startsWith("image/")) {
    return "https://api.cloudinary.com/v1_1/dkqpzws52/image/upload";
  } else if (file.type.startsWith("video/")) {
    return "https://api.cloudinary.com/v1_1/dkqpzws52/video/upload";
  } else {
    throw new Error("Unsupported file type");
  }
};

const upload = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "upload");

  try {
    const uploadUrl = getUploadUrl(file);
    const uploadRes = await axios.post(uploadUrl, data);
    return uploadRes.data.url;
  } catch (error) {
    console.log(error.message);
    throw new Error("Failed to upload file. Please try again.");
  }
};

export default upload;
