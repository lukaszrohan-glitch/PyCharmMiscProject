let
    GetOrders = (optional apiBase as nullable text, optional apiKey as nullable text, optional includeDiagnostics as nullable logical) as table =>
        let
            // Determine base URL; default to local dev backend if not provided
            base = if apiBase = null or Text.Trim(apiBase) = "" then "http://localhost:8000" else Text.TrimEnd(apiBase, "/"),

            // Always send Accept; include x-api-key only when present
            headers = if apiKey = null or Text.Trim(apiKey) = "" then [Accept = "application/json"] else [#"x-api-key" = apiKey, Accept = "application/json"],

            // Use RelativePath and handle common HTTP statuses; capture errors for diagnostics
            respTry = try Web.Contents(
                base,
                [
                    RelativePath = "api/orders",
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
            diag = #table({"status", "reason", "endpoint"}, {{ status, statusText, "api/orders" }}),

            // Parse JSON safely
            body = if response <> null then try Json.Document(response) otherwise null else null,

            // Accept either a list payload or a { data = [...] } envelope
            list =
                if body = null then
                    {}
                else if Value.Is(body, type list) then
                    body
                else if Value.Is(body, type record) and Record.HasFields(body, "data") and Value.Is(body[data], type list) then
                    body[data]
                else
                    {},

            // Convert to table; empty table if no items
            table = if List.Count(list) = 0 then #table({}, {}) else Table.FromRecords(list),

            // Strongly type known columns when present
            typePairs = {
                {"order_id", type text},
                {"customer_id", type text},
                {"status", type text},
                {"due_date", type date},
                {"order_date", type date}
            },
            presentPairs = List.Select(typePairs, (p) => Table.HasColumns(table, {p{0}})),
            typed = if List.Count(presentPairs) = 0 then table else Table.TransformColumnTypes(table, presentPairs),
            result = if (includeDiagnostics <> null and includeDiagnostics = true and status <> 200) then diag else typed
        in
            result
in
    GetOrders

