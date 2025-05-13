import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ModerateReviews.css";

function ModerateReviews() {
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await api.get("/api/admin/reviews/unapproved");
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModeration = async (id, approve) => {
    try {
      const res = await api.patch(`/api/admin/reviews/${id}`, {
        status: approve ? "approve" : "deny"
      });
      setMessage(res.data.message);
      fetchReviews();
    } catch (err) {
      console.error("Error moderating review", err);
      setMessage("Error moderating review.");
    }
  };

  return (
    <div className="moderate-reviews">
      <h2>Moderate Reviews</h2>
      {message && <p>{message}</p>}
      {Array.isArray(reviews) && reviews.length === 0 ? (
        <p>No reviews found.</p>
      ) : (
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.user_first_name} {review.user_last_name.charAt(0)}.</strong>
              <p className="line"><strong>Rating:</strong> {review.rating} ★</p>
              <p className="line"><strong>Comment:</strong> {review.comment}</p>
              <p className="line"><strong>Product:</strong> {review.product_name}</p>
              <small>Submitted on {new Date(review.created_at).toLocaleDateString()}</small>
              <div className="button-group">
                <button onClick={() => handleModeration(review.id, true)}>Approve</button>
                <button onClick={() => handleModeration(review.id, false)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ModerateReviews;
