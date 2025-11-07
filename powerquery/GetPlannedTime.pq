/* GetPlannedTime.pq - Power Query M function to fetch planned-time for an order from backend */
let
    GetPlannedTime = (optional apiBase as nullable text, optional apiKey as nullable text, orderId as text) as table =>
        let
            // default to local backend (port 8001) used by dev server
            base = if apiBase = null or Text.Trim(apiBase) = "" then "http://localhost:8001" else apiBase,
            url = Text.TrimEnd(base, "/") & "/api/planned-time/" & orderId,
            headers = if apiKey = null or Text.Trim(apiKey) = "" then [Accept = "application/json"] else [#"x-api-key" = apiKey, Accept = "application/json"],
            // fetch with a 60s timeout; on error return null
            raw = try Web.Contents(url, [Headers = headers, Timeout = #duration(0,0,1,0)]) otherwise null,
            json = if raw <> null then try Json.Document(raw) otherwise null else null,
            // convert JSON to table: record -> single-row table, list -> table, otherwise empty
            resultTable =
                if json = null then
                    #table({}, {})
                else if Value.Is(json, type record) then
                    Record.ToTable(json)
                else if Value.Is(json, type list) then
                    Table.FromList(json, Splitter.SplitByNothing(), null, null, ExtraValues.Error)
                else
                    #table({}, {})
        in
            resultTable
in
    GetPlannedTime

