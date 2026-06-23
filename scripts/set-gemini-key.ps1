$ErrorActionPreference = "Stop"

$key = Read-Host "Pega tu GEMINI_API_KEY de Google AI Studio"

if ([string]::IsNullOrWhiteSpace($key)) {
  throw "La clave no puede estar vacia."
}

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env"

$content = @"
PORT=3000
GEMINI_API_KEY=$key
GEMINI_MODEL=gemini-2.0-flash-lite
GEMINI_ENABLED=true
MOCK_MODE=true

AUTH_SERVICE_URL=
CATALOG_SERVICE_URL=
ORDER_SERVICE_URL=
PAYMENT_SERVICE_URL=
INVENTORY_SERVICE_URL=
SHIPPING_SERVICE_URL=
NOTIFICATION_SERVICE_URL=
REPORTING_SERVICE_URL=
"@

Set-Content -LiteralPath $envPath -Value $content -Encoding UTF8
Write-Host ".env creado en $envPath"
