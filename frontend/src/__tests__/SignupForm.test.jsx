import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupForm from "../pages/SignupForm";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Utility wrapper with mocked context
function renderWithAuthContext(ui, { signup = jest.fn() } = {}) {
  return {
    signup,
    ...render(
      <AuthContext.Provider value={{ signup }}>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthContext.Provider>
    ),
  };
}

describe("SignupForm", () => {
  test("renders all input fields and submit button", () => {
    renderWithAuthContext(<SignupForm />);

    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  test("shows password when eye icon is clicked", () => {
    renderWithAuthContext(<SignupForm />);

    const passwordInput = screen.getByPlaceholderText("Password");
    const toggleIcon = screen.getByText((_, el) => el?.classList.contains("eye-icon"));

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleIcon);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("submits form with correct data", async () => {
    const mockSignup = jest.fn().mockResolvedValue({});
    renderWithAuthContext(<SignupForm />, { signup: mockSignup });

    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Jane" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret123" } });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        password: "secret123",
      });
    });
  });

  test("displays error if signup fails", async () => {
    const mockSignup = jest.fn().mockRejectedValue(new Error("Signup failed"));
    renderWithAuthContext(<SignupForm />, { signup: mockSignup });

    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "Smith" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "fail@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "badpass" } });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });
  });
});
