let
    GetOrderFinance = (apiBase as text, apiKey as text, orderId as text) =>
        let
            url = Text.TrimEnd(apiBase, "/") & "/api/finance/" & orderId,
            headers = [#"x-api-key" = apiKey, #"Accept" = "application/json"],
            raw = Web.Contents(url, [Headers = headers, Timeout = #duration(0,0,1,0)]),
            json = Json.Document(raw),
            rec = if Type.Is(Value.Type(json), Record.Type) then json else null,
            table = if rec = null then #table({}, {}) else Record.ToTable(rec)
        in
            table
in
    GetOrderFinance

