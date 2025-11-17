/* GetPlannedTime.pq - Power Query M function to fetch planned-time for an order from backend */
let
    GetPlannedTime = (optional apiBase as nullable text, optional apiKey as nullable text, orderId as text, optional includeDiagnostics as nullable logical) as table =>
        let
            // Determine base URL; default to local dev backend if not provided
            base = if apiBase = null or Text.Trim(apiBase) = "" then "http://localhost:8000" else Text.TrimEnd(apiBase, "/"),

            // Always send Accept; include x-api-key only when present
            headers = if apiKey = null or Text.Trim(apiKey) = "" then [Accept = "application/json"] else [#"x-api-key" = apiKey, Accept = "application/json"],

            // Escape orderId for safety; build RelativePath
            safeOrderId = try Uri.EscapeDataString(orderId) otherwise orderId,
            path = "api/planned-time/" & safeOrderId,

            // Fetch with RelativePath and ManualStatusHandling; capture errors for diagnostics
            respTry = try Web.Contents(
                base,
                [
                    RelativePath = path,
                    Headers = headers,
                    Timeout = #duration(0,0,1,0),
                    ManualStatusHandling = {400,401,403,404,408,429,500,502,503}
                ]
            ),
            response = if respTry[HasError] then null else respTry[Value],
            meta = if response <> null then try Value.Metadata(response) otherwise null else null,
            status = if respTry[HasError] then -1 else if meta <> null and Record.HasFields(meta, "Response.Status") then meta[Response.Status] else 200,
            statusText = if respTry[HasError] then (try Error.Message(respTry[Error]) otherwise "Request failed") else if meta <> null and Record.HasFields(meta, "Response.StatusText") then meta[Response.StatusText] else null,
            // Optional diagnostics row on non-200
            diag = #table({"status", "reason", "endpoint"}, {{ status, statusText, path }}),

            // Parse JSON safely
            body = if response <> null then try Json.Document(response) otherwise null else null,

            // Accept record payload or envelope { data = record }
            rec = if body = null then null
                  else if Value.Is(body, type record) and Record.HasFields(body, "order_id") then body
                  else if Value.Is(body, type record) and Record.HasFields(body, "data") and Value.Is(body[data], type record) then body[data]
                  else null,

            // Convert to one-row table and apply strong types
            table = if rec = null then #table({}, {}) else Table.FromRecords({rec}),
            typePairs = {
                {"order_id", type text},
                {"planned_hours", type number}
            },
            presentPairs = List.Select(typePairs, (p) => Table.HasColumns(table, {p{0}})),
            typed = if List.Count(presentPairs) = 0 then table else Table.TransformColumnTypes(table, presentPairs),
            resultTable = if (includeDiagnostics <> null and includeDiagnostics = true and status <> 200) then diag else typed
        in
            resultTable
in
    GetPlannedTime
