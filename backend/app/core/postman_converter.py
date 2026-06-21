"""
Postman Collection v2.1 <-> API Studio converter.
Spec: https://schema.postman.com/collection/json/v2.1.0/draft-04/collection.json
"""
import uuid
from typing import Optional

# -- Postman -> Internal -----------------------------------------------------


def _pm_headers(header_list: list) -> list:
    """Convert Postman header array to internal [{key, value, enabled}] format."""
    result = []
    for h in header_list or []:
        if isinstance(h, dict) and h.get("key"):
            result.append({
                "key": h.get("key", ""),
                "value": h.get("value", ""),
                "enabled": not h.get("disabled", False)
            })
    return result


def _pm_params(url_obj) -> list:
    """Extract query params from Postman URL object."""
    if not isinstance(url_obj, dict):
        return []
    return [
        {"key": p.get("key", ""), "value": p.get("value", ""), "enabled": not p.get("disabled", False)}
        for p in url_obj.get("query", [])
    ]


def _pm_url(url_obj) -> str:
    """Resolve Postman URL object or string to a plain URL string."""
    if isinstance(url_obj, str):
        return url_obj
    if isinstance(url_obj, dict):
        raw = url_obj.get("raw", "")
        if raw:
            return raw
        host = ".".join(url_obj.get("host", []))
        path = "/".join(url_obj.get("path", []))
        protocol = url_obj.get("protocol", "https")
        return f"{protocol}://{host}/{path}"
    return ""


def _pm_body(body_obj: Optional[dict]) -> tuple[str, str]:
    """Return (body_type, body_content) from a Postman body object."""
    if not body_obj:
        return "none", ""
    mode = body_obj.get("mode", "none")
    if mode == "raw":
        return "raw", body_obj.get("raw", "")
    if mode == "urlencoded":
        pairs = "&".join(f"{p['key']}={p.get('value', '')}" for p in body_obj.get("urlencoded", []))
        return "x-www-form-urlencoded", pairs
    if mode == "formdata":
        pairs = "&".join(f"{p['key']}={p.get('value', '')}" for p in body_obj.get("formdata", []))
        return "form-data", pairs
    return "none", ""


def _parse_request_item(item: dict) -> dict:
    """Parse a single (non-folder) Postman item into an internal request dict."""
    req = item.get("request", {})
    method = req.get("method", "GET").upper() if isinstance(req, dict) else "GET"
    url_obj = req.get("url", "") if isinstance(req, dict) else ""
    body_type, body_content = _pm_body(req.get("body") if isinstance(req, dict) else None)
    return {
        "name": item.get("name", "Untitled"),
        "method": method,
        "url": _pm_url(url_obj),
        "headers": _pm_headers(req.get("header", []) if isinstance(req, dict) else []),
        "params": _pm_params(url_obj),
        "body_type": body_type,
        "body_content": body_content,
    }


def postman_to_internal(pm_json: dict, owner_id: int) -> dict:
    """
    Parse a full Postman v2.1 collection JSON.
    Returns:
      {
        "collection": { name, description, owner_id },
        "folders":    [ { name } ],
        "requests":   [ { ...request fields, folder_name } ]
      }
    Handles one level of nested folders (Postman v2.1 "item" groups).
    """
    info = pm_json.get("info", {})
    col_name = info.get("name", "Imported Collection")
    col_desc = info.get("description", "")

    folders = []
    requests = []

    for item in pm_json.get("item", []):
        if "item" in item:
            folder_name = item.get("name", "Folder")
            folders.append({"name": folder_name})
            for child in item["item"]:
                parsed = _parse_request_item(child)
                parsed["folder_name"] = folder_name
                requests.append(parsed)
        else:
            parsed = _parse_request_item(item)
            parsed["folder_name"] = None
            requests.append(parsed)

    return {
        "collection": {"name": col_name, "description": col_desc, "owner_id": owner_id},
        "folders": folders,
        "requests": requests,
    }


# -- Internal -> Postman -----------------------------------------------------


def _to_pm_header(headers: list) -> list:
    return [
        {"key": h["key"], "value": h["value"], "disabled": not h.get("enabled", True)}
        for h in (headers or [])
    ]


def _to_pm_url(url: str, params: list) -> dict:
    query = [{"key": p["key"], "value": p["value"], "disabled": not p.get("enabled", True)} for p in (params or [])]
    return {"raw": url, "query": query}


def _to_pm_body(body_type: str, body_content: str) -> Optional[dict]:
    if body_type == "raw":
        return {"mode": "raw", "raw": body_content, "options": {"raw": {"language": "json"}}}
    if body_type == "x-www-form-urlencoded":
        pairs = [{"key": k, "value": v} for p in body_content.split("&") for k, _, v in [p.partition("=")]]
        return {"mode": "urlencoded", "urlencoded": pairs}
    if body_type == "form-data":
        pairs = [{"key": k, "value": v, "type": "text"} for p in body_content.split("&") for k, _, v in [p.partition("=")]]
        return {"mode": "formdata", "formdata": pairs}
    return None


def internal_to_postman(collection, folders, requests) -> dict:
    """
    Build a Postman v2.1 collection JSON from DB objects.
    `folders`  -- list of Folder ORM objects
    `requests` -- list of Request ORM objects
    """
    folder_map = {}  # folder_id -> list of pm_items

    for req in requests:
        pm_item = {
            "name": req.name,
            "request": {
                "method": req.method,
                "header": _to_pm_header(req.headers or []),
                "url": _to_pm_url(req.url, req.params or []),
            }
        }
        body = _to_pm_body(req.body_type or "none", req.body_content or "")
        if body:
            pm_item["request"]["body"] = body

        if req.folder_id:
            folder_map.setdefault(req.folder_id, []).append(pm_item)
        else:
            folder_map.setdefault(None, []).append(pm_item)

    items = []
    for folder in folders:
        items.append({
            "name": folder.name,
            "item": folder_map.get(folder.id, [])
        })
    items.extend(folder_map.get(None, []))

    return {
        "info": {
            "_postman_id": str(uuid.uuid4()),
            "name": collection.name,
            "description": collection.description or "",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": items
    }
