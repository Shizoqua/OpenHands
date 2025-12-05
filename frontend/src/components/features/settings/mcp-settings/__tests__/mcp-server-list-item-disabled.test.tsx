import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MCPServerListItem } from "../mcp-server-list-item";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("MCPServerListItem - Disabled Feature", () => {
  it("should render toggle button for enabled server", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const enabledServer = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://enabled-server:8080",
      disabled: false,
    };

    render(
      <MCPServerListItem
        server={enabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const toggleButton = screen.getByTestId("toggle-mcp-server-button");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute(
      "aria-label",
      "Disable http://enabled-server:8080",
    );
  });

  it("should render toggle button for disabled server", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const disabledServer = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://disabled-server:8080",
      disabled: true,
    };

    render(
      <MCPServerListItem
        server={disabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const toggleButton = screen.getByTestId("toggle-mcp-server-button");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute(
      "aria-label",
      "Enable http://disabled-server:8080",
    );
  });

  it("should show disabled badge when server is disabled", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const disabledServer = {
      id: "stdio-0",
      type: "stdio" as const,
      name: "disabled-server",
      command: "python",
      disabled: true,
    };

    render(
      <MCPServerListItem
        server={disabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const disabledBadge = screen.getByText("Disabled");
    expect(disabledBadge).toBeInTheDocument();
  });

  it("should not show disabled badge when server is enabled", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const enabledServer = {
      id: "stdio-0",
      type: "stdio" as const,
      name: "enabled-server",
      command: "python",
      disabled: false,
    };

    render(
      <MCPServerListItem
        server={enabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const disabledBadge = screen.queryByText("Disabled");
    expect(disabledBadge).not.toBeInTheDocument();
  });

  it("should apply opacity styling when server is disabled", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const disabledServer = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://disabled-server:8080",
      disabled: true,
    };

    render(
      <MCPServerListItem
        server={disabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const serverItem = screen.getByTestId("mcp-server-item");
    expect(serverItem).toHaveClass("opacity-50");
  });

  it("should call onToggle when toggle button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const server = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://server:8080",
      disabled: false,
    };

    render(
      <MCPServerListItem
        server={server}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const toggleButton = screen.getByTestId("toggle-mcp-server-button");
    await user.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should handle server without disabled field (backward compatibility)", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const server = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://server:8080",
      // No disabled field
    };

    render(
      <MCPServerListItem
        server={server}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    // Should render without disabled badge
    const disabledBadge = screen.queryByText("Disabled");
    expect(disabledBadge).not.toBeInTheDocument();

    // Should not have opacity styling
    const serverItem = screen.getByTestId("mcp-server-item");
    expect(serverItem).not.toHaveClass("opacity-50");
  });

  it("should display correct toggle button color for enabled server", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const enabledServer = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://enabled-server:8080",
      disabled: false,
    };

    render(
      <MCPServerListItem
        server={enabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const toggleButton = screen.getByTestId("toggle-mcp-server-button");
    expect(toggleButton).toHaveClass("text-green-500");
  });

  it("should display correct toggle button color for disabled server", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnToggle = vi.fn();

    const disabledServer = {
      id: "sse-0",
      type: "sse" as const,
      url: "http://disabled-server:8080",
      disabled: true,
    };

    render(
      <MCPServerListItem
        server={disabledServer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />,
    );

    const toggleButton = screen.getByTestId("toggle-mcp-server-button");
    expect(toggleButton).toHaveClass("text-gray-400");
  });
});

