import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useToggleMcpServer } from "../use-toggle-mcp-server";
import SettingsService from "#/settings-service/settings-service.api";
import { useSettings } from "#/hooks/query/use-settings";

// Mock dependencies
vi.mock("#/settings-service/settings-service.api");
vi.mock("#/hooks/query/use-settings");

const mockSettingsService = vi.mocked(SettingsService);
const mockUseSettings = vi.mocked(useSettings);

describe("useToggleMcpServer", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should toggle disabled state for SSE server", async () => {
    const mockSettings = {
      MCP_CONFIG: {
        sse_servers: [
          { url: "http://server1:8080", disabled: false },
          { url: "http://server2:8080", disabled: true },
        ],
        stdio_servers: [],
        shttp_servers: [],
      },
    };

    mockUseSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    } as any);

    mockSettingsService.saveSettings = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleMcpServer(), { wrapper });

    await result.current.mutateAsync("sse-0");

    await waitFor(() => {
      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith({
        mcp_config: {
          sse_servers: [
            { url: "http://server1:8080", disabled: true }, // Toggled
            { url: "http://server2:8080", disabled: true },
          ],
          stdio_servers: [],
          shttp_servers: [],
        },
      });
    });
  });

  it("should toggle disabled state for STDIO server", async () => {
    const mockSettings = {
      MCP_CONFIG: {
        sse_servers: [],
        stdio_servers: [
          { name: "server1", command: "python", disabled: false },
          { name: "server2", command: "node", disabled: true },
        ],
        shttp_servers: [],
      },
    };

    mockUseSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    } as any);

    mockSettingsService.saveSettings = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleMcpServer(), { wrapper });

    await result.current.mutateAsync("stdio-0");

    await waitFor(() => {
      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith({
        mcp_config: {
          sse_servers: [],
          stdio_servers: [
            { name: "server1", command: "python", disabled: true }, // Toggled
            { name: "server2", command: "node", disabled: true },
          ],
          shttp_servers: [],
        },
      });
    });
  });

  it("should toggle disabled state for SHTTP server", async () => {
    const mockSettings = {
      MCP_CONFIG: {
        sse_servers: [],
        stdio_servers: [],
        shttp_servers: [
          { url: "http://server1:8080", disabled: false },
          { url: "http://server2:8080", disabled: true },
        ],
      },
    };

    mockUseSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    } as any);

    mockSettingsService.saveSettings = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleMcpServer(), { wrapper });

    await result.current.mutateAsync("shttp-0");

    await waitFor(() => {
      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith({
        mcp_config: {
          sse_servers: [],
          stdio_servers: [],
          shttp_servers: [
            { url: "http://server1:8080", disabled: true }, // Toggled
            { url: "http://server2:8080", disabled: true },
          ],
        },
      });
    });
  });

  it("should handle string URLs for SSE servers", async () => {
    const mockSettings = {
      MCP_CONFIG: {
        sse_servers: [
          "http://server1:8080", // String URL
          { url: "http://server2:8080", disabled: false },
        ],
        stdio_servers: [],
        shttp_servers: [],
      },
    };

    mockUseSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    } as any);

    mockSettingsService.saveSettings = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleMcpServer(), { wrapper });

    await result.current.mutateAsync("sse-0");

    await waitFor(() => {
      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith({
        mcp_config: {
          sse_servers: [
            { url: "http://server1:8080", disabled: false }, // Converted to object
            { url: "http://server2:8080", disabled: false },
          ],
          stdio_servers: [],
          shttp_servers: [],
        },
      });
    });
  });

  it("should handle missing MCP_CONFIG gracefully", async () => {
    mockUseSettings.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    mockSettingsService.saveSettings = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleMcpServer(), { wrapper });

    await result.current.mutateAsync("sse-0");

    // Should not call saveSettings if MCP_CONFIG is missing
    expect(mockSettingsService.saveSettings).not.toHaveBeenCalled();
  });

  it("should handle server without disabled field (defaults to false)", async () => {
    const mockSettings = {
      MCP_CONFIG: {
        sse_servers: [
          { url: "http://server1:8080" }, // No disabled field
        ],
        stdio_servers: [],
        shttp_servers: [],
      },
    };

    mockUseSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    } as any);

    mockSettingsService.saveSettings = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleMcpServer(), { wrapper });

    await result.current.mutateAsync("sse-0");

    await waitFor(() => {
      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith({
        mcp_config: {
          sse_servers: [
            { url: "http://server1:8080", disabled: true }, // Toggled from false (default)
          ],
          stdio_servers: [],
          shttp_servers: [],
        },
      });
    });
  });
});

