"""Tests for filtering disabled MCP servers in utils."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import openhands.mcp.utils
from openhands.core.config.mcp_config import (
    MCPConfig,
    MCPSHTTPServerConfig,
    MCPSSEServerConfig,
    MCPStdioServerConfig,
)


@pytest.mark.asyncio
@patch('openhands.mcp.utils.MCPClient')
async def test_create_mcp_clients_filters_disabled_sse_servers(mock_mcp_client):
    """Test that disabled SSE servers are filtered out when creating clients."""
    # Setup mock
    mock_client_instance = AsyncMock()
    mock_mcp_client.return_value = mock_client_instance
    mock_client_instance.connect_http = AsyncMock()

    # Create mix of enabled and disabled servers
    enabled_server = MCPSSEServerConfig(url='http://enabled:8080', disabled=False)
    disabled_server = MCPSSEServerConfig(url='http://disabled:8080', disabled=True)

    clients = await openhands.mcp.utils.create_mcp_clients(
        [enabled_server, disabled_server], []
    )

    # Verify only enabled server was processed
    assert len(clients) == 1
    assert mock_mcp_client.call_count == 1
    mock_client_instance.connect_http.assert_called_once_with(
        enabled_server, conversation_id=None
    )


@pytest.mark.asyncio
@patch('openhands.mcp.utils.MCPClient')
async def test_create_mcp_clients_filters_disabled_shttp_servers(mock_mcp_client):
    """Test that disabled SHTTP servers are filtered out when creating clients."""
    # Setup mock
    mock_client_instance = AsyncMock()
    mock_mcp_client.return_value = mock_client_instance
    mock_client_instance.connect_http = AsyncMock()

    # Create mix of enabled and disabled servers
    enabled_server = MCPSHTTPServerConfig(
        url='http://enabled:8080', disabled=False
    )
    disabled_server = MCPSHTTPServerConfig(
        url='http://disabled:8080', disabled=True
    )

    clients = await openhands.mcp.utils.create_mcp_clients(
        [], [enabled_server, disabled_server]
    )

    # Verify only enabled server was processed
    assert len(clients) == 1
    assert mock_mcp_client.call_count == 1
    mock_client_instance.connect_http.assert_called_once_with(
        enabled_server, conversation_id=None
    )


@pytest.mark.asyncio
@patch('openhands.mcp.utils.MCPClient')
@patch('openhands.mcp.utils.shutil.which')
async def test_create_mcp_clients_filters_disabled_stdio_servers(
    mock_which, mock_mcp_client
):
    """Test that disabled stdio servers are filtered out when creating clients."""
    # Setup mocks
    mock_which.return_value = '/usr/bin/python'  # Command exists
    mock_client_instance = AsyncMock()
    mock_mcp_client.return_value = mock_client_instance
    mock_client_instance.connect_stdio = AsyncMock()

    # Create mix of enabled and disabled servers
    enabled_server = MCPStdioServerConfig(
        name='enabled-server', command='python', disabled=False
    )
    disabled_server = MCPStdioServerConfig(
        name='disabled-server', command='python', disabled=True
    )

    clients = await openhands.mcp.utils.create_mcp_clients(
        [], [], stdio_servers=[enabled_server, disabled_server]
    )

    # Verify only enabled server was processed
    assert len(clients) == 1
    assert mock_mcp_client.call_count == 1
    mock_client_instance.connect_stdio.assert_called_once_with(enabled_server)


@pytest.mark.asyncio
@patch('openhands.mcp.utils.create_mcp_clients')
async def test_fetch_mcp_tools_from_config_filters_disabled_servers(
    mock_create_clients,
):
    """Test that fetch_mcp_tools_from_config filters disabled servers."""
    from openhands.mcp.utils import fetch_mcp_tools_from_config

    # Setup mock clients
    mock_client = MagicMock()
    mock_tool = MagicMock()
    mock_tool.to_param.return_value = {'function': {'name': 'test_tool'}}
    mock_client.tools = [mock_tool]
    mock_create_clients.return_value = [mock_client]

    # Create config with mix of enabled and disabled servers
    mcp_config = MCPConfig(
        sse_servers=[
            MCPSSEServerConfig(url='http://enabled:8080', disabled=False),
            MCPSSEServerConfig(url='http://disabled:8080', disabled=True),
        ],
        stdio_servers=[
            MCPStdioServerConfig(
                name='enabled-server', command='python', disabled=False
            ),
            MCPStdioServerConfig(
                name='disabled-server', command='python', disabled=True
            ),
        ],
        shttp_servers=[
            MCPSHTTPServerConfig(url='http://enabled-http:8080', disabled=False),
            MCPSHTTPServerConfig(url='http://disabled-http:8080', disabled=True),
        ],
    )

    # Fetch tools
    tools = await fetch_mcp_tools_from_config(mcp_config, use_stdio=True)

    # Verify create_mcp_clients was called with only enabled servers
    call_args = mock_create_clients.call_args
    enabled_sse = call_args[0][0]
    enabled_shttp = call_args[0][1]
    enabled_stdio = call_args[0][3] if len(call_args[0]) > 3 else []

    assert len(enabled_sse) == 1
    assert enabled_sse[0].url == 'http://enabled:8080'
    assert enabled_sse[0].disabled is False

    assert len(enabled_shttp) == 1
    assert enabled_shttp[0].url == 'http://enabled-http:8080'
    assert enabled_shttp[0].disabled is False

    assert len(enabled_stdio) == 1
    assert enabled_stdio[0].name == 'enabled-server'
    assert enabled_stdio[0].disabled is False

    # Verify tools were returned
    assert len(tools) == 1


@pytest.mark.asyncio
@patch('openhands.mcp.utils.create_mcp_clients')
async def test_fetch_mcp_tools_from_config_all_disabled(mock_create_clients):
    """Test fetch_mcp_tools_from_config when all servers are disabled."""
    from openhands.mcp.utils import fetch_mcp_tools_from_config

    # Setup mock - should not be called since all servers are disabled
    mock_create_clients.return_value = []

    # Create config with all servers disabled
    mcp_config = MCPConfig(
        sse_servers=[
            MCPSSEServerConfig(url='http://server1:8080', disabled=True),
        ],
        stdio_servers=[
            MCPStdioServerConfig(
                name='server1', command='python', disabled=True
            ),
        ],
        shttp_servers=[
            MCPSHTTPServerConfig(url='http://server1:8080', disabled=True),
        ],
    )

    # Fetch tools
    tools = await fetch_mcp_tools_from_config(mcp_config, use_stdio=True)

    # Verify create_mcp_clients was called with empty lists
    call_args = mock_create_clients.call_args
    enabled_sse = call_args[0][0]
    enabled_shttp = call_args[0][1]
    enabled_stdio = call_args[0][3] if len(call_args[0]) > 3 else []

    assert len(enabled_sse) == 0
    assert len(enabled_shttp) == 0
    assert len(enabled_stdio) == 0

    # Verify no tools were returned
    assert len(tools) == 0


@pytest.mark.asyncio
@patch('openhands.mcp.utils.MCPClient')
async def test_create_mcp_clients_only_disabled_servers(mock_mcp_client):
    """Test create_mcp_clients with only disabled servers returns empty list."""
    # Setup mock (should not be called)
    mock_client_instance = AsyncMock()
    mock_mcp_client.return_value = mock_client_instance

    # Create only disabled servers
    disabled_sse = MCPSSEServerConfig(url='http://disabled:8080', disabled=True)
    disabled_shttp = MCPSHTTPServerConfig(
        url='http://disabled-http:8080', disabled=True
    )

    clients = await openhands.mcp.utils.create_mcp_clients(
        [disabled_sse], [disabled_shttp]
    )

    # Verify no clients were created
    assert len(clients) == 0
    # MCPClient should not be instantiated
    assert mock_mcp_client.call_count == 0


@pytest.mark.asyncio
@patch('openhands.mcp.utils.MCPClient')
async def test_create_mcp_clients_backward_compatibility(mock_mcp_client):
    """Test that servers without disabled field (backward compatibility) work correctly."""
    # Setup mock
    mock_client_instance = AsyncMock()
    mock_mcp_client.return_value = mock_client_instance
    mock_client_instance.connect_http = AsyncMock()

    # Create server without disabled field (simulating old config)
    # In practice, Pydantic will set disabled=False by default
    server = MCPSSEServerConfig(url='http://server1:8080')
    # Explicitly verify default
    assert server.disabled is False

    clients = await openhands.mcp.utils.create_mcp_clients([server], [])

    # Verify server was processed (not filtered out)
    assert len(clients) == 1
    mock_client_instance.connect_http.assert_called_once_with(
        server, conversation_id=None
    )


@pytest.mark.asyncio
@patch('openhands.mcp.utils.create_mcp_clients')
async def test_fetch_mcp_tools_from_config_mixed_enabled_disabled(mock_create_clients):
    """Test fetch_mcp_tools_from_config with mixed enabled/disabled servers."""
    from openhands.mcp.utils import fetch_mcp_tools_from_config

    # Setup mock clients
    mock_client1 = MagicMock()
    mock_tool1 = MagicMock()
    mock_tool1.to_param.return_value = {'function': {'name': 'tool1'}}
    mock_client1.tools = [mock_tool1]

    mock_client2 = MagicMock()
    mock_tool2 = MagicMock()
    mock_tool2.to_param.return_value = {'function': {'name': 'tool2'}}
    mock_client2.tools = [mock_tool2]

    mock_create_clients.return_value = [mock_client1, mock_client2]

    # Create config with mix
    mcp_config = MCPConfig(
        sse_servers=[
            MCPSSEServerConfig(url='http://enabled1:8080', disabled=False),
            MCPSSEServerConfig(url='http://disabled1:8080', disabled=True),
            MCPSSEServerConfig(url='http://enabled2:8080', disabled=False),
        ],
    )

    # Fetch tools
    tools = await fetch_mcp_tools_from_config(mcp_config, use_stdio=False)

    # Verify create_mcp_clients was called with only enabled servers
    call_args = mock_create_clients.call_args
    enabled_sse = call_args[0][0]

    assert len(enabled_sse) == 2
    assert all(server.disabled is False for server in enabled_sse)
    assert enabled_sse[0].url == 'http://enabled1:8080'
    assert enabled_sse[1].url == 'http://enabled2:8080'

    # Verify tools from both enabled servers were returned
    assert len(tools) == 2

