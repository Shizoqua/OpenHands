import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "#/hooks/query/use-settings";
import SettingsService from "#/settings-service/settings-service.api";
import { MCPConfig } from "#/types/settings";

export function useToggleMcpServer() {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();

  return useMutation({
    mutationFn: async (serverId: string): Promise<void> => {
      if (!settings?.MCP_CONFIG) return;

      const newConfig: MCPConfig = { ...settings.MCP_CONFIG };
      const [serverType, indexStr] = serverId.split("-");
      const index = parseInt(indexStr, 10);

      if (serverType === "sse") {
        const server = newConfig.sse_servers[index];
        if (typeof server === "object") {
          server.disabled = !(server.disabled ?? false);
        }
        // If server is a string, convert it to an object first
        else if (typeof server === "string") {
          newConfig.sse_servers[index] = {
            url: server,
            disabled: false, // Toggle from string (always enabled) to object with disabled=false
          };
        }
      } else if (serverType === "stdio") {
        newConfig.stdio_servers[index].disabled = !(
          newConfig.stdio_servers[index].disabled ?? false
        );
      } else if (serverType === "shttp") {
        const server = newConfig.shttp_servers[index];
        if (typeof server === "object") {
          server.disabled = !(server.disabled ?? false);
        }
        // If server is a string, convert it to an object first
        else if (typeof server === "string") {
          newConfig.shttp_servers[index] = {
            url: server,
            disabled: false, // Toggle from string (always enabled) to object with disabled=false
          };
        }
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

