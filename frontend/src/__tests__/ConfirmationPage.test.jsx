import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ConfirmationPage from "../pages/ConfirmationPage";

// Mock navigate
const mockedUsedNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockedUsedNavigate,
  };
});

describe("ConfirmationPage", () => {
  const sampleOrder = {
    order_number: "ABC123",
    total: 59.97,
    items: [
      {
        name: "T-Shirt",
        color: "Blue",
        size: "M",
        quantity: 1,
        price: 19.99,
      },
      {
        name: "Tote Bag",
        color: "Natural",
        size: "One Size",
        quantity: 2,
        price: 19.99,
      },
    ],
  };

  it("renders order summary when order exists", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/confirmation", state: { order: sampleOrder } }]}>
        <Routes>
          <Route path="/confirmation" element={<ConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Thank You for Your Order!")).toBeInTheDocument();
    expect(screen.getByTestId("order-number")).toHaveTextContent("Order #: ABC123");
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Blue / M")).toBeInTheDocument();
    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("Tote Bag")).toBeInTheDocument();
    expect(screen.getByText("Natural / One Size")).toBeInTheDocument();
    expect(screen.getByText("$39.98")).toBeInTheDocument();
    expect(screen.getByText("Total:")).toBeInTheDocument();
    expect(screen.getByText("$59.97")).toBeInTheDocument();
  });


  it("navigates to home when 'Continue Shopping' is clicked", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/confirmation", state: { order: sampleOrder } }]}>
        <Routes>
          <Route path="/confirmation" element={<ConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Continue Shopping"));
    expect(mockedUsedNavigate).toHaveBeenCalledWith("/");
  });

  it("displays fallback message when no order is present", () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter initialEntries={[{ pathname: "/confirmation" }]}>
        <Routes>
          <Route path="/confirmation" element={<ConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Order Confirmed")).toBeInTheDocument();
    expect(
      screen.getByText("If you refreshed, the order summary is no longer available.")
    ).toBeInTheDocument();

    jest.advanceTimersByTime(5000);
    expect(mockedUsedNavigate).toHaveBeenCalledWith("/");

    jest.useRealTimers();
  });
});
