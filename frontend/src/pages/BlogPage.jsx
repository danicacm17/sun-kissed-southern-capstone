import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/BlogPage.css";

function BlogPage() {
  const [weather, setWeather] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogData() {
      try {
        const res = await api.get("/api/blog");
        setWeather(res.data.weather || {});
        setPosts(res.data.posts || []);
      } catch (err) {
        console.error("Failed to fetch blog posts", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogData();
  }, []);

  return (
    <div className="blog-page">
      <h2>Sun-Kissed Blog</h2>

      <div className="weather-banner">
        <h4>☀️ Florida Weather Vibes</h4>
        <ul>
          {Object.entries(weather).map(([city, summary]) => (
            <li key={city}>
              <strong>{city}:</strong> {summary}
            </li>
          ))}
        </ul>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <p className="no-posts">No blog posts available at the moment.</p>
      ) : (
        <div className="blog-posts">
          {posts.map((post) => (
            <div className="blog-card" key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content.slice(0, 150)}...</p>
              <Link to={`/blog/${post.id}`} className="read-more">Read More →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogPage;
