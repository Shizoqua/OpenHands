import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "#/hooks/query/use-settings";
import SettingsService from "#/settings-service/settings-service.api";
import { MCPSSEServer, MCPStdioServer, MCPSHTTPServer } from "#/types/settings";

type MCPServerType = "sse" | "stdio" | "shttp";

interface MCPServerConfig {
  type: MCPServerType;
  name?: string;
  url?: string;
  api_key?: string;
  timeout?: number;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export function useUpdateMcpServer() {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();

  return useMutation({
    mutationFn: async ({
      serverId,
      server,
    }: {
      serverId: string;
      server: MCPServerConfig;
    }): Promise<void> => {
      if (!settings?.MCP_CONFIG) return;

      const newConfig = { ...settings.MCP_CONFIG };
      const [serverType, indexStr] = serverId.split("-");
      const index = parseInt(indexStr, 10);

      if (serverType === "sse") {
        const existingServer = newConfig.sse_servers[index];
        const existingDisabled =
          typeof existingServer === "object"
            ? existingServer.disabled ?? false
            : false;
        const sseServer: MCPSSEServer = {
          url: server.url!,
          ...(server.api_key && { api_key: server.api_key }),
          disabled: server.disabled !== undefined ? server.disabled : existingDisabled,
        };
        newConfig.sse_servers[index] = sseServer;
      } else if (serverType === "stdio") {
        const existingDisabled =
          newConfig.stdio_servers[index].disabled ?? false;
        const stdioServer: MCPStdioServer = {
          name: server.name!,
          command: server.command!,
          ...(server.args && { args: server.args }),
          ...(server.env && { env: server.env }),
          disabled:
            server.disabled !== undefined ? server.disabled : existingDisabled,
        };
        newConfig.stdio_servers[index] = stdioServer;
      } else if (serverType === "shttp") {
        const existingServer = newConfig.shttp_servers[index];
        const existingDisabled =
          typeof existingServer === "object"
            ? existingServer.disabled ?? false
            : false;
        const shttpServer: MCPSHTTPServer = {
          url: server.url!,
          ...(server.api_key && { api_key: server.api_key }),
          ...(server.timeout !== undefined && { timeout: server.timeout }),
          disabled: server.disabled !== undefined ? server.disabled : existingDisabled,
        };
        newConfig.shttp_servers[index] = shttpServer;
      }

      const apiSettings = {
        mcp_config: newConfig,
      };

      await SettingsService.saveSettings(apiSettings);
    },
    onSuccess: () => {
      // Invalidate the settings query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
