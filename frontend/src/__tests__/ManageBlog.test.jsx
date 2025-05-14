import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageBlog from "../pages/ManageBlog";
import api from "../api/api";

// Mock API
jest.mock("../api/api");

const mockPosts = [
  { id: 1, title: "Post One", content: "This is the content for post one." },
  { id: 2, title: "Post Two", content: "This is the content for post two." },
];

describe("ManageBlog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders and fetches blog posts", async () => {
    api.get.mockResolvedValueOnce({ data: { posts: mockPosts } });

    render(<ManageBlog />);

    expect(screen.getByText("Manage Blog Posts")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Post One")).toBeInTheDocument();
      expect(screen.getByText("Post Two")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/api/blog");
  });

  it("creates a new blog post", async () => {
    api.get.mockResolvedValue({ data: { posts: mockPosts } });
    api.post.mockResolvedValue({});
    render(<ManageBlog />);

    await screen.findByText("Post One");

    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "New Post" },
    });
    fireEvent.change(screen.getByPlaceholderText("Content"), {
      target: { value: "This is a new blog post." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Post" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/blog", {
        title: "New Post",
        content: "This is a new blog post.",
      });
      expect(api.get).toHaveBeenCalledTimes(2); // initial + after creation
    });
  });

  it("enters edit mode when Edit is clicked", async () => {
    api.get.mockResolvedValueOnce({ data: { posts: mockPosts } });

    render(<ManageBlog />);

    await screen.findByText("Post One");

    fireEvent.click(screen.getAllByText("Edit")[0]);

    expect(screen.getByDisplayValue("Post One")).toBeInTheDocument();
    expect(screen.getByText("Update Post")).toBeInTheDocument();
  });

  it("updates a blog post", async () => {
    api.get.mockResolvedValue({ data: { posts: mockPosts } });
    api.patch.mockResolvedValue({});
    render(<ManageBlog />);

    await screen.findByText("Post One");

    fireEvent.click(screen.getAllByText("Edit")[0]);

    const titleInput = screen.getByPlaceholderText("Title");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    fireEvent.click(screen.getByRole("button", { name: "Update Post" }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/blog/1", {
        title: "Updated Title",
        content: "This is the content for post one.",
      });
    });
  });

  it("deletes a blog post", async () => {
    api.get.mockResolvedValue({ data: { posts: mockPosts } });
    api.delete.mockResolvedValue({});
    render(<ManageBlog />);

    await screen.findByText("Post One");

    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/blog/1");
    });
  });

  it("shows message on API error", async () => {
    api.get.mockRejectedValue(new Error("Fetch failed"));

    render(<ManageBlog />);

    await waitFor(() => {
      expect(screen.queryByText("Post One")).not.toBeInTheDocument();
    });
  });
});
