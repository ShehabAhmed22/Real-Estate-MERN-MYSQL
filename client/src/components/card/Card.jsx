import { Link } from "react-router-dom";
import "./card.scss";

function Card({ item }) {
  if (!item) return null;

  // 🔥 handle images سواء array أو string
  const parseImages = (images) => {
    if (Array.isArray(images)) return images;

    if (typeof images === "string") {
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    }

    return [];
  };

  const images = parseImages(item.images);
  const firstImage = images[0] || "/noimage.jpg";

  return (
    <div className="card">
      <Link to={`/${item.id}`} className="imageContainer">
        <img src={firstImage} alt="post" />
      </Link>

      <div className="textContainer">
        <h2 className="title">
          <Link to={`/${item.id}`}>{item.title || "No Title"}</Link>
        </h2>

        <p className="address">
          <img src="/pin.png" alt="" />
          <span>{item.address || "No address"}</span>
        </p>

        <p className="price">$ {item.price ?? 0}</p>

        <div className="bottom">
          <div className="features">
            <div className="feature">
              <img src="/bed.png" alt="" />
              <span>{item.bedroom ?? 0} bedroom</span>
            </div>

            <div className="feature">
              <img src="/bath.png" alt="" />
              <span>{item.bathroom ?? 0} bathroom</span>
            </div>
          </div>

          <div className="icons">
            <div className="icon">
              <img src="/save.png" alt="" />
            </div>
            <div className="icon">
              <img src="/chat.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
