import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModerateReviews from "../pages/ModerateReviews";
import api from "../api/api";

jest.mock("../api/api");

const mockReview = {
  id: 1,
  user_first_name: "Jane",
  user_last_name: "Doe",
  rating: 4,
  comment: "Great quality!",
  product_name: "Beach Towel",
  created_at: "2025-05-09T12:00:00Z",
};

describe("ModerateReviews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { reviews: [mockReview] } });
  });

  test("renders unapproved reviews", async () => {
    render(<ModerateReviews />);
    expect(screen.getByText(/Moderate Reviews/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Jane D.")).toBeInTheDocument();
      expect(screen.getByTestId("review-rating")).toHaveTextContent("Rating: 4 ★");
      expect(screen.getByText("Great quality!")).toBeInTheDocument();
      expect(screen.getByTestId("review-product")).toHaveTextContent("Product: Beach Towel");
    });
  });

  test("approves a review", async () => {
    render(<ModerateReviews />);
    await screen.findByText("Approve");

    api.patch.mockResolvedValue({ data: { message: "Review approved." } });

    userEvent.click(screen.getByText("Approve"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/reviews/1", { status: "approve" });
    });
  });

  test("rejects a review", async () => {
    render(<ModerateReviews />);
    await screen.findByText("Reject");

    api.patch.mockResolvedValue({ data: { message: "Review denied." } });

    userEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/admin/reviews/1", { status: "deny" });
    });
  });

  test("shows no reviews found message", async () => {
    api.get.mockResolvedValue({ data: { reviews: [] } });
    render(<ModerateReviews />);

    await waitFor(() => {
      expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    api.get.mockRejectedValue(new Error("Fetch failed"));
    api.patch.mockRejectedValue(new Error("Moderation failed"));

    render(<ModerateReviews />);
    await waitFor(() => {
      expect(screen.queryByText(/Moderate Reviews/i)).toBeInTheDocument();
    });

    // Trigger error for PATCH as well
    api.get.mockResolvedValue({ data: { reviews: [mockReview] } });
    render(<ModerateReviews />);
    await screen.findByText("Approve");

    userEvent.click(screen.getByText("Approve"));

    await waitFor(() => {
      expect(screen.getByText(/Error moderating review/i)).toBeInTheDocument();
    });
  });
});
