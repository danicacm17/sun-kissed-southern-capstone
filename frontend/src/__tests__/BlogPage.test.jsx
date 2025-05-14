import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BlogPage from "../pages/BlogPage";
import BlogPostDetail from "../pages/BlogPostDetail";
import * as api from "../api/api";

// Mock API
jest.mock("../api/api");

describe("📝 BlogPage", () => {
  it("displays loading state and then blog posts", async () => {
    api.default.get.mockResolvedValueOnce({
      data: {
        weather: {
          Miami: "Sunny 85°F",
          Tampa: "Partly Cloudy 80°F"
        },
        posts: [
          { id: 1, title: "Florida Fun", content: "So much to do..." },
          { id: 2, title: "Beach Vibes", content: "Relax on the sand..." }
        ]
      }
    });

    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Florida Fun")).toBeInTheDocument();
      expect(screen.getByText("Beach Vibes")).toBeInTheDocument();
      expect(screen.getByText("☀️ Florida Weather Vibes")).toBeInTheDocument();
    });
  });

  it("handles no posts gracefully", async () => {
    api.default.get.mockResolvedValueOnce({ data: { weather: {}, posts: [] } });

    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No blog posts available at the moment.")).toBeInTheDocument();
    });
  });
});

describe("📝 BlogPostDetail", () => {
  it("displays a single blog post by ID", async () => {
    const mockPost = {
      id: 5,
      title: "Seaside Serenity",
      content: "A peaceful walk on the beach...",
      created_at: new Date().toISOString()
    };

    api.default.get.mockResolvedValueOnce({ data: mockPost });

    render(
      <MemoryRouter initialEntries={["/blog/5"]}>
        <Routes>
          <Route path="/blog/:id" element={<BlogPostDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading post/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Seaside Serenity")).toBeInTheDocument();
      expect(screen.getByText("A peaceful walk on the beach...")).toBeInTheDocument();
    });
  });
});
