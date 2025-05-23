import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

function BlogPostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/api/blog/${id}`);
        setPost(res.data);
      } catch (err) {
        console.error("Error fetching blog post:", err);
      }
    };
    fetchPost();
  }, [id]);

  if (!post) return <p>Loading post...</p>;

  return (
    <div className="blog-page">
      <h2>{post.title}</h2>
      <div className="blog-meta">Published: {new Date(post.created_at).toLocaleDateString()}</div>

      <div className="blog-content">
        {post.content.split(/\n/).map((line, idx) => {
          if (line.trim() === "") {
            return <br key={idx} />; // Add a line break for empty lines
          }
          return <p key={idx}>{line}</p>; // Wrap non-empty lines in <p> tags
        })}
      </div>

      <a href="/blog" className="back-link">← Back to Blog</a>
      
    </div>
  );
}

export default BlogPostDetail;
