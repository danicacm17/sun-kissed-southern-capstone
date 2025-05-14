import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginModal from "../pages/LoginModal";
import { MemoryRouter } from "react-router-dom";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal content", () => {
    render(
      <MemoryRouter>
        <LoginModal onClose={onClose} />
      </MemoryRouter>
    );

    expect(screen.getByText("Please Login or Sign Up to Checkout")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("navigates to login on Login button click", () => {
    render(
      <MemoryRouter>
        <LoginModal onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Login"));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("navigates to signup on Sign Up button click", () => {
    render(
      <MemoryRouter>
        <LoginModal onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Sign Up"));
    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });

  it("calls onClose when backdrop is clicked", () => {
    render(
      <MemoryRouter>
        <LoginModal onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Please Login or Sign Up to Checkout").closest(".modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(
      <MemoryRouter>
        <LoginModal onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside modal", () => {
    render(
      <MemoryRouter>
        <LoginModal onClose={onClose} />
      </MemoryRouter>
    );

    const modal = screen.getByText("Please Login or Sign Up to Checkout").closest(".modal");
    fireEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();
  });
});
