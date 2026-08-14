"""MCP server exposing the same tool registry the in-app agent uses, for external clients like
Claude Desktop or Claude Code. Auth is a per-user API key sent as `Authorization: Bearer <key>` —
deliberately not FastMCP's built-in OAuth (`token_verifier`/`auth=`), which assumes a full OAuth
authorization server. A static bearer key is what `claude mcp add --header` sends, so we verify it
ourselves against the ApiKey table and resolve the request to a User before dispatching the tool.
"""

import logging

from mcp.server.fastmcp import FastMCP
from mcp.types import Tool as MCPTool

from app.agent_tools.api_keys import resolve_user_id_from_key
from app.agent_tools.registry import TOOLS, get_tool
from app.core.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

mcp_app = FastMCP("Study Progress Tracker", stateless_http=True, streamable_http_path="/")
_server = mcp_app._mcp_server  # noqa: SLF001 — intentional: we replace its list/call-tool handlers below


@_server.list_tools()
async def _list_tools() -> list[MCPTool]:
    return [MCPTool(name=t.name, description=t.description, inputSchema=t.parameters) for t in TOOLS]


@_server.call_tool(validate_input=True)
async def _call_tool(name: str, arguments: dict):
    request = _server.request_context.request
    header = request.headers.get("authorization", "") if request is not None else ""
    if not header.lower().startswith("bearer "):
        return {"error": "Missing or malformed Authorization header. Expected: Bearer <api key>."}
    secret = header[len("bearer "):].strip()

    db = SessionLocal()
    try:
        user_id = resolve_user_id_from_key(db, secret)
        if user_id is None:
            return {"error": "Invalid API key."}
        user = db.get(User, user_id)
        try:
            tool = get_tool(name)
        except KeyError as exc:
            return {"error": str(exc)}
        try:
            result = tool.call(db, user, arguments)
        except Exception as exc:  # noqa: BLE001 — surfaced to the MCP client as a tool error, not a crash
            logger.warning("MCP tool %s failed for user %s: %s", name, user_id, exc)
            return {"error": str(exc)}
        # The MCP SDK's call_tool handler only special-cases dict results as structured content;
        # anything else (e.g. the lists most list_* tools return) gets misread as an iterable of
        # ContentBlock objects instead of plain JSON data. Always hand it a dict.
        return result if isinstance(result, dict) else {"result": result}
    finally:
        db.close()
