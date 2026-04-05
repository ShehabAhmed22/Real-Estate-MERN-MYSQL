import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Filter from "../../components/filter/Filter";
import Card from "../../components/card/Card";
import Map from "../../components/map/Map";
import apiRequest from "../../lib/apiRequest";
import "./listPage.scss";

function ListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  // 🔥 handle images سواء string أو array
  const normalizePosts = (data) => {
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      let images = item.images;

      if (typeof images === "string") {
        try {
          images = JSON.parse(images);
        } catch {
          images = [];
        }
      }

      return {
        ...item,
        images: Array.isArray(images) ? images : [],
      };
    });
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiRequest.get("/posts?" + searchParams.toString());

        // ✅ FIX هنا
        const postsData = res.data?.data?.posts ?? [];

        setPosts(normalizePosts(postsData));
      } catch (err) {
        console.log(err);
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchParams]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="listPage">
      <div className="listContainer">
        <div className="wrapper">
          <Filter />

          {posts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            posts.map((post) => <Card key={post.id} item={post} />)
          )}
        </div>
      </div>

      <div className="mapContainer">
        <Map items={posts} />
      </div>
    </div>
  );
}

export default ListPage;
