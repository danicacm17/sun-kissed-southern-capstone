import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    <div className="blog-post-detail">
      <h2>{post.title}</h2>
      <div className="meta">
        Published: {new Date(post.created_at).toLocaleDateString()}
      </div>
      <p>{post.content}</p>
    </div>
  );
}

export default BlogPostDetail;
