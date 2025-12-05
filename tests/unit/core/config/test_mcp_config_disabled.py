"""Tests for disabled field in MCP server configurations."""

import pytest

from openhands.core.config.mcp_config import (
    MCPConfig,
    MCPSHTTPServerConfig,
    MCPSSEServerConfig,
    MCPStdioServerConfig,
)


def test_mcp_sse_server_config_disabled_default():
    """Test that MCPSSEServerConfig defaults to disabled=False."""
    config = MCPSSEServerConfig(url='http://server1:8080')
    assert config.disabled is False


def test_mcp_sse_server_config_disabled_true():
    """Test MCPSSEServerConfig with disabled=True."""
    config = MCPSSEServerConfig(url='http://server1:8080', disabled=True)
    assert config.disabled is True
    assert config.url == 'http://server1:8080'


def test_mcp_stdio_server_config_disabled_default():
    """Test that MCPStdioServerConfig defaults to disabled=False."""
    config = MCPStdioServerConfig(name='test-server', command='python')
    assert config.disabled is False


def test_mcp_stdio_server_config_disabled_true():
    """Test MCPStdioServerConfig with disabled=True."""
    config = MCPStdioServerConfig(
        name='test-server', command='python', disabled=True
    )
    assert config.disabled is True
    assert config.name == 'test-server'
    assert config.command == 'python'


def test_mcp_shttp_server_config_disabled_default():
    """Test that MCPSHTTPServerConfig defaults to disabled=False."""
    config = MCPSHTTPServerConfig(url='http://server1:8080')
    assert config.disabled is False


def test_mcp_shttp_server_config_disabled_true():
    """Test MCPSHTTPServerConfig with disabled=True."""
    config = MCPSHTTPServerConfig(
        url='http://server1:8080', api_key='test-key', disabled=True
    )
    assert config.disabled is True
    assert config.url == 'http://server1:8080'
    assert config.api_key == 'test-key'


def test_mcp_config_with_mixed_disabled_servers():
    """Test MCPConfig with mix of enabled and disabled servers."""
    enabled_sse = MCPSSEServerConfig(url='http://enabled:8080', disabled=False)
    disabled_sse = MCPSSEServerConfig(url='http://disabled:8080', disabled=True)
    enabled_stdio = MCPStdioServerConfig(
        name='enabled-server', command='python', disabled=False
    )
    disabled_stdio = MCPStdioServerConfig(
        name='disabled-server', command='python', disabled=True
    )
    enabled_shttp = MCPSHTTPServerConfig(
        url='http://enabled-http:8080', disabled=False
    )
    disabled_shttp = MCPSHTTPServerConfig(
        url='http://disabled-http:8080', disabled=True
    )

    config = MCPConfig(
        sse_servers=[enabled_sse, disabled_sse],
        stdio_servers=[enabled_stdio, disabled_stdio],
        shttp_servers=[enabled_shttp, disabled_shttp],
    )

    # All servers should be in the config
    assert len(config.sse_servers) == 2
    assert len(config.stdio_servers) == 2
    assert len(config.shttp_servers) == 2

    # Verify disabled states
    assert config.sse_servers[0].disabled is False
    assert config.sse_servers[1].disabled is True
    assert config.stdio_servers[0].disabled is False
    assert config.stdio_servers[1].disabled is True
    assert config.shttp_servers[0].disabled is False
    assert config.shttp_servers[1].disabled is True


def test_from_toml_section_with_disabled_servers():
    """Test creating config from TOML section with disabled servers."""
    data = {
        'sse_servers': [
            {'url': 'http://enabled:8080', 'disabled': False},
            {'url': 'http://disabled:8080', 'disabled': True},
        ],
        'stdio_servers': [
            {
                'name': 'enabled-server',
                'command': 'python',
                'disabled': False,
            },
            {
                'name': 'disabled-server',
                'command': 'python',
                'disabled': True,
            },
        ],
        'shttp_servers': [
            {'url': 'http://enabled-http:8080', 'disabled': False},
            {'url': 'http://disabled-http:8080', 'disabled': True},
        ],
    }
    result = MCPConfig.from_toml_section(data)
    assert 'mcp' in result

    mcp_config = result['mcp']
    assert len(mcp_config.sse_servers) == 2
    assert len(mcp_config.stdio_servers) == 2
    assert len(mcp_config.shttp_servers) == 2

    # Verify disabled states are preserved
    assert mcp_config.sse_servers[0].disabled is False
    assert mcp_config.sse_servers[1].disabled is True
    assert mcp_config.stdio_servers[0].disabled is False
    assert mcp_config.stdio_servers[1].disabled is True
    assert mcp_config.shttp_servers[0].disabled is False
    assert mcp_config.shttp_servers[1].disabled is True


def test_from_toml_section_without_disabled_field():
    """Test backward compatibility: servers without disabled field default to False."""
    data = {
        'sse_servers': [
            {'url': 'http://server1:8080'},  # No disabled field
        ],
        'stdio_servers': [
            {
                'name': 'test-server',
                'command': 'python',
                # No disabled field
            },
        ],
        'shttp_servers': [
            {'url': 'http://server1:8080'},  # No disabled field
        ],
    }
    result = MCPConfig.from_toml_section(data)
    assert 'mcp' in result

    mcp_config = result['mcp']
    # Should default to disabled=False
    assert mcp_config.sse_servers[0].disabled is False
    assert mcp_config.stdio_servers[0].disabled is False
    assert mcp_config.shttp_servers[0].disabled is False


def test_from_toml_section_string_urls_with_disabled():
    """Test TOML parsing with string URLs (should not support disabled)."""
    data = {
        'sse_servers': [
            'http://server1:8080',  # String URL - always enabled
            {'url': 'http://server2:8080', 'disabled': True},  # Object with disabled
        ],
    }
    result = MCPConfig.from_toml_section(data)
    assert 'mcp' in result

    mcp_config = result['mcp']
    assert len(mcp_config.sse_servers) == 2
    # String URLs are converted to objects, so they should have disabled=False
    assert mcp_config.sse_servers[0].disabled is False
    assert mcp_config.sse_servers[1].disabled is True


def test_mcp_config_merge_preserves_disabled_state():
    """Test that merging MCP configs preserves disabled state."""
    config1 = MCPConfig(
        sse_servers=[
            MCPSSEServerConfig(url='http://server1:8080', disabled=False),
            MCPSSEServerConfig(url='http://server2:8080', disabled=True),
        ]
    )
    config2 = MCPConfig(
        sse_servers=[
            MCPSSEServerConfig(url='http://server3:8080', disabled=False),
        ]
    )

    merged = config1.merge(config2)

    assert len(merged.sse_servers) == 3
    assert merged.sse_servers[0].disabled is False
    assert merged.sse_servers[1].disabled is True
    assert merged.sse_servers[2].disabled is False

