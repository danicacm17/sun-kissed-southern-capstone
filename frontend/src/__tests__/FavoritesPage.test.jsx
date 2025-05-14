import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FavoritesPage from "../pages/FavoritesPage";
import { MemoryRouter } from "react-router-dom";

// Shared mock for toggleFavorite
const mockToggleFavorite = jest.fn();

// ✅ Default mock setup for populated favorites
jest.mock("../context/FavoriteContext", () => {
  return {
    useFavorites: () => ({
      favorites: [
        {
          id: 1,
          name: "Beach Towel",
          category: "Beach Towels",
          image_url: "https://example.com/beach.jpg",
        },
      ],
      isFavorited: () => true,
      toggleFavorite: mockToggleFavorite,
    }),
  };
});

describe("FavoritesPage", () => {
  beforeEach(() => {
    mockToggleFavorite.mockClear();
  });

  it("renders favorite items if they exist", () => {
    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Your Favorites")).toBeInTheDocument();
    expect(screen.getByText("Beach Towel")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/beach.jpg");
    expect(screen.getByRole("link")).toHaveAttribute("href", "/category/beach-towels");
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls toggleFavorite when heart is clicked", () => {
    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));
    expect(mockToggleFavorite).toHaveBeenCalledWith(1);
  });

  it("renders message if there are no favorites", () => {
    jest.resetModules();

    // Remock with empty favorites
    jest.doMock("../context/FavoriteContext", () => ({
      useFavorites: () => ({
        favorites: [],
        isFavorited: () => false,
        toggleFavorite: jest.fn(),
      }),
    }));

    const { default: EmptyFavoritesPage } = require("../pages/FavoritesPage");

    render(
      <MemoryRouter>
        <EmptyFavoritesPage />
      </MemoryRouter>
    );

    expect(screen.getByText("You haven't favorited any products yet.")).toBeInTheDocument();
  });
});
