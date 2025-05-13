import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ManageBlog.css";

function ManageBlog() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/api/blog");
      setPosts(res.data.posts);
    } catch (err) {
      console.error("Failed to fetch blog posts:", err);
    }
  };

  const handleCreateOrUpdatePost = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/api/blog/${editingId}`, newPost);
        setMessage("Blog post updated!");
      } else {
        await api.post("/api/blog", newPost);
        setMessage("Blog post created!");
      }

      setNewPost({ title: "", content: "" });
      setEditingId(null);
      fetchPosts();
    } catch (err) {
      console.error("Error submitting blog post:", err);
      setMessage("Error submitting post");
    }
  };

  const handleEditPost = (post) => {
    setEditingId(post.id);
    setNewPost({ title: post.title, content: post.content });
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/api/blog/${postId}`);
      setMessage("Blog post deleted!");
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("Error deleting blog post:", err);
      setMessage("Error deleting post");
    }
  };

  return (
    <div className="manage-blog">
      <h2>Manage Blog Posts</h2>
      {message && <p>{message}</p>}

      {/* Form for create/edit */}
      <form onSubmit={handleCreateOrUpdatePost}>
        <h4>{editingId ? "Edit Blog Post" : "Create Blog Post"}</h4>
        <input
          type="text"
          placeholder="Title"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Content"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          rows={4}
          required
        />
        <button type="submit">
          {editingId ? "Update Post" : "Create Post"}
        </button>
      </form>

      <h4>Existing Posts</h4>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h5>{post.title}</h5>
            <p className="post-preview">{post.content.slice(0, 100)}...</p>
            <div className="post-controls">
              <button onClick={() => handleEditPost(post)}>Edit</button>
              <button onClick={() => handleDeletePost(post.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageBlog;
