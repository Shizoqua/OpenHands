import { FaPencil, FaTrash, FaPowerOff, FaPower } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";

interface MCPServerConfig {
  id: string;
  type: "sse" | "stdio" | "shttp";
  name?: string;
  url?: string;
  api_key?: string;
  timeout?: number;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export function MCPServerListItem({
  server,
  onEdit,
  onDelete,
  onToggle,
}: {
  server: MCPServerConfig;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  const getServerTypeLabel = (type: string) => {
    switch (type) {
      case "sse":
        return t(I18nKey.SETTINGS$MCP_SERVER_TYPE_SSE);
      case "stdio":
        return t(I18nKey.SETTINGS$MCP_SERVER_TYPE_STDIO);
      case "shttp":
        return t(I18nKey.SETTINGS$MCP_SERVER_TYPE_SHTTP);
      default:
        return type.toUpperCase();
    }
  };

  const getServerDescription = (serverConfig: MCPServerConfig) => {
    if (serverConfig.type === "stdio") {
      if (serverConfig.command) {
        const args =
          serverConfig.args && serverConfig.args.length > 0
            ? ` ${serverConfig.args.join(" ")}`
            : "";
        return `${serverConfig.command}${args}`;
      }
      return serverConfig.name || "";
    }
    if (
      (serverConfig.type === "sse" || serverConfig.type === "shttp") &&
      serverConfig.url
    ) {
      return serverConfig.url;
    }
    return "";
  };

  const serverName = server.type === "stdio" ? server.name : server.url;
  const serverDescription = getServerDescription(server);
  const isDisabled = server.disabled ?? false;

  return (
    <tr
      data-testid="mcp-server-item"
      className={`grid grid-cols-[minmax(0,0.25fr)_120px_minmax(0,1fr)_140px] gap-4 items-start border-t border-tertiary ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <td
        className="p-3 text-sm text-content-2 truncate min-w-0"
        title={serverName}
      >
        <div className="flex items-center gap-2">
          <span>{serverName}</span>
          {isDisabled && (
            <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">
              Disabled
            </span>
          )}
        </div>
      </td>

      <td className="p-3 text-sm text-content-2 whitespace-nowrap">
        {getServerTypeLabel(server.type)}
      </td>

      <td
        className="p-3 text-sm text-content-2 opacity-80 italic min-w-0 truncate"
        title={serverDescription}
      >
        <span className="inline-block max-w-full align-bottom">
          {serverDescription}
        </span>
      </td>

      <td className="p-3 flex items-start justify-end gap-4 whitespace-nowrap">
        <button
          data-testid="toggle-mcp-server-button"
          type="button"
          onClick={onToggle}
          aria-label={isDisabled ? `Enable ${serverName}` : `Disable ${serverName}`}
          className={`cursor-pointer hover:text-content-1 transition-colors ${
            isDisabled ? "text-gray-400" : "text-green-500"
          }`}
          title={isDisabled ? "Enable server" : "Disable server"}
        >
          {isDisabled ? <FaPowerOff size={16} /> : <FaPower size={16} />}
        </button>
        <button
          data-testid="edit-mcp-server-button"
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${serverName}`}
          className="cursor-pointer hover:text-content-1 transition-colors"
        >
          <FaPencil size={16} />
        </button>
        <button
          data-testid="delete-mcp-server-button"
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${serverName}`}
          className="cursor-pointer hover:text-content-1 transition-colors"
        >
          <FaTrash size={16} />
        </button>
      </td>
    </tr>
  );
}
